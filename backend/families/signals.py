# backend/churchconnect/families/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import FamilyRelationship


@receiver(post_save, sender=FamilyRelationship)
def update_member_family_id(sender, instance, created, **kwargs):
    """Update member's family_id when a family relationship is created or updated"""
    if instance.member:
        instance.member.family_id = instance.family.id
        instance.member.save(update_fields=['family_id'])


@receiver(post_delete, sender=FamilyRelationship)
def clear_member_family_id(sender, instance, **kwargs):
    """Clear member's family_id when family relationship is deleted"""
    if instance.member:
        instance.member.family_id = None
        instance.member.save(update_fields=['family_id'])