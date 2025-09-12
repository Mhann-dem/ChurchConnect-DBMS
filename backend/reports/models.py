# backend/churchconnect/reports/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import uuid
import json


class ReportTemplate(models.Model):
    """Template for commonly used report configurations"""
    
    REPORT_TYPE_CHOICES = [
        ('members', 'Members Report'),
        ('pledges', 'Pledges Report'),
        ('groups', 'Groups Report'),
        ('families', 'Families Report'),
        ('statistics', 'Statistics Report'),
    ]
    
    DEFAULT_FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('pdf', 'PDF'),
        ('json', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    default_filters = models.JSONField(default=dict, blank=True)
    default_columns = models.JSONField(default=list, blank=True)
    default_format = models.CharField(max_length=10, choices=DEFAULT_FORMAT_CHOICES, default='csv')
    is_system_template = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    usage_count = models.PositiveIntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'
        indexes = [
            models.Index(fields=['report_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_report_type_display(self):
        """Get human-readable report type"""
        return dict(self.REPORT_TYPE_CHOICES).get(self.report_type, self.report_type)
    
    def get_default_format_display(self):
        """Get human-readable default format"""
        return dict(self.DEFAULT_FORMAT_CHOICES).get(self.default_format, self.default_format)
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])


class Report(models.Model):
    """Report configuration and metadata"""
    
    REPORT_TYPE_CHOICES = [
        ('members', 'Members Report'),
        ('pledges', 'Pledges Report'),
        ('groups', 'Groups Report'),
        ('families', 'Families Report'),
        ('statistics', 'Statistics Report'),
    ]
    
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('pdf', 'PDF'),
        ('json', 'JSON'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='csv')
    filters = models.JSONField(default=dict, blank=True)
    columns = models.JSONField(default=list, blank=True)
    
    # Scheduling fields
    is_scheduled = models.BooleanField(default=False)
    frequency = models.CharField(
        max_length=20, 
        choices=FREQUENCY_CHOICES, 
        blank=True, 
        null=True
    )
    next_run = models.DateTimeField(blank=True, null=True)
    last_run = models.DateTimeField(blank=True, null=True)
    
    # Email settings
    email_recipients = models.JSONField(default=list, blank=True)
    email_subject = models.CharField(max_length=200, blank=True)
    email_body = models.TextField(blank=True)
    
    # Status and metadata
    is_active = models.BooleanField(default=True)
    template = models.ForeignKey(
        ReportTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        indexes = [
            models.Index(fields=['report_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_scheduled']),
            models.Index(fields=['next_run']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_report_type_display(self):
        """Get human-readable report type"""
        return dict(self.REPORT_TYPE_CHOICES).get(self.report_type, self.report_type)
    
    def get_format_display(self):
        """Get human-readable format"""
        return dict(self.FORMAT_CHOICES).get(self.format, self.format)
    
    def get_frequency_display(self):
        """Get human-readable frequency"""
        return dict(self.FREQUENCY_CHOICES).get(self.frequency, self.frequency)
    
    def clean(self):
        """Validate model data"""
        super().clean()
        
        # Validate email recipients
        if self.email_recipients:
            for email in self.email_recipients:
                try:
                    validate_email(email)
                except ValidationError:
                    raise ValidationError({'email_recipients': f'Invalid email address: {email}'})
        
        # Validate scheduling
        if self.is_scheduled and not self.frequency:
            raise ValidationError({'frequency': 'Frequency is required for scheduled reports'})
        
        # Validate JSON fields
        if not isinstance(self.filters, dict):
            raise ValidationError({'filters': 'Filters must be a dictionary'})
        
        if not isinstance(self.columns, list):
            raise ValidationError({'columns': 'Columns must be a list'})
    
    def calculate_next_run(self):
        """Calculate next run time based on frequency"""
        if not self.is_scheduled or not self.frequency:
            return None
            
        from datetime import timedelta
        now = timezone.now()
        
        frequency_map = {
            'daily': timedelta(days=1),
            'weekly': timedelta(weeks=1),
            'monthly': timedelta(days=30),
            'quarterly': timedelta(days=90),
            'annually': timedelta(days=365),
        }
        
        delta = frequency_map.get(self.frequency)
        if delta:
            return now + delta
        
        return None
    
    def save(self, *args, **kwargs):
        """Override save to calculate next run time and validate data"""
        self.full_clean()
        
        if self.is_scheduled and not self.next_run:
            self.next_run = self.calculate_next_run()
        elif not self.is_scheduled:
            self.next_run = None
            
        super().save(*args, **kwargs)


class ReportRun(models.Model):
    """Track individual report executions"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        Report, 
        on_delete=models.CASCADE, 
        related_name='runs',
        null=True,  # Allow null for ad-hoc reports
        blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    execution_time = models.DurationField(null=True, blank=True)
    
    # File information
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveBigIntegerField(blank=True, null=True)  # Size in bytes
    record_count = models.PositiveIntegerField(blank=True, null=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # User tracking
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Report Run'
        verbose_name_plural = 'Report Runs'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['started_at']),
            models.Index(fields=['report', 'status']),
        ]
    
    def __str__(self):
        report_name = self.report.name if self.report else 'Ad-hoc Report'
        return f"{report_name} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def get_status_display(self):
        """Get human-readable status"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    def mark_completed(self, file_path=None, file_size=None, record_count=None):
        """Mark the report run as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        
        if self.started_at:
            self.execution_time = self.completed_at - self.started_at
        
        if file_path:
            self.file_path = file_path
        if file_size is not None:
            self.file_size = file_size
        if record_count is not None:
            self.record_count = record_count
            
        self.save(update_fields=[
            'status', 'completed_at', 'execution_time', 
            'file_path', 'file_size', 'record_count'
        ])
        
        # Update parent report's last run time
        if self.report:
            self.report.last_run = self.completed_at
            self.report.save(update_fields=['last_run'])
    
    def mark_failed(self, error_message):
        """Mark the report run as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error_message
        
        if self.started_at:
            self.execution_time = self.completed_at - self.started_at
            
        self.save(update_fields=[
            'status', 'completed_at', 'execution_time', 'error_message'
        ])
    
    @property
    def duration_display(self):
        """Get human-readable duration"""
        if self.execution_time:
            total_seconds = int(self.execution_time.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            if hours:
                return f"{hours}h {minutes}m {seconds}s"
            elif minutes:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return "N/A"
    
    @property
    def file_size_display(self):
        """Get human-readable file size"""
        if self.file_size:
            if self.file_size < 1024:
                return f"{self.file_size} B"
            elif self.file_size < 1024**2:
                return f"{self.file_size/1024:.1f} KB"
            elif self.file_size < 1024**3:
                return f"{self.file_size/(1024**2):.1f} MB"
            else:
                return f"{self.file_size/(1024**3):.1f} GB"
        return "N/A"