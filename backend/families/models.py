from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Family(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family_name = models.CharField(max_length=100)
    primary_contact = models.ForeignKey(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_contact_for'
    )
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_families'
    )

    class Meta:
        verbose_name_plural = "Families"
        ordering = ['family_name']

    def __str__(self):
        return self.family_name

class FamilyRelationship(models.Model):
    RELATIONSHIP_CHOICES = [
        ('head', 'Head of Household'),
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('dependent', 'Dependent'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='relationships'
    )
    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        related_name='family_relationships'
    )
    relationship_type = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_CHOICES,
        default='head'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        unique_together = ('family', 'member')
        ordering = ['family', 'relationship_type']

    def __str__(self):
        return f"{self.member} - {self.get_relationship_type_display()} of {self.family}"