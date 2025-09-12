# authentication/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse

from .models import AdminUser, PasswordResetToken, LoginAttempt, SecurityLog, UserSession

@admin.register(AdminUser)
class AdminUserAdmin(UserAdmin):
    """
    Enhanced admin interface for AdminUser with comprehensive management features
    """
    
    # List display configuration - UPDATED to match your model fields
    list_display = [
        'email', 'username', 'first_name', 'last_name', 'role', 
        'active', 'last_login', 'created_at', 'actions_column'
    ]
    
    list_display_links = ['email', 'username']
    
    list_filter = [
        'role', 'active', 'is_staff', 'is_superuser',
        ('created_at', admin.DateFieldListFilter),
        ('last_login', admin.DateFieldListFilter),
        'two_factor_enabled', 'email_notifications',
    ]
    
    search_fields = [
        'email', 'username', 'first_name', 'last_name'
    ]
    
    ordering = ['-created_at']
    
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'last_login',
        'password_changed_at', 'failed_login_attempts',
        'last_failed_login', 'account_locked_until',
    ]
    
    # Enhanced fieldsets for better organization - UPDATED
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'username', 'email', 'password')
        }),
        ('Personal Details', {
            'fields': ('first_name', 'last_name', 'phone_number'),
            'classes': ('collapse',)
        }),
        ('Permissions & Role', {
            'fields': ('role', 'active', 'is_staff', 'is_superuser'),
            'description': 'User role determines access permissions within the system'
        }),
        ('Security Information', {
            'fields': (
                'password_changed_at', 'failed_login_attempts',
                'last_failed_login', 'account_locked_until',
                'two_factor_enabled'
            ),
            'classes': ('collapse',)
        }),
        ('Preferences', {
            'fields': ('timezone', 'email_notifications'),
            'classes': ('collapse',)
        }),
        ('System Timestamps', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Create New Admin User', {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'first_name', 'last_name',
                'password1', 'password2', 'role', 'active'
            ),
            'description': 'Create a new administrative user account'
        }),
    )

    # Custom display methods - UPDATED
    def role_badge(self, obj):
        """Display role with colored badge"""
        colors = {
            'super_admin': '#dc2626',  # Red
            'admin': '#ea580c',        # Orange
            'readonly': '#059669',     # Green
        }
        
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'

    def active_status(self, obj):
        """Display active status with icon"""
        if obj.active:
            if obj.account_locked_until and obj.account_locked_until > timezone.now():
                return format_html('<span style="color: #dc2626;">🔒 Locked</span>')
            return format_html('<span style="color: #059669;">✅ Active</span>')
        return format_html('<span style="color: #6b7280;">❌ Inactive</span>')
    active_status.short_description = 'Status'

    def actions_column(self, obj):
        """Quick action buttons"""
        actions = []
        
        if obj.active and not (obj.account_locked_until and obj.account_locked_until > timezone.now()):
            actions.append(
                f'<a href="#" onclick="lockAccount(\'{obj.id}\')" '
                f'style="color: #dc2626;">Lock</a>'
            )
        elif obj.account_locked_until and obj.account_locked_until > timezone.now():
            actions.append(
                f'<a href="#" onclick="unlockAccount(\'{obj.id}\')" '
                f'style="color: #059669;">Unlock</a>'
            )
        
        actions.append(
            f'<a href="#" onclick="resetPassword(\'{obj.id}\')" '
            f'style="color: #ea580c;">Reset PWD</a>'
        )
        
        return format_html(' | '.join(actions))
    actions_column.short_description = 'Actions'

    # Custom actions
    actions = ['activate_users', 'deactivate_users', 'reset_failed_attempts']

    def activate_users(self, request, queryset):
        """Bulk activate users"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} users were activated.')
    activate_users.short_description = "Activate selected users"

    def deactivate_users(self, request, queryset):
        """Bulk deactivate users"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} users were deactivated.')
    deactivate_users.short_description = "Deactivate selected users"

    def reset_failed_attempts(self, request, queryset):
        """Reset failed login attempts for selected users"""
        count = 0
        for user in queryset:
            if user.failed_login_attempts > 0:
                user.failed_login_attempts = 0
                user.last_failed_login = None
                user.account_locked_until = None
                user.save()
                count += 1
        
        self.message_user(request, f'Reset failed login attempts for {count} users.')
    reset_failed_attempts.short_description = "Reset failed login attempts"

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for password reset tokens
    """
    
    list_display = [
        'token_preview', 'user', 'created_at', 'expires_at',
        'status_display', 'remaining_time'
    ]
    
    list_filter = [
        'used', 'created_at', 'expires_at'
    ]
    
    search_fields = ['user__email', 'user__username']
    
    readonly_fields = [
        'id', 'token', 'created_at', 'expires_at', 'used_at',
        'remaining_time_display'
    ]
    
    ordering = ['-created_at']

    def token_preview(self, obj):
        """Show token preview for security"""
        return f"{obj.token[:12]}..." if obj.token else "No token"
    token_preview.short_description = 'Token'

    def status_display(self, obj):
        """Display token status with color coding"""
        if obj.used:
            return format_html('<span style="color: #6b7280;">Used</span>')
        elif timezone.now() >= obj.expires_at:
            return format_html('<span style="color: #dc2626;">Expired</span>')
        else:
            return format_html('<span style="color: #059669;">Active</span>')
    status_display.short_description = 'Status'

    def remaining_time(self, obj):
        """Show remaining time before expiration"""
        if obj.used:
            return "N/A"
        
        remaining = obj.expires_at - timezone.now()
        if remaining.total_seconds() <= 0:
            return "Expired"
        
        hours = remaining.total_seconds() // 3600
        minutes = (remaining.total_seconds() % 3600) // 60
        
        if hours > 0:
            return f"{int(hours)}h {int(minutes)}m"
        else:
            return f"{int(minutes)}m"
    remaining_time.short_description = 'Remaining'

    def remaining_time_display(self, obj):
        """Detailed remaining time display"""
        return self.remaining_time(obj)
    remaining_time_display.short_description = 'Time Remaining'

    def has_add_permission(self, request):
        """Don't allow manual creation of tokens"""
        return False

