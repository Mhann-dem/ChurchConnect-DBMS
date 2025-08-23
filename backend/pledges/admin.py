# ==============================================================================
# pledges/admin.py
# ==============================================================================
from django.contrib import admin
from django.db.models import Sum, Count
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from django.shortcuts import redirect
from django.contrib import messages
from .models import Pledge, PledgePayment, PledgeReminder


class PledgePaymentInline(admin.TabularInline):
    """Inline admin for pledge payments"""
    model = PledgePayment
    extra = 0
    readonly_fields = ['created_at']
    fields = [
        'payment_date', 'amount', 'payment_method', 
        'reference_number', 'recorded_by', 'notes'
    ]
    
    def get_queryset(self, request):
        """Optimize queryset for inline"""
        return super().get_queryset(request).select_related('pledge')


class PledgeReminderInline(admin.TabularInline):
    """Inline admin for pledge reminders"""
    model = PledgeReminder
    extra = 0
    readonly_fields = ['created_at', 'sent_date']
    fields = [
        'reminder_type', 'reminder_method', 'sent_date',
        'message', 'sent_by'
    ]
    
    def get_queryset(self, request):
        """Optimize queryset for inline"""
        return super().get_queryset(request).select_related('pledge')


@admin.register(Pledge)
class PledgeAdmin(admin.ModelAdmin):
    """Admin interface for pledges"""
    list_display = [
        'member_name_link', 'amount_display', 'frequency_display', 
        'status_display', 'completion_display', 'start_date', 
        'overdue_indicator', 'created_at'
    ]
    list_filter = [
        'status', 'frequency', 'created_at', 'start_date',
        ('member__gender', admin.AllValuesFieldListFilter),
        ('end_date', admin.DateFieldListFilter),
    ]
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email',
        'notes', 'member__phone'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'completion_percentage',
        'remaining_amount', 'is_overdue', 'annual_amount_display'
    ]
    inlines = [PledgePaymentInline, PledgeReminderInline]
    date_hierarchy = 'start_date'
    actions = [
        'mark_as_active', 'mark_as_completed', 'mark_as_cancelled',
        'export_to_csv', 'send_reminders'
    ]
    
    fieldsets = (
        ('Member Information', {
            'fields': ('member',)
        }),
        ('Pledge Details', {
            'fields': (
                'amount', 'frequency', 'start_date', 'end_date', 'status'
            )
        }),
        ('Financial Summary', {
            'fields': (
                'total_pledged', 'total_received', 'completion_percentage',
                'remaining_amount', 'annual_amount_display'
            ),
            'classes': ('collapse',)
        }),
        ('Status Information', {
            'fields': ('is_overdue', 'notes'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        return super().get_queryset(request).select_related(
            'member'
        ).prefetch_related('payments', 'reminders')

    def member_name_link(self, obj):
        """Display member name as link to member admin"""
        url = reverse('admin:members_member_change', args=[obj.member.id])
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            url, obj.member.get_full_name()
        )
    member_name_link.short_description = 'Member'
    member_name_link.admin_order_field = 'member__last_name'

    def amount_display(self, obj):
        """Display amount with currency formatting"""
        return f"${obj.amount:,.2f}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def frequency_display(self, obj):
        """Display frequency with better formatting"""
        return obj.get_frequency_display()
    frequency_display.short_description = 'Frequency'
    frequency_display.admin_order_field = 'frequency'

    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'active': 'green',
            'completed': 'blue',
            'cancelled': 'red',
            'paused': 'orange'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'
    status_display.admin_order_field = 'status'

    def completion_display(self, obj):
        """Display completion percentage with color coding and progress bar"""
        percentage = obj.completion_percentage
        
        if percentage >= 100:
            color = 'green'
        elif percentage >= 75:
            color = 'orange'
        elif percentage >= 25:
            color = 'blue'
        else:
            color = 'red'
        
        return format_html(
            '<div style="width: 100px; background: #f0f0f0; border-radius: 3px;">'
            '<div style="width: {}px; height: 20px; background: {}; border-radius: 3px; '
            'display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">'
            '{:.1f}%</div></div>',
            min(100, percentage), color, percentage
        )
    completion_display.short_description = 'Completion'
    completion_display.admin_order_field = 'total_received'

    def overdue_indicator(self, obj):
        """Display overdue status with warning icon"""
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;" title="Overdue since {}">⚠️ Overdue</span>',
                obj.end_date
            )
        elif obj.status == 'active' and obj.end_date:
            days_remaining = (obj.end_date - timezone.now().date()).days
            if days_remaining <= 30:
                return format_html(
                    '<span style="color: orange;" title="Due in {} days">📅 Due Soon</span>',
                    days_remaining
                )
        return '✅ Current'
    overdue_indicator.short_description = 'Due Status'

    def annual_amount_display(self, obj):
        """Display annual amount for readonly field"""
        return f"${obj.calculate_annual_amount():,.2f}"
    annual_amount_display.short_description = 'Annual Amount'

    # Admin Actions
    def mark_as_active(self, request, queryset):
        """Mark selected pledges as active"""
        updated = queryset.update(status='active')
        self.message_user(
            request, 
            f'{updated} pledge(s) marked as active.',
            messages.SUCCESS
        )
    mark_as_active.short_description = "Mark selected pledges as active"

    def mark_as_completed(self, request, queryset):
        """Mark selected pledges as completed"""
        updated = queryset.update(status='completed')
        self.message_user(
            request, 
            f'{updated} pledge(s) marked as completed.',
            messages.SUCCESS
        )
    mark_as_completed.short_description = "Mark selected pledges as completed"

    def mark_as_cancelled(self, request, queryset):
        """Mark selected pledges as cancelled"""
        updated = queryset.update(status='cancelled')
        self.message_user(
            request, 
            f'{updated} pledge(s) marked as cancelled.',
            messages.WARNING
        )
    mark_as_cancelled.short_description = "Mark selected pledges as cancelled"

    def export_to_csv(self, request, queryset):
        """Export selected pledges to CSV"""
        # This would redirect to the API endpoint or generate CSV directly
        ids = ','.join(str(pledge.id) for pledge in queryset)
        self.message_user(
            request,
            f'Export functionality for {queryset.count()} pledges would be implemented here.',
            messages.INFO
        )
    export_to_csv.short_description = "Export selected pledges to CSV"

    def send_reminders(self, request, queryset):
        """Send reminders for selected pledges"""
        active_pledges = queryset.filter(status='active')
        count = 0
        for pledge in active_pledges:
            # Create reminder record (actual sending would be implemented separately)
            PledgeReminder.objects.create(
                pledge=pledge,
                reminder_type='upcoming',
                reminder_method='email',
                message=f'Automated reminder for pledge of ${pledge.amount}',
                sent_by=request.user.get_full_name() or str(request.user)
            )
            count += 1
        
        self.message_user(
            request,
            f'Reminders created for {count} active pledge(s).',
            messages.SUCCESS
        )
    send_reminders.short_description = "Send reminders for selected pledges"


@admin.register(PledgePayment)
class PledgePaymentAdmin(admin.ModelAdmin):
    """Admin interface for pledge payments"""
    list_display = [
        'pledge_member_link', 'amount_display', 'payment_date',
        'payment_method_display', 'reference_number', 'recorded_by'
    ]
    list_filter = [
        'payment_method', 'payment_date', 'created_at',
        ('pledge__status', admin.AllValuesFieldListFilter),
        ('pledge__frequency', admin.AllValuesFieldListFilter),
    ]
    search_fields = [
        'pledge__member__first_name', 'pledge__member__last_name',
        'reference_number', 'notes', 'recorded_by'
    ]
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'payment_date'
    actions = ['export_to_csv']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('pledge', 'amount', 'payment_date', 'payment_method')
        }),
        ('Reference & Notes', {
            'fields': ('reference_number', 'recorded_by', 'notes')
        }),
        ('System Information', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related('pledge__member')

    def pledge_member_link(self, obj):
        """Display pledge member name as link"""
        pledge_url = reverse('admin:pledges_pledge_change', args=[obj.pledge.id])
        member_url = reverse('admin:members_member_change', args=[obj.pledge.member.id])
        
        return format_html(
            '<a href="{}" title="View Pledge">{}</a> '
            '(<a href="{}" title="View Member">Member</a>)',
            pledge_url, obj.pledge.member.get_full_name(), member_url
        )
    pledge_member_link.short_description = 'Member/Pledge'
    pledge_member_link.admin_order_field = 'pledge__member__last_name'

    def amount_display(self, obj):
        """Display amount with currency formatting"""
        return f"${obj.amount:,.2f}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def payment_method_display(self, obj):
        """Display payment method with icon"""
        icons = {
            'cash': '💵',
            'check': '📝',
            'card': '💳',
            'bank_transfer': '🏦',
            'online': '💻',
            'mobile': '📱',
            'other': '❓'
        }
        icon = icons.get(obj.payment_method, '❓')
        return f"{icon} {obj.get_payment_method_display()}"
    payment_method_display.short_description = 'Payment Method'
    payment_method_display.admin_order_field = 'payment_method'

    def export_to_csv(self, request, queryset):
        """Export selected payments to CSV"""
        self.message_user(
            request,
            f'Export functionality for {queryset.count()} payments would be implemented here.',
            messages.INFO
        )
    export_to_csv.short_description = "Export selected payments to CSV"


@admin.register(PledgeReminder)
class PledgeReminderAdmin(admin.ModelAdmin):
    """Admin interface for pledge reminders"""
    list_display = [
        'pledge_member_link', 'reminder_type_display', 'reminder_method_display',
        'sent_date', 'sent_by', 'message_preview'
    ]
    list_filter = [
        'reminder_type', 'reminder_method', 'sent_date', 'created_at',
        ('pledge__status', admin.AllValuesFieldListFilter)
    ]
    search_fields = [
        'pledge__member__first_name', 'pledge__member__last_name',
        'message', 'sent_by'
    ]
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'sent_date'
    
    fieldsets = (
        ('Reminder Information', {
            'fields': ('pledge', 'reminder_type', 'reminder_method', 'sent_date')
        }),
        ('Content', {
            'fields': ('message', 'sent_by')
        }),
        ('System Information', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related('pledge__member')

    def pledge_member_link(self, obj):
        """Display pledge member name as link"""
        pledge_url = reverse('admin:pledges_pledge_change', args=[obj.pledge.id])
        return format_html(
            '<a href="{}" title="View Pledge">{}</a>',
            pledge_url, obj.pledge.member.get_full_name()
        )
    pledge_member_link.short_description = 'Member'
    pledge_member_link.admin_order_field = 'pledge__member__last_name'

    def reminder_type_display(self, obj):
        """Display reminder type with appropriate icon"""
        icons = {
            'upcoming': '📅',
            'overdue': '⚠️',
            'thank_you': '🙏',
            'completion': '✅'
        }
        icon = icons.get(obj.reminder_type, '📧')
        return f"{icon} {obj.get_reminder_type_display()}"
    reminder_type_display.short_description = 'Type'
    reminder_type_display.admin_order_field = 'reminder_type'

    def reminder_method_display(self, obj):
        """Display reminder method with appropriate icon"""
        icons = {
            'email': '📧',
            'sms': '📱',
            'phone': '📞',
            'mail': '📮'
        }
        icon = icons.get(obj.reminder_method, '📧')
        return f"{icon} {obj.get_reminder_method_display()}"
    reminder_method_display.short_description = 'Method'
    reminder_method_display.admin_order_field = 'reminder_method'

    def message_preview(self, obj):
        """Display truncated message preview"""
        if len(obj.message) > 50:
            return f"{obj.message[:50]}..."
        return obj.message
    message_preview.short_description = 'Message Preview'


# Custom admin site configuration for pledges
class PledgeAdminSite(admin.AdminSite):
    """Custom admin site for pledge management"""
    site_header = "ChurchConnect Pledge Management"
    site_title = "Pledge Admin"
    index_title = "Pledge Administration Dashboard"

    def index(self, request, extra_context=None):
        """Custom admin index with pledge statistics"""
        extra_context = extra_context or {}
        
        # Add pledge statistics to the admin index
        try:
            total_pledges = Pledge.objects.count()
            active_pledges = Pledge.objects.filter(status='active').count()
            total_amount = Pledge.objects.aggregate(
                total=Sum('total_pledged')
            )['total'] or 0
            received_amount = Pledge.objects.aggregate(
                total=Sum('total_received')
            )['total'] or 0
            
            # Recent activity (last 30 days)
            from datetime import timedelta
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            recent_pledges = Pledge.objects.filter(created_at__date__gte=thirty_days_ago).count()
            recent_payments = PledgePayment.objects.filter(payment_date__gte=thirty_days_ago).count()
            
            # Overdue pledges
            overdue_pledges = Pledge.objects.filter(
                status='active',
                end_date__lt=timezone.now().date()
            ).count()
            
            extra_context.update({
                'pledge_stats': {
                    'total_pledges': total_pledges,
                    'active_pledges': active_pledges,
                    'total_amount': total_amount,
                    'received_amount': received_amount,
                    'completion_rate': (received_amount / total_amount * 100) if total_amount > 0 else 0,
                    'recent_pledges': recent_pledges,
                    'recent_payments': recent_payments,
                    'overdue_pledges': overdue_pledges,
                }
            })
        except Exception as e:
            # If there's any error getting stats, just continue without them
            pass
        
        return super().index(request, extra_context)


# Register models with the default admin site
admin.site.site_header = "ChurchConnect Administration"
admin.site.site_title = "ChurchConnect Admin"
admin.site.index_title = "Welcome to ChurchConnect Administration"

# Add custom CSS and JS for better admin interface
class PledgeAdminMixin:
    """Mixin to add custom styling to pledge admin classes"""
    
    class Media:
        css = {
            'all': ('admin/css/pledge_admin.css',)  # You would create this file
        }
        js = ('admin/js/pledge_admin.js',)  # You would create this file

# Apply the mixin to existing admin classes
PledgeAdmin.__bases__ += (PledgeAdminMixin,)
PledgePaymentAdmin.__bases__ += (PledgeAdminMixin,)
PledgeReminderAdmin.__bases__ += (PledgeAdminMixin,)