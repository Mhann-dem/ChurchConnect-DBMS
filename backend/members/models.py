# members/models.py - FIXED USER MODEL REFERENCES
import uuid
from django.db import models
from django.conf import settings  # Import settings instead of User directly
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.urls import reverse
from phonenumber_field.modelfields import PhoneNumberField
from .validators import validate_phone_number_field 


class Member(models.Model):
    """Enhanced Church member model with comprehensive fields"""
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    MEMBERSHIP_TYPE_CHOICES = [
        ('regular', 'Regular Member'),
        ('associate', 'Associate Member'),
        ('youth', 'Youth Member'),
        ('senior', 'Senior Member'),
        ('visitor', 'Visitor'),
        ('honorary', 'Honorary Member'),
    ]
    
    CONTACT_METHOD_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone Call'),
        ('sms', 'SMS/Text Message'),
        ('whatsapp', 'WhatsApp'),
        ('mail', 'Physical Mail'),
    ]
    
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('twi', 'Twi'),
        ('ga', 'Ga'),
        ('ewe', 'Ewe'),
        ('dagbani', 'Dagbani'),
        ('french', 'French'),
        ('other', 'Other'),
    ]
    
    REGISTRATION_SOURCE_CHOICES = [
        ('public_form', 'Public Registration Form'),
        ('admin_portal', 'Admin Portal'),
        ('bulk_import', 'Bulk Import'),
        ('referral', 'Member Referral'),
        ('event_registration', 'Event Registration'),
        ('migration', 'Data Migration'),
        ('manual', 'Manual Entry'),
    ]
    
    # Primary identification fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100, help_text="Member's first name")
    last_name = models.CharField(max_length=100, help_text="Member's last name")
    preferred_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Name the member prefers to be called"
    )
    
    # Contact information
    email = models.EmailField(unique=True, help_text="Primary email address")
    phone = models.CharField(
        blank=True,
        null=True,
        help_text="Phone number (supports international formats like +233241234567)"
    )
    alternate_phone = models.CharField(
        blank=True,
        null=True,
        help_text="Alternative phone number"
    )
    address = models.TextField(blank=True, null=True, help_text="Full address")
    
    # Personal details
    date_of_birth = models.DateField(
        blank=True, 
        null=True,
        help_text="Date of birth (YYYY-MM-DD)"
    )
    gender = models.CharField(
        max_length=20, 
        choices=GENDER_CHOICES,
        blank=True,
        null=True
    )
    
    # Membership details
    membership_type = models.CharField(
        max_length=20,
        choices=MEMBERSHIP_TYPE_CHOICES,
        default='regular'
    )
    
    # Contact preferences
    preferred_contact_method = models.CharField(
        max_length=15,
        choices=CONTACT_METHOD_CHOICES,
        default='email'
    )
    preferred_language = models.CharField(
        max_length=20,
        choices=LANGUAGE_CHOICES,
        default='english'
    )
    
    # Professional/Family information
    profession = models.CharField(max_length=100, blank=True, null=True)
    employer = models.CharField(max_length=100, blank=True, null=True)
    
    # Accessibility and special needs
    accessibility_needs = models.TextField(
        blank=True,
        null=True,
        help_text="Any accessibility requirements or special needs"
    )
    
    # Profile and media
    photo_url = models.URLField(
        blank=True,
        null=True,
        help_text="URL to member's profile photo"
    )
    
    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(blank=True, null=True)
    emergency_contact_relationship = models.CharField(
        max_length=50, 
        blank=True, 
        null=True
    )
    
    # Family relationship
    family = models.ForeignKey(
        'families.Family',  # String reference to avoid import issues
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='family_members'
    )
    
    # Administrative fields
    registration_date = models.DateTimeField(
        default=timezone.now,
        help_text="When the member was registered"
    )
    registration_source = models.CharField(
        max_length=20,
        choices=REGISTRATION_SOURCE_CHOICES,
        default='public_form'
    )
    
    is_active = models.BooleanField(
        default=True, 
        help_text="Whether the member is currently active"
    )
    
    last_updated = models.DateTimeField(auto_now=True)
    last_contact_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date of last contact with this member"
    )
    
    # Communication preferences
    communication_opt_in = models.BooleanField(
        default=True,
        help_text="Consent to receive communications"
    )
    marketing_consent = models.BooleanField(
        default=False,
        help_text="Consent to receive marketing communications"
    )
    
    # Privacy and consent
    privacy_policy_agreed = models.BooleanField(default=False)
    privacy_policy_agreed_date = models.DateTimeField(blank=True, null=True)
    
    # Notes and internal information
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="General notes about the member"
    )
    internal_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes not visible to the member"
    )
    
    # FIXED: Tracking fields using settings.AUTH_USER_MODEL
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_members',
        help_text="Admin user who registered this member"
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_members'
    )
    
    # Bulk import tracking
    import_batch_id = models.UUIDField(
        null=True, 
        blank=True,
        help_text="Batch ID if imported via bulk import"
    )
    import_row_number = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Row number from import file"
    )
    import_validation_overridden = models.BooleanField(
        default=False,
        help_text="Whether validation was overridden during import"
    )
    
    class Meta:
        ordering = ['-registration_date']
        verbose_name = 'Member'
        verbose_name_plural = 'Members'
        
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['registration_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['family']),
            models.Index(fields=['import_batch_id']),
        ]
        
        constraints = []
    
    def clean(self):
        """Model validation"""
        super().clean()
        
        # Validate birth date
        if self.date_of_birth and self.date_of_birth > timezone.now().date():
            raise ValidationError({'date_of_birth': 'Birth date cannot be in the future.'})
        
        # Validate privacy policy for certain sources
        if self.registration_source in ['public_form'] and not self.privacy_policy_agreed:
            raise ValidationError({
                'privacy_policy_agreed': 'Privacy policy agreement is required for public registrations.'
            })
        
        # Validate emergency contact completeness
        if self.emergency_contact_name and not self.emergency_contact_phone:
            raise ValidationError({
                'emergency_contact_phone': 'Emergency contact phone is required when emergency contact name is provided.'
            })

    def save(self, *args, **kwargs):
        """Override save method with conditional validation"""
        
        # Skip full_clean if only updating specific fields
        update_fields = kwargs.get('update_fields')
        if update_fields and set(update_fields).issubset({'family_id', 'updated_at'}):
            # Skip validation for simple reference updates
            super(Member, self).save(*args, **kwargs)
            return
        
        # Normal validation for other saves
        self.full_clean()
        super(Member, self).save(*args, **kwargs)
    
    @property
    def full_name(self):
        """Get the full name of the member"""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Get the preferred display name"""
        if self.preferred_name:
            return f"{self.preferred_name} {self.last_name}".strip()
        return self.full_name
    
    @property
    def age(self):
        """Calculate and return the member's age"""
        if not self.date_of_birth:
            return None
        
        today = timezone.now().date()
        age = today.year - self.date_of_birth.year
        
        # Adjust if birthday hasn't occurred this year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            age -= 1
            
        return age
    
    @property
    def age_group(self):
        """Get age group category"""
        age = self.age
        if age is None:
            return 'Unknown'
        elif age < 18:
            return 'Youth'
        elif age < 26:
            return '18-25'
        elif age < 41:
            return '26-40'
        elif age < 61:
            return '41-60'
        else:
            return '60+'
    
    @property
    def has_family(self):
        """Check if member belongs to a family"""
        return self.family is not None
    
    @property
    def contact_info(self):
        """Get primary contact information"""
        contacts = []
        if self.email:
            contacts.append(('Email', self.email))
        if self.phone:
            contacts.append(('Phone', str(self.phone)))
        return contacts
    
    def get_absolute_url(self):
        """Get the URL for this member"""
        return reverse('member-detail', kwargs={'pk': self.pk})


