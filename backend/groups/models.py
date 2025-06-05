from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Group(models.Model):
    GROUP_TYPES = [
        ('ministry', 'Ministry'),
        ('small_group', 'Small Group'),
        ('committee', 'Committee'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES, default='ministry')
    leader_name = models.CharField(max_length=100, blank=True, null=True)
    meeting_schedule = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_groups'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class MemberGroup(models.Model):
    ROLE_CHOICES = [
        ('leader', 'Leader'),
        ('assistant', 'Assistant'),
        ('member', 'Member'),
        ('guest', 'Guest'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='member_groups'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    join_date = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        unique_together = ('member', 'group')
        ordering = ['group', '-join_date']

    def __str__(self):
        return f"{self.member} in {self.group} ({self.role})"