# backend/churchconnect/reports/views.py

import os
import csv
import json
from io import StringIO
from datetime import datetime, timedelta
from django.http import HttpResponse, FileResponse, Http404
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage

from .models import Report, ReportRun, ReportTemplate
from .serializers import (
    ReportSerializer, ReportRunSerializer, ReportTemplateSerializer,
    ReportGenerationSerializer, ReportStatsSerializer, BulkReportActionSerializer
)
from .services import ReportGeneratorService, ReportSchedulerService
from members.models import Member
from pledges.models import Pledge
from groups.models import Group
from families.models import Family


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reports"""
    
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter reports based on user permissions"""
        queryset = super().get_queryset()
        
        # Filter by report type if specified
        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by scheduled status
        is_scheduled = self.request.query_params.get('scheduled')
        if is_scheduled is not None:
            queryset = queryset.filter(is_scheduled=is_scheduled.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Run a specific report"""
        report = self.get_object()
        
        try:
            # Create a report run record
            report_run = ReportRun.objects.create(
                report=report,
                executed_by=request.user,
                status='running'
            )
            
            # Generate the report using the service
            generator = ReportGeneratorService()
            result = generator.generate_report(report, report_run)
            
            if result['success']:
                report_run.status = 'completed'
                report_run.completed_at = timezone.now()
                report_run.file_path = result['file_path']
                report_run.file_size = result['file_size']
                report_run.record_count = result['record_count']
                report_run.execution_time = timezone.now() - report_run.started_at
                report_run.save()
                
                # Update report's last_run
                report.last_run = timezone.now()
                report.save()
                
                return Response({
                    'success': True,
                    'message': 'Report generated successfully',
                    'run_id': report_run.id,
                    'download_url': f'/api/reports/download/{report_run.id}/'
                })
            else:
                report_run.status = 'failed'
                report_run.error_message = result['error']
                report_run.completed_at = timezone.now()
                report_run.save()
                
                return Response({
                    'success': False,
                    'message': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a report on-the-fly without saving configuration"""
        serializer = ReportGenerationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Create temporary report run
                report_run = ReportRun.objects.create(
                    report=None,  # No associated report for on-the-fly generation
                    executed_by=request.user,
                    status='running'
                )
                
                # Generate report
                generator = ReportGeneratorService()
                result = generator.generate_adhoc_report(
                    serializer.validated_data, 
                    report_run
                )
                
                if result['success']:
                    report_run.status = 'completed'
                    report_run.completed_at = timezone.now()
                    report_run.file_path = result['file_path']
                    report_run.file_size = result['file_size']
                    report_run.record_count = result['record_count']
                    report_run.execution_time = timezone.now() - report_run.started_at
                    report_run.save()
                    
                    return Response({
                        'success': True,
                        'message': 'Report generated successfully',
                        'run_id': report_run.id,
                        'download_url': f'/api/reports/download/{report_run.id}/'
                    })
                else:
                    report_run.status = 'failed'
                    report_run.error_message = result['error']
                    report_run.completed_at = timezone.now()
                    report_run.save()
                    
                    return Response({
                        'success': False,
                        'message': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Exception as e:
                return Response({
                    'success': False,
                    'message': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get report statistics"""
        stats = {
            'total_reports': Report.objects.count(),
            'active_reports': Report.objects.filter(is_active=True).count(),
            'scheduled_reports': Report.objects.filter(is_scheduled=True).count(),
            'total_runs': ReportRun.objects.count(),
            'successful_runs': ReportRun.objects.filter(status='completed').count(),
            'failed_runs': ReportRun.objects.filter(status='failed').count(),
        }
        
        # Report type breakdown
        reports_by_type = dict(
            Report.objects.values('report_type')
            .annotate(count=Count('id'))
            .values_list('report_type', 'count')
        )
        stats['reports_by_type'] = reports_by_type
        
        # Recent runs (last 10)
        recent_runs = ReportRun.objects.select_related('report', 'executed_by')[:10]
        stats['recent_runs'] = ReportRunSerializer(recent_runs, many=True).data
        
        # Most used templates
        most_used_templates = ReportTemplate.objects.filter(is_active=True).order_by('-usage_count')[:5]
        stats['most_used_templates'] = ReportTemplateSerializer(most_used_templates, many=True).data
        
        # Storage statistics
        total_file_size = ReportRun.objects.filter(
            status='completed'
        ).aggregate(
            total=Sum('file_size')
        )['total'] or 0
        stats['total_file_size'] = total_file_size
        
        serializer = ReportStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on reports"""
        serializer = BulkReportActionSerializer(data=request.data)
        if serializer.is_valid():
            report_ids = serializer.validated_data['report_ids']
            action_type = serializer.validated_data['action']
            
            reports = Report.objects.filter(id__in=report_ids)
            
            if action_type == 'delete':
                count = reports.count()
                reports.delete()
                message = f'Deleted {count} reports'
            
            elif action_type == 'activate':
                count = reports.update(is_active=True)
                message = f'Activated {count} reports'
            
            elif action_type == 'deactivate':
                count = reports.update(is_active=False)
                message = f'Deactivated {count} reports'
            
            elif action_type == 'run':
                # Run all selected reports
                successful = 0
                failed = 0
                
                for report in reports:
                    try:
                        report_run = ReportRun.objects.create(
                            report=report,
                            executed_by=request.user,
                            status='running'
                        )
                        
                        generator = ReportGeneratorService()
                        result = generator.generate_report(report, report_run)
                        
                        if result['success']:
                            report_run.status = 'completed'
                            report_run.completed_at = timezone.now()
                            report_run.file_path = result['file_path']
                            report_run.file_size = result['file_size']
                            report_run.record_count = result['record_count']
                            report_run.execution_time = timezone.now() - report_run.started_at
                            successful += 1
                        else:
                            report_run.status = 'failed'
                            report_run.error_message = result['error']
                            report_run.completed_at = timezone.now()
                            failed += 1
                        
                        report_run.save()
                        
                    except Exception as e:
                        failed += 1
                
                message = f'Ran {len(report_ids)} reports: {successful} successful, {failed} failed'
            
            return Response({
                'success': True,
                'message': message
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportRunViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing report runs"""
    
    queryset = ReportRun.objects.select_related('report', 'executed_by')
    serializer_class = ReportRunSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter report runs"""
        queryset = super().get_queryset()
        
        # Filter by report
        report_id = self.request.query_params.get('report')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(started_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(started_at__lte=end_date)
        
        return queryset.order_by('-started_at')
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download report file"""
        report_run = self.get_object()
        
        if report_run.status != 'completed' or not report_run.file_path:
            raise Http404("Report file not found")
        
        file_path = report_run.file_path
        
        # Security check - ensure file is in allowed directory
        if not file_path.startswith(settings.MEDIA_ROOT):
            raise Http404("Invalid file path")
        
        if not os.path.exists(file_path):
            raise Http404("File not found")
        
        # Determine content type based on file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.json': 'application/json',
        }
        
        content_type = content_types.get(file_ext, 'application/octet-stream')
        
        # Generate filename
        report_name = report_run.report.name if report_run.report else 'adhoc_report'
        timestamp = report_run.started_at.strftime('%Y%m%d_%H%M%S')
        filename = f"{report_name}_{timestamp}{file_ext}"
        
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=filename
        )
        
        return response


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report templates"""
    
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates"""
        queryset = super().get_queryset()
        
        # Filter by report type
        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Show system templates or user templates
        show_system = self.request.query_params.get('system')
        if show_system is not None:
            queryset = queryset.filter(is_system_template=show_system.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Create a report from template"""
        template = self.get_object()
        
        # Update usage statistics
        template.usage_count += 1
        template.last_used = timezone.now()
        template.save()
        
        # Create report from template
        report_data = {
            'name': f"{template.name} - {timezone.now().strftime('%Y-%m-%d')}",
            'description': f"Report created from template: {template.name}",
            'report_type': template.report_type,
            'format': template.default_format,
            'filters': template.default_filters,
            'columns': template.default_columns,
            'created_by': request.user
        }
        
        report = Report.objects.create(**report_data)
        
        return Response({
            'success': True,
            'message': f'Report created from template: {template.name}',
            'report_id': report.id
        })


def download_report(request, run_id):
    """Download report file by run ID"""
    try:
        report_run = ReportRun.objects.get(id=run_id)
        
        if report_run.status != 'completed' or not report_run.file_path:
            raise Http404("Report file not found")
        
        file_path = report_run.file_path
        
        # Security check
        if not file_path.startswith(settings.MEDIA_ROOT):
            raise Http404("Invalid file path")
        
        if not os.path.exists(file_path):
            raise Http404("File not found")
        
        # Determine content type
        file_ext = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.json': 'application/json',
        }
        
        content_type = content_types.get(file_ext, 'application/octet-stream')
        
        # Generate filename
        report_name = report_run.report.name if report_run.report else 'adhoc_report'
        timestamp = report_run.started_at.strftime('%Y%m%d_%H%M%S')
        filename = f"{report_name}_{timestamp}{file_ext}"
        
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=filename
        )
        
        return response
        
    except ReportRun.DoesNotExist:
        raise Http404("Report run not found")