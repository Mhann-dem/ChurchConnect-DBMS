# ==============================================================================
# pledges/views.py
# ==============================================================================
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
import csv
from .models import Pledge, PledgePayment
from .serializers import (
    PledgeSerializer, PledgePaymentSerializer, PledgeStatsSerializer
)
from core.permissions import IsAdminUser


class PledgeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledges
    Provides CRUD operations and statistical endpoints
    """
    queryset = Pledge.objects.select_related('member').prefetch_related('payments')
    serializer_class = PledgeSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['status', 'frequency', 'member']
    search_fields = ['member__first_name', 'member__last_name', 'member__email', 'notes']
    ordering_fields = ['created_at', 'amount', 'start_date', 'total_pledged', 'total_received']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_date__lte=end_date)
            
        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
            
        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get pledge statistics"""
        queryset = self.get_queryset()
        
        # Basic stats
        total_pledges = queryset.count()
        active_pledges = queryset.filter(status='active').count()
        
        # Amount stats
        amount_stats = queryset.aggregate(
            total_pledged=Sum('total_pledged'),
            total_received=Sum('total_received'),
            average_amount=Avg('amount')
        )
        
        # Completion rate
        completion_rate = 0
        if amount_stats['total_pledged'] and amount_stats['total_pledged'] > 0:
            completion_rate = (amount_stats['total_received'] / amount_stats['total_pledged']) * 100
        
        # Frequency breakdown
        frequency_breakdown = {}
        for choice in Pledge.FREQUENCY_CHOICES:
            freq_code = choice[0]
            count = queryset.filter(frequency=freq_code).count()
            frequency_breakdown[freq_code] = count
        
        # Monthly stats for the last 12 months
        monthly_stats = []
        today = timezone.now().date()
        for i in range(12):
            month_start = today.replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_pledges = queryset.filter(
                created_at__date__range=[month_start, month_end]
            )
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_pledges.count(),
                'total_amount': month_pledges.aggregate(
                    total=Sum('amount')
                )['total'] or 0
            })
        
        stats_data = {
            'total_pledges': total_pledges,
            'total_active_pledges': active_pledges,
            'total_pledged_amount': amount_stats['total_pledged'] or 0,
            'total_received_amount': amount_stats['total_received'] or 0,
            'average_pledge_amount': amount_stats['average_amount'] or 0,
            'completion_rate': round(completion_rate, 2),
            'frequency_breakdown': frequency_breakdown,
            'monthly_stats': monthly_stats
        }
        
        serializer = PledgeStatsSerializer(stats_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export pledges to CSV"""
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pledges_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Member Name', 'Email', 'Amount', 'Frequency', 'Status',
            'Start Date', 'End Date', 'Total Pledged', 'Total Received',
            'Completion %', 'Created Date', 'Notes'
        ])
        
        for pledge in queryset:
            writer.writerow([
                pledge.member.get_full_name(),
                pledge.member.email,
                pledge.amount,
                pledge.get_frequency_display(),
                pledge.get_status_display(),
                pledge.start_date,
                pledge.end_date or '',
                pledge.total_pledged,
                pledge.total_received,
                f"{pledge.completion_percentage:.1f}%",
                pledge.created_at.strftime('%Y-%m-%d'),
                pledge.notes
            ])
        
        return response

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a specific pledge"""
        pledge = self.get_object()
        
        serializer = PledgePaymentSerializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save(pledge=pledge)
            
            # Update pledge total_received
            pledge.total_received = pledge.payments.aggregate(
                total=Sum('amount')
            )['total'] or 0
            pledge.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue pledges (active pledges past end date)"""
        today = timezone.now().date()
        overdue_pledges = self.get_queryset().filter(
            status='active',
            end_date__lt=today
        )
        
        serializer = self.get_serializer(overdue_pledges, many=True)
        return Response(serializer.data)


class PledgePaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledge payments
    """
    queryset = PledgePayment.objects.select_related('pledge__member')
    serializer_class = PledgePaymentSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['payment_method', 'pledge']
    search_fields = ['reference_number', 'notes', 'pledge__member__first_name', 'pledge__member__last_name']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def perform_create(self, serializer):
        """Update pledge total when payment is created"""
        payment = serializer.save()
        pledge = payment.pledge
        pledge.total_received = pledge.payments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        pledge.save()

    def perform_destroy(self, instance):
        """Update pledge total when payment is deleted"""
        pledge = instance.pledge
        super().perform_destroy(instance)
        pledge.total_received = pledge.payments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        pledge.save()