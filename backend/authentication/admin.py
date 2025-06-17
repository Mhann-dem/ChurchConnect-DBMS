from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import AdminUser, PasswordResetToken, LoginAttempt


@admin.register(AdminUser)
class AdminUserAdmin(UserAdmin):
    list_display = [
        'email', 'username', 'first_name', 'last_name', 
        'role', 'active', 'last_login', 'created_at'
    ]
    list_filter = ['role', 'active', 'created_at', 'last_login']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    fieldsets = (
        (None, {
            'fields': ('id', 'username', 'email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name')
        }),
        ('Permissions', {
            'fields': ('role', 'active', 'is_staff', 'is_superuser')
        }),
        ('Important dates', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_preview', 'created_at', 'expires_at', 'used', 'is_expired']
    list_filter = ['used', 'created_at', 'expires_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['id', 'token', 'created_at']
    ordering = ['-created_at']
    
    def token_preview(self, obj):
        return f"{obj.token[:8]}..."
    token_preview.short_description = 'Token Preview'
    
    def is_expired(self, obj):
        expired = obj.is_expired()
        if expired:
            return format_html('<span style="color: red;">Yes</span>')
        return format_html('<span style="color: green;">No</span>')
    is_expired.short_description = 'Expired'
    is_expired.boolean = True


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ['email', 'ip_address', 'success', 'attempted_at', 'user_agent_preview']
    list_filter = ['success', 'attempted_at']
    search_fields = ['email', 'ip_address']
    readonly_fields = ['id', 'email', 'ip_address', 'success', 'attempted_at', 'user_agent']
    ordering = ['-attempted_at']
    
    def user_agent_preview(self, obj):
        if obj.user_agent:
            return obj.user_agent[:50] + "..." if len(obj.user_agent) > 50 else obj.user_agent
        return "-"
    user_agent_preview.short_description = 'User Agent'
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Don't allow editing
    
    actions = ['delete_selected']
    
    def get_actions(self, request):
        actions = super().get_actions(request)
        # Only allow deletion
        return {'delete_selected': actions['delete_selected']}