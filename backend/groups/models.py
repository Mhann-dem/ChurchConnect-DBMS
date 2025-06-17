# backend/churchconnect/groups/models.py

import uuid
from django.db import models
from django.core.validators import MinLengthValidator
from members.models import Member


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=255, 
        validators=[MinLengthValidator(2)],
        help_text="Name of the group or ministry"
    )
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Detailed description of the group's purpose and activities"
    )
    leader_name = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Name of the group leader"
    )
    leader = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_groups',
        help_text="Group leader from member database"
    )
    meeting_schedule = models.CharField(
        max_length=500, 
        blank=True, 
        null=True,
        help_text="When and where the group meets"
    )
    meeting_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Physical or virtual meeting location"
    )
    contact_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Contact email for the group"
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Contact phone number for the group"
    )
    max_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of members (leave blank for unlimited)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the group is currently active"
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether the group is visible to members for joining"
    )
    requires_approval = models.BooleanField(
        default=False,
        help_text="Whether new members need approval to join"
    )
    age_restriction = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Age restrictions for the group (e.g., 'Adults only', 'Youth 13-18')"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_public']),
        ]

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()

    @property
    def pending_requests_count(self):
        return self.memberships.filter(status='pending').count()

    @property
    def is_full(self):
        if self.max_capacity:
            return self.member_count >= self.max_capacity
        return False

    @property
    def available_spots(self):
        if self.max_capacity:
            return max(0, self.max_capacity - self.member_count)
        return None

    def can_join(self, member):
        """Check if a member can join this group"""
        if not self.is_active or not self.is_public:
            return False, "Group is not available for joining"
        
        if self.is_full:
            return False, "Group is at maximum capacity"
        
        # Check if member is already in the group
        if self.memberships.filter(member=member, is_active=True).exists():
            return False, "Member is already in this group"
        
        return True, "Can join"


class MemberGroupRelationship(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
        ('declined', 'Declined'),
    ]

    ROLE_CHOICES = [
        ('member', 'Member'),
        ('leader', 'Leader'),
        ('co_leader', 'Co-Leader'),
        ('assistant', 'Assistant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        Member, 
        on_delete=models.CASCADE, 
        related_name='group_memberships'
    )
    group = models.ForeignKey(
        Group, 
        on_delete=models.CASCADE, 
        related_name='memberships'
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES,
        default='member'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    join_date = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="When the member officially started in this role"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="When the member left or role ended"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this membership is currently active"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this membership"
    )

    class Meta:
        unique_together = ['member', 'group']
        verbose_name = "Group Membership"
        verbose_name_plural = "Group Memberships"
        ordering = ['-join_date']

    def __str__(self):
        return f"{self.member.get_full_name()} - {self.group.name} ({self.get_role_display()})"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate end_date is after start_date
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date")
        
        # If end_date is set, membership should not be active
        if self.end_date and self.is_active:
            raise ValidationError("Membership cannot be active if end date is set")

    def deactivate(self, end_date=None):
        """Deactivate this membership"""
        from django.utils import timezone
        self.is_active = False
        self.status = 'inactive'
        self.end_date = end_date or timezone.now().date()
        self.save()

    def activate(self):
        """Activate this membership"""
        self.is_active = True
        self.status = 'active'
        self.end_date = None
        self.save()


class GroupCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text="Hex color code for category display"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Group Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class GroupCategoryRelationship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    category = models.ForeignKey(
        GroupCategory,
        on_delete=models.CASCADE,
        related_name='groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['group', 'category']
        verbose_name = "Group Category"
        verbose_name_plural = "Group Categories"

    def __str__(self):
        return f"{self.group.name} - {self.category.name}"