class MemberNote(models.Model):
    """Notes about members (admin only)"""
    
    NOTE_TYPE_CHOICES = [
        ('general', 'General Note'),
        ('pastoral', 'Pastoral Care'),
        ('administrative', 'Administrative'),
        ('prayer_request', 'Prayer Request'),
        ('follow_up', 'Follow Up Required'),
        ('medical', 'Medical Information'),
        ('emergency', 'Emergency Contact'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='member_notes'
    )
    title = models.CharField(max_length=200, blank=True)
    note = models.TextField(help_text="Note content")
    note_type = models.CharField(
        max_length=20,
        choices=NOTE_TYPE_CHOICES,
        default='general'
    )
    
    is_private = models.BooleanField(
        default=False,
        help_text="Private notes are only visible to senior staff"
    )
    is_confidential = models.BooleanField(
        default=False,
        help_text="Confidential notes require special permissions to view"
    )
    
    # FIXED: Using settings.AUTH_USER_MODEL
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_member_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Member Note'
        verbose_name_plural = 'Member Notes'
    
    def __str__(self):
        title = self.title or f"{self.note_type.replace('_', ' ').title()} Note"
        return f"{title} for {self.member.display_name}"


class MemberTag(models.Model):
    """Tags for categorizing members"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text="Hex color code for the tag (e.g., #FF5733)"
    )
    
    is_system_tag = models.BooleanField(
        default=False,
        help_text="System tags cannot be deleted by users"
    )
    
    # FIXED: Using settings.AUTH_USER_MODEL
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_member_tags'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Member Tag'
        verbose_name_plural = 'Member Tags'
    
    def __str__(self):
        return self.name


class MemberTagAssignment(models.Model):
    """Many-to-many relationship between members and tags"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='tag_assignments'
    )
    tag = models.ForeignKey(
        MemberTag,
        on_delete=models.CASCADE,
        related_name='member_assignments'
    )
    
    # FIXED: Using settings.AUTH_USER_MODEL
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.SET_NULL, 
        null=True,
        related_name='member_tag_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['member', 'tag']
        ordering = ['-assigned_at']
        verbose_name = 'Member Tag Assignment'
        verbose_name_plural = 'Member Tag Assignments'
    
    def __str__(self):
        return f"{self.member.display_name} - {self.tag.name}"


