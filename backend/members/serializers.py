# members/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Member, MemberNote, MemberTag, MemberTagAssignment
from datetime import date

User = get_user_model()

class MemberTagSerializer(serializers.ModelSerializer):
    """Serializer for member tags"""
    class Meta:
        model = MemberTag
        fields = ['id', 'name', 'color', 'description', 'created_at']
        read_only_fields = ['created_at']

class MemberTagAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for member tag assignments"""
    tag = MemberTagSerializer(read_only=True)
    tag_id = serializers.UUIDField(write_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.display_name', read_only=True)
    
    class Meta:
        model = MemberTagAssignment
        fields = ['id', 'tag', 'tag_id', 'assigned_by_name', 'assigned_at']
        read_only_fields = ['assigned_at', 'assigned_by']

class MemberNoteSerializer(serializers.ModelSerializer):
    """Serializer for member notes"""
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    
    class Meta:
        model = MemberNote
        fields = [
            'id', 'note', 'is_private', 'created_by_name', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

class MemberSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for member lists"""
    age = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    age_group = serializers.ReadOnlyField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'display_name',
            'email', 'phone', 'age', 'age_group', 'gender', 'is_active',
            'registration_date'
        ]
    
    def get_age(self, obj):
        return obj.age

class FamilySummarySerializer(serializers.Serializer):
    """Placeholder for family summary - implement when families app is created"""
    id = serializers.UUIDField()
    family_name = serializers.CharField()
    
    def to_representation(self, instance):
        if instance is None:
            return None
        return {
            'id': str(instance.id) if hasattr(instance, 'id') else None,
            'family_name': getattr(instance, 'family_name', 'Unknown Family')
        }

class MemberSerializer(serializers.ModelSerializer):
    """Full serializer for member details"""
    family = FamilySummarySerializer(read_only=True)
    family_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    age_group = serializers.ReadOnlyField()
    member_notes = MemberNoteSerializer(many=True, read_only=True)
    tag_assignments = MemberTagAssignmentSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'first_name', 'last_name', 'preferred_name', 'full_name', 
            'display_name', 'email', 'phone', 'alternate_phone', 'date_of_birth',
            'age', 'age_group', 'gender', 'address', 'preferred_contact_method',
            'preferred_language', 'accessibility_needs', 'photo_url', 'family',
            'family_id', 'emergency_contact_name', 'emergency_contact_phone',
            'registration_date', 'last_updated', 'last_contact_date', 'notes',
            'is_active', 'communication_opt_in', 'privacy_policy_agreed',
            'privacy_policy_agreed_date', 'member_notes', 'tag_assignments', 'tags'
        ]
        read_only_fields = ['registration_date', 'last_updated']
    
    def get_tags(self, obj):
        """Get simplified tag list"""
        return [
            {
                'id': assignment.tag.id,
                'name': assignment.tag.name,
                'color': assignment.tag.color
            }
            for assignment in obj.tag_assignments.all()
        ]
    
    def validate_email(self, value):
        """Ensure email is unique, excluding current instance"""
        queryset = Member.objects.filter(email=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A member with this email already exists.")
        
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is not in the future"""
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
    
    def validate_privacy_policy_agreed(self, value):
        """Ensure privacy policy is agreed for new members"""
        if not self.instance and not value:
            raise serializers.ValidationError("Privacy policy must be agreed to register.")
        return value

class MemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating members (public form)"""
    confirm_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'email', 'confirm_email',
            'phone', 'alternate_phone', 'date_of_birth', 'gender', 'address',
            'preferred_contact_method', 'preferred_language', 'accessibility_needs',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'communication_opt_in', 'privacy_policy_agreed'
        ]
    
    def validate(self, data):
        """Validate email confirmation matches"""
        if data.get('email') != data.get('confirm_email'):
            raise serializers.ValidationError({
                'confirm_email': 'Email addresses must match.'
            })
        return data
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if Member.objects.filter(email=value).exists():
            raise serializers.ValidationError("A member with this email already exists.")
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        # Check if person is too young (under 13) for data collection
        age = date.today().year - value.year - (
            (date.today().month, date.today().day) < (value.month, value.day)
        )
        if age < 13:
            raise serializers.ValidationError(
                "Members must be at least 13 years old to register independently."
            )
        
        return value
    
    def validate_privacy_policy_agreed(self, value):
        """Ensure privacy policy is agreed"""
        if not value:
            raise serializers.ValidationError("Privacy policy must be agreed to register.")
        return value
    
    def create(self, validated_data):
        """Create member instance"""
        # Remove confirm_email from validated_data
        validated_data.pop('confirm_email', None)
        return super().create(validated_data)

class MemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating members"""
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'phone', 'alternate_phone',
            'date_of_birth', 'gender', 'address', 'preferred_contact_method',
            'preferred_language', 'accessibility_needs', 'photo_url',
            'emergency_contact_name', 'emergency_contact_phone', 'last_contact_date',
            'notes', 'is_active', 'communication_opt_in'
        ]
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is not in the future"""
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

class MemberExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting member data"""
    family_name = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'email', 'phone',
            'date_of_birth', 'age', 'gender', 'address', 'preferred_contact_method',
            'preferred_language', 'family_name', 'registration_date', 'is_active'
        ]
    
    def get_family_name(self, obj):
        return obj.family.family_name if obj.family else None

class MemberStatsSerializer(serializers.Serializer):
    """Serializer for member statistics"""
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    inactive_members = serializers.IntegerField()
    recent_registrations = serializers.IntegerField()
    members_with_families = serializers.IntegerField()
    members_without_families = serializers.IntegerField()
    
    # Demographics
    gender_distribution = serializers.ListField()
    age_ranges = serializers.DictField()
    
    # Preferences
    communication_methods = serializers.ListField()
    
    # Growth
    last_30_days = serializers.IntegerField()