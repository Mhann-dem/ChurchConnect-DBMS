# members/models.py
import uuid
from django.db import models
from django.utils import timezone
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
    
    # Family relationship
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
    
    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['registration_date']),
            models.Index(fields=['is_active']),
        ]
    
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
    
    def __str__(self):
        return f"Note for {self.member.full_name} by {self.created_by.display_name}"
