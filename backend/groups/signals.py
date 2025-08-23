# backend/churchconnect/groups/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

from .models import MemberGroupRelationship, Group
from members.models import Member

logger = logging.getLogger(__name__)


@receiver(post_save, sender=MemberGroupRelationship)
def membership_status_changed(sender, instance, created, **kwargs):
    """Handle membership status changes"""
    
    if created:
        logger.info(f"New membership created: {instance.member.get_full_name()} joined {instance.group.name}")
        
        # Send welcome email if status is active
        if instance.status == 'active':
            send_welcome_email(instance)
    
    else:
        # Check if status changed
        if hasattr(instance, '_original_status'):
            old_status = instance._original_status
            new_status = instance.status
            
            if old_status != new_status:
                logger.info(f"Membership status changed for {instance.member.get_full_name()} in {instance.group.name}: {old_status} -> {new_status}")
                
                if new_status == 'active' and old_status == 'pending':
                    send_approval_email(instance)
                elif new_status == 'declined':
                    send_declined_email(instance)


@receiver(post_save, sender=MemberGroupRelationship)
def track_original_status(sender, instance, **kwargs):
    """Track the original status for comparison"""
    instance._original_status = instance.status


@receiver(post_delete, sender=MemberGroupRelationship)
def membership_deleted(sender, instance, **kwargs):
    """Handle membership deletion"""
    logger.info(f"Membership deleted: {instance.member.get_full_name()} removed from {instance.group.name}")


@receiver(post_save, sender=Group)
def group_created_or_updated(sender, instance, created, **kwargs):
    """Handle group creation or updates"""
    
    if created:
        logger.info(f"New group created: {instance.name}")
        
        # Notify administrators about new group
        if hasattr(settings, 'ADMIN_EMAIL') and settings.ADMIN_EMAIL:
            try:
                send_mail(
                    subject=f'New Group Created: {instance.name}',
                    message=f'A new group "{instance.name}" has been created.\n\nDescription: {instance.description}\nLeader: {instance.get_leader_name()}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.ADMIN_EMAIL],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send new group notification: {e}")
    
    else:
        # Check if group was deactivated
        if hasattr(instance, '_original_is_active'):
            if instance._original_is_active and not instance.is_active:
                logger.info(f"Group deactivated: {instance.name}")
                notify_members_group_deactivated(instance)


@receiver(post_save, sender=Group)
def track_original_group_status(sender, instance, **kwargs):
    """Track the original group status"""
    instance._original_is_active = instance.is_active


def send_welcome_email(membership):
    """Send welcome email to new group member"""
    if not membership.member.email:
        return
    
    try:
        subject = f'Welcome to {membership.group.name}!'
        message = f"""
Dear {membership.member.get_full_name()},

Welcome to {membership.group.name}! We're excited to have you as part of our group.

Group Details:
- Name: {membership.group.name}
- Description: {membership.group.description or 'No description available'}
- Meeting Schedule: {membership.group.meeting_schedule or 'To be announced'}
- Meeting Location: {membership.group.meeting_location or 'To be announced'}

If you have any questions, please don't hesitate to contact us.

Blessings,
{membership.group.get_leader_name()}
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[membership.member.email],
            fail_silently=True
        )
        
        logger.info(f"Welcome email sent to {membership.member.email}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")


def send_approval_email(membership):
    """Send approval notification email"""
    if not membership.member.email:
        return
    
    try:
        subject = f'Your request to join {membership.group.name} has been approved!'
        message = f"""
Dear {membership.member.get_full_name()},

Great news! Your request to join {membership.group.name} has been approved.

You are now an active member of the group. Here are the group details:

Group Details:
- Name: {membership.group.name}
- Description: {membership.group.description or 'No description available'}
- Meeting Schedule: {membership.group.meeting_schedule or 'To be announced'}
- Meeting Location: {membership.group.meeting_location or 'To be announced'}

We look forward to seeing you at our next meeting!

Blessings,
{membership.group.get_leader_name()}
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[membership.member.email],
            fail_silently=True
        )
        
        logger.info(f"Approval email sent to {membership.member.email}")
        
    except Exception as e:
        logger.error(f"Failed to send approval email: {e}")


def send_declined_email(membership):
    """Send declined notification email"""
    if not membership.member.email:
        return
    
    try:
        subject = f'Update on your request to join {membership.group.name}'
        message = f"""
Dear {membership.member.get_full_name()},

Thank you for your interest in joining {membership.group.name}.

Unfortunately, we are unable to approve your request at this time. This could be due to group capacity, specific requirements, or other factors.

Please don't hesitate to reach out to us if you have any questions or would like to discuss other opportunities to get involved.

Blessings,
{membership.group.get_leader_name()}
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[membership.member.email],
            fail_silently=True
        )
        
        logger.info(f"Declined notification sent to {membership.member.email}")
        
    except Exception as e:
        logger.error(f"Failed to send declined email: {e}")


def notify_members_group_deactivated(group):
    """Notify all active members when group is deactivated"""
    active_members = MemberGroupRelationship.objects.filter(
        group=group,
        is_active=True,
        status='active',
        member__email__isnull=False
    ).select_related('member')
    
    for membership in active_members:
        try:
            subject = f'Important Update: {group.name} Group Status'
            message = f"""
Dear {membership.member.get_full_name()},

We wanted to inform you that the {group.name} group has been temporarily deactivated.

This means that group activities and meetings are currently on hold. We will notify you as soon as the group becomes active again or if there are any alternative arrangements.

If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your understanding.

Blessings,
Church Administration
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[membership.member.email],
                fail_silently=True
            )
            
        except Exception as e:
            logger.error(f"Failed to send deactivation notice to {membership.member.email}: {e}")
    
    if active_members:
        logger.info(f"Deactivation notifications sent to {active_members.count()} members of {group.name}")