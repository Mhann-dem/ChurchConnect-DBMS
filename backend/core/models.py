# core/models.py - Production-ready core models for ChurchConnect
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


class Tag(models.Model):
    """Tags for categorizing members and other entities"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100, 
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9\s\-_]+$',
                message='Tag name can only contain letters, numbers, spaces, hyphens, and underscores'
            )
        ]
    )
    color = models.CharField(
        max_length=7, 
        default='#007bff',
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex color code'
            )
        ],
        help_text="Hex color code (e.g., #007bff)"
    )
    description = models.TextField(blank=True, max_length=500)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tags'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    usage_count = models.PositiveIntegerField(default=0, help_text="Number of times this tag is used")
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name

    def clean(self):
        """Validate tag data"""
        if self.name:
            self.name = self.name.strip()
            if not self.name:
                raise ValidationError({'name': 'Tag name cannot be empty'})

    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])

    def decrement_usage(self):
        """Decrement usage count"""
        if self.usage_count > 0:
            self.usage_count -= 1
            self.save(update_fields=['usage_count'])


class SystemSettings(models.Model):
    """System-wide configuration settings"""
    
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('email', 'Email'),
        ('url', 'URL'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(
        max_length=100, 
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Z_]+$',
                message='Setting key must be uppercase letters and underscores only'
            )
        ]
    )
    value = models.TextField()
    setting_type = models.CharField(
        max_length=20, 
        choices=SETTING_TYPES, 
        default='string'
    )
    description = models.TextField(blank=True, max_length=1000)
    is_sensitive = models.BooleanField(
        default=False,
        help_text="Mark as sensitive to hide value in admin interface"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_settings'
    )
    
    class Meta:
        ordering = ['key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['setting_type']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        value_display = self.value[:50] if not self.is_sensitive else '[HIDDEN]'
        return f"{self.key}: {value_display}"

    def clean(self):
        """Validate setting based on type"""
        if self.setting_type == 'integer':
            try:
                int(self.value)
            except ValueError:
                raise ValidationError({'value': 'Value must be a valid integer'})
        
        elif self.setting_type == 'boolean':
            if self.value.lower() not in ['true', 'false', '1', '0']:
                raise ValidationError({'value': 'Value must be true/false or 1/0'})
        
        elif self.setting_type == 'json':
            import json
            try:
                json.loads(self.value)
            except json.JSONDecodeError:
                raise ValidationError({'value': 'Value must be valid JSON'})
        
        elif self.setting_type == 'email':
            from django.core.validators import EmailValidator
            validator = EmailValidator()
            try:
                validator(self.value)
            except ValidationError:
                raise ValidationError({'value': 'Value must be a valid email address'})
        
        elif self.setting_type == 'url':
            from django.core.validators import URLValidator
            validator = URLValidator()
            try:
                validator(self.value)
            except ValidationError:
                raise ValidationError({'value': 'Value must be a valid URL'})

    def get_typed_value(self):
        """Get value converted to appropriate Python type"""
        if self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'boolean':
            return self.value.lower() in ['true', '1']
        elif self.setting_type == 'json':
            import json
            return json.loads(self.value)
        return self.value


class AuditLog(models.Model):
    """Comprehensive audit logging for all system changes"""
    
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('view', 'View'),
        ('permission_change', 'Permission Change'),
        ('system_change', 'System Change'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    user_email = models.EmailField(blank=True, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    
    # Change tracking
    changes = models.JSONField(blank=True, null=True)
    old_values = models.JSONField(blank=True, null=True)
    new_values = models.JSONField(blank=True, null=True)
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    
    # Metadata
    timestamp = models.DateTimeField(auto_now_add=True)
    session_key = models.CharField(max_length=40, blank=True)
    additional_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model_name', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['app_label', 'model_name']),
            models.Index(fields=['object_id']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
    
    def __str__(self):
        user_display = self.user_email or (self.user.email if self.user else 'Anonymous')
        return f"{user_display} {self.action} {self.model_name} at {self.timestamp}"

    @classmethod
    def log_action(cls, user=None, action=None, model_name=None, app_label=None,
                   object_id=None, object_repr=None, changes=None, old_values=None,
                   new_values=None, ip_address=None, user_agent=None,
                   request_path=None, request_method=None, session_key=None,
                   additional_data=None):
        """Create an audit log entry"""
        return cls.objects.create(
            user=user,
            user_email=user.email if user else None,
            action=action,
            model_name=model_name,
            app_label=app_label,
            object_id=str(object_id) if object_id else None,
            object_repr=str(object_repr)[:255] if object_repr else None,
            changes=changes,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            request_path=request_path,
            request_method=request_method,
            session_key=session_key,
            additional_data=additional_data or {}
        )

    @classmethod
    def cleanup_old_logs(cls, days=365):
        """Remove old audit logs"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(timestamp__lt=cutoff_date).delete()


