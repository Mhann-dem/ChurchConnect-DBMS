# backend/churchconnect/families/models.py

import uuid
from django.db import models
from django.core.exceptions import ValidationError
from members.models import Member


class Family(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family_name = models.CharField(max_length=255)
    primary_contact = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='primary_families'
    )
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Families"
        ordering = ['family_name']

    def __str__(self):
        return self.family_name

    def clean(self):
        if self.primary_contact and self.primary_contact.family_id and self.primary_contact.family_id != self.id:
            raise ValidationError("Primary contact is already assigned to another family")

    @property
    def member_count(self):
        return self.members.count()

    @property
    def children_count(self):
        return self.family_relationships.filter(relationship_type='child').count()

    @property
    def adults_count(self):
        return self.family_relationships.filter(
            relationship_type__in=['head', 'spouse']
        ).count()


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
        related_name='family_relationships'
    )
    member = models.OneToOneField(
        Member, 
        on_delete=models.CASCADE, 
        related_name='family_relationship'
    )
    relationship_type = models.CharField(
        max_length=20, 
        choices=RELATIONSHIP_CHOICES,
        default='other'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['family', 'member']
        verbose_name = "Family Relationship"
        verbose_name_plural = "Family Relationships"

    def __str__(self):
        return f"{self.member.get_full_name()} - {self.get_relationship_type_display()} in {self.family.family_name}"

    def clean(self):
        # Ensure only one head of household per family
        if self.relationship_type == 'head':
            existing_head = FamilyRelationship.objects.filter(
                family=self.family,
                relationship_type='head'
            ).exclude(id=self.id)
            
            if existing_head.exists():
                raise ValidationError("A family can only have one head of household")

        # Ensure member isn't already in another family
        if self.member_id:
            existing_relationship = FamilyRelationship.objects.filter(
                member=self.member
            ).exclude(id=self.id)
            
            if existing_relationship.exists():
                raise ValidationError("Member is already assigned to another family")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update member's family_id
        if self.member:
            self.member.family_id = self.family.id
            self.member.save(update_fields=['family_id'])