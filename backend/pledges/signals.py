# ==============================================================================
# pledges/signals.py
# ==============================================================================
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from .models import Pledge, PledgePayment, PledgeReminder


@receiver(post_save, sender=PledgePayment)
def update_pledge_totals_on_payment_save(sender, instance, created, **kwargs):
    """Update pledge totals when a payment is saved"""
    pledge = instance.pledge
    
    # Recalculate total received
    total_received = pledge.payments.aggregate(
        total=models.Sum('amount')
    )['total'] or Decimal('0.00')
    
    # Update pledge
    pledge.total_received = total_received
    
    # Check if pledge should be marked as completed
    if pledge.status == 'active' and pledge.total_received >= pledge.total_pledged:
        pledge.status = 'completed'
    
    # Save without triggering signals again
    pledge.save(update_fields=['total_received', 'status'])


@receiver(post_delete, sender=PledgePayment)
def update_pledge_totals_on_payment_delete(sender, instance, **kwargs):
    """Update pledge totals when a payment is deleted"""
    pledge = instance.pledge
    
    # Recalculate total received
    total_received = pledge.payments.aggregate(
        total=models.Sum('amount')
    )['total'] or Decimal('0.00')
    
    # Update pledge
    pledge.total_received = total_received
    
    # If pledge was completed but now has less than total pledged, make it active again
    if pledge.status == 'completed' and pledge.total_received < pledge.total_pledged:
        pledge.status = 'active'
    
    # Save without triggering signals again
    pledge.save(update_fields=['total_received', 'status'])


@receiver(pre_save, sender=Pledge)
def calculate_pledge_totals_on_save(sender, instance, **kwargs):
    """Calculate pledge totals before saving"""
    # Only calculate total_pledged if it's not already set or if key fields changed
    if instance.total_pledged == 0 or instance._state.adding:
        instance.total_pledged = instance.calculate_expected_total()


@receiver(post_save, sender=Pledge)
def create_initial_reminder_on_pledge_create(sender, instance, created, **kwargs):
    """Create an initial reminder when a new pledge is created"""
    if created and instance.status == 'active':
        # Create a welcome/confirmation reminder
        PledgeReminder.objects.create(
            pledge=instance,
            reminder_type='thank_you',
            reminder_method='email',
            message=f"Thank you for your pledge of ${instance.amount} ({instance.get_frequency_display().lower()}). "
                   f"We appreciate your commitment to supporting our church.",
            sent_by='System',
            sent_date=timezone.now()
        )


@receiver(post_save, sender=Pledge)
def handle_pledge_status_change(sender, instance, **kwargs):
    """Handle actions when pledge status changes"""
    if not instance._state.adding:  # Only for existing pledges
        # Get the old instance from the database to compare
        try:
            old_instance = Pledge.objects.get(pk=instance.pk)
            
            # If status changed to completed, create a completion reminder
            if old_instance.status != 'completed' and instance.status == 'completed':
                PledgeReminder.objects.create(
                    pledge=instance,
                    reminder_type='completion',
                    reminder_method='email',
                    message=f"Congratulations! You have completed your pledge of ${instance.total_pledged}. "
                           f"Thank you for your faithful giving.",
                    sent_by='System',
                    sent_date=timezone.now()
                )
            
            # If pledge was cancelled, create a cancellation note
            elif old_instance.status != 'cancelled' and instance.status == 'cancelled':
                # You might want to send a cancellation notification here
                pass
                
        except Pledge.DoesNotExist:
            # This shouldn't happen, but handle gracefully
            pass


# Custom signal for pledge milestone achievements
from django.dispatch import Signal

pledge_milestone_reached = Signal()

@receiver(pledge_milestone_reached)
def handle_pledge_milestone(sender, pledge, milestone_percentage, **kwargs):
    """Handle when a pledge reaches certain completion milestones"""
    milestone_messages = {
        25: "You're 25% of the way to completing your pledge! Thank you for your continued support.",
        50: "Halfway there! You've completed 50% of your pledge commitment.",
        75: "You're three-quarters of the way to completing your pledge. Thank you for your faithfulness!",
    }
    
    if milestone_percentage in milestone_messages:
        PledgeReminder.objects.create(
            pledge=pledge,
            reminder_type='thank_you',
            reminder_method='email',
            message=milestone_messages[milestone_percentage],
            sent_by='System',
            sent_date=timezone.now()
        )


# Helper function to trigger milestone signals
def check_and_trigger_milestones(pledge):
    """Check if pledge has reached any milestones and trigger appropriate signals"""
    if pledge.total_pledged > 0:
        completion_percentage = (pledge.total_received / pledge.total_pledged) * 100
        
        # Check for 25%, 50%, 75% milestones
        milestones = [25, 50, 75]
        for milestone in milestones:
            if completion_percentage >= milestone:
                # Check if we've already sent a reminder for this milestone
                existing_reminder = pledge.reminders.filter(
                    reminder_type='thank_you',
                    message__icontains=f'{milestone}%'
                ).exists()
                
                if not existing_reminder:
                    pledge_milestone_reached.send(
                        sender=Pledge,
                        pledge=pledge,
                        milestone_percentage=milestone
                    )


# Connect milestone checking to payment saves
@receiver(post_save, sender=PledgePayment)
def check_milestones_on_payment(sender, instance, created, **kwargs):
    """Check for milestone achievements when a payment is made"""
    if created:  # Only for new payments
        check_and_trigger_milestones(instance.pledge)