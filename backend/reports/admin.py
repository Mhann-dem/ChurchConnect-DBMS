# backend/churchconnect/reports/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.http import HttpResponse
from django.shortcuts import redirect
from django.contrib import messages
from .models import Report, ReportRun, ReportTemplate
from .services import ReportService

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin interface for Report model"""
    
    list_display = [
        'name', 'report_type', 'format', 'created_by', 'is_scheduled',
        'frequency', 'last_run', 'is_active', 'created_at', 'run_report_action'
    ]
    list_filter = [
        'report_type', 'format', 'is_scheduled', 'frequency', 'is_active',
        'created_at', 'last_run'
    ]
    search_fields = ['name', 'description', 'created_by__username', 'created_by__email']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_run', 'run_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'report_type', 'format')
        }),
        ('Configuration', {
            'fields': ('filters', 'fields_to_include', 'sort_by')
        }),
        ('Scheduling', {
            'fields': ('is_scheduled', 'frequency', 'recipients', 'next_run')
        }),
        ('Status', {
            'fields': ('is_active', 'last_run', 'run_count')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['run_selected_reports', 'activate_reports', 'deactivate_reports']
    
    def run_report_action(self, obj):
        """Add a run report button in the list view"""
        url = reverse('admin:reports_report_run', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Run Report</a>',
            url
        )
    run_report_action.short_description = 'Actions'
    
    def get_urls(self):
        """Add custom URLs for report actions"""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:report_id>/run/', self.admin_site.admin_view(self.run_report_view), name='reports_report_run'),
        ]
        return custom_urls + urls
    
    def run_report_view(self, request, report_id):
        """Handle running a report from admin"""
        try:
            report = Report.objects.get(pk=report_id)
            service = ReportService()
            result = service.generate_report(report)
            
            if result['success']:
                messages.success(request, f'Report "{report.name}" generated successfully!')
                # Return the file as download
                response = HttpResponse(
                    result['data'],
                    content_type=result['content_type']
                )
                response['Content-Disposition'] = f'attachment; filename="{result["filename"]}"'
                return response
            else:
                messages.error(request, f'Error generating report: {result["error"]}')
                
        except Report.DoesNotExist:
            messages.error(request, 'Report not found')
        except Exception as e:
            messages.error(request, f'Unexpected error: {str(e)}')
            
        return redirect('admin:reports_report_changelist')
    
    def run_selected_reports(self, request, queryset):
        """Run selected reports"""
        service = ReportService()
        success_count = 0
        
        for report in queryset:
            try:
                result = service.generate_report(report)
                if result['success']:
                    success_count += 1
            except Exception:
                continue
                
        self.message_user(
            request,
            f'{success_count} reports generated successfully out of {queryset.count()} selected.'
        )
    run_selected_reports.short_description = 'Run selected reports'
    
    def activate_reports(self, request, queryset):
        """Activate selected reports"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} reports activated.')
    activate_reports.short_description = 'Activate selected reports'
    
    def deactivate_reports(self, request, queryset):
        """Deactivate selected reports"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} reports deactivated.')
    deactivate_reports.short_description = 'Deactivate selected reports'
    
    def save_model(self, request, obj, form, change):
        """Set created_by when saving"""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ReportRun)
class ReportRunAdmin(admin.ModelAdmin):
    """Admin interface for ReportRun model"""
    
    list_display = [
        'report', 'status', 'started_at', 'completed_at', 'duration',
        'file_size_display', 'triggered_by', 'download_link'
    ]
    list_filter = ['status', 'started_at', 'completed_at', 'triggered_by']
    search_fields = ['report__name', 'triggered_by__username', 'error_message']
    ordering = ['-started_at']
    readonly_fields = [
        'id', 'started_at', 'completed_at', 'duration', 'file_size',
        'file_path', 'download_url'
    ]
    
    fieldsets = (
        ('Run Information', {
            'fields': ('report', 'status', 'triggered_by')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'duration')
        }),
        ('Results', {
            'fields': ('file_path', 'download_url', 'file_size', 'records_count')
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
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if obj.file_size:
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024**2:
                return f"{obj.file_size/1024:.1f} KB"
            elif obj.file_size < 1024**3:
                return f"{obj.file_size/(1024**2):.1f} MB"
            else:
                return f"{obj.file_size/(1024**3):.1f} GB"
        return "N/A"
    file_size_display.short_description = 'File Size'
    
    def download_link(self, obj):
        """Provide download link for completed reports"""
        if obj.status == 'completed' and obj.download_url:
            return format_html(
                '<a href="{}" target="_blank">Download</a>',
                obj.download_url
            )
        return "N/A"
    download_link.short_description = 'Download'
    
    def duration(self, obj):
        """Calculate and display duration"""
        if obj.started_at and obj.completed_at:
            duration = obj.completed_at - obj.started_at
            return str(duration).split('.')[0]  # Remove microseconds
        return "N/A"
    duration.short_description = 'Duration'


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    """Admin interface for ReportTemplate model"""
    
    list_display = [
        'name', 'report_type', 'is_system_template', 'created_by',
        'usage_count', 'is_active', 'created_at'
    ]
    list_filter = [
        'report_type', 'is_system_template', 'is_active', 'created_at'
    ]
    search_fields = ['name', 'description', 'created_by__username']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'usage_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'report_type')
        }),
        ('Template Configuration', {
            'fields': ('default_filters', 'default_fields', 'default_sort')
        }),
        ('Settings', {
            'fields': ('is_system_template', 'is_active')
        }),
        ('Statistics', {
            'fields': ('usage_count',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        """Set created_by when saving"""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)