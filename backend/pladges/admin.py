# ==============================================================================
# pledges/admin.py
# ==============================================================================
from django.contrib import admin
from django.db.models import Sum
from django.utils.html import format_html
from .models import Pledge, PledgePayment


class PledgePaymentInline(admin.TabularInline):
    """Inline admin for pledge payments"""
    model = PledgePayment
    extra = 0
    readonly_fields = ['created_at']
    fields = ['payment_date', 'amount', 'payment_method', 'reference_number', 'recorded_by']


@admin.register(Pledge)
class PledgeAdmin(admin.ModelAdmin):
    """Admin interface for pledges"""
    list_display = [
        'member_name', 'amount', 'frequency', 'status',
        'start_date', 'completion_display', 'created_at'
    ]
    list_filter = ['status', 'frequency', 'created_at', 'start_date']
    search_fields = ['member__first_name', 'member__last_name', 'member__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completion_percentage']
    inlines = [PledgePaymentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('member', 'amount', 'frequency', 'status')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Tracking', {
            'fields': ('total_pledged', 'total_received', 'completion_percentage'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def member_name(self, obj):
        """Display member name"""
        return obj.member.get_full_name()
    member_name.short_description = 'Member'
    member_name.admin_order_field = 'member__last_name'

    def completion_display(self, obj):
        """Display completion percentage with color coding"""
        percentage = obj.completion_percentage
        if percentage >= 100:
            color = 'green'
        elif percentage >= 75:
            color = 'orange'
        else:
            color = 'red'
        
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )
    completion_display.short_description = 'Completion'
    completion_display.admin_order_field = 'total_received'

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related('member')


@admin.register(PledgePayment)
class PledgePaymentAdmin(admin.ModelAdmin):
    """Admin interface for pledge payments"""
    list_display = [
        'pledge_member', 'amount', 'payment_date',
        'payment_method', 'reference_number', 'recorded_by'
    ]
    list_filter = ['payment_method', 'payment_date', 'created_at']
    search_fields = [
        'pledge__member__first_name', 'pledge__member__last_name',
        'reference_number', 'notes'
    ]
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('pledge', 'amount', 'payment_date', 'payment_method')
        }),
        ('Reference', {
            'fields': ('reference_number', 'recorded_by', 'notes')
        }),
        ('System Information', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

    def pledge_member(self, obj):
        """Display pledge member name"""
        return obj.pledge.member.get_full_name()
    pledge_member.short_description = 'Member'
    pledge_member.admin_order_field = 'pledge__member__last_name'

    def get_queryset(self, request):
        """Optimize queryset"""
        return super().get_queryset(request).select_related('pledge__member')


