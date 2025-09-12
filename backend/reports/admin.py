# backend/churchconnect/reports/admin.py

import logging
from pathlib import Path
from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.db.models import Count, Q
from django.utils.safestring import mark_safe

from .models import Report, ReportRun, ReportTemplate
from .services import ReportGeneratorService

logger = logging.getLogger(__name__)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    """Admin interface for ReportTemplate model"""
    
    list_display = [
        'name', 'report_type', 'default_format', 'is_system_template', 
        'is_active', 'usage_count', 'created_by', 'created_at'
    ]
    list_filter = [
        'report_type', 'default_format', 'is_system_template', 
        'is_active', 'created_at'
    ]
    search_fields = ['name', 'description', 'created_by__username', 'created_by__email']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'usage_count', 'last_used']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'report_type')
        }),
        ('Template Configuration', {
            'fields': ('default_filters', 'default_columns', 'default_format'),
            'description': 'Default settings for reports created from this template'
        }),
        ('Settings', {
            'fields': ('is_system_template', 'is_active')
        }),
        ('Statistics', {
            'fields': ('usage_count', 'last_used'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['activate_templates', 'deactivate_templates', 'mark_as_system']
    
    def get_queryset(self, request):
        """Add prefetch related for performance"""
        return super().get_queryset(request).select_related('created_by')
    
    def save_model(self, request, obj, form, change):
        """Set created_by when saving"""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def activate_templates(self, request, queryset):
        """Activate selected templates"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} templates activated.')
        logger.info(f"Admin action: {updated} templates activated by {request.user}")
    activate_templates.short_description = 'Activate selected templates'
    
    def deactivate_templates(self, request, queryset):
        """Deactivate selected templates"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} templates deactivated.')
        logger.info(f"Admin action: {updated} templates deactivated by {request.user}")
    deactivate_templates.short_description = 'Deactivate selected templates'
    
    def mark_as_system(self, request, queryset):
        """Mark selected templates as system templates"""
        if not request.user.is_superuser:
            self.message_user(request, 'Only superusers can mark templates as system templates.', messages.ERROR)
            return
        
        updated = queryset.update(is_system_template=True)
        self.message_user(request, f'{updated} templates marked as system templates.')
        logger.info(f"Admin action: {updated} templates marked as system by {request.user}")
    mark_as_system.short_description = 'Mark as system templates'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin interface for Report model"""
    
    list_display = [
        'name', 'report_type', 'format', 'created_by_name', 'is_scheduled',
        'frequency', 'is_active', 'run_count', 'last_run', 'created_at', 
        'action_buttons'
    ]
    list_filter = [
        'report_type', 'format', 'is_scheduled', 'frequency', 'is_active',
        'created_at', 'last_run'
    ]
    search_fields = [
        'name', 'description', 'created_by__username', 
        'created_by__email', 'created_by__first_name', 'created_by__last_name'
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'last_run', 
        'total_runs', 'successful_runs', 'failed_runs'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'report_type', 'format')
        }),
        ('Configuration', {
            'fields': ('filters', 'columns', 'template'),
            'description': 'Report configuration and data filtering'
        }),
        ('Scheduling', {
            'fields': ('is_scheduled', 'frequency', 'next_run', 'email_recipients', 
                      'email_subject', 'email_body'),
            'classes': ('collapse',)
        }),
        ('Status & Statistics', {
            'fields': ('is_active', 'last_run', 'total_runs', 'successful_runs', 'failed_runs')
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['run_selected_reports', 'activate_reports', 'deactivate_reports', 'duplicate_reports']
    
    def get_queryset(self, request):
        """Add prefetch related for performance"""
        return super().get_queryset(request).select_related('created_by', 'template').prefetch_related('runs')
    
    def created_by_name(self, obj):
        """Display creator's full name"""
        return obj.created_by.get_full_name() or obj.created_by.username
    created_by_name.short_description = 'Created By'
    created_by_name.admin_order_field = 'created_by__first_name'
    
    def run_count(self, obj):
        """Display total number of runs"""
        return obj.runs.count()
    run_count.short_description = 'Total Runs'
    
    def total_runs(self, obj):
        """Total runs for readonly field"""
        return obj.runs.count()
    total_runs.short_description = 'Total Runs'
    
    def successful_runs(self, obj):
        """Successful runs for readonly field"""
        return obj.runs.filter(status='completed').count()
    successful_runs.short_description = 'Successful Runs'
    
    def failed_runs(self, obj):
        """Failed runs for readonly field"""
        return obj.runs.filter(status='failed').count()
    failed_runs.short_description = 'Failed Runs'
    
    def action_buttons(self, obj):
        """Add action buttons in the list view"""
        buttons = []
        
        # Run report button
        run_url = reverse('admin:reports_report_run', args=[obj.pk])
        buttons.append(f'<a class="button" href="{run_url}" style="margin-right: 5px;">Run</a>')
        
        # View runs button
        runs_url = reverse('admin:reports_reportrun_changelist') + f'?report__id__exact={obj.pk}'
        run_count = obj.runs.count()
        buttons.append(f'<a class="button" href="{runs_url}">View Runs ({run_count})</a>')
        
        return mark_safe(''.join(buttons))
    action_buttons.short_description = 'Actions'
    
    def get_urls(self):
        """Add custom URLs for report actions"""
        urls = super().get_urls()
        custom_urls = [
            path('<uuid:report_id>/run/', self.admin_site.admin_view(self.run_report_view), 
                 name='reports_report_run'),
        ]
        return custom_urls + urls
    
    def run_report_view(self, request, report_id):
        """Handle running a report from admin"""
        try:
            report = get_object_or_404(Report, pk=report_id)
            
            # Create report run
            report_run = ReportRun.objects.create(
                report=report,
                triggered_by=request.user,
                status='running'
            )
            
            # Generate report
            service = ReportGeneratorService()
            result = service.generate_report(report, report_run)
            
            if result['success']:
                report_run.mark_completed(
                    file_path=result['file_path'],
                    file_size=result['file_size'],
                    record_count=result['record_count']
                )
                
                messages.success(
                    request, 
                    f'Report "{report.name}" generated successfully! '
                    f'{result["record_count"]} records, '
                    f'{result["file_size"] // 1024}KB'
                )
                
                # Provide download link
                download_url = reverse('reports:download_report', args=[report_run.id])
                messages.info(
                    request,
                    mark_safe(f'<a href="{download_url}" target="_blank">Download Report</a>')
                )
                
            else:
                report_run.mark_failed(result['error'])
                messages.error(request, f'Error generating report: {result["error"]}')
                
        except Exception as e:
            logger.error(f"Admin report run error: {str(e)}", exc_info=True)
            messages.error(request, f'Unexpected error: {str(e)}')
            
        return redirect('admin:reports_report_changelist')
    
    def save_model(self, request, obj, form, change):
        """Set created_by when saving"""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def run_selected_reports(self, request, queryset):
        """Run selected reports"""
        if queryset.count() > 5:
            self.message_user(
                request, 
                'Too many reports selected. Maximum 5 reports can be run at once.',
                messages.WARNING
            )
            return
        
        service = ReportGeneratorService()
        success_count = 0
        total_count = queryset.count()
        
        for report in queryset:
            try:
                report_run = ReportRun.objects.create(
                    report=report,
                    triggered_by=request.user,
                    status='running'
                )
                
                result = service.generate_report(report, report_run)
                if result['success']:
                    report_run.mark_completed(
                        file_path=result['file_path'],
                        file_size=result['file_size'],
                        record_count=result['record_count']
                    )
                    success_count += 1
                else:
                    report_run.mark_failed(result['error'])
                    
            except Exception as e:
                logger.error(f"Bulk report run error for report {report.id}: {str(e)}")
                continue
                
        self.message_user(
            request,
            f'{success_count} out of {total_count} reports generated successfully.'
        )
        logger.info(f"Admin bulk run: {success_count}/{total_count} reports by {request.user}")
    run_selected_reports.short_description = 'Run selected reports'
    
    def activate_reports(self, request, queryset):
        """Activate selected reports"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} reports activated.')
        logger.info(f"Admin action: {updated} reports activated by {request.user}")
    activate_reports.short_description = 'Activate selected reports'
    
    def deactivate_reports(self, request, queryset):
        """Deactivate selected reports"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} reports deactivated.')
        logger.info(f"Admin action: {updated} reports deactivated by {request.user}")
    deactivate_reports.short_description = 'Deactivate selected reports'
    
    def duplicate_reports(self, request, queryset):
        """Duplicate selected reports"""
        if queryset.count() > 10:
            self.message_user(
                request,
                'Too many reports selected for duplication. Maximum 10 reports.',
                messages.WARNING
            )
            return
        
        duplicated_count = 0
        for report in queryset:
            try:
                # Create duplicate
                report.pk = None  # This will create a new instance
                report.name = f"{report.name} (Copy)"
                report.created_by = request.user
                report.is_scheduled = False  # Disable scheduling for duplicates
                report.next_run = None
                report.last_run = None
                report.save()
                duplicated_count += 1
            except Exception as e:
                logger.error(f"Error duplicating report: {str(e)}")
                continue
        
        self.message_user(request, f'{duplicated_count} reports duplicated.')
        logger.info(f"Admin action: {duplicated_count} reports duplicated by {request.user}")
    duplicate_reports.short_description = 'Duplicate selected reports'


@admin.register(ReportRun)
class ReportRunAdmin(admin.ModelAdmin):
    """Admin interface for ReportRun model"""
    
    list_display = [
        'report_name', 'status_colored', 'started_at', 'duration_display',
        'file_size_display', 'record_count', 'triggered_by_name', 'download_button'
    ]
    list_filter = ['status', 'started_at', 'completed_at']
    search_fields = [
        'report__name', 'triggered_by__username', 'triggered_by__email',
        'error_message'
    ]
    ordering = ['-started_at']
    readonly_fields = [
        'id', 'started_at', 'completed_at', 'execution_time', 'file_size',
        'file_path', 'record_count', 'error_message'
    ]
    
    fieldsets = (
        ('Run Information', {
            'fields': ('report', 'status', 'triggered_by')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'execution_time')
        }),
        ('Results', {
            'fields': ('file_path', 'file_size', 'record_count'),
            'classes': ('collapse',)
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['delete_selected_with_files']
    
    def get_queryset(self, request):
        """Add prefetch related for performance"""
        return super().get_queryset(request).select_related('report', 'triggered_by')
    
    def report_name(self, obj):
        """Display report name or indicate ad-hoc"""
        return obj.report.name if obj.report else 'Ad-hoc Report'
    report_name.short_description = 'Report'
    report_name.admin_order_field = 'report__name'
    
    def triggered_by_name(self, obj):
        """Display user who triggered the run"""
        if obj.triggered_by:
            return obj.triggered_by.get_full_name() or obj.triggered_by.username
        return 'System'
    triggered_by_name.short_description = 'Triggered By'
    triggered_by_name.admin_order_field = 'triggered_by__first_name'
    
    def status_colored(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': 'orange',
            'running': 'blue',
            'completed': 'green',
            'failed': 'red',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    status_colored.admin_order_field = 'status'
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        return obj.file_size_display
    file_size_display.short_description = 'File Size'
    file_size_display.admin_order_field = 'file_size'
    
    def duration_display(self, obj):
        """Display execution duration"""
        return obj.duration_display
    duration_display.short_description = 'Duration'
    
    def download_button(self, obj):
        """Provide download button for completed reports"""
        if obj.status == 'completed' and obj.file_path and Path(obj.file_path).exists():
            download_url = reverse('reports:download_report', args=[obj.id])
            return format_html(
                '<a class="button" href="{}" target="_blank">Download</a>',
                download_url
            )
        return "N/A"
    download_button.short_description = 'Download'
    
    def delete_selected_with_files(self, request, queryset):
        """Delete selected report runs and their associated files"""
        deleted_files = 0
        for run in queryset:
            if run.file_path and Path(run.file_path).exists():
                try:
                    Path(run.file_path).unlink()
                    deleted_files += 1
                except Exception as e:
                    logger.warning(f"Failed to delete file {run.file_path}: {str(e)}")
        
        deleted_runs = queryset.count()
        queryset.delete()
        
        self.message_user(
            request,
            f'Deleted {deleted_runs} report runs and {deleted_files} associated files.'
        )
        logger.info(f"Admin action: {deleted_runs} runs deleted with {deleted_files} files by {request.user}")
    delete_selected_with_files.short_description = 'Delete selected runs and files'
    
    def has_add_permission(self, request):
        """Disable adding report runs through admin"""
        return False