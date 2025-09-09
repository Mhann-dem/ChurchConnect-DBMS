# events/serializers.py - COMPLETE Events serializers for ChurchConnect
from rest_framework import serializers
from django.utils import timezone
from .models import Event, EventRegistration, EventReminder, EventCategory, EventVolunteer
from members.serializers import MemberSummarySerializer
from groups.serializers import GroupSerializer
from groups.models import Group


class EventCategorySerializer(serializers.ModelSerializer):
    """Serializer for event categories"""
    
    class Meta:
        model = EventCategory
        fields = [
            'id', 'name', 'description', 'color', 'is_active',
            'created_at', 'created_by'
        ]


class EventVolunteerSerializer(serializers.ModelSerializer):
    """Serializer for event volunteers"""
    member = MemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hours_volunteered = serializers.ReadOnlyField()

    class Meta:
        model = EventVolunteer
        fields = [
            'id', 'event', 'member', 'member_id', 'role', 'role_display',
            'status', 'status_display', 'role_description', 'start_time', 'end_time',
            'notes', 'invited_date', 'response_date', 'check_in_time', 'check_out_time',
            'hours_volunteered', 'created_at', 'created_by'
        ]

    def validate(self, data):
        """Validate volunteer assignment"""
        event = data.get('event')
        member_id = data.get('member_id')
        role = data.get('role')
        
        # Check for duplicate volunteer role for same member
        if event and member_id and role:
            existing = EventVolunteer.objects.filter(
                event=event,
                member_id=member_id,
                role=role
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError(
                    "This member is already assigned to this role for this event."
                )
        
        return data


class EventSerializer(serializers.ModelSerializer):
    """Main event serializer with full details"""
    target_groups = GroupSerializer(many=True, read_only=True)
    target_group_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Group.objects.all(),
        source='target_groups',
        required=False
    )
    
    # Calculated fields
    registration_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    volunteer_count = serializers.SerializerMethodField()
    available_spots = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    duration_hours = serializers.ReadOnlyField()
    
    # Display fields
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'event_type_display',
            'location', 'location_details', 'start_datetime', 'end_datetime',
            'registration_deadline', 'max_capacity', 'requires_registration',
            'registration_fee', 'organizer', 'contact_email', 'contact_phone',
            'target_groups', 'target_group_ids', 'age_min', 'age_max',
            'status', 'status_display', 'is_public', 'is_featured',
            'prerequisites', 'tags', 'image_url', 'external_registration_url',
            'created_at', 'updated_at', 'created_by', 'last_modified_by',
            'registration_count', 'waitlist_count', 'volunteer_count',
            'available_spots', 'is_past', 'is_upcoming', 'is_today',
            'registration_open', 'is_full', 'duration_hours'
        ]

    def get_registration_count(self, obj):
        """Get count of confirmed registrations"""
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_waitlist_count(self, obj):
        """Get count of waitlisted registrations"""
        return obj.registrations.filter(status='waitlist').count()

    def get_volunteer_count(self, obj):
        """Get count of confirmed volunteers"""
        return obj.volunteers.filter(status='confirmed').count()

    def validate(self, data):
        """Validate event data"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError("Start time must be before end time.")
        
        age_min = data.get('age_min')
        age_max = data.get('age_max')
        
        if age_min and age_max:
            if age_min > age_max:
                raise serializers.ValidationError("Minimum age cannot be greater than maximum age.")
        
        registration_deadline = data.get('registration_deadline')
        if registration_deadline and start_datetime:
            if registration_deadline > start_datetime:
                raise serializers.ValidationError(
                    "Registration deadline cannot be after event start time."
                )
        
        return data


class EventListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    registration_count = serializers.SerializerMethodField()
    is_upcoming = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_display', 'location', 
            'start_datetime', 'end_datetime', 'status', 'status_display',
            'is_public', 'is_featured', 'registration_count', 'max_capacity', 
            'requires_registration', 'registration_open', 'is_upcoming', 'is_past',
            'organizer', 'registration_fee'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()


class EventCalendarSerializer(serializers.ModelSerializer):
    """Minimal serializer for calendar view"""
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_datetime', 'end_datetime', 
            'event_type', 'event_type_display', 'location', 
            'is_public', 'status', 'is_featured', 'color'
        ]
    
    def to_representation(self, instance):
        """Add color field for calendar display"""
        data = super().to_representation(instance)
        
        # Add color based on event type
        color_map = {
            'service': '#3498db',
            'meeting': '#e74c3c',
            'social': '#2ecc71',
            'youth': '#f39c12',
            'workshop': '#9b59b6',
            'outreach': '#1abc9c',
            'other': '#95a5a6'
        }
        
        data['color'] = color_map.get(instance.event_type, '#95a5a6')
        return data


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating events"""
    target_group_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(),
        source='target_groups',
        required=False
    )

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'location', 'location_details',
            'start_datetime', 'end_datetime', 'registration_deadline',
            'max_capacity', 'requires_registration', 'registration_fee',
            'organizer', 'contact_email', 'contact_phone', 'target_group_ids',
            'age_min', 'age_max', 'status', 'is_public', 'is_featured',
            'prerequisites', 'tags', 'image_url', 'external_registration_url'
        ]

    def validate(self, data):
        """Validate event data"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError("Start time must be before end time.")
        
        return data


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for event registrations"""
    member = MemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'member', 'member_id', 'event_title', 'member_name',
            'status', 'status_display', 'registration_date', 'notes',
            'dietary_requirements', 'emergency_contact_name', 'emergency_contact_phone',
            'accessibility_needs', 'payment_status', 'payment_status_display',
            'payment_amount', 'payment_reference', 'payment_date',
            'approved_by', 'approval_date', 'check_in_time', 'check_out_time',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate registration"""
        event = data.get('event')
        member_id = data.get('member_id')
        
        if event and member_id:
            # Check if registration already exists
            existing = EventRegistration.objects.filter(
                event=event, 
                member_id=member_id
            )
            
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
                
            if existing.exists():
                raise serializers.ValidationError(
                    "Member is already registered for this event."
                )
            
            # Check if registration is open
            if not event.registration_open and not self.instance:
                raise serializers.ValidationError(
                    "Registration is closed for this event."
                )
            
            # Check capacity
            if event.is_full and not self.instance:
                # Allow waitlist registration
                data['status'] = 'waitlist'
        
        return data


class EventReminderSerializer(serializers.ModelSerializer):
    """Serializer for event reminders"""
    event_title = serializers.CharField(source='event.title', read_only=True)
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    reminder_method_display = serializers.CharField(source='get_reminder_method_display', read_only=True)
    
    class Meta:
        model = EventReminder
        fields = [
            'id', 'event', 'event_title', 'reminder_type', 'reminder_type_display',
            'reminder_method', 'reminder_method_display', 'send_at', 'days_before',
            'subject', 'message', 'send_to_all', 'target_statuses',
            'sent', 'sent_at', 'sent_count', 'created_at', 'created_by'
        ]

    def validate(self, data):
        """Validate reminder"""
        event = data.get('event')
        send_at = data.get('send_at')
        
        if event and send_at:
            if send_at > event.start_datetime:
                raise serializers.ValidationError(
                    "Reminder cannot be scheduled after event start time."
                )
        
        return data


class EventStatsSerializer(serializers.Serializer):
    """Serializer for event statistics"""
    summary = serializers.DictField()
    by_status = serializers.DictField()
    by_type = serializers.DictField()
    monthly_stats = serializers.ListField()
    upcoming_events = serializers.ListField()


class EventExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting events"""
    event_type_display = serializers.CharField(source='get_event_type_display')
    status_display = serializers.CharField(source='get_status_display')
    registration_count = serializers.SerializerMethodField()
    volunteer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type_display', 'location', 'organizer',
            'start_datetime', 'end_datetime', 'status_display', 'is_public',
            'requires_registration', 'max_capacity', 'registration_count',
            'volunteer_count', 'registration_fee', 'created_at'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_volunteer_count(self, obj):
        return obj.volunteers.filter(status='confirmed').count()


class EventRegistrationExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting event registrations"""
    event_title = serializers.CharField(source='event.title')
    member_name = serializers.CharField(source='member.get_full_name')
    member_email = serializers.CharField(source='member.email')
    member_phone = serializers.CharField(source='member.phone')
    status_display = serializers.CharField(source='get_status_display')
    payment_status_display = serializers.CharField(source='get_payment_status_display')
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event_title', 'member_name', 'member_email', 'member_phone',
            'status_display', 'registration_date', 'payment_status_display',
            'payment_amount', 'dietary_requirements', 'accessibility_needs',
            'check_in_time', 'check_out_time'
        ]


class BulkEventActionSerializer(serializers.Serializer):
    """Serializer for bulk event actions"""
    ACTION_CHOICES = [
        ('publish', 'Publish'),
        ('cancel', 'Cancel'),
        ('duplicate', 'Duplicate'),
        ('delete', 'Delete'),
        ('export', 'Export'),
        ('send_reminder', 'Send Reminder'),
    ]
    
    event_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of event IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        help_text="Action to perform on selected events"
    )
    data = serializers.DictField(
        required=False,
        help_text="Additional data for the action"
    )

    def validate_event_ids(self, value):
        """Validate that all event IDs exist"""
        existing_events = Event.objects.filter(id__in=value)
        if existing_events.count() != len(value):
            raise serializers.ValidationError("Some event IDs do not exist.")
        return value