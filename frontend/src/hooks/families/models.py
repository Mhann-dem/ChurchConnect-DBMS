# backend/churchconnect/families/models.py

import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Family(models.Model):
    # Core fields as per documentation
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family_name = models.CharField(max_length=255)
    primary_contact = models.ForeignKey(
        'members.Member',  # Use string reference to avoid circular import
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='primary_families',
        help_text="Primary contact for this family"
    )
    address = models.TextField(blank=True, null=True, help_text="Family address")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True, help_text="Additional notes about the family")

    class Meta:
        verbose_name = "Family"
        verbose_name_plural = "Families"
        ordering = ['family_name']
        indexes = [
            models.Index(fields=['family_name']),
            models.Index(fields=['created_at']),
            models.Index(fields=['primary_contact']),
        ]

    def __str__(self):
        return self.family_name

    def clean(self):
        """Validate the family data"""
        errors = {}
        
        if self.primary_contact and hasattr(self.primary_contact, 'family_id'):
            if self.primary_contact.family_id and self.primary_contact.family_id != self.id:
                errors['primary_contact'] = "Primary contact is already assigned to another family"
        
        if not self.family_name or not self.family_name.strip():
            errors['family_name'] = "Family name cannot be empty"
            
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def member_count(self):
        """Total number of members in the family"""
        return self.family_relationships.count()

    @property
    def children_count(self):
        """Number of children in the family"""
        return self.family_relationships.filter(relationship_type='child').count()

    @property
    def adults_count(self):
        """Number of adults (head and spouse) in the family"""
        return self.family_relationships.filter(
            relationship_type__in=['head', 'spouse']
        ).count()

    @property
    def dependents_count(self):
        """Number of dependents in the family"""
        return self.family_relationships.filter(relationship_type='dependent').count()

    @property
    def members(self):
        """Get all members in the family"""
        from members.models import Member
        return Member.objects.filter(family_id=self.id)

    def get_head_of_household(self):
        """Get the head of household for this family"""
        try:
            head_relationship = self.family_relationships.get(relationship_type='head')
            return head_relationship.member
        except FamilyRelationship.DoesNotExist:
            return None

    def get_spouse(self):
        """Get the spouse in this family"""
        try:
            spouse_relationship = self.family_relationships.get(relationship_type='spouse')
            return spouse_relationship.member
        except FamilyRelationship.DoesNotExist:
            return None

    def get_children(self):
        """Get all children in this family"""
        child_relationships = self.family_relationships.filter(relationship_type='child')
        return [rel.member for rel in child_relationships]

    def has_primary_contact(self):
        """Check if family has a primary contact"""
        return self.primary_contact is not None

    def get_contact_info(self):
        """Get primary contact information for the family"""
        if self.primary_contact:
            return {
                'name': self.primary_contact.get_full_name(),
                'email': self.primary_contact.email,
                'phone': self.primary_contact.phone,
                'preferred_contact': self.primary_contact.preferred_contact_method
            }
        return None

    def get_family_summary(self):
        """Get a summary of the family structure"""
        return {
            'family_name': self.family_name,
            'total_members': self.member_count,
            'adults': self.adults_count,
            'children': self.children_count,
            'dependents': self.dependents_count,
            'primary_contact': self.get_contact_info(),
            'created_date': self.created_at.date()
        }


class FamilyRelationship(models.Model):
    """Represents the relationship between a member and a family"""
    
    RELATIONSHIP_CHOICES = [
        ('head', 'Head of Household'),
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('dependent', 'Dependent'),
        ('other', 'Other'),
    ]

    # Core fields as per documentation
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        Family, 
        on_delete=models.CASCADE, 
        related_name='family_relationships',
        help_text="The family this relationship belongs to"
    )
    member = models.OneToOneField(
        'members.Member',  # Use string reference to avoid circular import
        on_delete=models.CASCADE, 
        related_name='family_relationship',
        help_text="The member in this relationship"
    )
    relationship_type = models.CharField(
        max_length=20, 
        choices=RELATIONSHIP_CHOICES,
        default='other',
        help_text="Type of relationship to the family"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes about this relationship"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['family', 'member']
        verbose_name = "Family Relationship"
        verbose_name_plural = "Family Relationships"
        ordering = ['relationship_type', 'created_at']
        indexes = [
            models.Index(fields=['family', 'relationship_type']),
            models.Index(fields=['member']),
            models.Index(fields=['relationship_type']),
        ]

    def __str__(self):
        return f"{self.member.get_full_name()} - {self.get_relationship_type_display()} in {self.family.family_name}"

    def clean(self):
        """Validate the relationship data"""
        errors = {}
        
        # Ensure only one head of household per family
        if self.relationship_type == 'head':
            existing_head = FamilyRelationship.objects.filter(
                family=self.family,
                relationship_type='head'
            ).exclude(id=self.id)
            
            if existing_head.exists():
                errors['relationship_type'] = "A family can only have one head of household"

        # Ensure member isn't already in another family
        if self.member_id:
            existing_relationship = FamilyRelationship.objects.filter(
                member=self.member
            ).exclude(id=self.id)
            
            if existing_relationship.exists():
                errors['member'] = "Member is already assigned to another family"

        # Business rule: Only one spouse per family
        if self.relationship_type == 'spouse':
            existing_spouse = FamilyRelationship.objects.filter(
                family=self.family,
                relationship_type='spouse'
            ).exclude(id=self.id)
            
            if existing_spouse.exists():
                errors['relationship_type'] = "A family can only have one spouse"

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Override save to ensure validation and update member family_id"""
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update member's family_id
        if self.member:
            self.member.family_id = self.family.id
            self.member.save(update_fields=['family_id'])

    def delete(self, *args, **kwargs):
        """Override delete to update member's family_id"""
        member = self.member
        super().delete(*args, **kwargs)
        
        # Clear member's family_id
        if member:
            member.family_id = None
            member.save(update_fields=['family_id'])

    def is_adult(self):
        """Check if this relationship represents an adult member"""
        return self.relationship_type in ['head', 'spouse']

    def is_child(self):
        """Check if this relationship represents a child member"""
        return self.relationship_type == 'child'

    def is_dependent(self):
        """Check if this relationship represents a dependent member"""
        return self.relationship_type == 'dependent'

    def get_relationship_priority(self):
        """Get priority order for sorting relationships"""
        priority_map = {
            'head': 1,
            'spouse': 2,
            'child': 3,
            'dependent': 4,
            'other': 5
        }
        return priority_map.get(self.relationship_type, 5)