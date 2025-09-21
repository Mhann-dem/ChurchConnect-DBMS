# backend/churchconnect/families/signals.py

# Note: The original signals were redundant because the same logic
# is already implemented in the FamilyRelationship model's save() method
# and in the view's destroy() method.

# If you want to keep signals for consistency or additional functionality,
# you can uncomment the code below. However, it's recommended to use
# the model's save() method approach for better maintainability.

"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import FamilyRelationship


@receiver(post_save, sender=FamilyRelationship)
def update_member_family_id(sender, instance, created, **kwargs):
    '''Update member's family_id when a family relationship is created or updated'''
    if instance.member:
        instance.member.family_id = instance.family.id
        instance.member.save(update_fields=['family_id'])


@receiver(post_delete, sender=FamilyRelationship)
def clear_member_family_id(sender, instance, **kwargs):
    '''Clear member's family_id when family relationship is deleted'''
    if instance.member:
        instance.member.family_id = None
        instance.member.save(update_fields=['family_id'])
"""

# For now, we'll keep the signals file empty to avoid redundancy
# The same functionality is handled in the model's save() method