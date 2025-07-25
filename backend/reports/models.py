# backend/churchconnect/reports/models.py
from django.db import models
from django.conf import settings  # Add this import
from django.utils import timezone
import uuid
import json

class ReportTemplate(models.Model):
    """Template for commonly used report configurations"""
    
    REPORT_TYPE_CHOICES = [
        ('members', 'Members Report'),
        ('pledges', 'Pledges Report'),
        ('groups', 'Groups Report'),
        ('attendance', 'Attendance Report'),
        ('financial', 'Financial Report'),
        ('custom', 'Custom Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    default_filters = models.JSONField(default=dict, blank=True)
    default_fields = models.JSONField(default=list, blank=True)
    default_sort = models.CharField(max_length=100, blank=True)
    is_system_template = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)  # Fixed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class Report(models.Model):
    """Report configuration and metadata"""
    
    REPORT_TYPE_CHOICES = [
        ('members', 'Members Report'),
        ('pledges', 'Pledges Report'),
        ('groups', 'Groups Report'),
        ('attendance', 'Attendance Report'),
        ('financial', 'Financial Report'),
        ('custom', 'Custom Report'),
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
        ('yearly', 'Yearly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='csv')
    filters = models.JSONField(default=dict, blank=True)
    fields_to_include = models.JSONField(default=list, blank=True)
    sort_by = models.CharField(max_length=100, blank=True)
    is_scheduled = models.BooleanField(default=False)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, blank=True, null=True)
    recipients = models.JSONField(default=list, blank=True)  # Email addresses
    next_run = models.DateTimeField(blank=True, null=True)
    last_run = models.DateTimeField(blank=True, null=True)
    run_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    template = models.ForeignKey(ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Fixed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
    
    def __str__(self):
        return self.name
    
    def increment_run_count(self):
        """Increment run count and update last run time"""
        self.run_count += 1
        self.last_run = timezone.now()
        self.save(update_fields=['run_count', 'last_run'])
    
    def calculate_next_run(self):
        """Calculate next run time based on frequency"""
        if not self.is_scheduled or not self.frequency:
            return None
            
        from datetime import timedelta
        now = timezone.now()
        
        if self.frequency == 'daily':
            return now + timedelta(days=1)
        elif self.frequency == 'weekly':
            return now + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            return now + timedelta(days=30)
        elif self.frequency == 'quarterly':
            return now + timedelta(days=90)
        elif self.frequency == 'yearly':
            return now + timedelta(days=365)
        
        return None
    
    def save(self, *args, **kwargs):
        """Override save to calculate next run time"""
        if self.is_scheduled and not self.next_run:
            self.next_run = self.calculate_next_run()
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
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='runs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    file_path = models.CharField(max_length=500, blank=True)
    download_url = models.URLField(blank=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)  # Size in bytes
    records_count = models.PositiveIntegerField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    triggered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)  # Fixed
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Report Run'
        verbose_name_plural = 'Report Runs'
    
    def __str__(self):
        return f"{self.report.name} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def mark_completed(self, file_path=None, download_url=None, file_size=None, records_count=None):
        """Mark the report run as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if file_path:
            self.file_path = file_path
        if download_url:
            self.download_url = download_url
        if file_size:
            self.file_size = file_size
        if records_count:
            self.records_count = records_count
        self.save()
    
    def mark_failed(self, error_message):
        """Mark the report run as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.save()
    
    @property
    def duration(self):
        """Get the duration of the report run"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None