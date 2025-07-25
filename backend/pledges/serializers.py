# ==============================================================================
# pledges/serializers.py
# ==============================================================================
from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Pledge, PledgePayment
from members.serializers import MemberSummarySerializer


class PledgePaymentSerializer(serializers.ModelSerializer):
    """Serializer for pledge payment records"""
    
    class Meta:
        model = PledgePayment
        fields = [
            'id', 'amount', 'payment_date', 'payment_method',
            'reference_number', 'notes', 'recorded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        """Validate payment amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value


class PledgeSerializer(serializers.ModelSerializer):
    """Serializer for pledge records"""
    member_details = MemberSummarySerializer(source='member', read_only=True)
    payments = PledgePaymentSerializer(many=True, read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    annual_amount = serializers.SerializerMethodField()
    payment_count = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Pledge
        fields = [
            'id', 'member', 'member_details', 'amount', 'frequency',
            'start_date', 'end_date', 'status', 'notes', 'created_at',
            'updated_at', 'total_pledged', 'total_received',
            'completion_percentage', 'annual_amount', 'payments',
            'payment_count', 'last_payment_date'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_received']

    def get_annual_amount(self, obj):
        """Get annual pledge amount"""
        return obj.calculate_annual_amount()

    def get_payment_count(self, obj):
        """Get number of payments made"""
        return obj.payments.count()

    def get_last_payment_date(self, obj):
        """Get date of last payment"""
        last_payment = obj.payments.first()
        return last_payment.payment_date if last_payment else None

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
        
        return data


class PledgeStatsSerializer(serializers.Serializer):
    """Serializer for pledge statistics"""
    total_pledges = serializers.IntegerField()
    total_active_pledges = serializers.IntegerField()
    total_pledged_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_received_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_pledge_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Frequency breakdown
    frequency_breakdown = serializers.DictField()
    
    # Monthly stats
    monthly_stats = serializers.ListField()
