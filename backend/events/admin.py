# events/admin.py - COMPLETE Events admin for ChurchConnect
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Event, EventRegistration, EventReminder, EventCategory, EventVolunteer


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def color_display(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc;"></div>',
            obj.color
        )
    color_display.short_description = 'Color'


class EventRegistrationInline(admin.TabularInline):
    model = EventRegistration
    extra = 0
    readonly_fields = ['registration_date', 'created_at']
    fields = [
        'member', 'status', 'payment_status', 'payment_amount',
        'registration_date', 'notes'
    ]


class EventVolunteerInline(admin.TabularInline):
    model = EventVolunteer
    extra = 0
    readonly_fields = ['invited_date', 'response_date']
    fields = [
        'member', 'role', 'status', 'start_time', 'end_time',
        'invited_date', 'response_date'
    ]


class EventReminderInline(admin.TabularInline):
    model = EventReminder
    extra = 0
    readonly_fields = ['sent_at', 'sent_count', 'created_at']
    fields = [
        'reminder_type', 'reminder_method', 'send_at', 'subject',
        'sent', 'sent_at', 'sent_count'
    ]


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'event_type', 'start_datetime', 'location',
        'status', 'is_public', 'registration_count', 'created_by'
    ]
    list_filter = [
        'event_type', 'status', 'is_public', 'is_featured',
        'requires_registration', 'start_datetime', 'created_at'
    ]
    search_fields = ['title', 'description', 'location', 'organizer', 'tags']
    ordering = ['-start_datetime']
    date_hierarchy = 'start_datetime'
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'title', 'description', 'event_type', 'status',
                'is_public', 'is_featured'
            )
        }),
        ('Date & Time', {
            'fields': (
                'start_datetime', 'end_datetime', 'registration_deadline'
            )
        }),
        ('Location', {
            'fields': ('location', 'location_details')
        }),
        ('Registration', {
            'fields': (
                'requires_registration', 'max_capacity', 'registration_fee',
                'external_registration_url'
            )
        }),
        ('Organization', {
            'fields': (
                'organizer', 'contact_email', 'contact_phone'
            )
        }),
        ('Target Audience', {
            'fields': ('target_groups', 'age_min', 'age_max')
        }),
        ('Additional Info', {
            'fields': ('prerequisites', 'tags', 'image_url'),
            'classes': ['collapse']
        }),
        ('Metadata', {
            'fields': ('created_by', 'last_modified_by', 'created_at', 'updated_at'),
            'classes': ['collapse'],
            'description': 'System-generated fields'
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['target_groups']
    
    inlines = [EventRegistrationInline, EventVolunteerInline, EventReminderInline]
    
    def registration_count(self, obj):
        count = obj.registrations.filter(status__in=['confirmed', 'attended']).count()
        if obj.max_capacity:
            return f"{count} / {obj.max_capacity}"
        return str(count)
    registration_count.short_description = 'Registrations'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related().prefetch_related(
            'registrations', 'volunteers', 'target_groups'
        )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = str(request.user)
        obj.last_modified_by = str(request.user)
        super().save_model(request, obj, form, change)


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = [
        'member_name', 'event_title', 'status', 'payment_status',
        'registration_date', 'payment_amount'
    ]
    list_filter = [
        'status', 'payment_status', 'registration_date',
        'event__event_type', 'event__start_datetime'
    ]
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email',
        'event__title', 'notes'
    ]
    ordering = ['-registration_date']
    date_hierarchy = 'registration_date'
    
    fieldsets = (
        ('Registration Info', {
            'fields': ('event', 'member', 'status', 'registration_date', 'notes')
        }),
        ('Requirements & Needs', {
            'fields': (
                'dietary_requirements', 'accessibility_needs',
                'emergency_contact_name', 'emergency_contact_phone'
            )
        }),
        ('Payment', {
            'fields': (
                'payment_status', 'payment_amount', 'payment_reference',
                'payment_date'
            )
        }),
        ('Admin Fields', {
            'fields': (
                'approved_by', 'approval_date', 'check_in_time', 'check_out_time'
            ),
            'classes': ['collapse']
        })
    )
    
    readonly_fields = ['registration_date', 'created_at', 'updated_at']
    
    def member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"
    member_name.short_description = 'Member'
    member_name.admin_order_field = 'member__first_name'
    
    def event_title(self, obj):
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event', 'member')


@admin.register(EventVolunteer)
class EventVolunteerAdmin(admin.ModelAdmin):
    list_display = [
        'member_name', 'event_title', 'role', 'status',
        'invited_date', 'response_date'
    ]
    list_filter = [
        'role', 'status', 'invited_date', 'event__event_type'
    ]
    search_fields = [
        'member__first_name', 'member__last_name', 'event__title',
        'role_description'
    ]
    ordering = ['-invited_date']
    
    fieldsets = (
        ('Volunteer Assignment', {
            'fields': ('event', 'member', 'role', 'status')
        }),
        ('Role Details', {
            'fields': ('role_description', 'start_time', 'end_time', 'notes')
        }),
        ('Tracking', {
            'fields': (
                'invited_date', 'response_date', 'check_in_time', 'check_out_time'
            )
        })
    )
    
    readonly_fields = ['invited_date', 'created_at']
    
    def member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"
    member_name.short_description = 'Volunteer'
    member_name.admin_order_field = 'member__first_name'
    
    def event_title(self, obj):
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event', 'member')


@admin.register(EventReminder)
class EventReminderAdmin(admin.ModelAdmin):
    list_display = [
        'event_title', 'reminder_type', 'reminder_method',
        'send_at', 'sent', 'sent_count'
    ]
    list_filter = [
        'reminder_type', 'reminder_method', 'sent', 'send_at'
    ]
    search_fields = ['event__title', 'subject', 'message']
    ordering = ['-send_at']
    
    fieldsets = (
        ('Reminder Info', {
            'fields': ('event', 'reminder_type', 'reminder_method')
        }),
        ('Scheduling', {
            'fields': ('send_at', 'days_before')
        }),
        ('Content', {
            'fields': ('subject', 'message')
        }),
        ('Targeting', {
            'fields': ('send_to_all', 'target_statuses')
        }),
        ('Status', {
            'fields': ('sent', 'sent_at', 'sent_count'),
            'classes': ['collapse']
        })
    )
    
    readonly_fields = ['sent_at', 'sent_count', 'created_at']
    
    def event_title(self, obj):
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event')


# Customize admin site header
admin.site.site_header = "ChurchConnect Events Administration"
admin.site.site_title = "Events Admin"
admin.site.index_title = "Events Management"