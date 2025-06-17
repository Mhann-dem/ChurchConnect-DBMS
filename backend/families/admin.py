# backend/churchconnect/families/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import Family, FamilyRelationship


class FamilyRelationshipInline(admin.TabularInline):
    model = FamilyRelationship
    extra = 0
    readonly_fields = ['created_at']
    autocomplete_fields = ['member']


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = [
        'family_name', 'primary_contact', 'member_count', 
        'adults_count', 'children_count', 'created_at'
    ]
    list_filter = ['created_at', 'updated_at']
    search_fields = ['family_name', 'primary_contact__first_name', 'primary_contact__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'member_count', 'adults_count', 'children_count']
    autocomplete_fields = ['primary_contact']
    inlines = [FamilyRelationshipInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'family_name', 'primary_contact')
        }),
        ('Details', {
            'fields': ('address', 'notes')
        }),
        ('Statistics', {
            'fields': ('member_count', 'adults_count', 'children_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('primary_contact')


@admin.register(FamilyRelationship)
class FamilyRelationshipAdmin(admin.ModelAdmin):
    list_display = [
        'member', 'family', 'relationship_type', 'created_at'
    ]
    list_filter = ['relationship_type', 'created_at']
    search_fields = [
        'member__first_name', 'member__last_name', 
        'family__family_name'
    ]
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['family', 'member']
    
    fieldsets = (
        ('Relationship', {
            'fields': ('id', 'family', 'member', 'relationship_type')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at')
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('family', 'member')