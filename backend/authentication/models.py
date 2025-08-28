import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class AdminUser(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('readonly', 'Read Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='readonly')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Added missing field
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def can_create(self):
        return self.role in ['super_admin', 'admin']
    
    def can_edit(self):
        return self.role in ['super_admin', 'admin']
    
    def can_delete(self):
        return self.role == 'super_admin'
    
    def can_manage_users(self):
        return self.role == 'super_admin'
    
    @property
    def full_name(self):
        """Return full name for display purposes"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    class Meta:
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'
        ordering = ['-created_at']


class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(AdminUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=100)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        """Check if the token has expired"""
        return timezone.now() > self.expires_at
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']


class LoginAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    success = models.BooleanField()
    attempted_at = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Login Attempt'
        verbose_name_plural = 'Login Attempts'
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['-attempted_at']),
            models.Index(fields=['email']),
            models.Index(fields=['ip_address']),
        ]