class BulkImportLog(models.Model):
    """Log of bulk import operations"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('completed_with_errors', 'Completed with Errors'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_id = models.UUIDField(unique=True, default=uuid.uuid4)
    filename = models.CharField(max_length=255)
    
    status = models.CharField(
        max_length=25, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    
    total_rows = models.PositiveIntegerField(default=0)
    successful_rows = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    skipped_rows = models.PositiveIntegerField(default=0)
    
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    error_summary = models.TextField(blank=True, null=True)
    import_summary = models.JSONField(default=dict, blank=True)
    
    # FIXED: Using settings.AUTH_USER_MODEL
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # FIXED: Use settings.AUTH_USER_MODEL
        on_delete=models.CASCADE,
        related_name='bulk_imports'
    )
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Bulk Import Log'
        verbose_name_plural = 'Bulk Import Logs'
    
    def __str__(self):
        return f"Import {self.filename} - {self.status}"
    
    @property
    def success_rate(self):
        """Calculate import success rate"""
        if self.total_rows == 0:
            return 0
        return (self.successful_rows / self.total_rows) * 100


class BulkImportError(models.Model):
    """Individual errors from bulk import operations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    import_log = models.ForeignKey(
        BulkImportLog,
        on_delete=models.CASCADE,
        related_name='import_errors'
    )
    
    row_number = models.PositiveIntegerField()
    field_name = models.CharField(max_length=100, blank=True, null=True)
    error_message = models.TextField()
    row_data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['row_number']
        verbose_name = 'Bulk Import Error'
        verbose_name_plural = 'Bulk Import Errors'
        
        indexes = [
            models.Index(fields=['import_log', 'row_number']),
        ]
    
    def __str__(self):
        return f"Row {self.row_number}: {self.error_message[:100]}"