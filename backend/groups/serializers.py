# backend/churchconnect/groups/serializers.py

from rest_framework import serializers
from django.db import transaction
from .models import Group, MemberGroupRelationship, GroupCategory, GroupCategoryRelationship
from members.serializers import MemberSummarySerializer


class GroupCategorySerializer(serializers.ModelSerializer):
    group_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupCategory
        fields = ['id', 'name', 'description', 'color', 'is_active', 'created_at', 'group_count']
        read_only_fields = ['id', 'created_at']

    def get_group_count(self, obj):
        """Return the number of active groups in this category"""
        return obj.groups.filter(group__is_active=True).count()


class GroupCategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupCategory
        fields = ['id', 'name', 'color']


class MemberGroupRelationshipSerializer(serializers.ModelSerializer):
    member = MemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MemberGroupRelationship
        fields = [
            'id', 'member', 'member_id', 'group_name', 'role', 'role_display',
            'status', 'status_display', 'join_date', 'start_date',
            'end_date', 'is_active', 'notes'
        ]
        read_only_fields = ['id', 'join_date']

    def validate_member_id(self, value):
        from members.models import Member
        try:
            Member.objects.get(id=value, is_active=True)
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist or is inactive.")

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError(
                    "End date cannot be before start date."
                )
        
        if attrs.get('end_date') and attrs.get('is_active', True):
            raise serializers.ValidationError(
                "Membership cannot be active if end date is set."
            )
        
        return attrs


class GroupSerializer(serializers.ModelSerializer):
    leader = MemberSummarySerializer(read_only=True)
    leader_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    leader_name_display = serializers.SerializerMethodField()
    memberships = MemberGroupRelationshipSerializer(many=True, read_only=True)
    active_memberships = serializers.SerializerMethodField()
    categories = GroupCategorySummarySerializer(
        source='categories.category', many=True, read_only=True
    )
    category_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    member_count = serializers.ReadOnlyField()
    pending_requests_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    available_spots = serializers.ReadOnlyField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'leader_name', 'leader', 'leader_id',
            'leader_name_display', 'meeting_schedule', 'meeting_location', 
            'contact_email', 'contact_phone', 'max_capacity', 'is_active', 
            'is_public', 'requires_approval', 'age_restriction', 'created_at', 
            'updated_at', 'memberships', 'active_memberships', 'categories', 
            'category_ids', 'member_count', 'pending_requests_count',
            'is_full', 'available_spots'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_leader_name_display(self, obj):
        """Return the display name of the leader"""
        return obj.get_leader_name()

    def get_active_memberships(self, obj):
        """Return only active memberships"""
        active_memberships = obj.memberships.filter(is_active=True, status='active')
        return MemberGroupRelationshipSerializer(active_memberships, many=True).data

    def validate_leader_id(self, value):
        if value:
            from members.models import Member
            try:
                Member.objects.get(id=value, is_active=True)
                return value
            except Member.DoesNotExist:
                raise serializers.ValidationError("Leader does not exist or is inactive.")
        return value

    def validate_category_ids(self, value):
        if value:
            existing_categories = GroupCategory.objects.filter(
                id__in=value, is_active=True
            ).count()
            if existing_categories != len(value):
                raise serializers.ValidationError(
                    "One or more categories do not exist or are inactive."
                )
        return value

    def validate_max_capacity(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("Maximum capacity must be at least 1.")
        return value

    def validate(self, attrs):
        # If max_capacity is being set, ensure it's not less than current member count
        if self.instance and attrs.get('max_capacity'):
            current_member_count = self.instance.member_count
            if attrs['max_capacity'] < current_member_count:
                raise serializers.ValidationError(
                    f"Maximum capacity cannot be less than current member count ({current_member_count})."
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        group = super().create(validated_data)
        
        # Add categories
        for category_id in category_ids:
            GroupCategoryRelationship.objects.create(
                group=group,
                category_id=category_id
            )
        
        return group

    @transaction.atomic
    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        group = super().update(instance, validated_data)
        
        # Update categories if provided
        if category_ids is not None:
            # Remove existing categories
            GroupCategoryRelationship.objects.filter(group=group).delete()
            
            # Add new categories
            for category_id in category_ids:
                GroupCategoryRelationship.objects.create(
                    group=group,
                    category_id=category_id
                )
        
        return group


class GroupSummarySerializer(serializers.ModelSerializer):
    leader_name_display = serializers.SerializerMethodField()
    member_count = serializers.ReadOnlyField()
    categories = GroupCategorySummarySerializer(
        source='categories.category', many=True, read_only=True
    )
    is_full = serializers.ReadOnlyField()
    can_join_status = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'leader_name_display', 'meeting_schedule',
            'meeting_location', 'member_count', 'max_capacity', 'is_active', 
            'is_public', 'requires_approval', 'age_restriction', 'categories',
            'is_full', 'can_join_status'
        ]

    def get_leader_name_display(self, obj):
        return obj.get_leader_name()

    def get_can_join_status(self, obj):
        """Return whether the group can accept new members"""
        can_join, message = obj.can_join(None)  # General check without specific member
        return {
            'can_join': can_join and obj.is_active and obj.is_public and not obj.is_full,
            'message': message if not can_join else 'Available for joining'
        }


class JoinGroupSerializer(serializers.Serializer):
    member_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=MemberGroupRelationship.ROLE_CHOICES,
        default='member'
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_member_id(self, value):
        from members.models import Member
        try:
            Member.objects.get(id=value, is_active=True)
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist or is inactive.")

    def validate(self, attrs):
        group_id = self.context.get('group_id')
        member_id = attrs.get('member_id')
        
        if group_id and member_id:
            # Check if member is already in the group
            if MemberGroupRelationship.objects.filter(
                group_id=group_id,
                member_id=member_id
            ).exclude(status='declined').exists():
                raise serializers.ValidationError(
                    "Member is already in this group or has a pending request."
                )
        
        return attrs


class UpdateMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberGroupRelationship
        fields = ['role', 'status', 'start_date', 'end_date', 'is_active', 'notes']

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError(
                    "End date cannot be before start date."
                )
        
        if attrs.get('end_date') and attrs.get('is_active', True):
            raise serializers.ValidationError(
                "Membership cannot be active if end date is set."
            )
        
        return attrs


class GroupStatsSerializer(serializers.Serializer):
    """Serializer for group statistics"""
    total_groups = serializers.IntegerField()
    active_groups = serializers.IntegerField()
    public_groups = serializers.IntegerField()
    total_memberships = serializers.IntegerField()
    average_group_size = serializers.FloatField()
    categories = serializers.ListField()
    largest_group = serializers.DictField(required=False)
    newest_groups = serializers.ListField(required=False)