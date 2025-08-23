# backend/churchconnect/groups/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from .models import Group, MemberGroupRelationship, GroupCategory, GroupCategoryRelationship


class MemberGroupRelationshipInline(admin.TabularInline):
    model = MemberGroupRelationship
    extra = 0
    readonly_fields = ['join_date']
    autocomplete_fields = ['member']
    fields = ['member', 'role', 'status', 'is_active', 'start_date', 'end_date', 'join_date']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('member')


class GroupCategoryRelationshipInline(admin.TabularInline):
    model = GroupCategoryRelationship
    extra = 0
    readonly_fields = ['created_at']
    autocomplete_fields = ['category']
    fields = ['category', 'created_at']


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'leader_display', 'member_count_display', 'capacity_display',
        'is_active', 'is_public', 'requires_approval', 'created_at'
    ]
    list_filter = [
        'is_active', 'is_public', 'requires_approval', 'created_at',
        ('categories__category', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = ['name', 'description', 'leader_name', 'leader__first_name', 'leader__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'member_count_display', 'pending_requests_display']
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
            'fields': (
                'max_capacity', 'is_active', 'is_public', 
                'requires_approval', 'age_restriction'
            )
        }),
        ('Statistics', {
            'fields': ('member_count_display', 'pending_requests_display'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('leader').annotate(
            active_member_count=models.Count(
                'memberships',
                filter=models.Q(memberships__is_active=True, memberships__status='active')
            ),
            pending_count=models.Count(
                'memberships',
                filter=models.Q(memberships__status='pending')
            )
        )

    def leader_display(self, obj):
        if obj.leader:
            return obj.leader.get_full_name()
        return obj.leader_name or 'No leader assigned'
    leader_display.short_description = 'Leader'

    def member_count_display(self, obj):
        if hasattr(obj, 'active_member_count'):
            return obj.active_member_count
        return obj.member_count
    member_count_display.short_description = 'Active Members'

    def pending_requests_display(self, obj):
        if hasattr(obj, 'pending_count'):
            return obj.pending_count
        return obj.pending_requests_count
    pending_requests_display.short_description = 'Pending Requests'

    def capacity_display(self, obj):
        member_count = self.member_count_display(obj)
        if obj.max_capacity:
            return format_html(
                '<span style="color: {};">{}/{}</span>',
                'red' if member_count >= obj.max_capacity else 'green',
                member_count,
                obj.max_capacity
            )
        return f"{member_count}/∞"
    capacity_display.short_description = 'Capacity'


@admin.register(MemberGroupRelationship)
class MemberGroupRelationshipAdmin(admin.ModelAdmin):
    list_display = [
        'member_display', 'group', 'role', 'status_display', 
        'is_active', 'join_date'
    ]
    list_filter = [
        'role', 'status', 'is_active', 'join_date',
        ('group', admin.RelatedOnlyFieldListFilter)
    ]
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email',
        'group__name'
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

    def member_display(self, obj):
        return obj.member.get_full_name()
    member_display.short_description = 'Member'

    def status_display(self, obj):
        colors = {
            'active': 'green',
            'pending': 'orange',
            'inactive': 'gray',
            'declined': 'red'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_display.short_description = 'Status'


@admin.register(GroupCategory)
class GroupCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'color_display', 'group_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'group_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'color')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Statistics', {
            'fields': ('group_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            active_group_count=models.Count(
                'groups__group',
                filter=models.Q(groups__group__is_active=True)
            )
        )

    def color_display(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; display: inline-block;"></div> {}',
            obj.color,
            obj.color
        )
    color_display.short_description = 'Color'

    def group_count(self, obj):
        if hasattr(obj, 'active_group_count'):
            return obj.active_group_count
        return obj.groups.filter(group__is_active=True).count()
    group_count.short_description = 'Active Groups'


@admin.register(GroupCategoryRelationship)
class GroupCategoryRelationshipAdmin(admin.ModelAdmin):
    list_display = ['group', 'category', 'created_at']
    list_filter = [
        ('category', admin.RelatedOnlyFieldListFilter), 
        'created_at'
    ]
    search_fields = ['group__name', 'category__name']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['group', 'category']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('group', 'category')


# Additional admin configuration
admin.site.site_header = "ChurchConnect Administration"
admin.site.site_title = "ChurchConnect Admin"
admin.site.index_title = "Welcome to ChurchConnect Administration"