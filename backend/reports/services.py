# backend/churchconnect/reports/services.py

import os
import csv
import json
import openpyxl
from io import StringIO, BytesIO
from datetime import datetime, timedelta
from django.conf import settings
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from ..members.models import Member
from ..pladges.models import Pledge
from ..groups.models import Group
from ..families.models import Family
from .models import Report, ReportRun


class ReportGeneratorService:
    """Service class for generating various types of reports"""
    
    def __init__(self):
        self.media_root = settings.MEDIA_ROOT
        self.reports_dir = os.path.join(self.media_root, 'reports')
        
        # Ensure reports directory exists
        os.makedirs(self.reports_dir, exist_ok=True)
    
    def generate_report(self, report, report_run):
        """Generate a report based on configuration"""
        try:
            # Get data based on report type
            data = self._get_report_data(
                report.report_type,
                report.filters,
                report.columns
            )
            
            # Generate file based on format
            file_path = self._generate_file(
                data,
                report.format,
                report.name,
                report_run.id
            )
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            return {
                'success': True,
                'file_path': file_path,
                'file_size': file_size,
                'record_count': len(data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_adhoc_report(self, report_config, report_run):
        """Generate an ad-hoc report without saving configuration"""
        try:
            data = self._get_report_data(
                report_config['report_type'],
                report_config.get('filters', {}),
                report_config.get('columns', [])
            )
            
            name = report_config.get('name', f"adhoc_{report_config['report_type']}")
            
            file_path = self._generate_file(
                data,
                report_config['format'],
                name,
                report_run.id
            )
            
            file_size = os.path.getsize(file_path)
            
            return {
                'success': True,
                'file_path': file_path,
                'file_size': file_size,
                'record_count': len(data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_report_data(self, report_type, filters=None, columns=None):
        """Get data for specific report type"""
        if filters is None:
            filters = {}
        
        if report_type == 'members':
            return self._get_members_data(filters, columns)
        elif report_type == 'pledges':
            return self._get_pledges_data(filters, columns)
        elif report_type == 'groups':
            return self._get_groups_data(filters, columns)
        elif report_type == 'families':
            return self._get_families_data(filters, columns)
        elif report_type == 'statistics':
            return self._get_statistics_data(filters, columns)
        else:
            raise ValueError(f"Unknown report type: {report_type}")
    
    def _get_members_data(self, filters, columns):
        """Get members data with filters"""
        queryset = Member.objects.select_related('family').prefetch_related('groups', 'pledges')
        
        # Apply filters
        if filters.get('age_min'):
            birth_date_max = timezone.now().date() - timedelta(days=filters['age_min'] * 365)
            queryset = queryset.filter(date_of_birth__lte=birth_date_max)
        
        if filters.get('age_max'):
            birth_date_min = timezone.now().date() - timedelta(days=filters['age_max'] * 365)
            queryset = queryset.filter(date_of_birth__gte=birth_date_min)
        
        if filters.get('gender'):
            queryset = queryset.filter(gender=filters['gender'])
        
        if filters.get('groups'):
            queryset = queryset.filter(groups__id__in=filters['groups'])
        
        if filters.get('has_pledged'):
            if filters['has_pledged']:
                queryset = queryset.filter(pledges__isnull=False)
            else:
                queryset = queryset.filter(pledges__isnull=True)
        
        if filters.get('registration_date_from'):
            queryset = queryset.filter(registration_date__gte=filters['registration_date_from'])
        
        if filters.get('registration_date_to'):
            queryset = queryset.filter(registration_date__lte=filters['registration_date_to'])
        
        if filters.get('is_active') is not None:
            queryset = queryset.filter(is_active=filters['is_active'])
        
        # Default columns if none specified
        if not columns:
            columns = [
                'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
                'gender', 'address', 'registration_date', 'preferred_contact_method'
            ]
        
        # Convert queryset to list of dictionaries
        data = []
        for member in queryset:
            row = {}
            for column in columns:
                if hasattr(member, column):
                    value = getattr(member, column)
                    if isinstance(value, datetime):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif value is None:
                        value = ''
                    row[column] = value
                elif column == 'age':
                    if member.date_of_birth:
                        age = (timezone.now().date() - member.date_of_birth).days // 365
                        row[column] = age
                    else:
                        row[column] = ''
                elif column == 'groups':
                    row[column] = ', '.join([group.name for group in member.groups.all()])
                elif column == 'family_name':
                    row[column] = member.family.family_name if member.family else ''
                elif column == 'total_pledged':
                    total = member.pledges.aggregate(Sum('amount'))['amount__sum'] or 0
                    row[column] = total
                else:
                    row[column] = ''
            data.append(row)
        
        return data
    
    def _get_pledges_data(self, filters, columns):
        """Get pledges data with filters"""
        queryset = Pledge.objects.select_related('member')
        
        # Apply filters
        if filters.get('amount_min'):
            queryset = queryset.filter(amount__gte=filters['amount_min'])
        
        if filters.get('amount_max'):
            queryset = queryset.filter(amount__lte=filters['amount_max'])
        
        if filters.get('frequency'):
            queryset = queryset.filter(frequency=filters['frequency'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
        
        if filters.get('start_date_from'):
            queryset = queryset.filter(start_date__gte=filters['start_date_from'])
        
        if filters.get('start_date_to'):
            queryset = queryset.filter(start_date__lte=filters['start_date_to'])
        
        # Default columns
        if not columns:
            columns = [
                'member_name', 'member_email', 'amount', 'frequency',
                'start_date', 'end_date', 'status', 'created_at'
            ]
        
        data = []
        for pledge in queryset:
            row = {}
            for column in columns:
                if hasattr(pledge, column):
                    value = getattr(pledge, column)
                    if isinstance(value, datetime):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif value is None:
                        value = ''
                    row[column] = value
                elif column == 'member_name':
                    row[column] = f"{pledge.member.first_name} {pledge.member.last_name}"
                elif column == 'member_email':
                    row[column] = pledge.member.email
                elif column == 'member_phone':
                    row[column] = pledge.member.phone
                else:
                    row[column] = ''
            data.append(row)
        
        return data
    
    def _get_groups_data(self, filters, columns):
        """Get groups data with filters"""
        queryset = Group.objects.prefetch_related('members')
        
        # Apply filters
        if filters.get('active') is not None:
            queryset = queryset.filter(active=filters['active'])
        
        if filters.get('min_members'):
            queryset = queryset.annotate(
                member_count=Count('members')
            ).filter(member_count__gte=filters['min_members'])
        
        # Default columns
        if not columns:
            columns = [
                'name', 'description', 'leader_name', 'meeting_schedule',
                'member_count', 'active', 'created_at'
            ]
        
        data = []
        for group in queryset:
            row = {}
            for column in columns:
                if hasattr(group, column):
                    value = getattr(group, column)
                    if isinstance(value, datetime):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif value is None:
                        value = ''
                    row[column] = value
                elif column == 'member_count':
                    row[column] = group.members.count()
                else:
                    row[column] = ''
            data.append(row)
        
        return data
    
    def _get_families_data(self, filters, columns):
        """Get families data with filters"""
        queryset = Family.objects.prefetch_related('members')
        
        # Apply filters
        if filters.get('min_members'):
            queryset = queryset.annotate(
                member_count=Count('members')
            ).filter(member_count__gte=filters['min_members'])
        
        # Default columns
        if not columns:
            columns = [
                'family_name', 'primary_contact_name', 'primary_contact_email',
                'address', 'member_count', 'created_at'
            ]
        
        data = []
        for family in queryset:
            row = {}
            for column in columns:
                if hasattr(family, column):
                    value = getattr(family, column)
                    if isinstance(value, datetime):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif value is None:
                        value = ''
                    row[column] = value
                elif column == 'member_count':
                    row[column] = family.members.count()
                elif column == 'primary_contact_name':
                    if family.primary_contact:
                        row[column] = f"{family.primary_contact.first_name} {family.primary_contact.last_name}"
                    else:
                        row[column] = ''
                elif column == 'primary_contact_email':
                    row[column] = family.primary_contact.email if family.primary_contact else ''
                else:
                    row[column] = ''
            data.append(row)
        
        return data
    
    def _get_statistics_data(self, filters, columns):
        """Get statistics data"""
        data = []
        
        # Members statistics
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        new_members_this_month = Member.objects.filter(
            registration_date__gte=timezone.now().replace(day=1)
        ).count()
        
        data.append({
            'category': 'Members',
            'metric': 'Total Members',
            'value': total_members
        })
        data.append({
            'category': 'Members',
            'metric': 'Active Members',
            'value': active_members
        })
        data.append({
            'category': 'Members',
            'metric': 'New Members This Month',
            'value': new_members_this_month
        })
        
        # Gender distribution
        gender_stats = Member.objects.values('gender').annotate(count=Count('id'))
        for stat in gender_stats:
            data.append({
                'category': 'Demographics',
                'metric': f"Members - {stat['gender'].title()}",
                'value': stat['count']
            })
        
        # Pledges statistics
        total_pledges = Pledge.objects.count()
        active_pledges = Pledge.objects.filter(status='active').count()
        total_pledge_amount = Pledge.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        data.append({
            'category': 'Pledges',
            'metric': 'Total Pledges',
            'value': total_pledges
        })
        data.append({
            'category': 'Pledges',
            'metric': 'Active Pledges',
            'value': active_pledges
        })
        data.append({
            'category': 'Pledges',
            'metric': 'Total Pledge Amount',
            'value': total_pledge_amount
        })
        
        # Groups statistics
        total_groups = Group.objects.count()
        active_groups = Group.objects.filter(active=True).count()
        
        data.append({
            'category': 'Groups',
            'metric': 'Total Groups',
            'value': total_groups
        })
        data.append({
            'category': 'Groups',
            'metric': 'Active Groups',
            'value': active_groups
        })
        
        return data
    
    def _generate_file(self, data, format_type, name, run_id):
        """Generate file in specified format"""
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{name}_{timestamp}_{run_id}"
        
        if format_type == 'csv':
            return self._generate_csv(data, filename)
        elif format_type == 'excel':
            return self._generate_excel(data, filename)
        elif format_type == 'pdf':
            return self._generate_pdf(data, filename, name)
        elif format_type == 'json':
            return self._generate_json(data, filename)
        else:
            raise ValueError(f"Unsupported format: {format_type}")
    
    def _generate_csv(self, data, filename):
        """Generate CSV file"""
        file_path = os.path.join(self.reports_dir, f"{filename}.csv")
        
        if not data:
            # Create empty file
            with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
                csvfile.write("No data available")
            return file_path
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        return file_path
    
    def _generate_excel(self, data, filename):
        """Generate Excel file"""
        file_path = os.path.join(self.reports_dir, f"{filename}.xlsx")
        
        workbook = openpyxl.Workbook()
        worksheet = workbook.active
        worksheet.title = "Report Data"
        
        if not data:
            worksheet.cell(row=1, column=1, value="No data available")
            workbook.save(file_path)
            return file_path
        
        # Write headers
        headers = list(data[0].keys())
        for col, header in enumerate(headers, 1):
            cell = worksheet.cell(row=1, column=col, value=header)
            cell.font = openpyxl.styles.Font(bold=True)
        
        # Write data
        for row_idx, row_data in enumerate(data, 2):
            for col_idx, header in enumerate(headers, 1):
                worksheet.cell(row=row_idx, column=col_idx, value=row_data.get(header, ''))
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
        
        workbook.save(file_path)
        return file_path
    
    def _generate_pdf(self, data, filename, title):
        """Generate PDF file"""
        file_path = os.path.join(self.reports_dir, f"{filename}.pdf")
        
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Title
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 12))
        
        # Generation info
        generation_info = f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(generation_info, styles['Normal']))
        story.append(Spacer(1, 12))
        
        if not data:
            story.append(Paragraph("No data available", styles['Normal']))
        else:
            # Create table
            headers = list(data[0].keys())
            table_data = [headers]
            
            for row in data:
                table_data.append([str(row.get(header, '')) for header in headers])
            
            # Limit columns to fit page width
            if len(headers) > 6:
                table_data = [row[:6] for row in table_data]
                story.append(Paragraph("Note: Only first 6 columns shown due to page width constraints", styles['Italic']))
                story.append(Spacer(1, 12))
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
        
        # Record count
        record_count = f"Total Records: {len(data)}"
        story.append(Spacer(1, 12))
        story.append(Paragraph(record_count, styles['Normal']))
        
        doc.build(story)
        return file_path
    
    def _generate_json(self, data, filename):
        """Generate JSON file"""
        file_path = os.path.join(self.reports_dir, f"{filename}.json")
        
        report_data = {
            'generated_at': timezone.now().isoformat(),
            'record_count': len(data),
            'data': data
        }
        
        with open(file_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(report_data, jsonfile, indent=2, ensure_ascii=False, default=str)
        
        return file_path


class ReportSchedulerService:
    """Service for managing scheduled reports"""
    
    def __init__(self):
        self.generator = ReportGeneratorService()
    
    def run_scheduled_reports(self):
        """Run all scheduled reports that are due"""
        now = timezone.now()
        due_reports = Report.objects.filter(
            is_scheduled=True,
            is_active=True,
            next_run__lte=now
        )
        
        results = []
        
        for report in due_reports:
            try:
                # Create report run
                report_run = ReportRun.objects.create(
                    report=report,
                    status='running'
                )
                
                # Generate report
                result = self.generator.generate_report(report, report_run)
                
                if result['success']:
                    report_run.status = 'completed'
                    report_run.completed_at = timezone.now()
                    report_run.file_path = result['file_path']
                    report_run.file_size = result['file_size']
                    report_run.record_count = result['record_count']
                    report_run.execution_time = timezone.now() - report_run.started_at
                    
                    # Send email if configured
                    if report.email_recipients:
                        self._send_report_email(report, report_run)
                    
                    # Update next run time
                    report.last_run = timezone.now()
                    report.next_run = self._calculate_next_run(report)
                    report.save()
                    
                    results.append({
                        'report_id': report.id,
                        'status': 'success',
                        'message': 'Report generated and sent successfully'
                    })
                    
                else:
                    report_run.status = 'failed'
                    report_run.error_message = result['error']
                    report_run.completed_at = timezone.now()
                    
                    results.append({
                        'report_id': report.id,
                        'status': 'failed',
                        'message': result['error']
                    })
                
                report_run.save()
                
            except Exception as e:
                results.append({
                    'report_id': report.id,
                    'status': 'error',
                    'message': str(e)
                })
        
        return results
    
    def _calculate_next_run(self, report):
        """Calculate next run time based on frequency"""
        now = timezone.now()
        
        if report.frequency == 'daily':
            return now + timedelta(days=1)
        elif report.frequency == 'weekly':
            return now + timedelta(weeks=1)
        elif report.frequency == 'monthly':
            return now + timedelta(days=30)
        elif report.frequency == 'quarterly':
            return now + timedelta(days=90)
        elif report.frequency == 'annually':
            return now + timedelta(days=365)
        else:
            return None
    
    def _send_report_email(self, report, report_run):
        """Send report via email"""
        try:
            subject = report.email_subject or f"Scheduled Report: {report.name}"
            body = report.email_body or f"Please find attached the scheduled report: {report.name}"
            
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=report.email_recipients
            )
            
            # Attach report file
            if report_run.file_path and os.path.exists(report_run.file_path):
                email.attach_file(report_run.file_path)
            
            email.send()
            
        except Exception as e:
            # Log email sending error but don't fail the report generation
            print(f"Failed to send email for report {report.id}: {str(e)}")