@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for login attempts
    """
    
    list_display = [
        'attempted_at', 'username', 'ip_address', 'successful',
        'user_agent_preview'
    ]
    
    list_filter = [
        'successful', ('attempted_at', admin.DateFieldListFilter)
    ]
    
    search_fields = ['username', 'ip_address', 'user_agent']
    
    readonly_fields = [
        'id', 'username', 'ip_address', 'successful', 'attempted_at',
        'user_agent'
    ]
    
    ordering = ['-attempted_at']
    
    date_hierarchy = 'attempted_at'

    def user_agent_preview(self, obj):
        """Shortened user agent display"""
        if obj.user_agent:
            preview = obj.user_agent[:50] + "..." if len(obj.user_agent) > 50 else obj.user_agent
            return format_html('<span title="{}">{}</span>', obj.user_agent, preview)
        return "Unknown"
    user_agent_preview.short_description = 'User Agent'

    def has_add_permission(self, request):
        """Don't allow manual creation"""
        return False

@admin.register(SecurityLog)
class SecurityLogAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for security logs
    """
    
    list_display = [
        'timestamp', 'action', 'user', 'ip_address', 'details_preview'
    ]
    
    list_filter = [
        'action', ('timestamp', admin.DateFieldListFilter)
    ]
    
    search_fields = ['user__email', 'ip_address', 'details']
    
    readonly_fields = [
        'id', 'timestamp', 'action', 'user', 'ip_address', 'user_agent', 'details'
    ]
    
    ordering = ['-timestamp']
    
    date_hierarchy = 'timestamp'

    def details_preview(self, obj):
        """Shortened details preview"""
        if obj.details:
            details_str = str(obj.details)
            return details_str[:100] + "..." if len(details_str) > 100 else details_str
        return "No details"
    details_preview.short_description = 'Details'

    def has_add_permission(self, request):
        """Don't allow manual creation"""
        return False

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for user sessions
    """
    
    list_display = [
        'user', 'ip_address', 'created_at', 'expires_at', 'status_indicator'
    ]
    
    list_filter = [
        ('created_at', admin.DateFieldListFilter),
        ('expires_at', admin.DateFieldListFilter)
    ]
    
    search_fields = ['user__email', 'ip_address', 'session_key']
    
    readonly_fields = [
        'id', 'user', 'session_key', 'ip_address', 'user_agent',
        'created_at', 'expires_at'
    ]
    
    ordering = ['-created_at']

    def status_indicator(self, obj):
        """Visual status indicator"""
        if timezone.now() >= obj.expires_at:
            return format_html('<span style="color: #ea580c;">⏰ Expired</span>')
        else:
            return format_html('<span style="color: #059669;">✅ Active</span>')
    status_indicator.short_description = 'Status'

    def has_add_permission(self, request):
        """Don't allow manual creation"""
        return False

# Basic admin site configuration
admin.site.site_header = "ChurchConnect Administration"
admin.site.site_title = "ChurchConnect Admin"
admin.site.index_title = "Welcome to ChurchConnect Administration"