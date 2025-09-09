# events/views.py - COMPLETE Events views for ChurchConnect
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
import csv
import logging

# Import DjangoFilterBackend from django-filter package
try:
    from django_filters.rest_framework import DjangoFilterBackend
except ImportError:
    # Fallback if django-filter is not installed
    DjangoFilterBackend = None

from .models import Event, EventRegistration, EventReminder, EventCategory, EventVolunteer
from .serializers import (
    EventSerializer, EventListSerializer, EventCalendarSerializer,
    EventCreateUpdateSerializer, EventRegistrationSerializer, EventReminderSerializer,
    EventCategorySerializer, EventVolunteerSerializer, EventStatsSerializer,
    EventExportSerializer, EventRegistrationExportSerializer, BulkEventActionSerializer
)
from members.models import Member

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing events with comprehensive functionality
    """
    queryset = Event.objects.select_related().prefetch_related(
        'registrations', 'volunteers', 'target_groups', 'reminders'
    ).order_by('start_datetime')
    permission_classes = [permissions.IsAuthenticated]
    
    # Set filter backends conditionally
    if DjangoFilterBackend:
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    else:
        filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'status': ['exact'],
        'event_type': ['exact'],
        'is_public': ['exact'],
        'is_featured': ['exact'],
        'requires_registration': ['exact'],
        'start_datetime': ['gte', 'lte'],
        'end_datetime': ['gte', 'lte'],
    }
    search_fields = [
        'title', 'description', 'location', 'organizer', 'tags'
    ]
    ordering_fields = [
        'start_datetime', 'end_datetime', 'title', 'created_at', 'registration_count'
    ]
    ordering = ['start_datetime']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'calendar':
            return EventCalendarSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        elif self.action == 'export':
            return EventExportSerializer
        return EventSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_datetime__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_datetime__date__lte=end_date)
        
        # Filter upcoming events
        if self.request.query_params.get('upcoming') == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())
        
        # Filter past events
        if self.request.query_params.get('past') == 'true':
            queryset = queryset.filter(end_datetime__lt=timezone.now())
        
        # Filter today's events
        if self.request.query_params.get('today') == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(start_datetime__date=today)
        
        # Filter by target group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(target_groups__id=group_id)
        
        # Filter by organizer
        organizer = self.request.query_params.get('organizer')
        if organizer:
            queryset = queryset.filter(organizer__icontains=organizer)
        
        # Filter events with registration open
        if self.request.query_params.get('registration_open') == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                requires_registration=True,
                status='published'
            ).filter(
                Q(registration_deadline__gte=now) | Q(registration_deadline__isnull=True)
            ).filter(start_datetime__gte=now)
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by when creating event"""
        serializer.save(
            created_by=str(self.request.user),
            last_modified_by=str(self.request.user)
        )

    def perform_update(self, serializer):
        """Set last_modified_by when updating event"""
        serializer.save(last_modified_by=str(self.request.user))

    def list(self, request, *args, **kwargs):
        """List events with logging"""
        try:
            logger.info(f"[EventViewSet] Events list request from: {request.user.email}")
            logger.info(f"[EventViewSet] Query params: {request.query_params}")
            
            response = super().list(request, *args, **kwargs)
            
            logger.info(f"[EventViewSet] Returned {len(response.data.get('results', []))} events")
            return response
            
        except Exception as e:
            logger.error(f"[EventViewSet] Error listing events: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve events'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get events in calendar format"""
        try:
            logger.info(f"[EventViewSet] Calendar request from: {request.user.email}")
            
            queryset = self.filter_queryset(self.get_queryset())
            serializer = EventCalendarSerializer(queryset, many=True)
            
            logger.info(f"[EventViewSet] Calendar returned {len(serializer.data)} events")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[EventViewSet] Calendar error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get calendar events'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events"""
        try:
            days_ahead = int(request.query_params.get('days', 30))
            limit = int(request.query_params.get('limit', 50))
            
            logger.info(f"[EventViewSet] Upcoming events request: {days_ahead} days, limit {limit}")
            
            end_date = timezone.now() + timedelta(days=days_ahead)
            
            queryset = Event.objects.filter(
                start_datetime__gte=timezone.now(),
                start_datetime__lte=end_date,
                status='published'
            ).order_by('start_datetime')[:limit]
            
            serializer = EventListSerializer(queryset, many=True)
            
            logger.info(f"[EventViewSet] Found {len(serializer.data)} upcoming events")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'days_ahead': days_ahead
            })
            
        except Exception as e:
            logger.error(f"[EventViewSet] Upcoming events error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get upcoming events'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register a member for an event"""
        try:
            event = self.get_object()
            member_id = request.data.get('member_id')
            
            logger.info(f"[EventViewSet] Registration request for event {pk}, member {member_id}")
            
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
            
            # Create registration data
            registration_data = {
                'event': event.id,
                'member_id': member_id,
                'notes': request.data.get('notes', ''),
                'dietary_requirements': request.data.get('dietary_requirements', ''),
                'emergency_contact_name': request.data.get('emergency_contact_name', ''),
                'emergency_contact_phone': request.data.get('emergency_contact_phone', ''),
                'accessibility_needs': request.data.get('accessibility_needs', ''),
            }
            
            serializer = EventRegistrationSerializer(data=registration_data)
            if serializer.is_valid():
                registration = serializer.save()
                
                logger.info(f"[EventViewSet] Registration successful: {member.first_name} {member.last_name} for {event.title}")
                
                return Response({
                    'success': True,
                    'message': 'Registration successful',
                    'registration': serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"[EventViewSet] Registration error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Registration failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all registrations for an event"""
        try:
            event = self.get_object()
            logger.info(f"[EventViewSet] Registrations request for event {pk}")
            
            registrations = event.registrations.all().order_by('registration_date')
            serializer = EventRegistrationSerializer(registrations, many=True)
            
            logger.info(f"[EventViewSet] Found {len(serializer.data)} registrations")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[EventViewSet] Registrations error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get registrations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def volunteers(self, request, pk=None):
        """Get all volunteers for an event"""
        try:
            event = self.get_object()
            logger.info(f"[EventViewSet] Volunteers request for event {pk}")
            
            volunteers = event.volunteers.all().order_by('role')
            serializer = EventVolunteerSerializer(volunteers, many=True)
            
            logger.info(f"[EventViewSet] Found {len(serializer.data)} volunteers")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[EventViewSet] Volunteers error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get volunteers'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an event"""
        try:
            original_event = self.get_object()
            logger.info(f"[EventViewSet] Duplicate event request for {pk}")
            
            # Get new date from request
            new_start = request.data.get('start_datetime')
            new_end = request.data.get('end_datetime')
            
            if not new_start or not new_end:
                return Response(
                    {'error': 'start_datetime and end_datetime are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create duplicate
            duplicate_event = Event.objects.create(
                title=f"{original_event.title} (Copy)",
                description=original_event.description,
                event_type=original_event.event_type,
                location=original_event.location,
                location_details=original_event.location_details,
                start_datetime=new_start,
                end_datetime=new_end,
                max_capacity=original_event.max_capacity,
                requires_registration=original_event.requires_registration,
                registration_fee=original_event.registration_fee,
                organizer=original_event.organizer,
                contact_email=original_event.contact_email,
                contact_phone=original_event.contact_phone,
                age_min=original_event.age_min,
                age_max=original_event.age_max,
                status='draft',  # Always create as draft
                is_public=original_event.is_public,
                is_featured=False,  # Don't copy featured status
                prerequisites=original_event.prerequisites,
                tags=original_event.tags,
                image_url=original_event.image_url,
                external_registration_url=original_event.external_registration_url,
                created_by=str(request.user),
                last_modified_by=str(request.user)
            )
            
            # Copy target groups
            duplicate_event.target_groups.set(original_event.target_groups.all())
            
            serializer = EventSerializer(duplicate_event)
            
            logger.info(f"[EventViewSet] Event duplicated successfully: {duplicate_event.id}")
            
            return Response({
                'success': True,
                'message': 'Event duplicated successfully',
                'event': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"[EventViewSet] Duplicate error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to duplicate event'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive event statistics"""
        try:
            logger.info(f"[EventViewSet] Statistics request from: {request.user.email}")
            
            now = timezone.now()
            
            # Basic counts
            total_events = Event.objects.count()
            published_events = Event.objects.filter(status='published').count()
            upcoming_events = Event.objects.filter(
                start_datetime__gte=now,
                status='published'
            ).count()
            past_events = Event.objects.filter(end_datetime__lt=now).count()
            
            # Events by status
            status_counts = Event.objects.values('status').annotate(count=Count('id'))
            status_breakdown = {item['status']: item['count'] for item in status_counts}
            
            # Events by type
            type_counts = Event.objects.values('event_type').annotate(count=Count('id'))
            type_breakdown = {item['event_type']: item['count'] for item in type_counts}
            
            # Registration statistics
            total_registrations = EventRegistration.objects.count()
            confirmed_registrations = EventRegistration.objects.filter(
                status='confirmed'
            ).count()
            
            # Recent activity (last 30 days)
            thirty_days_ago = now - timedelta(days=30)
            recent_events = Event.objects.filter(created_at__gte=thirty_days_ago).count()
            recent_registrations = EventRegistration.objects.filter(
                registration_date__gte=thirty_days_ago
            ).count()
            
            # Monthly stats for last 6 months
            monthly_stats = []
            for i in range(6):
                month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_events = Event.objects.filter(
                    created_at__date__range=[month_start.date(), month_end.date()]
                )
                month_registrations = EventRegistration.objects.filter(
                    registration_date__date__range=[month_start.date(), month_end.date()]
                )
                
                monthly_stats.append({
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%B %Y'),
                    'events_count': month_events.count(),
                    'registrations_count': month_registrations.count()
                })
            
            stats_data = {
                'summary': {
                    'total_events': total_events,
                    'published_events': published_events,
                    'upcoming_events': upcoming_events,
                    'past_events': past_events,
                    'total_registrations': total_registrations,
                    'confirmed_registrations': confirmed_registrations,
                    'recent_events': recent_events,
                    'recent_registrations': recent_registrations
                },
                'breakdown': {
                    'by_status': status_breakdown,
                    'by_type': type_breakdown
                },
                'monthly_stats': monthly_stats
            }
            
            logger.info(f"[EventViewSet] Statistics calculated successfully")
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"[EventViewSet] Statistics error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export events to CSV"""
        try:
            logger.info(f"[EventViewSet] Export request from: {request.user.email}")
            
            queryset = self.filter_queryset(self.get_queryset())
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="events_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Title', 'Type', 'Location', 'Organizer', 'Start Date', 'End Date',
                'Status', 'Is Public', 'Requires Registration', 'Max Capacity',
                'Registration Count', 'Volunteer Count', 'Registration Fee', 'Created At'
            ])
            
            for event in queryset.select_related().prefetch_related('registrations', 'volunteers'):
                writer.writerow([
                    str(event.id),
                    event.title,
                    event.get_event_type_display(),
                    event.location,
                    event.organizer,
                    event.start_datetime.strftime('%Y-%m-%d %H:%M'),
                    event.end_datetime.strftime('%Y-%m-%d %H:%M'),
                    event.get_status_display(),
                    'Yes' if event.is_public else 'No',
                    'Yes' if event.requires_registration else 'No',
                    event.max_capacity or 'Unlimited',
                    event.registrations.filter(status__in=['confirmed', 'attended']).count(),
                    event.volunteers.filter(status='confirmed').count(),
                    f"${event.registration_fee}" if event.registration_fee > 0 else 'Free',
                    event.created_at.strftime('%Y-%m-%d %H:%M')
                ])
            
            logger.info(f"[EventViewSet] Export completed with {queryset.count()} events")
            
            return response
            
        except Exception as e:
            logger.error(f"[EventViewSet] Export error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to export events'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on multiple events"""
        try:
            serializer = BulkEventActionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            event_ids = serializer.validated_data['event_ids']
            action = serializer.validated_data['action']
            action_data = serializer.validated_data.get('data', {})
            
            logger.info(f"[EventViewSet] Bulk action '{action}' for {len(event_ids)} events")
            
            events = Event.objects.filter(id__in=event_ids)
            actual_count = events.count()
            
            if actual_count != len(event_ids):
                logger.warning(f"[EventViewSet] Some event IDs not found: requested {len(event_ids)}, found {actual_count}")
            
            result_message = ""
            
            if action == 'publish':
                events.update(status='published', last_modified_by=str(request.user))
                result_message = f"Successfully published {actual_count} events"
                
            elif action == 'cancel':
                events.update(status='cancelled', last_modified_by=str(request.user))
                result_message = f"Successfully cancelled {actual_count} events"
                
            elif action == 'delete':
                deleted_count = events.count()
                events.delete()
                result_message = f"Successfully deleted {deleted_count} events"
                
            elif action == 'export':
                # Export selected events
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="selected_events_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                
                writer = csv.writer(response)
                writer.writerow([
                    'ID', 'Title', 'Type', 'Location', 'Start Date', 'Status'
                ])
                
                for event in events:
                    writer.writerow([
                        str(event.id),
                        event.title,
                        event.get_event_type_display(),
                        event.location,
                        event.start_datetime.strftime('%Y-%m-%d %H:%M'),
                        event.get_status_display()
                    ])
                
                return response
                
            elif action == 'send_reminder':
                # Create reminders for each event
                reminder_count = 0
                message = action_data.get('message', 'Event reminder')
                
                for event in events:
                    # Send reminder 1 day before event
                    send_time = event.start_datetime - timedelta(days=1)
                    if send_time > timezone.now():  # Only schedule future reminders
                        EventReminder.objects.create(
                            event=event,
                            reminder_type='manual',
                            reminder_method='email',
                            send_at=send_time,
                            subject=f"Reminder: {event.title}",
                            message=message,
                            created_by=str(request.user)
                        )
                        reminder_count += 1
                
                result_message = f"Successfully created {reminder_count} reminders"
                
            else:
                return Response(
                    {'error': f'Unknown action: {action}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"[EventViewSet] Bulk action completed: {result_message}")
            
            return Response({
                'success': True,
                'message': result_message,
                'processed_count': actual_count
            })
            
        except Exception as e:
            logger.error(f"[EventViewSet] Bulk action error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Bulk action failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event reminders
    """
    queryset = EventReminder.objects.select_related('event').order_by('send_at')
    serializer_class = EventReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    if DjangoFilterBackend:
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    else:
        filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'reminder_type': ['exact'],
        'reminder_method': ['exact'],
        'event': ['exact'],
        'sent': ['exact'],
    }
    search_fields = ['message', 'subject', 'event__title']
    ordering_fields = ['send_at', 'sent_at', 'created_at']
    ordering = ['send_at']

    def perform_create(self, serializer):
        """Set created_by when creating reminder"""
        serializer.save(created_by=str(self.request.user))


class EventCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event categories
    """
    queryset = EventCategory.objects.filter(is_active=True).order_by('name')
    serializer_class = EventCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        """Set created_by when creating category"""
        serializer.save(created_by=str(self.request.user))


class EventVolunteerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event volunteers
    """
    queryset = EventVolunteer.objects.select_related('event', 'member').order_by('event', 'role')
    serializer_class = EventVolunteerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    if DjangoFilterBackend:
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    else:
        filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'role': ['exact'],
        'status': ['exact'],
        'event': ['exact'],
        'member': ['exact'],
    }
    search_fields = [
        'member__first_name', 'member__last_name', 'event__title',
        'role_description', 'notes'
    ]
    ordering_fields = ['invited_date', 'response_date', 'role']
    ordering = ['event', 'role']

    def perform_create(self, serializer):
        """Set created_by when creating volunteer assignment"""
        serializer.save(created_by=str(self.request.user))


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event registrations
    """
    queryset = EventRegistration.objects.select_related('event', 'member').order_by('-registration_date')
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    if DjangoFilterBackend:
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    else:
        filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'status': ['exact'],
        'payment_status': ['exact'],
        'event': ['exact'],
        'member': ['exact'],
        'registration_date': ['gte', 'lte'],
    }
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email',
        'event__title', 'notes'
    ]
    ordering_fields = ['registration_date', 'status', 'payment_status']
    ordering = ['-registration_date']

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by event
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        # Filter by member
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        
        return queryset

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a registration"""
        try:
            registration = self.get_object()
            logger.info(f"[EventRegistrationViewSet] Confirm registration {pk}")
            
            registration.confirm_registration(confirmed_by=str(request.user))
            
            serializer = self.get_serializer(registration)
            return Response({
                'success': True,
                'message': 'Registration confirmed',
                'registration': serializer.data
            })
            
        except Exception as e:
            logger.error(f"[EventRegistrationViewSet] Confirm error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to confirm registration'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a registration"""
        try:
            registration = self.get_object()
            logger.info(f"[EventRegistrationViewSet] Cancel registration {pk}")
            
            registration.cancel_registration()
            
            serializer = self.get_serializer(registration)
            return Response({
                'success': True,
                'message': 'Registration cancelled',
                'registration': serializer.data
            })
            
        except Exception as e:
            logger.error(f"[EventRegistrationViewSet] Cancel error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to cancel registration'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def mark_attended(self, request, pk=None):
        """Mark registration as attended"""
        try:
            registration = self.get_object()
            logger.info(f"[EventRegistrationViewSet] Mark attended {pk}")
            
            registration.mark_attended()
            
            serializer = self.get_serializer(registration)
            return Response({
                'success': True,
                'message': 'Marked as attended',
                'registration': serializer.data
            })
            
        except Exception as e:
            logger.error(f"[EventRegistrationViewSet] Mark attended error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to mark as attended'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export registrations to CSV"""
        try:
            logger.info(f"[EventRegistrationViewSet] Export request from: {request.user.email}")
            
            queryset = self.filter_queryset(self.get_queryset())
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="registrations_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Registration ID', 'Event Title', 'Member Name', 'Member Email',
                'Status', 'Registration Date', 'Payment Status', 'Payment Amount',
                'Dietary Requirements', 'Check-in Time', 'Check-out Time'
            ])
            
            for registration in queryset:
                writer.writerow([
                    str(registration.id),
                    registration.event.title,
                    f"{registration.member.first_name} {registration.member.last_name}",
                    registration.member.email,
                    registration.get_status_display(),
                    registration.registration_date.strftime('%Y-%m-%d %H:%M'),
                    registration.get_payment_status_display(),
                    f"${registration.payment_amount}" if registration.payment_amount > 0 else 'Free',
                    registration.dietary_requirements or '',
                    registration.check_in_time.strftime('%Y-%m-%d %H:%M') if registration.check_in_time else '',
                    registration.check_out_time.strftime('%Y-%m-%d %H:%M') if registration.check_out_time else ''
                ])
            
            logger.info(f"[EventRegistrationViewSet] Export completed with {queryset.count()} registrations")
            
            return response
            
        except Exception as e:
            logger.error(f"[EventRegistrationViewSet] Export error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to export registrations'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )