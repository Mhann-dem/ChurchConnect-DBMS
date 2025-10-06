# backend/churchconnect/reports/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import Report, ReportRun, ReportTemplate
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ReportTemplate model"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    default_format_display = serializers.CharField(source='get_default_format_display', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'report_type', 'report_type_display',
            'default_filters', 'default_columns', 'default_format', 
            'default_format_display', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_system_template', 'is_active', 
            'usage_count', 'last_used'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 'usage_count', 'last_used'
        ]
    
    def validate_default_filters(self, value):
        """Validate default filters format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Default filters must be a dictionary.")
        return value
    
    def validate_default_columns(self, value):
        """Validate default columns format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Default columns must be a list.")
        return value


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    # Calculated fields
    total_runs = serializers.SerializerMethodField()
    successful_runs = serializers.SerializerMethodField()
    last_successful_run = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'description', 'report_type', 'report_type_display',
            'format', 'format_display', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_scheduled', 'frequency', 
            'frequency_display', 'next_run', 'last_run', 'filters', 
            'columns', 'email_recipients', 'email_subject', 'email_body',
            'is_active', 'total_runs', 'successful_runs', 'last_successful_run'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'last_run']
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_total_runs(self, obj):
        """Get total number of report runs"""
        return obj.runs.count()
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_successful_runs(self, obj):
        """Get number of successful report runs"""
        return obj.runs.filter(status='completed').count()
    
    @extend_schema_field(OpenApiTypes.DATETIME)
    def get_last_successful_run(self, obj):
        """Get last successful run date"""
        last_run = obj.runs.filter(status='completed').first()
        return last_run.completed_at if last_run else None
    
    def validate_email_recipients(self, value):
        """Validate email recipients format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Email recipients must be a list.")
        
        for email in value:
            if not isinstance(email, str):
                raise serializers.ValidationError("Each email must be a string.")
            try:
                validate_email(email)
            except ValidationError:
                raise serializers.ValidationError(f"Invalid email format: {email}")
        
        return value
    
    def validate_columns(self, value):
        """Validate columns format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Columns must be a list.")
        
        # Ensure all column names are strings
        for column in value:
            if not isinstance(column, str):
                raise serializers.ValidationError("All column names must be strings.")
        
        return value
    
    def validate_filters(self, value):
        """Validate filters format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a dictionary.")
        
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate scheduling requirements
        if data.get('is_scheduled') and not data.get('frequency'):
            raise serializers.ValidationError({
                'frequency': 'Frequency is required for scheduled reports.'
            })
        
        # If email recipients are provided, email subject should also be provided
        if data.get('email_recipients') and not data.get('email_subject'):
            data['email_subject'] = f"Scheduled Report: {data.get('name', 'Unnamed Report')}"
        
        return data


class ReportRunSerializer(serializers.ModelSerializer):
    """Serializer for ReportRun model"""
    
    report_name = serializers.CharField(source='report.name', read_only=True)
    report_type = serializers.CharField(source='report.report_type', read_only=True)
    triggered_by_name = serializers.CharField(source='triggered_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # File information
    file_size_mb = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    duration_display = serializers.CharField(read_only=True)
    file_size_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = ReportRun
        fields = [
            'id', 'report', 'report_name', 'report_type', 'started_at',
            'completed_at', 'execution_time', 'status', 'status_display', 
            'file_path', 'file_size', 'file_size_mb', 'file_size_display',
            'record_count', 'error_message', 'triggered_by', 'triggered_by_name', 
            'download_url', 'duration_display'
        ]
        read_only_fields = [
            'id', 'started_at', 'completed_at', 'execution_time', 'file_path', 
            'file_size', 'record_count', 'error_message'
        ]
    
    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_file_size_mb(self, obj):
        """Convert file size to MB"""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_download_url(self, obj):
        """Generate download URL for completed reports"""
        if obj.status == 'completed' and obj.file_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/reports/download/{obj.id}/')
        return None


class ReportGenerationSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPE_CHOICES)
    format = serializers.ChoiceField(choices=Report.FORMAT_CHOICES, default='csv')
    filters = serializers.JSONField(default=dict, required=False)
    columns = serializers.JSONField(default=list, required=False)
    name = serializers.CharField(max_length=200, required=False)
    
    def validate_filters(self, value):
        """Validate filters format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a dictionary.")
        return value
    
    def validate_columns(self, value):
        """Validate columns format"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Columns must be a list.")
        
        # Ensure all column names are strings
        for column in value:
            if not isinstance(column, str):
                raise serializers.ValidationError("All column names must be strings.")
        
        return value


class ReportStatsSerializer(serializers.Serializer):
    """Serializer for report statistics"""
    
    total_reports = serializers.IntegerField()
    active_reports = serializers.IntegerField()
    scheduled_reports = serializers.IntegerField()
    total_runs = serializers.IntegerField()
    successful_runs = serializers.IntegerField()
    failed_runs = serializers.IntegerField()
    
    # Report type breakdown
    reports_by_type = serializers.DictField()
    
    # Recent activity
    recent_runs = ReportRunSerializer(many=True)
    
    # Usage statistics
    most_used_templates = ReportTemplateSerializer(many=True)
    
    # Storage statistics
    total_file_size = serializers.IntegerField()  # in bytes
    total_file_size_mb = serializers.SerializerMethodField()
    
    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_total_file_size_mb(self, obj):
        """Convert total file size to MB"""
        total_size = obj.get('total_file_size', 0)
        return round(total_size / (1024 * 1024), 2) if total_size else 0


class BulkReportActionSerializer(serializers.Serializer):
    """Serializer for bulk actions on reports"""
    
    ACTION_CHOICES = [
        ('delete', 'Delete'),
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
        ('run', 'Run'),
    ]
    
    report_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100  # Limit bulk operations
    )
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    
    def validate_report_ids(self, value):
        """Validate that all report IDs exist and user has access"""
        from django.db.models import Q
        
        # Check if reports exist
        existing_ids = Report.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f"Reports not found: {', '.join(str(id) for id in missing_ids)}"
            )
        
        return value


class ReportExportSerializer(serializers.Serializer):
    """Serializer for legacy export endpoints"""
    
    format = serializers.ChoiceField(choices=['csv'], default='csv')
    filters = serializers.JSONField(default=dict, required=False)
    
    def validate_filters(self, value):
        """Validate filters format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a dictionary.")
        return value