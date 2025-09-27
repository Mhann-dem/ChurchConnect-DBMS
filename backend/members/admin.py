# backend/churchconnect/members/admin.py - FIXED FOR CUSTOM USER MODEL
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog

# Get the custom user model - it's already registered in authentication app
User = get_user_model()

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'email', 'phone', 'age', 'gender', 
        'family', 'is_active', 'registration_date'
    ]
    list_filter = [
        'gender', 'is_active', 'communication_opt_in', 
        'preferred_contact_method', 'registration_date'
    ]
    search_fields = [
        'first_name', 'last_name', 'preferred_name', 
        'email', 'phone'
    ]
    readonly_fields = [
        'id', 'registration_date', 'last_updated', 'age'
    ]
    autocomplete_fields = ['family', 'registered_by', 'last_modified_by']  # Added user fields
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'first_name', 'last_name', 'preferred_name', 
                'date_of_birth', 'gender'
            )
        }),
        ('Contact Information', {
            'fields': (
                'email', 'phone', 'alternate_phone', 'address',
                'preferred_contact_method', 'preferred_language'
            )
        }),
        ('Family & Emergency Contact', {
            'fields': (
                'family', 'emergency_contact_name', 'emergency_contact_phone'
            )
        }),
        ('Accessibility & Special Needs', {
            'fields': ('accessibility_needs',)
        }),
        ('Profile & Media', {
            'fields': ('photo_url',)
        }),
        ('Administrative', {
            'fields': (
                'is_active', 'communication_opt_in', 'last_contact_date',
                'notes', 'registered_by', 'last_modified_by'
            )
        }),
        ('Privacy & Legal', {
            'fields': (
                'privacy_policy_agreed', 'privacy_policy_agreed_date'
            )
        }),
        ('System Information', {
            'fields': ('registration_date', 'last_updated'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('family', 'registered_by', 'last_modified_by')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Name'
    full_name.admin_order_field = 'last_name'

@admin.register(MemberNote)
class MemberNoteAdmin(admin.ModelAdmin):
    list_display = ['member', 'created_by', 'is_private', 'created_at']
    list_filter = ['is_private', 'created_at', 'note_type']
    search_fields = ['member__first_name', 'member__last_name', 'note', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    # FIXED: Now that User is registered, autocomplete will work
    autocomplete_fields = ['member', 'created_by']
    
    fieldsets = (
        ('Note Information', {
            'fields': ('id', 'member', 'created_by', 'title', 'note', 'note_type', 'is_private', 'is_confidential')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('member', 'created_by')

@admin.register(MemberTag)
class MemberTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'color', 'is_system_tag', 'created_by', 'created_at']
    list_filter = ['is_system_tag', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['created_by']
    
    fieldsets = (
        ('Tag Information', {
            'fields': ('id', 'name', 'description', 'color', 'is_system_tag', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

@admin.register(MemberTagAssignment)
class MemberTagAssignmentAdmin(admin.ModelAdmin):
    list_display = ['member', 'tag', 'assigned_by', 'assigned_at']
    list_filter = ['assigned_at', 'tag']
    search_fields = ['member__first_name', 'member__last_name', 'tag__name']
    readonly_fields = ['id', 'assigned_at']
    autocomplete_fields = ['member', 'tag', 'assigned_by']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('member', 'tag', 'assigned_by')

@admin.register(BulkImportLog)
class BulkImportLogAdmin(admin.ModelAdmin):
    list_display = ['filename', 'status', 'total_rows', 'successful_rows', 'failed_rows', 'uploaded_by', 'started_at']
    list_filter = ['status', 'started_at', 'completed_at']
    search_fields = ['filename', 'uploaded_by__username', 'uploaded_by__email']
    readonly_fields = ['id', 'batch_id', 'started_at', 'completed_at', 'success_rate']
    autocomplete_fields = ['uploaded_by']
    
    fieldsets = (
        ('Import Information', {
            'fields': ('id', 'batch_id', 'filename', 'status', 'uploaded_by')
        }),
        ('Statistics', {
            'fields': ('total_rows', 'successful_rows', 'failed_rows', 'skipped_rows', 'success_rate')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at')
        }),
        ('Details', {
            'fields': ('error_summary', 'import_summary'),
            'classes': ('collapse',)
        })
    )
    
    def success_rate(self, obj):
        return f"{obj.success_rate:.1f}%"
    success_rate.short_description = 'Success Rate'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('uploaded_by')