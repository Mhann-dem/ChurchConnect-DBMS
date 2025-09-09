# pledges/views.py - COMPLETE FIX with missing recent endpoint and trends
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
import logging

logger = logging.getLogger(__name__)

from .models import Pledge, PledgePayment, PledgeReminder
from .serializers import (
    PledgeDetailSerializer, PledgeListSerializer, PledgeCreateUpdateSerializer,
    PledgePaymentSerializer, PledgeStatsSerializer, PledgeSummarySerializer,
    BulkPledgeActionSerializer, PledgeReminderSerializer
)

class PledgeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledges - Complete with all actions including recent
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

    # FIXED: Added missing recent endpoint
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently created pledges"""
        try:
            limit = int(request.query_params.get('limit', 10))
            logger.info(f"[PledgeViewSet] Recent pledges request from: {request.user.email}, limit: {limit}")
            
            recent_pledges = Pledge.objects.select_related('member').order_by('-created_at')[:limit]
            serializer = PledgeListSerializer(recent_pledges, many=True)
            
            logger.info(f"[PledgeViewSet] Returning {len(serializer.data)} recent pledges")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error getting recent pledges: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get recent pledges'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # FIXED: Added missing trends endpoint
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get pledge trends over time"""
        try:
            range_param = request.query_params.get('range', '12m')
            logger.info(f"[PledgeViewSet] Trends request for range: {range_param} from: {request.user.email}")
            
            # Parse range parameter
            if range_param.endswith('m'):
                months = int(range_param[:-1])
                start_date = timezone.now().date() - timedelta(days=months * 30)
            elif range_param.endswith('d'):
                days = int(range_param[:-1])
                start_date = timezone.now().date() - timedelta(days=days)
            else:
                months = 12
                start_date = timezone.now().date() - timedelta(days=months * 30)
            
            # Get trends data
            trends_data = []
            current_date = start_date
            today = timezone.now().date()
            
            while current_date <= today:
                month_end = current_date.replace(day=28) + timedelta(days=4)
                month_end = month_end - timedelta(days=month_end.day)
                
                # Pledges created this month
                month_pledges = Pledge.objects.filter(
                    created_at__date__range=[current_date, month_end]
                )
                
                # Payments made this month
                month_payments = PledgePayment.objects.filter(
                    payment_date__range=[current_date, month_end]
                )
                
                trends_data.append({
                    'month': current_date.strftime('%Y-%m'),
                    'month_name': current_date.strftime('%B %Y'),
                    'pledges_count': month_pledges.count(),
                    'pledges_amount': month_pledges.aggregate(total=Sum('amount'))['total'] or 0,
                    'payments_count': month_payments.count(),
                    'payments_amount': month_payments.aggregate(total=Sum('amount'))['total'] or 0,
                    'avg_pledge_amount': month_pledges.aggregate(avg=Avg('amount'))['avg'] or 0
                })
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            logger.info(f"[PledgeViewSet] Returning trends data with {len(trends_data)} months")
            
            return Response({
                'results': trends_data,
                'range': range_param,
                'start_date': start_date,
                'end_date': today
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error getting trends: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get pledge trends'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive pledge statistics - MAIN STATS ENDPOINT"""
        try:
            logger.info(f"[PledgeViewSet] Statistics request from: {request.user.email}")
            
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
            
            # Recent activity (last 30 days)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            recent_pledges = queryset.filter(created_at__date__gte=thirty_days_ago)
            recent_payments = PledgePayment.objects.filter(
                payment_date__gte=thirty_days_ago,
                pledge__in=queryset
            )
            
            stats_data = {
                'summary': {
                    'total_pledges': total_pledges,
                    'active_pledges': status_breakdown.get('active', 0),
                    'completed_pledges': status_breakdown.get('completed', 0),
                    'cancelled_pledges': status_breakdown.get('cancelled', 0),
                    'total_pledged_amount': amount_stats['total_pledged'] or 0,
                    'total_received_amount': amount_stats['total_received'] or 0,
                    'outstanding_amount': outstanding_amount,
                    'average_pledge_amount': amount_stats['average_amount'] or 0,
                    'average_completion_rate': round(avg_completion, 2),
                    'recent_pledges_count': recent_pledges.count(),
                    'recent_payments_count': recent_payments.count(),
                    'recent_payments_amount': recent_payments.aggregate(total=Sum('amount'))['total'] or 0
                },
                'breakdown': {
                    'status': status_breakdown,
                    'frequency': frequency_breakdown
                }
            }
            
            logger.info(f"[PledgeViewSet] Statistics returned successfully")
            
            return Response(stats_data)
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error calculating statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to calculate statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export pledges to CSV with comprehensive data"""
        try:
            logger.info(f"[PledgeViewSet] Export request from: {request.user.email}")
            
            queryset = self.get_queryset()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="pledges_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
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
                    f"{pledge.member.first_name} {pledge.member.last_name}",
                    pledge.member.email,
                    getattr(pledge.member, 'phone', '') or '',
                    pledge.amount,
                    pledge.get_frequency_display() if hasattr(pledge, 'get_frequency_display') else pledge.frequency,
                    pledge.get_status_display() if hasattr(pledge, 'get_status_display') else pledge.status,
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
            
            logger.info(f"[PledgeViewSet] Export completed with {queryset.count()} records")
            
            return response
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error exporting pledges: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to export pledges: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def summary_report(self, request):
        """Get member summary report"""
        try:
            logger.info(f"[PledgeViewSet] Summary report request from: {request.user.email}")
            
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
                    'member_name': f"{member.first_name} {member.last_name}",
                    'member_email': member.email,
                    'total_pledged': total_pledged,
                    'total_received': total_received,
                    'completion_percentage': round(completion_pct, 2),
                    'active_pledges': member_pledges.filter(status='active').count(),
                    'last_payment_date': last_payment
                })
            
            logger.info(f"[PledgeViewSet] Summary report generated for {len(summary_data)} members")
            
            return Response({
                'results': summary_data,
                'count': len(summary_data)
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error generating summary report: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to generate summary report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue pledges"""
        try:
            logger.info(f"[PledgeViewSet] Overdue pledges request from: {request.user.email}")
            
            today = timezone.now().date()
            overdue_pledges = self.get_queryset().filter(
                status='active',
                end_date__lt=today
            )
            
            serializer = PledgeListSerializer(overdue_pledges, many=True)
            
            logger.info(f"[PledgeViewSet] Found {overdue_pledges.count()} overdue pledges")
            
            return Response({
                'results': serializer.data,
                'count': overdue_pledges.count()
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching overdue pledges: {str(e)}", exc_info=True)
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
            
            logger.info(f"[PledgeViewSet] Upcoming payments request for {days_ahead} days from: {request.user.email}")
            
            # Get active pledges that are not overdue
            upcoming_pledges = self.get_queryset().filter(
                status='active',
                start_date__lte=target_date
            ).filter(
                Q(end_date__gte=today) | Q(end_date__isnull=True)
            )
            
            serializer = PledgeListSerializer(upcoming_pledges, many=True)
            
            logger.info(f"[PledgeViewSet] Found {upcoming_pledges.count()} pledges with upcoming payments")
            
            return Response({
                'results': serializer.data,
                'count': upcoming_pledges.count(),
                'days_ahead': days_ahead
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching upcoming payments: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to fetch upcoming payments: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on multiple pledges"""
        try:
            action = request.data.get('action')
            pledge_ids = request.data.get('pledge_ids', [])
            notes = request.data.get('notes', '')
            
            logger.info(f"[PledgeViewSet] Bulk action '{action}' for {len(pledge_ids)} pledges from: {request.user.email}")
            
            if not action or not pledge_ids:
                return Response(
                    {'error': 'Action and pledge_ids are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pledges = Pledge.objects.filter(id__in=pledge_ids)
            actual_count = pledges.count()
            
            if actual_count != len(pledge_ids):
                logger.warning(f"[PledgeViewSet] Some pledge IDs not found: requested {len(pledge_ids)}, found {actual_count}")
            
            result_message = ""
            
            if action == 'activate':
                pledges.update(status='active')
                result_message = f"Successfully activated {actual_count} pledges"
            elif action == 'pause':
                pledges.update(status='paused')
                result_message = f"Successfully paused {actual_count} pledges"
            elif action == 'cancel':
                pledges.update(status='cancelled')
                result_message = f"Successfully cancelled {actual_count} pledges"
            elif action == 'complete':
                pledges.update(status='completed')
                result_message = f"Successfully completed {actual_count} pledges"
            elif action == 'send_reminder':
                # Create reminders for each pledge
                reminder_count = 0
                for pledge in pledges:
                    PledgeReminder.objects.create(
                        pledge=pledge,
                        reminder_type='manual',
                        reminder_method='email',
                        message=notes or f"Reminder for pledge #{pledge.id}",
                        sent_date=timezone.now().date(),
                        sent_by=str(request.user)
                    )
                    reminder_count += 1
                result_message = f"Successfully created {reminder_count} reminders"
            else:
                return Response(
                    {'error': f'Unknown action: {action}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"[PledgeViewSet] Bulk action completed: {result_message}")
            
            return Response({
                'success': True,
                'message': result_message,
                'processed_count': actual_count
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error in bulk action: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to perform bulk action: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a specific pledge"""
        try:
            pledge = self.get_object()
            logger.info(f"[PledgeViewSet] Add payment to pledge {pk} from: {request.user.email}")
            
            serializer = PledgePaymentSerializer(data=request.data)
            if serializer.is_valid():
                payment = serializer.save(
                    pledge=pledge,
                    recorded_by=str(request.user)
                )
                
                # Update pledge totals
                pledge.total_received = pledge.payments.aggregate(total=Sum('amount'))['total'] or 0
                pledge.save(update_fields=['total_received'])
                
                logger.info(f"[PledgeViewSet] Payment added successfully: ${payment.amount}")
                
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
            logger.error(f"[PledgeViewSet] Error adding payment: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to add payment: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def payment_history(self, request, pk=None):
        """Get payment history for a specific pledge"""
        try:
            pledge = self.get_object()
            logger.info(f"[PledgeViewSet] Payment history request for pledge {pk} from: {request.user.email}")
            
            payments = pledge.payments.all().order_by('-payment_date')
            serializer = PledgePaymentSerializer(payments, many=True)
            
            logger.info(f"[PledgeViewSet] Returning {payments.count()} payments")
            
            return Response({
                'results': serializer.data,
                'count': payments.count()
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching payment history: {str(e)}", exc_info=True)
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
        payment = serializer.save(recorded_by=str(self.request.user))
        # Update pledge totals
        pledge = payment.pledge
        pledge.total_received = pledge.payments.aggregate(total=Sum('amount'))['total'] or 0
        pledge.save(update_fields=['total_received'])

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get payment statistics"""
        try:
            logger.info(f"[PledgePaymentViewSet] Statistics request from: {request.user.email}")
            
            queryset = self.get_queryset()
            
            # Basic statistics
            total_payments = queryset.count()
            total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
            average_amount = queryset.aggregate(avg=Avg('amount'))['avg'] or 0
            
            # Payment method breakdown
            method_breakdown = {}
            method_counts = queryset.values('payment_method').annotate(
                count=Count('id'),
                total_amount=Sum('amount')
            )
            
            for item in method_counts:
                method_breakdown[item['payment_method']] = {
                    'count': item['count'],
                    'amount': item['total_amount'] or 0
                }
            
            return Response({
                'summary': {
                    'total_payments': total_payments,
                    'total_amount': total_amount,
                    'average_amount': round(average_amount, 2)
                },
                'breakdown': {
                    'payment_methods': method_breakdown
                }
            })
        
        except Exception as e:
            logger.error(f"[PledgePaymentViewSet] Error calculating statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to calculate payment statistics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export payments to CSV"""
        try:
            logger.info(f"[PledgePaymentViewSet] Export request from: {request.user.email}")
            
            queryset = self.get_queryset()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="payments_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Payment ID', 'Pledge ID', 'Member Name', 'Amount', 'Payment Date',
                'Payment Method', 'Reference Number', 'Notes', 'Recorded By', 'Created Date'
            ])
            
            for payment in queryset.select_related('pledge__member'):
                writer.writerow([
                    str(payment.id),
                    str(payment.pledge.id),
                    f"{payment.pledge.member.first_name} {payment.pledge.member.last_name}",
                    payment.amount,
                    payment.payment_date,
                    payment.payment_method,
                    payment.reference_number or '',
                    payment.notes or '',
                    payment.recorded_by or '',
                    payment.created_at.strftime('%Y-%m-%d %H:%M')
                ])
            
            logger.info(f"[PledgePaymentViewSet] Export completed with {queryset.count()} records")
            
            return response
        
        except Exception as e:
            logger.error(f"[PledgePaymentViewSet] Error exporting payments: {str(e)}", exc_info=True)
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
        serializer.save(sent_by=str(self.request.user))