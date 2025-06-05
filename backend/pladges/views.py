from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pledge
from .serializers import (
    PledgeSerializer,
    PledgeCreateSerializer,
    PledgeStatsSerializer
)
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth

class PledgeViewSet(viewsets.ModelViewSet):
    queryset = Pledge.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['frequency', 'status', 'member']
    search_fields = ['member__first_name', 'member__last_name', 'notes']
    ordering_fields = ['amount', 'start_date', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return PledgeCreateSerializer
        return PledgeSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        status_counts = queryset.values('status').annotate(count=Count('id'))
        frequency_counts = queryset.values('frequency').annotate(count=Count('id'))
        
        stats = {
            'total_amount': total_amount,
            'active_count': queryset.filter(status='active').count(),
            'completed_count': queryset.filter(status='completed').count(),
            'by_frequency': {item['frequency']: item['count'] for item in frequency_counts},
            'by_status': {item['status']: item['count'] for item in status_counts},
        }
        
        serializer = PledgeStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        pledge = self.get_object()
        pledge.status = 'completed'
        pledge.save()
        return Response({'status': 'pledge marked as completed'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        pledge = self.get_object()
        pledge.status = 'cancelled'
        pledge.save()
        return Response({'status': 'pledge cancelled'})