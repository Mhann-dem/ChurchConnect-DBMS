# pledges/views.py - ENHANCED VERSION with missing endpoints and better error handling
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum, Avg, F
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

    def create(self, request, *args, **kwargs):
        """Enhanced create with better response formatting"""
        try:
            logger.info(f"[PledgeViewSet] Create request from: {request.user.email}")
            logger.debug(f"[PledgeViewSet] Create data: {request.data}")
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                pledge = serializer.save()
                
                # Return detailed response
                response_serializer = PledgeDetailSerializer(pledge)
                logger.info(f"[PledgeViewSet] Pledge created successfully: ID {pledge.id}")
                
                return Response({
                    'success': True,
                    'message': 'Pledge created successfully',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"[PledgeViewSet] Create validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"[PledgeViewSet] Create error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to create pledge: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Enhanced update with better response formatting"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            logger.info(f"[PledgeViewSet] Update request for pledge {instance.id} from: {request.user.email}")
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                pledge = serializer.save()
                
                response_serializer = PledgeDetailSerializer(pledge)
                logger.info(f"[PledgeViewSet] Pledge updated successfully: ID {pledge.id}")
                
                return Response({
                    'success': True,
                    'message': 'Pledge updated successfully',
                    'data': response_serializer.data
                })
            else:
                logger.warning(f"[PledgeViewSet] Update validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"[PledgeViewSet] Update error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to update pledge: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """Enhanced delete with better response formatting"""
        try:
            instance = self.get_object()
            pledge_id = instance.id
            
            logger.info(f"[PledgeViewSet] Delete request for pledge {pledge_id} from: {request.user.email}")
            
            instance.delete()
            
            logger.info(f"[PledgeViewSet] Pledge deleted successfully: ID {pledge_id}")
            
            return Response({
                'success': True,
                'message': 'Pledge deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Delete error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to delete pledge: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error getting recent pledges: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get recent pledges'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                    'pledges_amount': float(month_pledges.aggregate(total=Sum('amount'))['total'] or 0),
                    'payments_count': month_payments.count(),
                    'payments_amount': float(month_payments.aggregate(total=Sum('amount'))['total'] or 0),
                    'avg_pledge_amount': float(month_pledges.aggregate(avg=Avg('amount'))['avg'] or 0)
                })
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            logger.info(f"[PledgeViewSet] Returning trends data with {len(trends_data)} months")
            
            return Response({
                'success': True,
                'results': trends_data,
                'range': range_param,
                'start_date': start_date,
                'end_date': today
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error getting trends: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get pledge trends'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive pledge statistics - MAIN STATS ENDPOINT"""
        try:
            logger.info(f"[PledgeViewSet] Statistics request from: {request.user.email}")
            
            queryset = self.get_queryset()
            
            # Basic counts
            total_pledges = queryset.count()
            active_pledges = queryset.filter(status='active').count()
            completed_pledges = queryset.filter(status='completed').count()
            cancelled_pledges = queryset.filter(status='cancelled').count()
            
            # Status breakdown
            status_counts = queryset.values('status').annotate(count=Count('id'))
            status_breakdown = {item['status']: item['count'] for item in status_counts}
            
            # Amount statistics
            amount_stats = queryset.aggregate(
                total_pledged=Sum('total_pledged'),
                total_received=Sum('total_received'),
                average_amount=Avg('amount')
            )
            
            # Convert Decimal to float for JSON serialization
            total_pledged = float(amount_stats['total_pledged'] or 0)
            total_received = float(amount_stats['total_received'] or 0)
            average_pledge = float(amount_stats['average_amount'] or 0)
            
            # Calculate outstanding amount
            outstanding_amount = total_pledged - total_received
            
            # Fulfillment rate calculation
            fulfillment_rate = 0
            if total_pledged > 0:
                fulfillment_rate = (total_received / total_pledged) * 100
            
            # Frequency breakdown
            frequency_counts = queryset.values('frequency').annotate(
                count=Count('id'),
                total_amount=Sum('amount'),
                avg_amount=Avg('amount')
            )
            frequency_breakdown = {}
            for item in frequency_counts:
                frequency_breakdown[item['frequency']] = {
                    'count': item['count'],
                    'amount': float(item['total_amount'] or 0),
                    'avg_amount': float(item['avg_amount'] or 0)
                }
            
            # Recent activity (last 30 days)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            recent_pledges = queryset.filter(created_at__date__gte=thirty_days_ago)
            recent_payments = PledgePayment.objects.filter(
                payment_date__gte=thirty_days_ago,
                pledge__in=queryset
            )
            
            # This month's activity
            first_of_month = timezone.now().date().replace(day=1)
            this_month_received = float(
                recent_payments.filter(
                    payment_date__gte=first_of_month
                ).aggregate(total=Sum('amount'))['total'] or 0
            )
            
            # Calculate target (average of last 3 months)
            three_months_ago = timezone.now().date() - timedelta(days=90)
            avg_monthly = float(
                PledgePayment.objects.filter(
                    payment_date__gte=three_months_ago,
                    pledge__in=queryset
                ).aggregate(total=Sum('amount'))['total'] or 0
            ) / 3
            
            # Overdue pledges
            today = timezone.now().date()
            overdue_amount = float(
                queryset.filter(
                    status='active',
                    end_date__lt=today
                ).aggregate(total=Sum('amount'))['total'] or 0
            )
            
            # Top pledgers (members with highest total pledged)
            from members.models import Member
            top_pledgers_data = Member.objects.filter(
                pledges__in=queryset
            ).annotate(
                total_pledged=Sum('pledges__total_pledged'),
                total_received=Sum('pledges__total_received'),
                pledge_count=Count('pledges')
            ).order_by('-total_pledged')[:10]
            
            top_pledgers = []
            for member in top_pledgers_data:
                fulfillment = 0
                if member.total_pledged and member.total_pledged > 0:
                    fulfillment = (float(member.total_received or 0) / float(member.total_pledged)) * 100
                
                top_pledgers.append({
                    'id': member.id,
                    'name': f"{member.first_name} {member.last_name}",
                    'email': member.email,
                    'total_pledged': float(member.total_pledged or 0),
                    'total_received': float(member.total_received or 0),
                    'fulfillment_rate': fulfillment,
                    'pledge_count': member.pledge_count
                })
            
            # Monthly trends for the last 12 months
            monthly_trends = []
            for i in range(12):
                month_start = (timezone.now().date().replace(day=1) - timedelta(days=i*30)).replace(day=1)
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
                else:
                    month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
                
                month_pledges = queryset.filter(created_at__date__range=[month_start, month_end])
                month_payments = PledgePayment.objects.filter(
                    payment_date__range=[month_start, month_end],
                    pledge__in=queryset
                )
                
                monthly_trends.insert(0, {
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%B %Y'),
                    'amount': float(month_pledges.aggregate(total=Sum('amount'))['total'] or 0),
                    'count': month_pledges.count(),
                    'payments_amount': float(month_payments.aggregate(total=Sum('amount'))['total'] or 0),
                    'payments_count': month_payments.count()
                })
            
            stats_data = {
                # Basic summary stats
                'total_pledged': total_pledged,
                'total_received': total_received,
                'active_pledges': active_pledges,
                'completed_pledges': completed_pledges,
                'cancelled_pledges': cancelled_pledges,
                'average_pledge': average_pledge,
                'fulfillment_rate': fulfillment_rate,
                'projected_annual': total_received * 12 if total_received > 0 else 0,
                'overdue_amount': overdue_amount,
                'upcoming_pledges': active_pledges,  # Simplified - could be more specific
                'this_month_received': this_month_received,
                'this_month_target': avg_monthly,
                'payments_count': recent_payments.count(),
                
                # Breakdown data
                'pledges_by_frequency': frequency_breakdown,
                'monthly_trends': monthly_trends,
                'top_pledgers': top_pledgers,
                
                # Legacy compatibility
                'summary': {
                    'total_pledges': total_pledges,
                    'active_pledges': active_pledges,
                    'completed_pledges': completed_pledges,
                    'cancelled_pledges': cancelled_pledges,
                    'total_pledged_amount': total_pledged,
                    'total_received_amount': total_received,
                    'outstanding_amount': outstanding_amount,
                    'average_pledge_amount': average_pledge,
                    'average_completion_rate': fulfillment_rate,
                    'recent_pledges_count': recent_pledges.count(),
                    'recent_payments_count': recent_payments.count(),
                    'recent_payments_amount': float(recent_payments.aggregate(total=Sum('amount'))['total'] or 0)
                },
                'breakdown': {
                    'status': status_breakdown,
                    'frequency': frequency_breakdown
                }
            }
            
            logger.info(f"[PledgeViewSet] Statistics returned successfully")
            
            return Response({
                'success': True,
                **stats_data
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error calculating statistics: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to calculate statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # NEW: Bulk update endpoint
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple pledges"""
        try:
            pledge_ids = request.data.get('pledge_ids', [])
            updates = request.data.get('updates', {})
            
            if not pledge_ids:
                return Response({
                    'success': False,
                    'error': 'No pledge IDs provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            pledges = Pledge.objects.filter(id__in=pledge_ids)
            updated_count = pledges.update(**updates)
            
            logger.info(f"[PledgeViewSet] Bulk updated {updated_count} pledges")
            
            return Response({
                'success': True,
                'message': f'Successfully updated {updated_count} pledges',
                'updated_count': updated_count
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Bulk update error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Bulk update failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # NEW: Bulk delete endpoint
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple pledges"""
        try:
            pledge_ids = request.data.get('pledge_ids', [])
            
            if not pledge_ids:
                return Response({
                    'success': False,
                    'error': 'No pledge IDs provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            pledges = Pledge.objects.filter(id__in=pledge_ids)
            deleted_count = pledges.count()
            pledges.delete()
            
            logger.info(f"[PledgeViewSet] Bulk deleted {deleted_count} pledges")
            
            return Response({
                'success': True,
                'message': f'Successfully deleted {deleted_count} pledges',
                'deleted_count': deleted_count
            })
            
        except Exception as e:
            logger.error(f"[PledgeViewSet] Bulk delete error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Bulk delete failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return Response({
                'success': False,
                'error': f'Failed to export pledges: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def summary_report(self, request):
        """Get member summary report"""
        try:
            logger.info(f"[PledgeViewSet] Summary report request from: {request.user.email}")
            
            from members.models import Member
            
            members_with_pledges = Member.objects.filter(
                pledges__isnull=False
            ).distinct().prefetch_related('pledge_set__payments')
            
            summary_data = []
            for member in members_with_pledges:
                member_pledges = member.pledge_set.all()
                total_pledged = sum(float(p.total_pledged) for p in member_pledges)
                total_received = sum(float(p.total_received) for p in member_pledges)
                completion_pct = (total_received / total_pledged * 100) if total_pledged > 0 else 0
                
                # Get last payment date
                last_payment = None
                for pledge in member_pledges:
                    pledge_last_payment = pledge.payments.first()
                    if pledge_last_payment and (not last_payment or pledge_last_payment.payment_date > last_payment):
                        last_payment = pledge_last_payment.payment_date
                
                summary_data.append({
                    'member_id': member.id,
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
                'success': True,
                'results': summary_data,
                'count': len(summary_data)
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error generating summary report: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to generate summary report: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                'success': True,
                'results': serializer.data,
                'count': overdue_pledges.count()
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching overdue pledges: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to fetch overdue pledges: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                'success': True,
                'results': serializer.data,
                'count': upcoming_pledges.count(),
                'days_ahead': days_ahead
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching upcoming payments: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to fetch upcoming payments'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on multiple pledges"""
        try:
            action = request.data.get('action')
            pledge_ids = request.data.get('pledge_ids', [])
            updates = request.data.get('updates', {})
            notes = request.data.get('notes', '')
            
            logger.info(f"[PledgeViewSet] Bulk action '{action}' for {len(pledge_ids)} pledges from: {request.user.email}")
            
            if not action or not pledge_ids:
                return Response({
                    'success': False,
                    'error': 'Action and pledge_ids are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            pledges = Pledge.objects.filter(id__in=pledge_ids)
            actual_count = pledges.count()
            
            if actual_count != len(pledge_ids):
                logger.warning(f"[PledgeViewSet] Some pledge IDs not found: requested {len(pledge_ids)}, found {actual_count}")
            
            result_message = ""
            
            if action == 'bulk_update':
                pledges.update(**updates)
                result_message = f"Successfully updated {actual_count} pledges"
            elif action == 'delete':
                pledges.delete()
                result_message = f"Successfully deleted {actual_count} pledges"
            elif action == 'activate':
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
                return Response({
                    'success': False,
                    'error': f'Unknown action: {action}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"[PledgeViewSet] Bulk action completed: {result_message}")
            
            return Response({
                'success': True,
                'message': result_message,
                'processed_count': actual_count
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error in bulk action: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to perform bulk action: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                    'success': True,
                    'message': 'Payment added successfully',
                    'payment': serializer.data,
                    'pledge_updated': {
                        'total_received': float(pledge.total_received),
                        'completion_percentage': (float(pledge.total_received) / float(pledge.total_pledged) * 100) if pledge.total_pledged > 0 else 0,
                        'status': pledge.status
                    }
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'error': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error adding payment: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to add payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                'success': True,
                'results': serializer.data,
                'count': payments.count()
            })
        
        except Exception as e:
            logger.error(f"[PledgeViewSet] Error fetching payment history: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to fetch payment history: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ADD THESE VIEWSETS TO YOUR EXISTING pledges/views.py file

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
                    'amount': float(item['total_amount'] or 0)
                }
            
            return Response({
                'success': True,
                'summary': {
                    'total_payments': total_payments,
                    'total_amount': float(total_amount),
                    'average_amount': float(average_amount)
                },
                'breakdown': {
                    'payment_methods': method_breakdown
                }
            })
        
        except Exception as e:
            logger.error(f"[PledgePaymentViewSet] Error calculating statistics: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to calculate payment statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            
            for payment in queryset.select_related('pledges__member'):
                writer.writerow([
                    str(payment.id),
                    str(payment.pledge.id),
                    f"{payment.pledge.member.first_name} {payment.pledge.member.last_name}",
                    float(payment.amount),
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
            return Response({
                'success': False,
                'error': f'Failed to export payments: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PledgeReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pledge reminders
    """
    queryset = PledgeReminder.objects.select_related('pledges__member')
    serializer_class = PledgeReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['reminder_type', 'reminder_method', 'pledge']
    search_fields = ['message', 'sent_by', 'pledges__member__first_name', 'pledges__member__last_name']
    ordering_fields = ['sent_date', 'created_at']
    ordering = ['-sent_date']

    def perform_create(self, serializer):
        """Set sent_by to current user when creating reminder"""
        serializer.save(sent_by=str(self.request.user))

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get reminder statistics"""
        try:
            queryset = self.get_queryset()
            
            # Basic statistics
            total_reminders = queryset.count()
            
            # Reminder type breakdown
            type_breakdown = {}
            type_counts = queryset.values('reminder_type').annotate(count=Count('id'))
            
            for item in type_counts:
                type_breakdown[item['reminder_type']] = item['count']
            
            # Method breakdown
            method_breakdown = {}
            method_counts = queryset.values('reminder_method').annotate(count=Count('id'))
            
            for item in method_counts:
                method_breakdown[item['reminder_method']] = item['count']
            
            return Response({
                'success': True,
                'summary': {
                    'total_reminders': total_reminders
                },
                'breakdown': {
                    'reminder_types': type_breakdown,
                    'reminder_methods': method_breakdown
                }
            })
        
        except Exception as e:
            logger.error(f"[PledgeReminderViewSet] Error calculating statistics: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to calculate reminder statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_bulk_reminders(self, request):
        """Send reminders for multiple pledges"""
        try:
            pledge_ids = request.data.get('pledge_ids', [])
            message = request.data.get('message', 'Pledge reminder')
            reminder_method = request.data.get('method', 'email')
            
            if not pledge_ids:
                return Response({
                    'success': False,
                    'error': 'No pledge IDs provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reminders_created = 0
            for pledge_id in pledge_ids:
                try:
                    pledge = Pledge.objects.get(id=pledge_id)
                    PledgeReminder.objects.create(
                        pledge=pledge,
                        reminder_type='manual',
                        reminder_method=reminder_method,
                        message=message,
                        sent_date=timezone.now().date(),
                        sent_by=str(request.user)
                    )
                    reminders_created += 1
                except Pledge.DoesNotExist:
                    continue
            
            return Response({
                'success': True,
                'message': f'Created {reminders_created} reminders',
                'reminders_created': reminders_created
            })
        
        except Exception as e:
            logger.error(f"[PledgeReminderViewSet] Error sending bulk reminders: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Failed to send bulk reminders: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)