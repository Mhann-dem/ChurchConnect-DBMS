# backend/churchconnect/reports/views.py

import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any

from django.http import HttpResponse, FileResponse, Http404, JsonResponse
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.throttling import UserRateThrottle

from .models import Report, ReportRun, ReportTemplate
from .serializers import (
    ReportSerializer, ReportRunSerializer, ReportTemplateSerializer,
    ReportGenerationSerializer, ReportStatsSerializer, BulkReportActionSerializer
)
from .services import ReportGeneratorService, ReportSchedulerService

logger = logging.getLogger(__name__)


class ReportThrottle(UserRateThrottle):
    """Custom throttle for report generation"""
    scope = 'report_generation'
    rate = '10/hour'  # Limit to 10 report generations per hour per user


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reports"""
    
    queryset = Report.objects.select_related('created_by', 'template').prefetch_related('runs')
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]
    throttle_classes = [ReportThrottle]
    
    def get_queryset(self):
        """Filter reports based on user permissions and query parameters"""
        queryset = self.queryset
        
        # Users can only see their own reports unless they're staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        
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
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        try:
            serializer.save(created_by=self.request.user)
            logger.info(f"Report created by user {self.request.user.id}: {serializer.instance.name}")
        except Exception as e:
            logger.error(f"Error creating report: {str(e)}")
            raise
    
    def perform_destroy(self, instance):
        """Clean up files when deleting a report"""
        try:
            # Delete associated report run files
            for run in instance.runs.all():
                if run.file_path and Path(run.file_path).exists():
                    try:
                        Path(run.file_path).unlink()
                        logger.info(f"Deleted file: {run.file_path}")
                    except Exception as e:
                        logger.warning(f"Failed to delete file {run.file_path}: {str(e)}")
            
            super().perform_destroy(instance)
            logger.info(f"Report deleted: {instance.name} (ID: {instance.id})")
            
        except Exception as e:
            logger.error(f"Error deleting report {instance.id}: {str(e)}")
            raise
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Run a specific report"""
        report = self.get_object()
        
        # Check permissions
        if not request.user.is_staff and report.created_by != request.user:
            raise PermissionDenied("You can only run your own reports.")
        
        try:
            # Create a report run record
            report_run = ReportRun.objects.create(
                report=report,
                triggered_by=request.user,
                status='running'
            )
            
            logger.info(f"Starting report run {report_run.id} for report {report.id}")
            
            # Generate the report using the service
            generator = ReportGeneratorService()
            result = generator.generate_report(report, report_run)
            
            if result['success']:
                report_run.mark_completed(
                    file_path=result['file_path'],
                    file_size=result['file_size'],
                    record_count=result['record_count']
                )
                
                logger.info(f"Report run {report_run.id} completed successfully")
                
                return Response({
                    'success': True,
                    'message': 'Report generated successfully',
                    'run_id': report_run.id,
                    'download_url': f'/api/v1/reports/download/{report_run.id}/',
                    'file_size': result['file_size'],
                    'record_count': result['record_count']
                })
            else:
                report_run.mark_failed(result['error'])
                
                logger.error(f"Report run {report_run.id} failed: {result['error']}")
                
                return Response({
                    'success': False,
                    'message': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Unexpected error in report run: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], throttle_classes=[ReportThrottle])
    def generate(self, request):
        """Generate a report on-the-fly without saving configuration"""
        serializer = ReportGenerationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Create temporary report run
                report_run = ReportRun.objects.create(
                    report=None,  # No associated report for on-the-fly generation
                    triggered_by=request.user,
                    status='running'
                )
                
                logger.info(f"Starting ad-hoc report generation: {report_run.id}")
                
                # Generate report
                generator = ReportGeneratorService()
                result = generator.generate_adhoc_report(
                    serializer.validated_data, 
                    report_run
                )
                
                if result['success']:
                    report_run.mark_completed(
                        file_path=result['file_path'],
                        file_size=result['file_size'],
                        record_count=result['record_count']
                    )
                    
                    logger.info(f"Ad-hoc report generation {report_run.id} completed successfully")
                    
                    return Response({
                        'success': True,
                        'message': 'Report generated successfully',
                        'run_id': report_run.id,
                        'download_url': f'/api/v1/reports/download/{report_run.id}/',
                        'file_size': result['file_size'],
                        'record_count': result['record_count']
                    })
                else:
                    report_run.mark_failed(result['error'])
                    
                    logger.error(f"Ad-hoc report generation {report_run.id} failed: {result['error']}")
                    
                    return Response({
                        'success': False,
                        'message': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Exception as e:
                logger.error(f"Unexpected error in ad-hoc report generation: {str(e)}", exc_info=True)
                return Response({
                    'success': False,
                    'message': f'Internal server error: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get report statistics"""
        try:
            # Base queryset filtered by user permissions
            reports_qs = Report.objects.all()
            runs_qs = ReportRun.objects.select_related('report')
            
            if not request.user.is_staff:
                reports_qs = reports_qs.filter(created_by=request.user)
                runs_qs = runs_qs.filter(
                    Q(triggered_by=request.user) | Q(report__created_by=request.user)
                )
            
            stats = {
                'total_reports': reports_qs.count(),
                'active_reports': reports_qs.filter(is_active=True).count(),
                'scheduled_reports': reports_qs.filter(is_scheduled=True).count(),
                'total_runs': runs_qs.count(),
                'successful_runs': runs_qs.filter(status='completed').count(),
                'failed_runs': runs_qs.filter(status='failed').count(),
            }
            
            # Report type breakdown
            reports_by_type = dict(
                reports_qs.values('report_type')
                .annotate(count=Count('id'))
                .values_list('report_type', 'count')
            )
            stats['reports_by_type'] = reports_by_type
            
            # Recent runs (last 10)
            recent_runs = runs_qs.order_by('-started_at')[:10]
            stats['recent_runs'] = ReportRunSerializer(
                recent_runs, 
                many=True, 
                context={'request': request}
            ).data
            
            # Most used templates (for staff only)
            if request.user.is_staff:
                most_used_templates = ReportTemplate.objects.filter(
                    is_active=True
                ).order_by('-usage_count')[:5]
                stats['most_used_templates'] = ReportTemplateSerializer(
                    most_used_templates, 
                    many=True
                ).data
            else:
                stats['most_used_templates'] = []
            
            # Storage statistics
            total_file_size = runs_qs.filter(
                status='completed'
            ).aggregate(
                total=Sum('file_size')
            )['total'] or 0
            stats['total_file_size'] = total_file_size
            
            serializer = ReportStatsSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating report stats: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to generate statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on reports"""
        serializer = BulkReportActionSerializer(data=request.data)
        if serializer.is_valid():
            report_ids = serializer.validated_data['report_ids']
            action_type = serializer.validated_data['action']
            
            # Filter reports by user permissions
            reports = Report.objects.filter(id__in=report_ids)
            if not request.user.is_staff:
                reports = reports.filter(created_by=request.user)
            
            if not reports.exists():
                return Response({
                    'success': False,
                    'message': 'No accessible reports found with the provided IDs'
                }, status=status.HTTP_404_NOT_FOUND)
            
            try:
                if action_type == 'delete':
                    # Clean up files before deletion
                    for report in reports:
                        for run in report.runs.all():
                            if run.file_path and Path(run.file_path).exists():
                                try:
                                    Path(run.file_path).unlink()
                                except Exception as e:
                                    logger.warning(f"Failed to delete file {run.file_path}: {str(e)}")
                    
                    count = reports.count()
                    reports.delete()
                    message = f'Deleted {count} reports'
                    logger.info(f"Bulk delete: {count} reports deleted by user {request.user.id}")
                
                elif action_type == 'activate':
                    count = reports.update(is_active=True)
                    message = f'Activated {count} reports'
                    logger.info(f"Bulk activate: {count} reports activated by user {request.user.id}")
                
                elif action_type == 'deactivate':
                    count = reports.update(is_active=False)
                    message = f'Deactivated {count} reports'
                    logger.info(f"Bulk deactivate: {count} reports deactivated by user {request.user.id}")
                
                elif action_type == 'run':
                    # Run all selected reports
                    successful = 0
                    failed = 0
                    
                    generator = ReportGeneratorService()
                    
                    for report in reports[:5]:  # Limit to 5 concurrent reports
                        try:
                            report_run = ReportRun.objects.create(
                                report=report,
                                triggered_by=request.user,
                                status='running'
                            )
                            
                            result = generator.generate_report(report, report_run)
                            
                            if result['success']:
                                report_run.mark_completed(
                                    file_path=result['file_path'],
                                    file_size=result['file_size'],
                                    record_count=result['record_count']
                                )
                                successful += 1
                            else:
                                report_run.mark_failed(result['error'])
                                failed += 1
                            
                        except Exception as e:
                            logger.error(f"Error in bulk run for report {report.id}: {str(e)}")
                            failed += 1
                    
                    processed = min(len(reports), 5)
                    message = f'Processed {processed} reports: {successful} successful, {failed} failed'
                    if len(reports) > 5:
                        message += f' (limited to first 5 of {len(reports)} selected)'
                
                return Response({
                    'success': True,
                    'message': message
                })
                
            except Exception as e:
                logger.error(f"Error in bulk action {action_type}: {str(e)}", exc_info=True)
                return Response({
                    'success': False,
                    'message': f'Failed to perform bulk action: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportRunViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing report runs"""
    
    queryset = ReportRun.objects.select_related('report', 'triggered_by').order_by('-started_at')
    serializer_class = ReportRunSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter report runs based on user permissions"""
        queryset = self.queryset
        
        # Users can only see their own report runs unless they're staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(triggered_by=self.request.user) | Q(report__created_by=self.request.user)
            )
        
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
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                queryset = queryset.filter(started_at__gte=start_dt)
            except ValueError:
                logger.warning(f"Invalid start_date format: {start_date}")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                queryset = queryset.filter(started_at__lte=end_dt)
            except ValueError:
                logger.warning(f"Invalid end_date format: {end_date}")
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report templates"""
    
    queryset = ReportTemplate.objects.select_related('created_by').order_by('-created_at')
    serializer_class = ReportTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates based on permissions and parameters"""
        queryset = self.queryset
        
        # Users can see system templates and their own templates
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_system_template=True) | Q(created_by=self.request.user)
            )
        
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
        logger.info(f"Report template created by user {self.request.user.id}: {serializer.instance.name}")
    
    def perform_update(self, serializer):
        """Check permissions for template updates"""
        instance = self.get_object()
        
        # Only allow updates to own templates or if user is staff
        if not self.request.user.is_staff and instance.created_by != self.request.user:
            raise PermissionDenied("You can only edit your own templates.")
        
        # System templates can only be edited by staff
        if instance.is_system_template and not self.request.user.is_staff:
            raise PermissionDenied("Only staff can edit system templates.")
        
        serializer.save()
        logger.info(f"Report template updated by user {self.request.user.id}: {instance.name}")
    
    def perform_destroy(self, instance):
        """Check permissions for template deletion"""
        # Only allow deletion of own templates or if user is staff
        if not self.request.user.is_staff and instance.created_by != self.request.user:
            raise PermissionDenied("You can only delete your own templates.")
        
        # System templates can only be deleted by staff
        if instance.is_system_template and not self.request.user.is_staff:
            raise PermissionDenied("Only staff can delete system templates.")
        
        super().perform_destroy(instance)
        logger.info(f"Report template deleted: {instance.name} (ID: {instance.id})")
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Create a report from template"""
        template = self.get_object()
        
        try:
            # Update usage statistics
            template.increment_usage()
            
            # Create report from template
            report_data = {
                'name': f"{template.name} - {timezone.now().strftime('%Y-%m-%d')}",
                'description': f"Report created from template: {template.name}",
                'report_type': template.report_type,
                'format': template.default_format,
                'filters': template.default_filters,
                'columns': template.default_columns,
                'created_by': request.user,
                'template': template
            }
            
            report = Report.objects.create(**report_data)
            
            logger.info(f"Report created from template {template.id} by user {request.user.id}")
            
            return Response({
                'success': True,
                'message': f'Report created from template: {template.name}',
                'report_id': report.id,
                'report': ReportSerializer(report, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"Error creating report from template {template.id}: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'Failed to create report from template: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def download_report(request, run_id):
    """Download report file by run ID"""
    try:
        report_run = ReportRun.objects.select_related('report').get(id=run_id)
        
        # Check permissions
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        if (not request.user.is_staff and 
            report_run.triggered_by != request.user and 
            (report_run.report and report_run.report.created_by != request.user)):
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        if report_run.status != 'completed' or not report_run.file_path:
            raise Http404("Report file not found")
        
        file_path = Path(report_run.file_path)
        
        # Security check
        if not str(file_path).startswith(str(Path(settings.MEDIA_ROOT))):
            logger.warning(f"Attempt to access file outside media root: {file_path}")
            raise Http404("Invalid file path")
        
        if not file_path.exists():
            logger.warning(f"Report file not found: {file_path}")
            raise Http404("File not found")
        
        # Determine content type
        content_types = {
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.json': 'application/json',
        }
        
        content_type = content_types.get(file_path.suffix.lower(), 'application/octet-stream')
        
        # Generate filename
        report_name = report_run.report.name if report_run.report else 'adhoc_report'
        safe_name = "".join(c for c in report_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        timestamp = report_run.started_at.strftime('%Y%m%d_%H%M%S')
        filename = f"{safe_name}_{timestamp}{file_path.suffix}"
        
        logger.info(f"File download: {filename} by user {request.user.id}")
        
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=filename
        )
        
        return response
        
    except ReportRun.DoesNotExist:
        raise Http404("Report run not found")
    except Exception as e:
        logger.error(f"Error downloading report {run_id}: {str(e)}", exc_info=True)
        return JsonResponse({'error': 'Internal server error'}, status=500)