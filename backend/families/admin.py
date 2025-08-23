# backend/churchconnect/families/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Family, FamilyRelationship


class FamilyRelationshipInline(admin.TabularInline):
    """Inline admin for family relationships"""
    model = FamilyRelationship
    extra = 0
    readonly_fields = ['created_at', 'relationship_priority']
    autocomplete_fields = ['member']
    fields = ['member', 'relationship_type', 'notes', 'created_at']
    
    def relationship_priority(self, obj):
        """Show relationship priority for sorting"""
        return obj.get_relationship_priority() if obj else '-'
    relationship_priority.short_description = 'Priority'

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('member')


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    """Enhanced admin interface for families"""
    
    list_display = [
        'family_name', 'primary_contact_link', 'member_count_display', 
        'adults_count_display', 'children_count_display', 'has_primary_contact',
        'created_at_formatted', 'updated_at_formatted'
    ]
    list_filter = [
        'created_at', 'updated_at',
        ('primary_contact', admin.EmptyFieldListFilter),
    ]
    search_fields = [
        'family_name', 'primary_contact__first_name', 
        'primary_contact__last_name', 'primary_contact__email',
        'address', 'notes'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'member_count_display', 
        'adults_count_display', 'children_count_display', 'family_summary_display',
        'contact_info_display'
    ]
    autocomplete_fields = ['primary_contact']
    inlines = [FamilyRelationshipInline]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'family_name', 'primary_contact')
        }),
        ('Contact Details', {
            'fields': ('address', 'contact_info_display'),
            'classes': ('wide',)
        }),
        ('Family Composition', {
            'fields': ('member_count_display', 'adults_count_display', 'children_count_display'),
            'classes': ('collapse',)
        }),
        ('Summary', {
            'fields': ('family_summary_display',),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        """Optimize queryset with annotations and select_related"""
        return super().get_queryset(request).select_related('primary_contact').annotate(
            member_count=models.Count('family_relationships'),
            adults_count=models.Count(
                'family_relationships',
                filter=models.Q(family_relationships__relationship_type__in=['head', 'spouse'])
            ),
            children_count=models.Count(
                'family_relationships',
                filter=models.Q(family_relationships__relationship_type='child')
            )
        )

    def primary_contact_link(self, obj):
        """Display primary contact with link to member admin"""
        if obj.primary_contact:
            url = reverse('admin:members_member_change', args=[obj.primary_contact.pk])
            return format_html(
                '<a href="{}" title="View member details">{}</a>',
                url, obj.primary_contact.get_full_name()
            )
        return format_html('<span style="color: red;">No Primary Contact</span>')
    primary_contact_link.short_description = 'Primary Contact'
    primary_contact_link.admin_order_field = 'primary_contact__last_name'

    def member_count_display(self, obj):
        """Display member count with color coding"""
        count = getattr(obj, 'member_count', obj.member_count)
        if count == 0:
            color = 'red'
        elif count == 1:
            color = 'orange'
        else:
            color = 'green'
        return format_html('<span style="color: {};">{}</span>', color, count)
    member_count_display.short_description = 'Members'
    member_count_display.admin_order_field = 'member_count'

    def adults_count_display(self, obj):
        """Display adults count"""
        count = getattr(obj, 'adults_count', obj.adults_count)
        return count
    adults_count_display.short_description = 'Adults'
    adults_count_display.admin_order_field = 'adults_count'

    def children_count_display(self, obj):
        """Display children count"""
        count = getattr(obj, 'children_count', obj.children_count)
        return count
    children_count_display.short_description = 'Children'
    children_count_display.admin_order_field = 'children_count'

    def has_primary_contact(self, obj):
        """Show if family has primary contact"""
        if obj.primary_contact:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    has_primary_contact.short_description = 'Primary Contact'
    has_primary_contact.boolean = True

    def created_at_formatted(self, obj):
        """Format created date"""
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_formatted.short_description = 'Created'
    created_at_formatted.admin_order_field = 'created_at'

    def updated_at_formatted(self, obj):
        """Format updated date"""
        return obj.updated_at.strftime('%Y-%m-%d %H:%M')
    updated_at_formatted.short_description = 'Updated'
    updated_at_formatted.admin_order_field = 'updated_at'

    def family_summary_display(self, obj):
        """Display comprehensive family summary"""
        if obj:
            summary = obj.get_family_summary()
            html = f"""
            <div style="font-family: monospace;">
                <strong>Family:</strong> {summary['family_name']}<br>
                <strong>Total Members:</strong> {summary['total_members']}<br>
                <strong>Adults:</strong> {summary['adults']} | 
                <strong>Children:</strong> {summary['children']} | 
                <strong>Dependents:</strong> {summary['dependents']}<br>
                <strong>Created:</strong> {summary['created_date']}
            """
            
            if summary['primary_contact']:
                contact = summary['primary_contact']
                html += f"""<br><strong>Primary Contact:</strong> {contact['name']}<br>
                <strong>Email:</strong> {contact.get('email', 'N/A')}<br>
                <strong>Phone:</strong> {contact.get('phone', 'N/A')}"""
            
            html += "</div>"
            return mark_safe(html)
        return '-'
    family_summary_display.short_description = 'Family Summary'

    def contact_info_display(self, obj):
        """Display contact information"""
        if obj:
            contact_info = obj.get_contact_info()
            if contact_info:
                return mark_safe(f"""
                    <div>
                        <strong>{contact_info['name']}</strong><br>
                        Email: {contact_info.get('email', 'N/A')}<br>
                        Phone: {contact_info.get('phone', 'N/A')}<br>
                        Preferred: {contact_info.get('preferred_contact', 'N/A')}
                    </div>
                """)
        return 'No primary contact set'
    contact_info_display.short_description = 'Contact Information'

    # Custom admin actions
    actions = ['mark_needs_attention', 'export_family_data']

    def mark_needs_attention(self, request, queryset):
        """Mark families as needing attention (custom action example)"""
        # This would be implemented based on specific business needs
        count = queryset.count()
        self.message_user(request, f'{count} families marked as needing attention.')
    mark_needs_attention.short_description = "Mark selected families as needing attention"

    def export_family_data(self, request, queryset):
        """Export family data (custom action example)"""
        # This would integrate with the export functionality
        count = queryset.count()
        self.message_user(request, f'Export initiated for {count} families.')
    export_family_data.short_description = "Export selected families"


@admin.register(FamilyRelationship)
class FamilyRelationshipAdmin(admin.ModelAdmin):
    """Enhanced admin interface for family relationships"""
    
    list_display = [
        'member_link', 'family_link', 'relationship_type_display', 
        'is_adult_display', 'is_child_display', 'created_at_formatted'
    ]
    list_filter = [
        'relationship_type', 'created_at',
        ('family', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = [
        'member__first_name', 'member__last_name', 
        'family__family_name', 'notes'
    ]
    readonly_fields = [
        'id', 'created_at', 'relationship_priority_display',
        'is_adult_display', 'is_child_display'
    ]
    autocomplete_fields = ['family', 'member']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Relationship Details', {
            'fields': ('id', 'family', 'member', 'relationship_type')
        }),
        ('Relationship Properties', {
            'fields': ('relationship_priority_display', 'is_adult_display', 'is_child_display'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at')
        })
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('family', 'member')

    def member_link(self, obj):
        """Display member with link"""
        if obj.member:
            url = reverse('admin:members_member_change', args=[obj.member.pk])
            return format_html(
                '<a href="{}" title="View member details">{}</a>',
                url, obj.member.get_full_name()
            )
        return '-'
    member_link.short_description = 'Member'
    member_link.admin_order_field = 'member__last_name'

    def family_link(self, obj):
        """Display family with link"""
        if obj.family:
            url = reverse('admin:families_family_change', args=[obj.family.pk])
            return format_html(
                '<a href="{}" title="View family details">{}</a>',
                url, obj.family.family_name
            )
        return '-'
    family_link.short_description = 'Family'
    family_link.admin_order_field = 'family__family_name'

    def relationship_type_display(self, obj):
        """Display relationship type with color coding"""
        colors = {
            'head': 'blue',
            'spouse': 'green',
            'child': 'orange',
            'dependent': 'purple',
            'other': 'gray'
        }
        color = colors.get(obj.relationship_type, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_relationship_type_display()
        )
    relationship_type_display.short_description = 'Relationship'
    relationship_type_display.admin_order_field = 'relationship_type'

    def is_adult_display(self, obj):
        """Show if relationship represents an adult"""
        if obj.is_adult():
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: gray;">-</span>')
    is_adult_display.short_description = 'Adult'
    is_adult_display.boolean = True

    def is_child_display(self, obj):
        """Show if relationship represents a child"""
        if obj.is_child():
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: gray;">-</span>')
    is_child_display.short_description = 'Child'
    is_child_display.boolean = True

    def created_at_formatted(self, obj):
        """Format created date"""
        return obj.created_at.strftime('%Y-%m-%d %H:%M')
    created_at_formatted.short_description = 'Added'
    created_at_formatted.admin_order_field = 'created_at'

    def relationship_priority_display(self, obj):
        """Display relationship priority"""
        return obj.get_relationship_priority() if obj else '-'
    relationship_priority_display.short_description = 'Priority Order'


# Customize admin site headers
admin.site.site_header = "ChurchConnect Family Management"
admin.site.site_title = "Family Admin"
admin.site.index_title = "Family Management Dashboard"