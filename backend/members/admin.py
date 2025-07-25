# backend/churchconnect/members/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Member, MemberNote

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
    autocomplete_fields = ['family']
    
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
                'notes'
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
        return super().get_queryset(request).select_related('family')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Name'
    full_name.admin_order_field = 'last_name'

@admin.register(MemberNote)
class MemberNoteAdmin(admin.ModelAdmin):
    list_display = ['member', 'created_by', 'is_private', 'created_at']
    list_filter = ['is_private', 'created_at']
    search_fields = ['member__first_name', 'member__last_name', 'note']
    readonly_fields = ['id', 'created_at', 'updated_at']
    autocomplete_fields = ['member', 'created_by']
    
    fieldsets = (
        ('Note Information', {
            'fields': ('id', 'member', 'created_by', 'note', 'is_private')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('member', 'created_by')