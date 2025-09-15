# events/models.py - COMPLETE Events models for ChurchConnect
from django.db import models
import uuid
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

# Import Member and Group models
from members.models import Member
from groups.models import Group


class EventCategory(models.Model):
    """Categories for organizing events"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#3498db", help_text="Hex color code")
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name_plural = "Event Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Event(models.Model):
    EVENT_TYPES = [
        ('service', 'Church Service'),
        ('workshop', 'Workshop'),
        ('meeting', 'Meeting'),
        ('social', 'Social Event'),
        ('outreach', 'Outreach'),
        ('conference', 'Conference'),
        ('retreat', 'Retreat'),
        ('fundraiser', 'Fundraiser'),
        ('youth', 'Youth Event'),
        ('kids', 'Kids Event'),
        ('seniors', 'Seniors Event'),
        ('prayer', 'Prayer Meeting'),
        ('bible_study', 'Bible Study'),
        ('baptism', 'Baptism'),
        ('wedding', 'Wedding'),
        ('funeral', 'Memorial Service'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('postponed', 'Postponed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, help_text="Full event description")
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='other')
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Event category for organization"
    )
    location = models.CharField(max_length=255, blank=True, help_text="Event location")
    location_details = models.TextField(blank=True, help_text="Additional location information")
    
    # Date and time fields
    start_datetime = models.DateTimeField(help_text="Event start date and time")
    end_datetime = models.DateTimeField(help_text="Event end date and time")
    registration_deadline = models.DateTimeField(
        blank=True, 
        null=True, 
        help_text="Last date/time for registration"
    )
    
    # Capacity and registration
    max_capacity = models.PositiveIntegerField(
        blank=True, 
        null=True, 
        validators=[MinValueValidator(1)],
        help_text="Maximum number of attendees (leave blank for unlimited)"
    )
    requires_registration = models.BooleanField(
        default=False, 
        help_text="Whether registration is required to attend"
    )
    registration_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Registration fee amount (0 for free events)"
    )
    
    # Organization and contact
    organizer = models.CharField(max_length=200, blank=True, help_text="Event organizer name")
    contact_email = models.EmailField(blank=True, help_text="Contact email for questions")
    contact_phone = models.CharField(max_length=20, blank=True, help_text="Contact phone number")
    
    # Target audience
    target_groups = models.ManyToManyField(
        Group, 
        blank=True, 
        help_text="Specific groups this event is targeted to"
    )
    age_min = models.PositiveIntegerField(
        blank=True, 
        null=True, 
        validators=[MinValueValidator(0), MaxValueValidator(120)],
        help_text="Minimum age requirement"
    )
    age_max = models.PositiveIntegerField(
        blank=True, 
        null=True, 
        validators=[MinValueValidator(0), MaxValueValidator(120)],
        help_text="Maximum age requirement"
    )
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_public = models.BooleanField(
        default=True, 
        help_text="Show on public calendar and allow public registration"
    )
    is_featured = models.BooleanField(
        default=False, 
        help_text="Feature this event prominently"
    )
    
    # Additional information
    prerequisites = models.TextField(
        blank=True, 
        help_text="Requirements, items to bring, or preparation needed"
    )
    tags = models.CharField(
        max_length=500, 
        blank=True, 
        help_text="Comma-separated tags for categorization"
    )
    image_url = models.URLField(
        blank=True, 
        help_text="URL to event poster or promotional image"
    )
    external_registration_url = models.URLField(
        blank=True, 
        help_text="External registration link (if using third-party system)"
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=255, blank=True)
    last_modified_by = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['start_datetime']),
            models.Index(fields=['status']),
            models.Index(fields=['event_type']),
            models.Index(fields=['is_public']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"

    @property
    def is_past(self):
        """Check if event has already ended"""
        return self.end_datetime < timezone.now()

    @property
    def is_upcoming(self):
        """Check if event is in the future"""
        return self.start_datetime > timezone.now()

    @property
    def is_today(self):
        """Check if event is happening today"""
        today = timezone.now().date()
        return self.start_datetime.date() == today

    @property
    def registration_open(self):
        """Check if registration is currently open"""
        if not self.requires_registration:
            return False
        
        now = timezone.now()
        
        # Check if registration deadline has passed
        if self.registration_deadline and now > self.registration_deadline:
            return False
            
        # Check if event has already started
        if now > self.start_datetime:
            return False
            
        # Check if event is published
        if self.status != 'published':
            return False
            
        return True

    @property
    def available_spots(self):
        """Calculate available spots remaining"""
        if not self.max_capacity:
            return None  # Unlimited capacity
            
        confirmed_registrations = self.registrations.filter(
            status__in=['confirmed', 'attended']
        ).count()
        
        return max(0, self.max_capacity - confirmed_registrations)

    @property
    def is_full(self):
        """Check if event is at capacity"""
        if not self.max_capacity:
            return False
            
        available = self.available_spots
        return available is not None and available == 0

    @property
    def duration_hours(self):
        """Calculate event duration in hours"""
        if self.start_datetime and self.end_datetime:
            duration = self.end_datetime - self.start_datetime
            return round(duration.total_seconds() / 3600, 2)
        return 0

    def clean(self):
        """Model validation"""
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError('Start time must be before end time.')
                
        if self.age_min is not None and self.age_max is not None:
            if self.age_min > self.age_max:
                raise ValidationError('Minimum age cannot be greater than maximum age.')
                
        if self.registration_deadline and self.start_datetime:
            if self.registration_deadline > self.start_datetime:
                raise ValidationError('Registration deadline cannot be after event start time.')

    def get_registration_count(self):
        """Get count of confirmed registrations"""
        return self.registrations.filter(status__in=['confirmed', 'attended']).count()

    def get_waitlist_count(self):
        """Get count of waitlisted registrations"""
        return self.registrations.filter(status='waitlist').count()

    def get_volunteer_count(self):
        """Get count of confirmed volunteers"""
        return self.volunteers.filter(status='confirmed').count()


class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('waitlist', 'Waitlisted'),
        ('attended', 'Attended'),
        ('no_show', 'No Show'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('not_required', 'Not Required'),
        ('pending', 'Payment Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
        ('refunded', 'Refunded'),
        ('failed', 'Payment Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations',null=True,blank=True )
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='event_registrations',null=True,blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Registration details
    registration_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, help_text="Additional notes or comments")
    dietary_requirements = models.CharField(
        max_length=500, 
        blank=True, 
        help_text="Special dietary needs or restrictions"
    )
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    accessibility_needs = models.CharField(
        max_length=500, 
        blank=True,
        help_text="Any accessibility accommodations needed"
    )
    
    # Payment information
    payment_status = models.CharField(
        max_length=20, 
        choices=PAYMENT_STATUS_CHOICES, 
        default='not_required'
    )
    payment_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    payment_reference = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Payment reference number or transaction ID"
    )
    payment_date = models.DateTimeField(blank=True, null=True)
    
    # Admin fields
    approved_by = models.CharField(max_length=255, blank=True)
    approval_date = models.DateTimeField(blank=True, null=True)
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['event', 'member']
        ordering = ['-registration_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['registration_date']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} - {self.event.title}"

    def clean(self):
        """Model validation"""
        # Check if registration is allowed
        if not self.event.registration_open and not self.pk:
            raise ValidationError("Registration is not currently open for this event.")

    def confirm_registration(self, confirmed_by=None):
        """Confirm the registration"""
        self.status = 'confirmed'
        self.approved_by = confirmed_by or ''
        self.approval_date = timezone.now()
        self.save(update_fields=['status', 'approved_by', 'approval_date'])

    def cancel_registration(self):
        """Cancel the registration"""
        self.status = 'cancelled'
        self.save(update_fields=['status'])

    def mark_attended(self):
        """Mark as attended"""
        self.status = 'attended'
        self.check_in_time = timezone.now()
        self.save(update_fields=['status', 'check_in_time'])


class EventReminder(models.Model):
    REMINDER_TYPES = [
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
        ('follow_up', 'Follow-up'),
    ]

    REMINDER_METHODS = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Email and SMS'),
        ('push', 'Push Notification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES, default='automatic')
    reminder_method = models.CharField(max_length=10, choices=REMINDER_METHODS, default='email')
    
    # Timing
    send_at = models.DateTimeField(help_text="When to send the reminder")
    days_before = models.PositiveIntegerField(
        blank=True, 
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
        help_text="Days before event to send (for automatic reminders)"
    )
    
    # Content
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True, help_text="Reminder message content")
    
    # Targeting
    send_to_all = models.BooleanField(default=True, help_text="Send to all registered members")
    target_statuses = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Comma-separated list of registration statuses to target"
    )
    
    # Status
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)
    sent_count = models.PositiveIntegerField(default=0, help_text="Number of recipients")
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['send_at']
        indexes = [
            models.Index(fields=['send_at']),
            models.Index(fields=['sent']),
        ]

    def __str__(self):
        return f"Reminder for {self.event.title} at {self.send_at}"

    def clean(self):
        """Model validation"""
        if self.send_at and self.event:
            if self.send_at > self.event.start_datetime:
                raise ValidationError("Reminder cannot be scheduled after event start time.")


class EventVolunteer(models.Model):
    """Volunteer assignments for events"""
    ROLE_CHOICES = [
        ('coordinator', 'Event Coordinator'),
        ('setup', 'Setup Crew'),
        ('registration', 'Registration Desk'),
        ('usher', 'Usher'),
        ('security', 'Security'),
        ('tech', 'Technical Support'),
        ('catering', 'Catering/Food Service'),
        ('childcare', 'Childcare'),
        ('cleanup', 'Cleanup Crew'),
        ('photographer', 'Photographer'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('invited', 'Invited'),
        ('confirmed', 'Confirmed'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='volunteers')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='volunteer_assignments')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='invited')
    
    # Details
    role_description = models.TextField(blank=True, help_text="Specific duties and responsibilities")
    start_time = models.DateTimeField(blank=True, null=True, help_text="Volunteer start time")
    end_time = models.DateTimeField(blank=True, null=True, help_text="Volunteer end time")
    notes = models.TextField(blank=True)
    
    # Tracking
    invited_date = models.DateTimeField(default=timezone.now)
    response_date = models.DateTimeField(blank=True, null=True)
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ['event', 'member', 'role']
        ordering = ['event', 'role']

    def __str__(self):
        return f"{self.member.first_name} {self.member.last_name} - {self.get_role_display()} for {self.event.title}"

    @property
    def hours_volunteered(self):
        """Calculate hours volunteered"""
        if self.check_in_time and self.check_out_time:
            duration = self.check_out_time - self.check_in_time
            return round(duration.total_seconds() / 3600, 2)
        return 0