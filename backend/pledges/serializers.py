# ==============================================================================
# pledges/serializers.py
# ==============================================================================
from rest_framework import serializers
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from decimal import Decimal
from .models import Pledge, PledgePayment, PledgeReminder


class MemberSummarySerializer(serializers.Serializer):
    """Simple member summary for pledge serializers"""
    id = serializers.UUIDField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    phone = serializers.CharField(read_only=True)
    
    def to_representation(self, instance):
        """Add full name to the representation"""
        data = super().to_representation(instance)
        data['full_name'] = f"{instance.first_name} {instance.last_name}".strip()
        return data


class PledgeReminderSerializer(serializers.ModelSerializer):
    """Serializer for pledge reminder records"""
    
    class Meta:
        model = PledgeReminder
        fields = [
            'id', 'reminder_type', 'reminder_method', 'sent_date',
            'message', 'sent_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PledgePaymentSerializer(serializers.ModelSerializer):
    """Serializer for pledge payment records"""
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = PledgePayment
        fields = [
            'id', 'amount', 'payment_date', 'payment_method', 'payment_method_display',
            'reference_number', 'notes', 'recorded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        """Validate payment amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value

    def validate_payment_date(self, value):
        """Validate payment date is not in the future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Payment date cannot be in the future.")
        return value


class PledgeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for pledge list views"""
    member_details = MemberSummarySerializer(source='member', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    annual_amount = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    payment_count = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Pledge
        fields = [
            'id', 'member', 'member_details', 'amount', 'frequency', 'frequency_display',
            'start_date', 'end_date', 'status', 'status_display', 'created_at',
            'total_pledged', 'total_received', 'completion_percentage',
            'annual_amount', 'is_overdue', 'remaining_amount',
            'payment_count', 'last_payment_date'
        ]

    def get_annual_amount(self, obj):
        """Get annual pledge amount"""
        return float(obj.calculate_annual_amount())

    def get_payment_count(self, obj):
        """Get number of payments made"""
        return obj.payments.count()

    def get_last_payment_date(self, obj):
        """Get date of last payment"""
        last_payment = obj.payments.first()
        return last_payment.payment_date if last_payment else None


class PledgeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for pledge detail views"""
    member_details = MemberSummarySerializer(source='member', read_only=True)
    payments = PledgePaymentSerializer(many=True, read_only=True)
    reminders = PledgeReminderSerializer(many=True, read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    annual_amount = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    payment_count = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()
    next_expected_payment = serializers.SerializerMethodField()

    class Meta:
        model = Pledge
        fields = [
            'id', 'member', 'member_details', 'amount', 'frequency', 'frequency_display',
            'start_date', 'end_date', 'status', 'status_display', 'notes',
            'created_at', 'updated_at', 'total_pledged', 'total_received',
            'completion_percentage', 'annual_amount', 'is_overdue', 'remaining_amount',
            'payments', 'reminders', 'payment_count', 'last_payment_date',
            'next_expected_payment'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_received']

    def get_annual_amount(self, obj):
        """Get annual pledge amount"""
        return float(obj.calculate_annual_amount())

    def get_payment_count(self, obj):
        """Get number of payments made"""
        return obj.payments.count()

    def get_last_payment_date(self, obj):
        """Get date of last payment"""
        last_payment = obj.payments.first()
        return last_payment.payment_date if last_payment else None

    def get_next_expected_payment(self, obj):
        """Calculate next expected payment date based on frequency"""
        if obj.frequency == 'one-time' or obj.status != 'active':
            return None
        
        last_payment = obj.payments.first()
        base_date = last_payment.payment_date if last_payment else obj.start_date
        
        from datetime import timedelta
        
        if obj.frequency == 'weekly':
            next_date = base_date + timedelta(weeks=1)
        elif obj.frequency == 'monthly':
            # Add one month (approximate)
            next_date = base_date + timedelta(days=30)
        elif obj.frequency == 'quarterly':
            next_date = base_date + timedelta(days=90)
        elif obj.frequency == 'annually':
            next_date = base_date + timedelta(days=365)
        else:
            return None
        
        return next_date if next_date <= (obj.end_date or timezone.now().date() + timedelta(days=365)) else None


class PledgeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating pledges"""
    
    class Meta:
        model = Pledge
        fields = [
            'id', 'member', 'amount', 'frequency', 'start_date', 'end_date',
            'status', 'notes', 'total_pledged'
        ]
        read_only_fields = ['id']

    def validate(self, data):
        """Validate pledge data"""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError(
                    "End date must be after start date."
                )
        
        if data.get('amount', 0) <= 0:
            raise serializers.ValidationError(
                "Pledge amount must be greater than zero."
            )
        
        # Validate frequency-specific rules
        frequency = data.get('frequency')
        if frequency == 'one-time' and data.get('end_date'):
            raise serializers.ValidationError(
                "One-time pledges should not have an end date."
            )
        
        return data

    def create(self, validated_data):
        """Create a new pledge"""
        pledge = super().create(validated_data)
        # The model's save method will calculate total_pledged
        return pledge

    def update(self, instance, validated_data):
        """Update an existing pledge"""
        pledge = super().update(instance, validated_data)
        # Recalculate totals if amount or dates changed
        if any(field in validated_data for field in ['amount', 'start_date', 'end_date', 'frequency']):
            pledge.total_pledged = pledge.calculate_expected_total()
            pledge.save(update_fields=['total_pledged'])
        return pledge


class PledgeStatsSerializer(serializers.Serializer):
    """Serializer for pledge statistics"""
    total_pledges = serializers.IntegerField()
    total_active_pledges = serializers.IntegerField()
    total_completed_pledges = serializers.IntegerField()
    total_cancelled_pledges = serializers.IntegerField()
    total_pledged_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_received_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    outstanding_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_pledge_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Frequency breakdown
    frequency_breakdown = serializers.DictField()
    
    # Status breakdown
    status_breakdown = serializers.DictField()
    
    # Monthly stats
    monthly_stats = serializers.ListField()
    
    # Recent activity
    recent_pledges_count = serializers.IntegerField()
    recent_payments_count = serializers.IntegerField()
    recent_payments_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class PledgeSummarySerializer(serializers.Serializer):
    """Serializer for pledge summary reports"""
    member_name = serializers.CharField()
    member_email = serializers.EmailField()
    total_pledged = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_received = serializers.DecimalField(max_digits=12, decimal_places=2)
    completion_percentage = serializers.FloatField()
    active_pledges = serializers.IntegerField()
    last_payment_date = serializers.DateField()


class BulkPledgeActionSerializer(serializers.Serializer):
    """Serializer for bulk actions on pledges"""
    ACTION_CHOICES = [
        ('activate', 'Activate'),
        ('pause', 'Pause'),
        ('cancel', 'Cancel'),
        ('complete', 'Complete'),
        ('send_reminder', 'Send Reminder'),
    ]
    
    pledge_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of pledge IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        help_text="Action to perform on selected pledges"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Optional notes for the action"
    )
    
    def validate_pledge_ids(self, value):
        """Validate that all pledge IDs exist"""
        existing_ids = set(
            Pledge.objects.filter(id__in=value).values_list('id', flat=True)
        )
        provided_ids = set(value)
        
        if existing_ids != provided_ids:
            missing_ids = provided_ids - existing_ids
            raise serializers.ValidationError(
                f"The following pledge IDs do not exist: {list(missing_ids)}"
            )
        
        return value