class ApiKey(models.Model):
    """API key management for external integrations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="Descriptive name for this API key")
    key = models.CharField(max_length=64, unique=True, db_index=True)
    
    # Permissions
    is_active = models.BooleanField(default=True)
    can_read = models.BooleanField(default=True)
    can_write = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    
    # Scope limitations
    allowed_models = models.JSONField(
        default=list,
        blank=True,
        help_text="List of models this key can access (empty = all models)"
    )
    allowed_ips = models.JSONField(
        default=list,
        blank=True,
        help_text="List of IP addresses allowed to use this key (empty = any IP)"
    )
    
    # Usage tracking
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_api_keys'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    # Rate limiting
    rate_limit_per_hour = models.PositiveIntegerField(
        default=1000,
        help_text="Maximum requests per hour (0 = unlimited)"
    )
    
    # Expiration
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this key expires (leave blank for no expiration)"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.key[:8]}...)"

    def clean(self):
        """Validate API key data"""
        if self.expires_at and self.expires_at <= timezone.now():
            raise ValidationError({'expires_at': 'Expiration date must be in the future'})

    def is_valid(self):
        """Check if API key is valid and not expired"""
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def record_usage(self, ip_address=None):
        """Record API key usage"""
        self.usage_count += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=['usage_count', 'last_used_at'])

    @classmethod
    def generate_key(cls):
        """Generate a new API key"""
        import secrets
        return secrets.token_urlsafe(32)


class Notification(models.Model):
    """System notifications for users"""
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('system', 'System Announcement'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField(max_length=1000)
    notification_type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='info'
    )
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='medium'
    )
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional action
    action_url = models.URLField(blank=True, help_text="Optional action link")
    action_text = models.CharField(max_length=50, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this notification expires"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.title} for {self.recipient.email}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def is_expired(self):
        """Check if notification has expired"""
        return self.expires_at and timezone.now() > self.expires_at

    @classmethod
    def create_for_user(cls, recipient, title, message, notification_type='info',
                       priority='medium', action_url=None, action_text=None,
                       created_by=None, expires_at=None):
        """Create a notification for a user"""
        return cls.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            action_url=action_url,
            action_text=action_text,
            created_by=created_by,
            expires_at=expires_at
        )

    @classmethod
    def cleanup_expired(cls):
        """Remove expired notifications"""
        return cls.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()


class DataExportTask(models.Model):
    """Track data export tasks"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
        ('pdf', 'PDF'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='export_tasks'
    )
    
    # Export parameters
    model_name = models.CharField(max_length=100)
    export_format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    filters = models.JSONField(default=dict, blank=True)
    fields = models.JSONField(default=list, blank=True)
    
    # Status and progress
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress_percent = models.PositiveIntegerField(default=0)
    total_records = models.PositiveIntegerField(default=0)
    processed_records = models.PositiveIntegerField(default=0)
    
    # File information
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        help_text="When the exported file expires and gets deleted"
    )
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.model_name} export for {self.user.email} - {self.status}"

    def update_progress(self, processed_records=None, progress_percent=None):
        """Update task progress"""
        if processed_records is not None:
            self.processed_records = processed_records
            if self.total_records > 0:
                self.progress_percent = int((processed_records / self.total_records) * 100)
        if progress_percent is not None:
            self.progress_percent = min(100, max(0, progress_percent))
        
        self.save(update_fields=['processed_records', 'progress_percent'])

    def mark_completed(self, file_path=None, file_size=None):
        """Mark task as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.progress_percent = 100
        if file_path:
            self.file_path = file_path
        if file_size:
            self.file_size = file_size
        
        self.save(update_fields=[
            'status', 'completed_at', 'progress_percent', 'file_path', 'file_size'
        ])

    def mark_failed(self, error_message=None):
        """Mark task as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        if error_message:
            self.error_message = error_message
        
        self.save(update_fields=['status', 'completed_at', 'error_message'])

    @classmethod
    def cleanup_expired_tasks(cls):
        """Remove expired export tasks and their files"""
        expired_tasks = cls.objects.filter(expires_at__lt=timezone.now())
        
        # Delete files
        import os
        for task in expired_tasks:
            if task.file_path and os.path.exists(task.file_path):
                try:
                    os.remove(task.file_path)
                except OSError:
                    pass
        
        return expired_tasks.delete()