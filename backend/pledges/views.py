# pledges/views.py - COMPLETE FIX with all missing actions
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
import csv
import json
from decimal import Decimal

from .models import Pledge, PledgePayment, PledgeReminder
from .serializers import (
    PledgeDetailSerializer, PledgeListSerializer, PledgeCreateUpdateSerializer,
    PledgePaymentSerializer, PledgeStatsSerializer, PledgeSummarySerializer,
    BulkPledgeActionSerializer, PledgeReminderSerializer
)

class PledgeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledges - Complete with all actions
    """
    queryset = Pledge.objects.select_related('member').prefetch_related('payments', 'reminders')
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'frequency', 'member', 'member__gender']
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email', 
        'notes', 'member__phone'
    ]
    ordering_fields = [
        'created_at', 'amount', 'start_date', 'end_date', 
        'total_pledged', 'total_received', 'status'
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return PledgeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PledgeCreateUpdateSerializer
        else:
            return PledgeDetailSerializer

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
            
        # Filter by completion status
        completion_status = self.request.query_params.get('completion_status')
        if completion_status == 'completed':
            queryset = queryset.filter(total_received__gte=F('total_pledged'))
        elif completion_status == 'partial':
            queryset = queryset.filter(
                total_received__gt=0,
                total_received__lt=F('total_pledged')
            )
        elif completion_status == 'none':
            queryset = queryset.filter(total_received=0)
            
        # Filter overdue pledges
        if self.request.query_params.get('overdue') == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                status='active',
                end_date__lt=today
            )
            
        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive pledge statistics - MAIN STATS ENDPOINT"""
        try:
            queryset = self.get_queryset()
            
            # Basic counts
            total_pledges = queryset.count()
            status_counts = queryset.values('status').annotate(count=Count('id'))
            status_breakdown = {item['status']: item['count'] for item in status_counts}
            
            # Amount statistics
            amount_stats = queryset.aggregate(
                total_pledged=Sum('total_pledged'),
                total_received=Sum('total_received'),
                average_amount=Avg('amount')
            )
            
            # Calculate outstanding amount
            outstanding_amount = (amount_stats['total_pledged'] or 0) - (amount_stats['total_received'] or 0)
            
            # Average completion rate
            pledges_with_payments = queryset.exclude(total_pledged=0)
            if pledges_with_payments.exists():
                avg_completion = pledges_with_payments.aggregate(
                    avg_completion=Avg(
                        F('total_received') * 100.0 / F('total_pledged')
                    )
                )['avg_completion'] or 0
            else:
                avg_completion = 0
            
            # Frequency breakdown
            frequency_counts = queryset.values('frequency').annotate(count=Count('id'))
            frequency_breakdown = {item['frequency']: item['count'] for item in frequency_counts}
            
            # Monthly statistics for the last 12 months
            monthly_stats = []
            today = timezone.now().date()
            for i in range(12):
                month_start = today.replace(day=1) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_pledges = queryset.filter(
                    created_at__date__range=[month_start, month_end]
                )
                
                month_payments = PledgePayment.objects.filter(
                    payment_date__range=[month_start, month_end],
                    pledge__in=queryset
                )
                
                monthly_stats.append({
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%B %Y'),
                    'pledges_count': month_pledges.count(),
                    'pledges_amount': month_pledges.aggregate(total=Sum('amount'))['total'] or 0,
                    'payments_count': month_payments.count(),
                    'payments_amount': month_payments.aggregate(total=Sum('amount'))['total'] or 0
                })
            
            # Recent activity (last 30 days)
            thirty_days_ago = today - timedelta(days=30)
            recent_pledges = queryset.filter(created_at__date__gte=thirty_days_ago)
            recent_payments = PledgePayment.objects.filter(
                payment_date__gte=thirty_days_ago,
                pledge__in=queryset
            )
            
            stats_data = {
                'total_pledges': total_pledges,
                'total_active_pledges': status_breakdown.get('active', 0),
                'total_completed_pledges': status_breakdown.get('completed', 0),
                'total_cancelled_pledges': status_breakdown.get('cancelled', 0),
                'total_pledged_amount': amount_stats['total_pledged'] or 0,
                'total_received_amount': amount_stats['total_received'] or 0,
                'outstanding_amount': outstanding_amount,
                'average_pledge_amount': amount_stats['average_amount'] or 0,
                'average_completion_rate': round(avg_completion, 2),
                'frequency_breakdown': frequency_breakdown,
                'status_breakdown': status_breakdown,
                'monthly_stats': monthly_stats,
                'recent_pledges_count': recent_pledges.count(),
                'recent_payments_count': recent_payments.count(),
                'recent_payments_amount': recent_payments.aggregate(total=Sum('amount'))['total'] or 0
            }
            
            serializer = PledgeStatsSerializer(stats_data)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export pledges to CSV with comprehensive data"""
        try:
            queryset = self.get_queryset()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="pledges_export.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Member ID', 'Member Name', 'Email', 'Phone', 'Amount', 'Frequency', 'Status',
                'Start Date', 'End Date', 'Total Pledged', 'Total Received',
                'Completion %', 'Remaining Amount', 'Is Overdue', 'Payment Count',
                'Last Payment Date', 'Created Date', 'Notes'
            ])
            
            for pledge in queryset.select_related('member').prefetch_related('payments'):
                last_payment = pledge.payments.first()
                completion_pct = 0
                if pledge.total_pledged and pledge.total_pledged > 0:
                    completion_pct = (pledge.total_received / pledge.total_pledged) * 100
                
                writer.writerow([
                    str(pledge.member.id),
                    pledge.member.get_full_name() if hasattr(pledge.member, 'get_full_name') else f"{pledge.member.first_name} {pledge.member.last_name}",
                    pledge.member.email,
                    getattr(pledge.member, 'phone', '') or '',
                    pledge.amount,
                    pledge.get_frequency_display(),
                    pledge.get_status_display(),
                    pledge.start_date,
                    pledge.end_date or '',
                    pledge.total_pledged,
                    pledge.total_received,
                    f"{completion_pct:.1f}%",
                    pledge.total_pledged - pledge.total_received,
                    'Yes' if (pledge.end_date and pledge.end_date < timezone.now().date() and pledge.status == 'active') else 'No',
                    pledge.payments.count(),
                    last_payment.payment_date if last_payment else '',
                    pledge.created_at.strftime('%Y-%m-%d %H:%M'),
                    pledge.notes or ''
                ])
            
            return response
        
        except Exception as e:
            return Response(
                {'error': f'Failed to export pledges: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def summary_report(self, request):
        """Get member summary report"""
        try:
            from members.models import Member
            
            members_with_pledges = Member.objects.filter(
                pledge__isnull=False
            ).distinct().prefetch_related('pledge_set__payments')
            
            summary_data = []
            for member in members_with_pledges:
                member_pledges = member.pledge_set.all()
                total_pledged = sum(p.total_pledged for p in member_pledges)
                total_received = sum(p.total_received for p in member_pledges)
                completion_pct = (total_received / total_pledged * 100) if total_pledged > 0 else 0
                
                # Get last payment date
                last_payment = None
                for pledge in member_pledges:
                    pledge_last_payment = pledge.payments.first()
                    if pledge_last_payment and (not last_payment or pledge_last_payment.payment_date > last_payment):
                        last_payment = pledge_last_payment.payment_date
                
                summary_data.append({
                    'member_name': member.get_full_name() if hasattr(member, 'get_full_name') else f"{member.first_name} {member.last_name}",
                    'member_email': member.email,
                    'total_pledged': total_pledged,
                    'total_received': total_received,
                    'completion_percentage': round(completion_pct, 2),
                    'active_pledges': member_pledges.filter(status='active').count(),
                    'last_payment_date': last_payment
                })
            
            serializer = PledgeSummarySerializer(summary_data, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to generate summary report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue pledges"""
        try:
            today = timezone.now().date()
            overdue_pledges = self.get_queryset().filter(
                status='active',
                end_date__lt=today
            )
            
            serializer = PledgeListSerializer(overdue_pledges, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch overdue pledges: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def upcoming_payments(self, request):
        """Get pledges with upcoming payments due"""
        try:
            today = timezone.now().date()
            days_ahead = int(request.query_params.get('days', 30))
            target_date = today + timedelta(days=days_ahead)
            
            # This is a simplified version - you may want to implement more complex logic
            # based on pledge frequency and last payment dates
            upcoming_pledges = self.get_queryset().filter(
                status='active',
                start_date__lte=target_date
            ).filter(
                Q(end_date__gte=today) | Q(end_date__isnull=True)
            )
            
            serializer = PledgeListSerializer(upcoming_pledges, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch upcoming payments: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on multiple pledges"""
        try:
            serializer = BulkPledgeActionSerializer(data=request.data)
            if serializer.is_valid():
                pledge_ids = serializer.validated_data['pledge_ids']
                action = serializer.validated_data['action']
                notes = serializer.validated_data.get('notes', '')
                
                pledges = Pledge.objects.filter(id__in=pledge_ids)
                
                if action == 'activate':
                    pledges.update(status='active')
                elif action == 'pause':
                    pledges.update(status='paused')
                elif action == 'cancel':
                    pledges.update(status='cancelled')
                elif action == 'complete':
                    pledges.update(status='completed')
                elif action == 'send_reminder':
                    # Create reminders for each pledge
                    for pledge in pledges:
                        PledgeReminder.objects.create(
                            pledge=pledge,
                            reminder_type='manual',
                            reminder_method='email',
                            message=notes or f"Reminder for pledge #{pledge.id}",
                            sent_date=timezone.now().date(),
                            sent_by=request.user.get_full_name() if hasattr(request.user, 'get_full_name') else str(request.user)
                        )
                
                return Response({
                    'success': True,
                    'message': f'Bulk action "{action}" completed for {pledges.count()} pledges.',
                    'affected_count': pledges.count()
                })
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to perform bulk action: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a specific pledge"""
        try:
            pledge = self.get_object()
            
            serializer = PledgePaymentSerializer(data=request.data)
            if serializer.is_valid():
                payment = serializer.save(
                    pledge=pledge,
                    recorded_by=request.user.get_full_name() if hasattr(request.user, 'get_full_name') else str(request.user)
                )
                
                # Update pledge totals
                pledge.total_received = pledge.payments.aggregate(total=Sum('amount'))['total'] or 0
                pledge.save(update_fields=['total_received'])
                
                return Response({
                    'payment': serializer.data,
                    'pledge_updated': {
                        'total_received': pledge.total_received,
                        'completion_percentage': (pledge.total_received / pledge.total_pledged * 100) if pledge.total_pledged > 0 else 0,
                        'status': pledge.status
                    }
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to add payment: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def payment_history(self, request, pk=None):
        """Get payment history for a specific pledge"""
        try:
            pledge = self.get_object()
            payments = pledge.payments.all().order_by('-payment_date')
            serializer = PledgePaymentSerializer(payments, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch payment history: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PledgePaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledge payments
    """
    queryset = PledgePayment.objects.select_related('pledge__member')
    serializer_class = PledgePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_method', 'pledge', 'pledge__member', 'pledge__status']
    search_fields = [
        'reference_number', 'notes', 'recorded_by',
        'pledge__member__first_name', 'pledge__member__last_name'
    ]
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def perform_create(self, serializer):
        """Update pledge total when payment is created"""
        payment = serializer.save(
            recorded_by=self.request.user.get_full_name() if hasattr(self.request.user, 'get_full_name') else str(self.request.user)
        )
        # Update pledge totals
        pledge = payment.pledge
        pledge.total_received = pledge.payments.aggregate(total=Sum('amount'))['total'] or 0
        pledge.save(update_fields=['total_received'])

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get payment statistics"""
        try:
            queryset = self.get_queryset()
            
            # Basic statistics
            total_payments = queryset.count()
            total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
            average_amount = queryset.aggregate(avg=Avg('amount'))['avg'] or 0
            
            # Payment method breakdown
            method_breakdown = {}
            if hasattr(PledgePayment, 'PAYMENT_METHOD_CHOICES'):
                for choice in PledgePayment.PAYMENT_METHOD_CHOICES:
                    method_code = choice[0]
                    count = queryset.filter(payment_method=method_code).count()
                    amount = queryset.filter(payment_method=method_code).aggregate(
                        total=Sum('amount')
                    )['total'] or 0
                    method_breakdown[method_code] = {
                        'count': count,
                        'amount': amount,
                        'display': choice[1]
                    }
            
            return Response({
                'total_payments': total_payments,
                'total_amount': total_amount,
                'average_amount': round(average_amount, 2),
                'payment_method_breakdown': method_breakdown,
            })
        
        except Exception as e:
            return Response(
                {'error': f'Failed to calculate payment statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export payments to CSV"""
        try:
            queryset = self.get_queryset()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="payments_export.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Payment ID', 'Pledge ID', 'Member Name', 'Amount', 'Payment Date',
                'Payment Method', 'Reference Number', 'Notes', 'Recorded By', 'Created Date'
            ])
            
            for payment in queryset.select_related('pledge__member'):
                writer.writerow([
                    str(payment.id),
                    str(payment.pledge.id),
                    payment.pledge.member.get_full_name() if hasattr(payment.pledge.member, 'get_full_name') else f"{payment.pledge.member.first_name} {payment.pledge.member.last_name}",
                    payment.amount,
                    payment.payment_date,
                    payment.get_payment_method_display() if hasattr(payment, 'get_payment_method_display') else payment.payment_method,
                    payment.reference_number or '',
                    payment.notes or '',
                    payment.recorded_by or '',
                    payment.created_at.strftime('%Y-%m-%d %H:%M')
                ])
            
            return response
        
        except Exception as e:
            return Response(
                {'error': f'Failed to export payments: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PledgeReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledge reminders
    """
    queryset = PledgeReminder.objects.select_related('pledge__member')
    serializer_class = PledgeReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['reminder_type', 'reminder_method', 'pledge']
    search_fields = ['message', 'sent_by', 'pledge__member__first_name', 'pledge__member__last_name']
    ordering_fields = ['sent_date', 'created_at']
    ordering = ['-sent_date']

    def perform_create(self, serializer):
        """Set sent_by to current user when creating reminder"""
        serializer.save(
            sent_by=self.request.user.get_full_name() if hasattr(self.request.user, 'get_full_name') else str(self.request.user)
        )