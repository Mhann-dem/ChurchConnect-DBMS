# backend/churchconnect/events/models.py
from django.db import models
import uuid
from django.utils import timezone
from members.models import Member
from groups.models import Group

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
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='other')
    location = models.CharField(max_length=255, blank=True)
    location_details = models.TextField(blank=True, help_text="Additional location information")
    
    # Date and time fields
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    registration_deadline = models.DateTimeField(blank=True, null=True)
    
    # Capacity and registration
    max_capacity = models.PositiveIntegerField(blank=True, null=True, help_text="Maximum number of attendees")
    requires_registration = models.BooleanField(default=False)
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Organization
    organizer = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Target audience
    target_groups = models.ManyToManyField(Group, blank=True, help_text="Specific groups this event is for")
    age_min = models.PositiveIntegerField(blank=True, null=True)
    age_max = models.PositiveIntegerField(blank=True, null=True)
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_public = models.BooleanField(default=True, help_text="Show on public calendar")
    is_featured = models.BooleanField(default=False)
    
    # Additional information
    prerequisites = models.TextField(blank=True, help_text="Requirements or items to bring")
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    image_url = models.URLField(blank=True, help_text="Event poster or image")
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['start_datetime']),
            models.Index(fields=['status']),
            models.Index(fields=['event_type']),
        ]

    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"

    @property
    def is_past(self):
        return self.end_datetime < timezone.now()

    @property
    def is_upcoming(self):
        return self.start_datetime > timezone.now()

    @property
    def registration_open(self):
        if not self.requires_registration:
            return False
        if self.registration_deadline:
            return timezone.now() < self.registration_deadline
        return self.start_datetime > timezone.now()

    @property
    def available_spots(self):
        if not self.max_capacity:
            return None
        registered_count = self.registrations.filter(status='confirmed').count()
        return max(0, self.max_capacity - registered_count)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_datetime >= self.end_datetime:
            raise ValidationError('Start time must be before end time.')
        if self.age_min and self.age_max and self.age_min > self.age_max:
            raise ValidationError('Minimum age cannot be greater than maximum age.')


class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('waitlist', 'Waitlist'),
        ('attended', 'Attended'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='event_registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Registration details
    registration_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    dietary_requirements = models.CharField(max_length=200, blank=True)
    emergency_contact = models.CharField(max_length=200, blank=True)
    
    # Payment information (if applicable)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('not_required', 'Not Required'),
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('refunded', 'Refunded'),
        ],
        default='not_required'
    )
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['event', 'member']
        ordering = ['registration_date']

    def __str__(self):
        return f"{self.member.get_full_name()} - {self.event.title}"


class EventReminder(models.Model):
    REMINDER_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('both', 'Email and SMS'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=10, choices=REMINDER_TYPES, default='email')
    send_at = models.DateTimeField()
    message = models.TextField(blank=True)
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['send_at']

    def __str__(self):
        return f"Reminder for {self.event.title} at {self.send_at}"