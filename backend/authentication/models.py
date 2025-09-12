# File: backend/authentication/models.py
"""
Enhanced models for ChurchConnect authentication system
Production-ready with comprehensive security, audit trails, and data integrity
"""

import uuid
import secrets
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, EmailValidator
import re


class AdminUserManager(BaseUserManager):
    """
    Enhanced user manager with security features and validation
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password
        """
        if not email:
            raise ValueError('Email address is required')
        
        # Normalize and validate email
        email = self.normalize_email(email)
        self._validate_email(email)
        
        # Set default values
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_active', extra_fields.get('active', True))
        extra_fields.setdefault('role', 'readonly')
        
        # Generate username from email if not provided
        if 'username' not in extra_fields:
            username = email.split('@')[0]
            # Ensure uniqueness
            counter = 1
            original_username = username
            while self.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            extra_fields['username'] = username
        
        user = self.model(email=email, **extra_fields)
        
        if password:
            user.set_password(password)
        else:
            # Generate a random password that will need to be reset
            user.set_unusable_password()
            
        user.full_clean()  # Validate before saving
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
    
    def _validate_email(self, email):
        """Enhanced email validation"""
        if not email:
            raise ValueError('Email address is required')
        
        # Basic format validation
        email_validator = EmailValidator()
        email_validator(email)
        
        # Additional security checks
        if len(email) > 254:  # RFC 5321 limit
            raise ValueError('Email address is too long')
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'\.{2,}',  # Multiple consecutive dots
            r'^\.|\.$',  # Starting or ending with dot
            r'[<>"\'\\\x00-\x1f\x7f-\x9f]',  # Control characters or quotes
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email):
                raise ValueError('Email address contains invalid characters')

    def get_active_admins(self):
        """Get all active admin users"""
        return self.filter(active=True, role__in=['admin', 'super_admin'])
    
    def get_dormant_users(self, days=90):
        """Get users who haven't logged in for specified days"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.filter(
            active=True,
            last_login__lt=cutoff_date
        ).exclude(last_login__isnull=True)


class AdminUser(AbstractUser):
    """
    Enhanced admin user model with comprehensive security features
    """
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),
        ('admin', 'Administrator'),
        ('readonly', 'Read Only User'),
    ]
    
    # Primary fields
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False,
        help_text="Unique identifier for the user"
    )
    
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="User's email address (used for login)"
    )
    
    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_-]+$',
                message='Username can only contain letters, numbers, underscore, and hyphen'
            )
        ],
        help_text="Unique username (3-30 characters, alphanumeric, underscore, hyphen only)"
    )
    
    # Enhanced name fields with validation
    first_name = models.CharField(
        max_length=30,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s'-]+$",
                message='First name can only contain letters, spaces, apostrophes, and hyphens'
            )
        ],
        help_text="User's first name"
    )
    
    last_name = models.CharField(
        max_length=30,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z\s'-]+$",
                message='Last name can only contain letters, spaces, apostrophes, and hyphens'
            )
        ],
        help_text="User's last name"
    )
    
    # Role and permissions
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='readonly',
        db_index=True,
        help_text="User's role determining access permissions"
    )
    
    active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether the user account is active"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the user account was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the user account was last updated"
    )
    
    # Security fields
    failed_login_attempts = models.PositiveIntegerField(
        default=0,
        help_text="Number of consecutive failed login attempts"
    )
    
    last_failed_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of last failed login attempt"
    )
    
    account_locked_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Account locked until this timestamp"
    )
    
    password_changed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the password was last changed"
    )
    
    # Profile fields
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message='Phone number must be valid format'
            )
        ],
        help_text="User's phone number (optional)"
    )
    
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text="User's timezone preference"
    )
    
    # Preferences
    email_notifications = models.BooleanField(
        default=True,
        help_text="Whether user wants to receive email notifications"
    )
    
    two_factor_enabled = models.BooleanField(
        default=False,
        help_text="Whether two-factor authentication is enabled"
    )
    
    # Manager
    objects = AdminUserManager()
    
    # Authentication settings
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_login']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(role__in=['super_admin', 'admin', 'readonly']),
                name='valid_role'
            ),
        ]

    def clean(self):
        """Enhanced model validation"""
        super().clean()
        
        # Validate email format and security
        if self.email:
            self.email = self.email.lower().strip()
            
            # Check for suspicious email patterns
            suspicious_patterns = [
                r'\.{2,}',  # Multiple consecutive dots
                r'^\.|\.$',  # Starting or ending with dot
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, self.email):
                    raise ValidationError({'email': 'Email address format is invalid'})
        
        # Validate username
        if self.username:
            self.username = self.username.strip()
            
            if len(self.username) < 3:
                raise ValidationError({'username': 'Username must be at least 3 characters long'})
            
            # Check for reserved usernames
            reserved_usernames = [
                'admin', 'administrator', 'root', 'system', 'api', 'www',
                'mail', 'email', 'support', 'help', 'info', 'contact'
            ]
            if self.username.lower() in reserved_usernames:
                raise ValidationError({'username': 'This username is reserved'})
        
        # Name validation
        if self.first_name:
            self.first_name = self.first_name.strip()
        if self.last_name:
            self.last_name = self.last_name.strip()
        
        # Role-specific validation
        if self.role == 'super_admin' and not self.is_staff:
            self.is_staff = True

    def save(self, *args, **kwargs):
        """Enhanced save method with security features"""
        # Sync active with is_active for Django compatibility
        if hasattr(self, 'active'):
            self.is_active = self.active
        
        # Update password change timestamp if password was changed
        if self.pk:
            try:
                old_instance = AdminUser.objects.get(pk=self.pk)
                if old_instance.password != self.password:
                    self.password_changed_at = timezone.now()
            except AdminUser.DoesNotExist:
                pass
        elif self.password:  # New user with password
            self.password_changed_at = timezone.now()
        
        # Full validation before save
        self.full_clean()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Return full name for display purposes"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username or self.email

    # Permission methods
    def can_create(self):
        """Check if user can create records"""
        return self.role in ['super_admin', 'admin'] and self.active

    def can_edit(self):
        """Check if user can edit records"""
        return self.role in ['super_admin', 'admin'] and self.active

    def can_delete(self):
        """Check if user can delete records"""
        return self.role == 'super_admin' and self.active

    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role == 'super_admin' and self.active

    def can_view_reports(self):
        """Check if user can view reports"""
        return self.active  # All active users can view reports

    def can_export_data(self):
        """Check if user can export data"""
        return self.role in ['super_admin', 'admin'] and self.active


class PasswordResetToken(models.Model):
    """Password reset tokens with enhanced security"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['used']),
            models.Index(fields=['user', 'used']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(expires_at__gt=models.F('created_at')),
                name='expires_after_created'
            ),
        ]
    
    def __str__(self):
        return f"Password reset for {self.user.email} ({'used' if self.used else 'active'})"
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        return not self.used and timezone.now() < self.expires_at
    
    def is_expired(self):
        """Check if token is expired"""
        return timezone.now() >= self.expires_at
    
    def get_remaining_time(self):
        """Get remaining time before expiration"""
        return self.expires_at - timezone.now() if not self.is_expired() else timedelta(0)
    
    def mark_used(self, ip_address=None, user_agent=None):
        """Mark token as used"""
        self.used = True
        self.used_at = timezone.now()
        if ip_address:
            self.ip_address = ip_address
        if user_agent:
            self.user_agent = user_agent
        self.save(update_fields=['used', 'used_at', 'ip_address', 'user_agent'])
    
    @classmethod
    def cleanup_inactive_sessions(cls, days=30):
        """Remove inactive sessions older than specified days"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(
            last_activity__lt=cutoff_date,
            is_active=False
        ).delete()
    def create_token(cls, user, expiration_hours=24, ip_address=None, user_agent=None):
        """Create a new password reset token"""
        # Invalidate existing tokens for this user
        cls.objects.filter(user=user, used=False).update(used=True, used_at=timezone.now())
        
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=expiration_hours)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @classmethod
    def cleanup_expired(cls):
        """Remove expired tokens"""
        return cls.objects.filter(expires_at__lt=timezone.now()).delete()


class LoginAttempt(models.Model):
    """Enhanced login attempt tracking with security features"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=255, default='unknown')
    email = models.EmailField(blank=True, null=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=False)
    suspicious = models.BooleanField(default=False)
    blocked = models.BooleanField(default=False)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'login_attempts'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['attempted_at']),
            models.Index(fields=['successful']),
            models.Index(fields=['suspicious']),
            models.Index(fields=['ip_address', 'attempted_at']),
        ]
        ordering = ['-attempted_at']

    def __str__(self):
        status = 'Success' if self.successful else 'Failed'
        return f"{self.email or self.username} - {status} - {self.attempted_at}"

    @classmethod
    def record_attempt(cls, username=None, email=None, ip_address=None, 
                      user_agent=None, successful=False, suspicious=False, 
                      details=None):
        """Record a login attempt"""
        return cls.objects.create(
            username=username or 'unknown',
            email=email,
            ip_address=ip_address,
            user_agent=user_agent or '',
            successful=successful,
            suspicious=suspicious,
            details=details or {}
        )

    @classmethod
    def cleanup_old_attempts(cls, days=90):
        """Remove old login attempts"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(attempted_at__lt=cutoff_date).delete()


class SecurityLog(models.Model):
    """Enhanced security logging"""
    
    SEVERITY_CHOICES = [
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('LOGIN', 'Login Event'),
        ('LOGOUT', 'Logout Event'),
        ('PASSWORD_CHANGE', 'Password Change'),
        ('PASSWORD_RESET', 'Password Reset'),
        ('ACCOUNT_LOCKED', 'Account Locked'),
        ('ACCOUNT_UNLOCKED', 'Account Unlocked'),
        ('PERMISSION_DENIED', 'Permission Denied'),
        ('SUSPICIOUS_ACTIVITY', 'Suspicious Activity'),
        ('DATA_ACCESS', 'Data Access'),
        ('SYSTEM_ERROR', 'System Error'),
        ('SECURITY_EVENT', 'General Security Event'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='security_logs'
    )
    user_email = models.EmailField(blank=True, null=True)
    action = models.CharField(max_length=255)
    event_type = models.CharField(
        max_length=100, 
        choices=EVENT_TYPE_CHOICES, 
        default='SECURITY_EVENT'
    )
    severity = models.CharField(
        max_length=20, 
        choices=SEVERITY_CHOICES, 
        default='INFO'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)
    additional_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'security_logs'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user_email']),
            models.Index(fields=['action']),
            models.Index(fields=['event_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        user_id = self.user_email or (self.user.email if self.user else 'unknown')
        return f"{user_id} - {self.action} - {self.severity}"

    @classmethod
    def log_event(cls, user=None, action=None, event_type='SECURITY_EVENT', 
                  severity='INFO', ip_address=None, user_agent=None, 
                  details=None, additional_data=None):
        """Log a security event"""
        return cls.objects.create(
            user=user,
            user_email=user.email if user else None,
            action=action,
            event_type=event_type,
            severity=severity,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            additional_data=additional_data or {}
        )

    @classmethod
    def cleanup_old_logs(cls, days=365):
        """Remove old security logs"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return cls.objects.filter(timestamp__lt=cutoff_date).delete()


class UserSession(models.Model):
    """Enhanced user session tracking"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='user_sessions'
    )
    session_key = models.CharField(max_length=40, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    device_type = models.CharField(max_length=50, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'user_sessions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_active']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['user', 'is_active']),
        ]
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.email} - {self.session_key[:8]}... - {'Active' if self.is_active else 'Inactive'}"

    def is_expired(self):
        """Check if session is expired"""
        return timezone.now() >= self.expires_at

    def deactivate(self):
        """Deactivate the session"""
        self.is_active = False
        self.save(update_fields=['is_active'])

    @classmethod
    def cleanup_expired_sessions(cls):
        """Remove expired sessions"""
        return cls.objects.filter(expires_at__lt=timezone.now()).delete()
