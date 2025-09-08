# backend/churchconnect/events/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Event, EventRegistration, EventReminder
from .serializers import (
    EventSerializer, EventListSerializer, EventCalendarSerializer,
    EventRegistrationSerializer, EventReminderSerializer
)
from members.models import Member

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'calendar':
            return EventCalendarSerializer
        return EventSerializer

    def get_queryset(self):
        queryset = Event.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(start_datetime__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_datetime__lte=end_date)
        
        # Filter upcoming events
        if self.request.query_params.get('upcoming') == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())
        
        # Filter past events
        if self.request.query_params.get('past') == 'true':
            queryset = queryset.filter(end_datetime__lt=timezone.now())
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search) |
                Q(organizer__icontains=search)
            )
        
        return queryset.order_by('start_datetime')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.email)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get events in calendar format"""
        queryset = self.get_queryset()
        serializer = EventCalendarSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events"""
        days_ahead = int(request.query_params.get('days', 30))
        end_date = timezone.now() + timedelta(days=days_ahead)
        
        queryset = Event.objects.filter(
            start_datetime__gte=timezone.now(),
            start_datetime__lte=end_date,
            status='published'
        ).order_by('start_datetime')
        
        serializer = EventListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register a member for an event"""
        event = self.get_object()
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create registration
        registration_data = {
            'event': event.id,
            'member_id': member_id,
            'notes': request.data.get('notes', ''),
            'dietary_requirements': request.data.get('dietary_requirements', ''),
            'emergency_contact': request.data.get('emergency_contact', ''),
        }
        
        serializer = EventRegistrationSerializer(data=registration_data)
        if serializer.is_valid():
            registration = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all registrations for an event"""
        event = self.get_object()
        registrations = event.registrations.all().order_by('registration_date')
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get event statistics"""
        now = timezone.now()
        
        # Basic counts
        total_events = Event.objects.count()
        upcoming_events = Event.objects.filter(start_datetime__gte=now).count()
        past_events = Event.objects.filter(end_datetime__lt=now).count()
        
        # Events by status
        status_counts = Event.objects.values('status').annotate(count=Count('id'))
        
        # Events by type
        type_counts = Event.objects.values('event_type').annotate(count=Count('id'))
        
        # Recent registrations (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        recent_registrations = EventRegistration.objects.filter(
            registration_date__gte=thirty_days_ago
        ).count()
        
        return Response({
            'summary': {
                'total_events': total_events,
                'upcoming_events': upcoming_events,
                'past_events': past_events,
                'recent_registrations': recent_registrations,
            },
            'by_status': {item['status']: item['count'] for item in status_counts},
            'by_type': {item['event_type']: item['count'] for item in type_counts},
        })


class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = EventRegistration.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by member
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-registration_date')

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a registration"""
        registration = self.get_object()
        registration.status = 'confirmed'
        registration.save()
        
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a registration"""
        registration = self.get_object()
        registration.status = 'cancelled'
        registration.save()
        
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_attended(self, request, pk=None):
        """Mark as attended"""
        registration = self.get_object()
        registration.status = 'attended'
        registration.save()
        
        serializer = self.get_serializer(registration)
        return Response(serializer.data)


class EventReminderViewSet(viewsets.ModelViewSet):
    queryset = EventReminder.objects.all()
    serializer_class = EventReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = EventReminder.objects.all()
        
        # Filter by event
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset.order_by('send_at')