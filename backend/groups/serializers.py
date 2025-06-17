# backend/churchconnect/groups/serializers.py

from rest_framework import serializers
from .models import Group, MemberGroupRelationship, GroupCategory, GroupCategoryRelationship
from members.serializers import MemberSummarySerializer


class GroupCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupCategory
        fields = ['id', 'name', 'description', 'color', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class GroupCategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupCategory
        fields = ['id', 'name', 'color']


class MemberGroupRelationshipSerializer(serializers.ModelSerializer):
    member = MemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MemberGroupRelationship
        fields = [
            'id', 'member', 'member_id', 'role', 'role_display',
            'status', 'status_display', 'join_date', 'start_date',
            'end_date', 'is_active', 'notes'
        ]
        read_only_fields = ['id', 'join_date']

    def validate_member_id(self, value):
        from members.models import Member
        try:
            Member.objects.get(id=value)
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist.")

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError(
                    "End date cannot be before start date."
                )
        
        if attrs.get('end_date') and attrs.get('is_active'):
            raise serializers.ValidationError(
                "Membership cannot be active if end date is set."
            )
        
        return attrs


class GroupSerializer(serializers.ModelSerializer):
    leader = MemberSummarySerializer(read_only=True)
    leader_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    memberships = MemberGroupRelationshipSerializer(many=True, read_only=True)
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
            'meeting_schedule', 'meeting_location', 'contact_email', 'contact_phone',
            'max_capacity', 'is_active', 'is_public', 'requires_approval',
            'age_restriction', 'created_at', 'updated_at', 'memberships',
            'categories', 'category_ids', 'member_count', 'pending_requests_count',
            'is_full', 'available_spots'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_leader_id(self, value):
        if value:
            from members.models import Member
            try:
                Member.objects.get(id=value)
                return value
            except Member.DoesNotExist:
                raise serializers.ValidationError("Leader does not exist.")
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

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'leader_name_display', 'meeting_schedule',
            'member_count', 'max_capacity', 'is_active', 'is_public',
            'categories'
        ]

    def get_leader_name_display(self, obj):
        if obj.leader:
            return obj.leader.get_full_name()
        return obj.leader_name


class JoinGroupSerializer(serializers.Serializer):
    member_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=MemberGroupRelationship.ROLE_CHOICES,
        default='member'
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_member_id(self, value):
        from members.models import Member
        try:
            Member.objects.get(id=value)
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist.")

    def validate(self, attrs):
        group_id = self.context.get('group_id')
        member_id = attrs.get('member_id')
        
        if group_id and member_id:
            # Check if member is already in the group
            if MemberGroupRelationship.objects.filter(
                group_id=group_id,
                member_id=member_id,
                is_active=True
            ).exists():
                raise serializers.ValidationError(
                    "Member is already in this group."
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
        
        if attrs.get('end_date') and attrs.get('is_active'):
            raise serializers.ValidationError(
                "Membership cannot be active if end date is set."
            )
        
        return attrs