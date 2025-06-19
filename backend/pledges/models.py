# ==============================================================================
# pledges/models.py
# ==============================================================================
import uuid
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from members.models import Member


class Pledge(models.Model):
    """
    Model representing a financial pledge made by a church member
    """
    FREQUENCY_CHOICES = [
        ('one-time', 'One Time'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('paused', 'Paused'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        Member, 
        on_delete=models.CASCADE, 
        related_name='pledges',
        help_text="Member making the pledge"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Pledge amount"
    )
    frequency = models.CharField(
        max_length=20, 
        choices=FREQUENCY_CHOICES,
        help_text="How often the pledge is made"
    )
    start_date = models.DateField(help_text="When the pledge starts")
    end_date = models.DateField(
        null=True, 
        blank=True,
        help_text="When the pledge ends (optional for ongoing pledges)"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        help_text="Current status of the pledge"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about the pledge"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Tracking fields
    total_pledged = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total amount pledged over the commitment period"
    )
    total_received = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Total amount actually received"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pledge'
        verbose_name_plural = 'Pledges'
        indexes = [
            models.Index(fields=['member', 'status']),
            models.Index(fields=['frequency', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.member.get_full_name()} - ${self.amount} ({self.frequency})"

    @property
    def is_active(self):
        """Check if pledge is currently active"""
        return self.status == 'active'

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on received vs pledged"""
        if self.total_pledged == 0:
            return 0
        return min(100, (self.total_received / self.total_pledged) * 100)

    def calculate_annual_amount(self):
        """Calculate annual pledge amount based on frequency"""
        frequency_multipliers = {
            'one-time': 1,
            'weekly': 52,
            'monthly': 12,
            'quarterly': 4,
            'annually': 1,
        }
        return self.amount * frequency_multipliers.get(self.frequency, 1)

    def save(self, *args, **kwargs):
        """Override save to calculate total_pledged"""
        if self.frequency != 'one-time' and self.start_date and self.end_date:
            # Calculate total based on date range and frequency
            days = (self.end_date - self.start_date).days
            if self.frequency == 'weekly':
                periods = days // 7
            elif self.frequency == 'monthly':
                periods = days // 30  # Approximate
            elif self.frequency == 'quarterly':
                periods = days // 90  # Approximate
            elif self.frequency == 'annually':
                periods = days // 365
            else:
                periods = 1
            
            self.total_pledged = self.amount * max(1, periods)
        elif self.frequency == 'one-time':
            self.total_pledged = self.amount
        
        super().save(*args, **kwargs)


class PledgePayment(models.Model):
    """
    Model to track individual payments against pledges
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('online', 'Online Payment'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pledge = models.ForeignKey(
        Pledge, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHOD_CHOICES,
        default='cash'
    )
    reference_number = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Check number, transaction ID, etc."
    )
    notes = models.TextField(blank=True)
    recorded_by = models.CharField(
        max_length=100,
        help_text="Who recorded this payment"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']
        verbose_name = 'Pledge Payment'
        verbose_name_plural = 'Pledge Payments'

    def __str__(self):
        return f"{self.pledge.member.get_full_name()} - ${self.amount} on {self.payment_date}"
