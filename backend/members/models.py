# backend/members/models.py
from django.db import models
from django.contrib.auth import get_user_model
import uuid

class Member(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    
    CONTACT_METHOD_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('sms', 'SMS'),
        ('mail', 'Mail'),
        ('no_contact', 'No Contact'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    preferred_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    address = models.TextField(blank=True, null=True)
    preferred_contact_method = models.CharField(
        max_length=20, 
        choices=CONTACT_METHOD_CHOICES,
        default='email'
    )
    preferred_language = models.CharField(max_length=50, default='English')
    accessibility_needs = models.TextField(blank=True, null=True)
    photo_url = models.URLField(blank=True, null=True)
    family = models.ForeignKey(
        'families.Family', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )
    registration_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_contact_date = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    communication_opt_in = models.BooleanField(default=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(
        get_user_model(), 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_members'
    )
    
    class Meta:
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"