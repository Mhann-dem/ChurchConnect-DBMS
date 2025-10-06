# events/serializers.py - COMPLETE Events serializers for ChurchConnect
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import Event, EventRegistration, EventReminder, EventCategory, EventVolunteer
from members.models import Member
from groups.models import Group


class EventMemberSummarySerializer(serializers.ModelSerializer):
    """Simple member serializer for event contexts"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'phone']


class EventGroupSummarySerializer(serializers.ModelSerializer):
    """Simple group serializer for event contexts"""
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description']


class EventCategorySerializer(serializers.ModelSerializer):
    """Serializer for event categories"""
    
    class Meta:
        model = EventCategory
        fields = [
            'id', 'name', 'description', 'color', 'is_active',
            'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']


class EventVolunteerSerializer(serializers.ModelSerializer):
    """Serializer for event volunteers"""
    member = EventMemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True, source='member.id')
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
        read_only_fields = ['id', 'invited_date', 'created_at', 'created_by']

    def validate(self, data):
        """Validate volunteer assignment"""
        event = data.get('event')
        member_id = data.get('member', {}).get('id') if data.get('member') else None
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

    def create(self, validated_data):
        """Create volunteer assignment with proper member handling"""
        member_data = validated_data.pop('member', {})
        member_id = member_data.get('id')
        
        if member_id:
            try:
                validated_data['member'] = Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                raise serializers.ValidationError({"member_id": "Member not found."})
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update volunteer assignment with proper member handling"""
        member_data = validated_data.pop('member', {})
        member_id = member_data.get('id')
        
        if member_id:
            try:
                validated_data['member'] = Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                raise serializers.ValidationError({"member_id": "Member not found."})
        
        return super().update(instance, validated_data)


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for event registrations"""
    member = EventMemberSummarySerializer(read_only=True)
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
        read_only_fields = [
            'id', 'registration_date', 'created_at', 'updated_at',
            'approved_by', 'approval_date'
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
            
            # Validate member exists
            try:
                Member.objects.get(id=member_id)
            except Member.DoesNotExist:
                raise serializers.ValidationError({"member_id": "Member not found."})
            
            # Check if registration is open
            if not event.registration_open and not self.instance:
                # Allow waitlist registration if event is full
                if event.is_full:
                    data['status'] = 'waitlist'
                else:
                    raise serializers.ValidationError(
                        "Registration is closed for this event."
                    )
        
        return data

    def create(self, validated_data):
        """Create registration with proper member assignment"""
        member_id = validated_data.pop('member_id')
        validated_data['member_id'] = member_id
        return super().create(validated_data)


class EventSerializer(serializers.ModelSerializer):
    """Main event serializer with full details"""
    category = EventCategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    target_groups = EventGroupSummarySerializer(many=True, read_only=True)
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
            'category', 'category_id', 'location', 'location_details', 
            'start_datetime', 'end_datetime', 'registration_deadline', 
            'max_capacity', 'requires_registration', 'registration_fee', 
            'organizer', 'contact_email', 'contact_phone',
            'target_groups', 'target_group_ids', 'age_min', 'age_max',
            'status', 'status_display', 'is_public', 'is_featured',
            'prerequisites', 'tags', 'image_url', 'external_registration_url',
            'created_at', 'updated_at', 'created_by', 'last_modified_by',
            'registration_count', 'waitlist_count', 'volunteer_count',
            'available_spots', 'is_past', 'is_upcoming', 'is_today',
            'registration_open', 'is_full', 'duration_hours'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'last_modified_by']

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
                raise serializers.ValidationError({
                    "end_datetime": "End time must be after start time."
                })
        
        age_min = data.get('age_min')
        age_max = data.get('age_max')
        
        if age_min is not None and age_max is not None:
            if age_min > age_max:
                raise serializers.ValidationError({
                    "age_max": "Maximum age cannot be less than minimum age."
                })
        
        registration_deadline = data.get('registration_deadline')
        if registration_deadline and start_datetime:
            if registration_deadline > start_datetime:
                raise serializers.ValidationError({
                    "registration_deadline": "Registration deadline cannot be after event start time."
                })
        
        # Validate category exists
        category_id = data.get('category_id')
        if category_id:
            try:
                EventCategory.objects.get(id=category_id, is_active=True)
            except EventCategory.DoesNotExist:
                raise serializers.ValidationError({
                    "category_id": "Category not found or inactive."
                })
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create event with proper category handling"""
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category_id'] = category_id
        
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update event with proper category handling"""
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            validated_data['category_id'] = category_id
        
        return super().update(instance, validated_data)


class EventListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    category = EventCategorySerializer(read_only=True)
    registration_count = serializers.SerializerMethodField()
    volunteer_count = serializers.SerializerMethodField()
    is_upcoming = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    registration_open = serializers.ReadOnlyField()
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'event_type_display', 'category',
            'location', 'start_datetime', 'end_datetime', 'status', 'status_display',
            'is_public', 'is_featured', 'registration_count', 'volunteer_count',
            'max_capacity', 'requires_registration', 'registration_open', 
            'is_upcoming', 'is_past', 'organizer', 'registration_fee', 'image_url'
        ]

    def get_registration_count(self, obj):
        return obj.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_volunteer_count(self, obj):
        return obj.volunteers.filter(status='confirmed').count()


class EventCalendarSerializer(serializers.ModelSerializer):
    """Minimal serializer for calendar view"""
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    color = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_datetime', 'end_datetime', 
            'event_type', 'event_type_display', 'location', 
            'is_public', 'status', 'is_featured', 'color'
        ]
    
    def get_color(self, obj):
        """Add color based on event type"""
        color_map = {
            'service': '#3498db',
            'meeting': '#e74c3c',
            'social': '#2ecc71',
            'youth': '#f39c12',
            'workshop': '#9b59b6',
            'outreach': '#1abc9c',
            'conference': '#e67e22',
            'retreat': '#8e44ad',
            'fundraiser': '#27ae60',
            'kids': '#f1c40f',
            'seniors': '#95a5a6',
            'prayer': '#34495e',
            'bible_study': '#2c3e50',
            'baptism': '#16a085',
            'wedding': '#e91e63',
            'funeral': '#607d8b',
            'other': '#95a5a6'
        }
        
        return color_map.get(obj.event_type, '#95a5a6')


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating events"""
    category_id = serializers.UUIDField(required=False, allow_null=True)
    target_group_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(),
        source='target_groups',
        required=False
    )

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'category_id',
            'location', 'location_details', 'start_datetime', 'end_datetime', 
            'registration_deadline', 'max_capacity', 'requires_registration', 
            'registration_fee', 'organizer', 'contact_email', 'contact_phone', 
            'target_group_ids', 'age_min', 'age_max', 'status', 'is_public', 
            'is_featured', 'prerequisites', 'tags', 'image_url', 
            'external_registration_url'
        ]

    def validate(self, data):
        """Validate event data"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError({
                    "end_datetime": "End time must be after start time."
                })
        
        age_min = data.get('age_min')
        age_max = data.get('age_max')
        
        if age_min is not None and age_max is not None:
            if age_min > age_max:
                raise serializers.ValidationError({
                    "age_max": "Maximum age cannot be less than minimum age."
                })
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create event with proper relationships"""
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category_id'] = category_id
        
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update event with proper relationships"""
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            validated_data['category_id'] = category_id
        
        return super().update(instance, validated_data)


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
        read_only_fields = ['id', 'sent_at', 'sent_count', 'created_at', 'created_by']

    def validate(self, data):
        """Validate reminder"""
        event = data.get('event')
        send_at = data.get('send_at')
        
        if event and send_at:
            if send_at > event.start_datetime:
                raise serializers.ValidationError({
                    "send_at": "Reminder cannot be scheduled after event start time."
                })
        
        return data


class EventStatsSerializer(serializers.Serializer):
    """Serializer for event statistics"""
    summary = serializers.DictField()
    breakdown = serializers.DictField()
    monthly_stats = serializers.ListField()
    recent_activity = serializers.DictField()


class EventExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting events"""
    event_type_display = serializers.CharField(source='get_event_type_display')
    status_display = serializers.CharField(source='get_status_display')
    category_name = serializers.CharField(source='category.name', default='')
    registration_count = serializers.SerializerMethodField()
    volunteer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type_display', 'category_name', 'location', 
            'organizer', 'start_datetime', 'end_datetime', 'status_display', 
            'is_public', 'requires_registration', 'max_capacity', 'registration_count',
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