# backend/churchconnect/groups/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Group, MemberGroupRelationship, GroupCategory, GroupCategoryRelationship

class MemberGroupRelationshipInline(admin.TabularInline):
    model = MemberGroupRelationship
    extra = 0
    readonly_fields = ['join_date']
    autocomplete_fields = ['member']
    fields = ['member', 'role', 'status', 'is_active', 'start_date', 'end_date', 'join_date']

class GroupCategoryRelationshipInline(admin.TabularInline):
    model = GroupCategoryRelationship
    extra = 0
    readonly_fields = ['created_at']
    autocomplete_fields = ['category']

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'leader_display', 'member_count', 'capacity_display',
        'is_active', 'is_public', 'created_at'
    ]
    list_filter = [
        'is_active', 'is_public', 'requires_approval', 'created_at',
        'categories__category'
    ]
    search_fields = ['name', 'description', 'leader_name', 'leader__first_name', 'leader__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'member_count']
    autocomplete_fields = ['leader']
    inlines = [GroupCategoryRelationshipInline, MemberGroupRelationshipInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description')
        }),
        ('Leadership', {
            'fields': ('leader', 'leader_name')
        }),
        ('Meeting Details', {
            'fields': ('meeting_schedule', 'meeting_location')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone')
        }),
        ('Settings', {
            'fields': ('max_capacity', 'is_active', 'is_public', 'requires_approval', 'age_restriction')
        }),
        ('Statistics', {
            'fields': ('member_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('leader').prefetch_related('memberships')

    def leader_display(self, obj):
        if obj.leader:
            return obj.leader.get_full_name()
        return obj.leader_name or 'No leader assigned'
    leader_display.short_description = 'Leader'

    def capacity_display(self, obj):
        if obj.max_capacity:
            return f"{obj.member_count}/{obj.max_capacity}"
        return f"{obj.member_count}/∞"
    capacity_display.short_description = 'Members'

@admin.register(MemberGroupRelationship)
class MemberGroupRelationshipAdmin(admin.ModelAdmin):
    list_display = [
        'member', 'group', 'role', 'status', 'is_active', 'join_date'
    ]
    list_filter = ['role', 'status', 'is_active', 'join_date']
    search_fields = [
        'member__first_name', 'member__last_name', 'group__name'
    ]
    readonly_fields = ['id', 'join_date']
    autocomplete_fields = ['member', 'group']
    
    fieldsets = (
        ('Membership', {
            'fields': ('id', 'member', 'group', 'role', 'status', 'is_active')
        }),
        ('Dates', {
            'fields': ('join_date', 'start_date', 'end_date')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('member', 'group')

@admin.register(GroupCategory)
class GroupCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'color', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'color')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(GroupCategoryRelationship)
class GroupCategoryRelationshipAdmin(admin.ModelAdmin):
    list_display = ['group', 'category', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['group__name', 'category__name']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['group', 'category']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('group', 'category')