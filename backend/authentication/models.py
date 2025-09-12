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

class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)  # Add this field
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # Add this field
    user_agent = models.TextField(blank=True, null=True)  # Add this field
    
    class Meta:
        db_table = 'password_reset_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['used']),  # Add this index
        ]
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at
    
    def is_expired(self):  # Add this method
        return timezone.now() >= self.expires_at
    
    def get_remaining_time(self):  # Add this method
        return self.expires_at - timezone.now()
    
    @classmethod
    def create_token(cls, user, expiration_hours=24):
        """Create a new password reset token"""
        token = secrets.token_urlsafe(32)  # Use secrets instead of signing
        expires_at = timezone.now() + timedelta(hours=expiration_hours)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
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
            old_instance = AdminUser.objects.get(pk=self.pk)
            if old_instance.password != self.password:
                self.password_changed_at = timezone.now()
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
    

class LoginAttempt(models.Model):
    username = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)  # Add this field
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=False)
    suspicious = models.BooleanField(default=False)  # Add this field
    blocked = models.BooleanField(default=False)  # Add this field
    country = models.CharField(max_length=100, blank=True, null=True)  # Add this field
    city = models.CharField(max_length=100, blank=True, null=True)  # Add this field
    details = models.JSONField(default=dict)  # Add this field
    
    class Meta:
        db_table = 'login_attempts'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),  # Add this index
            models.Index(fields=['ip_address']),
            models.Index(fields=['attempted_at']),
            models.Index(fields=['successful']),  # Add this index
            models.Index(fields=['suspicious']),  # Add this index
        ]

class SecurityLog(models.Model):
    SEVERITY_CHOICES = [  # Add this
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    user_email = models.EmailField(blank=True, null=True)  # Add this field
    action = models.CharField(max_length=255)
    event_type = models.CharField(max_length=100, default='SECURITY_EVENT')  # Add this field
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFO')  # Add this field
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)
    additional_data = models.JSONField(default=dict, blank=True)  # Add this field
    
    class Meta:
        db_table = 'security_logs'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user_email']),  # Add this index
            models.Index(fields=['action']),
            models.Index(fields=['event_type']),  # Add this index
            models.Index(fields=['severity']),  # Add this index
            models.Index(fields=['timestamp']),
        ]

class UserSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(auto_now=True)  # Add this field
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)  # Add this field
    
    class Meta:
        db_table = 'user_sessions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_active']),  # Add this index
            models.Index(fields=['last_activity']),  # Add this index
        ]