# ==============================================================================
# pledges/models.py
# ==============================================================================
import uuid
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone
from datetime import datetime, timedelta
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
        help_text="Pledge amount per frequency period"
    )
    frequency = models.CharField(
        max_length=20, 
        choices=FREQUENCY_CHOICES,
        help_text="How often the pledge is made"
    )
    start_date = models.DateField(
        default=timezone.now,
        help_text="When the pledge starts"
    )
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
    
    # Auto-generated fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pledge'
        verbose_name_plural = 'Pledges'
        indexes = [
            models.Index(fields=['member', 'status']),
            models.Index(fields=['frequency', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'start_date']),
        ]

    def __str__(self):
        return f"{self.member.get_full_name()} - ${self.amount} ({self.get_frequency_display()})"

    @property
    def is_active(self):
        """Check if pledge is currently active"""
        return self.status == 'active'

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on received vs pledged"""
        if self.total_pledged == 0:
            return 0
        return min(100, float((self.total_received / self.total_pledged) * 100))

    @property
    def is_overdue(self):
        """Check if pledge is overdue"""
        if not self.end_date or self.status != 'active':
            return False
        return timezone.now().date() > self.end_date

    @property
    def remaining_amount(self):
        """Calculate remaining pledge amount"""
        return max(0, self.total_pledged - self.total_received)

    def calculate_annual_amount(self):
        """Calculate annual pledge amount based on frequency"""
        frequency_multipliers = {
            'one-time': 1,  # Special case - not really annual
            'weekly': 52,
            'monthly': 12,
            'quarterly': 4,
            'annually': 1,
        }
        return self.amount * frequency_multipliers.get(self.frequency, 1)

    def calculate_expected_total(self):
        """Calculate expected total based on start/end dates and frequency"""
        if self.frequency == 'one-time':
            return self.amount
        
        if not self.end_date:
            # For ongoing pledges, calculate based on one year from start
            end_date = self.start_date.replace(year=self.start_date.year + 1)
        else:
            end_date = self.end_date
        
        # Calculate number of periods between start and end date
        days = (end_date - self.start_date).days
        
        if self.frequency == 'weekly':
            periods = max(1, days // 7)
        elif self.frequency == 'monthly':
            periods = max(1, days // 30)  # Approximate
        elif self.frequency == 'quarterly':
            periods = max(1, days // 90)  # Approximate
        elif self.frequency == 'annually':
            periods = max(1, days // 365)
        else:
            periods = 1
        
        return self.amount * periods

    def update_totals(self):
        """Update total_pledged and total_received from related payments"""
        # Update total_received from payments
        total_payments = self.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.total_received = total_payments
        
        # Update total_pledged if not set
        if self.total_pledged == 0:
            self.total_pledged = self.calculate_expected_total()
        
        # Check if completed
        if self.total_received >= self.total_pledged and self.status == 'active':
            self.status = 'completed'

    def save(self, *args, **kwargs):
        """Override save to calculate total_pledged and update status"""
        # Calculate total_pledged if not set
        if self.total_pledged == 0:
            self.total_pledged = self.calculate_expected_total()
        
        # Update totals
        super().save(*args, **kwargs)
        self.update_totals()
        
        # Save again if totals changed
        if self._state.adding is False:
            super().save(update_fields=['total_received', 'status', 'updated_at'])


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
        ('mobile', 'Mobile Payment'),
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
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Payment amount"
    )
    payment_date = models.DateField(
        default=timezone.now,
        help_text="Date when payment was received"
    )
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
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about the payment"
    )
    recorded_by = models.CharField(
        max_length=100,
        help_text="Who recorded this payment",
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name = 'Pledge Payment'
        verbose_name_plural = 'Pledge Payments'
        indexes = [
            models.Index(fields=['pledge', 'payment_date']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.pledge.member.get_full_name()} - ${self.amount} on {self.payment_date}"

    def save(self, *args, **kwargs):
        """Override save to update pledge totals"""
        super().save(*args, **kwargs)
        # Update the related pledge's totals
        self.pledge.update_totals()

    def delete(self, *args, **kwargs):
        """Override delete to update pledge totals"""
        pledge = self.pledge
        super().delete(*args, **kwargs)
        # Update the related pledge's totals
        pledge.update_totals()


class PledgeReminder(models.Model):
    """
    Model to track pledge reminders sent to members
    """
    REMINDER_TYPE_CHOICES = [
        ('upcoming', 'Upcoming Payment'),
        ('overdue', 'Overdue Payment'),
        ('thank_you', 'Thank You'),
        ('completion', 'Pledge Completion'),
    ]
    
    REMINDER_METHOD_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('phone', 'Phone Call'),
        ('mail', 'Physical Mail'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pledge = models.ForeignKey(
        Pledge,
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    reminder_type = models.CharField(
        max_length=20,
        choices=REMINDER_TYPE_CHOICES
    )
    reminder_method = models.CharField(
        max_length=20,
        choices=REMINDER_METHOD_CHOICES
    )
    sent_date = models.DateTimeField(default=timezone.now)
    message = models.TextField(
        help_text="Content of the reminder sent"
    )
    sent_by = models.CharField(
        max_length=100,
        help_text="Who sent the reminder"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_date']
        verbose_name = 'Pledge Reminder'
        verbose_name_plural = 'Pledge Reminders'

    def __str__(self):
        return f"{self.get_reminder_type_display()} reminder for {self.pledge.member.get_full_name()}"