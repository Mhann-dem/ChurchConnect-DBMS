# backend/churchconnect/events/serializers.py
from rest_framework import serializers
from .models import Event, EventRegistration, EventReminder
from members.serializers import MemberSerializer
from groups.serializers import GroupSerializer
from groups.models import Group 

class EventSerializer(serializers.ModelSerializer):
    target_groups = GroupSerializer(many=True, read_only=True)
    target_group_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Group.objects.all(),
        source='target_groups',
        required=False
    )
    registration_count = serializers.SerializerMethodField()
    available_spots = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'location', 'location_details',
            'start_datetime', 'end_datetime', 'registration_deadline', 'max_capacity',
            'requires_registration', 'registration_fee', 'organizer', 'contact_email',
            'contact_phone', 'target_groups', 'target_group_ids', 'age_min', 'age_max',
            'status', 'is_public', 'is_featured', 'prerequisites', 'tags', 'image_url',
            'created_at', 'updated_at', 'created_by', 'registration_count', 
            'available_spots', 'is_past', 'is_upcoming', 'registration_open'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status='confirmed').count()

    def validate(self, data):
        if data.get('start_datetime') and data.get('end_datetime'):
            if data['start_datetime'] >= data['end_datetime']:
                raise serializers.ValidationError("Start time must be before end time.")
        
        if data.get('age_min') and data.get('age_max'):
            if data['age_min'] > data['age_max']:
                raise serializers.ValidationError("Minimum age cannot be greater than maximum age.")
        
        return data


class EventRegistrationSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'member', 'member_id', 'event_title', 'status',
            'registration_date', 'notes', 'dietary_requirements', 'emergency_contact',
            'payment_status', 'payment_amount', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        event = data.get('event')
        member_id = data.get('member_id')
        
        if event and member_id:
            # Check if registration already exists
            if EventRegistration.objects.filter(event=event, member_id=member_id).exists():
                raise serializers.ValidationError("Member is already registered for this event.")
            
            # Check capacity
            if event.max_capacity:
                confirmed_registrations = event.registrations.filter(status='confirmed').count()
                if confirmed_registrations >= event.max_capacity:
                    raise serializers.ValidationError("Event is at full capacity.")
            
            # Check if registration is still open
            if not event.registration_open:
                raise serializers.ValidationError("Registration is closed for this event.")
        
        return data


class EventReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventReminder
        fields = [
            'id', 'event', 'reminder_type', 'send_at', 'message',
            'sent', 'sent_at', 'created_at'
        ]


class EventListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    registration_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'location', 'start_datetime', 
            'end_datetime', 'status', 'is_public', 'registration_count',
            'max_capacity', 'requires_registration', 'is_featured'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status='confirmed').count()


class EventCalendarSerializer(serializers.ModelSerializer):
    """Serializer for calendar view"""
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_datetime', 'end_datetime', 
            'event_type', 'location', 'is_public', 'status'
        ]