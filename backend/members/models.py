# members/models.py
import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from phonenumber_field.modelfields import PhoneNumberField

class Member(models.Model):
    """Church member model"""
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    CONTACT_METHOD_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('sms', 'SMS'),
        ('mail', 'Mail'),
        ('no_contact', 'No Contact'),
    ]
    
    REGISTRATION_SOURCE_CHOICES = [
        ('public_form', 'Public Form'),
        ('admin_portal', 'Admin Portal'),
        ('bulk_import', 'Bulk Import'),
        ('migration', 'Data Migration'),
        ('manual', 'Manual Entry'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    preferred_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    phone = PhoneNumberField()
    alternate_phone = PhoneNumberField(blank=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    
    # Address and contact preferences
    address = models.TextField(blank=True)
    preferred_contact_method = models.CharField(
        max_length=20, 
        choices=CONTACT_METHOD_CHOICES,
        default='email'
    )
    preferred_language = models.CharField(max_length=50, default='English')
    
    # Accessibility and special needs
    accessibility_needs = models.TextField(blank=True)
    
    # Profile and media
    photo_url = models.URLField(blank=True)
    
    # Family relationship - make it optional for now
    family = models.ForeignKey(
        'families.Family',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )
    
    # Emergency contact
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = PhoneNumberField(blank=True)
    
    # Administrative fields
    registration_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_contact_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    communication_opt_in = models.BooleanField(default=True)
    
    # Privacy policy agreement
    privacy_policy_agreed = models.BooleanField(default=False)
    privacy_policy_agreed_date = models.DateTimeField(null=True, blank=True)
    
    # NEW: Audit and admin tracking fields
    registration_source = models.CharField(
        max_length=20,
        choices=REGISTRATION_SOURCE_CHOICES,
        default='public_form'
    )
    registered_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_members'
    )
    last_modified_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_members'
    )
    
    # Bulk import tracking
    import_batch_id = models.UUIDField(null=True, blank=True)
    import_row_number = models.IntegerField(null=True, blank=True)
    import_validation_overridden = models.BooleanField(default=False)
    
    # Admin-only fields
    internal_notes = models.TextField(
        blank=True,
        help_text="Internal notes not visible to the member"
    )
    
    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['registration_date']),
            models.Index(fields=['is_active']),
            models.Index(fields=['import_batch_id']),
        ]
        verbose_name = 'Member'
        verbose_name_plural = 'Members'
    
    def __str__(self):
        return self.full_name
    
    @property
    def full_name(self):
        if self.preferred_name:
            return f"{self.preferred_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self):
        return self.preferred_name or self.first_name
    
    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = timezone.now().date()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def age_group(self):
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
    
    def save(self, *args, **kwargs):
        # Auto-set privacy policy agreed date when agreed
        if self.privacy_policy_agreed and not self.privacy_policy_agreed_date:
            self.privacy_policy_agreed_date = timezone.now()
        super().save(*args, **kwargs)

class MemberNote(models.Model):
    """Notes about members by admin users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='member_notes'
    )
    created_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.CASCADE,
        related_name='created_notes'
    )
    note = models.TextField()
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Member Note'
        verbose_name_plural = 'Member Notes'
    
    def __str__(self):
        return f"Note for {self.member.full_name} by {self.created_by.username}"

class MemberTag(models.Model):
    """Tags for categorizing members"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='member_tags'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Member Tag'
        verbose_name_plural = 'Member Tags'
    
    def __str__(self):
        return self.name

class MemberTagAssignment(models.Model):
    """Assignment of tags to members"""
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
    assigned_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tag_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['member', 'tag']
        ordering = ['-assigned_at']
        verbose_name = 'Member Tag Assignment'
        verbose_name_plural = 'Member Tag Assignments'
    
    def __str__(self):
        return f"{self.member.full_name} - {self.tag.name}"

class BulkImportLog(models.Model):
    """Log for bulk import operations"""
    
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('completed_with_errors', 'Completed with Errors'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_id = models.UUIDField(default=uuid.uuid4, unique=True)
    uploaded_by = models.ForeignKey(
        'authentication.AdminUser',
        on_delete=models.CASCADE,
        related_name='bulk_imports'
    )
    filename = models.CharField(max_length=255)
    total_rows = models.IntegerField(default=0)
    successful_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='processing')
    error_summary = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Bulk Import Log'
        verbose_name_plural = 'Bulk Import Logs'
    
    def __str__(self):
        return f"Bulk import {self.batch_id} - {self.filename}"

class BulkImportError(models.Model):
    """Individual errors from bulk import operations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    import_log = models.ForeignKey(
        BulkImportLog,
        on_delete=models.CASCADE,
        related_name='import_errors'
    )
    row_number = models.IntegerField()
    field_name = models.CharField(max_length=100, blank=True)
    error_message = models.TextField()
    row_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['row_number']
        verbose_name = 'Bulk Import Error'
        verbose_name_plural = 'Bulk Import Errors'
    
    def __str__(self):
        return f"Error at row {self.row_number}: {self.error_message}"