# members/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from datetime import date

User = get_user_model()

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'

class MemberListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'registration_date', 'is_active']

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
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = MemberTagAssignment
        fields = ['id', 'tag', 'tag_id', 'assigned_by_name', 'assigned_at']
        read_only_fields = ['assigned_at', 'assigned_by']

class MemberNoteSerializer(serializers.ModelSerializer):
    """Serializer for member notes"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
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
            'registration_date',
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

class MemberDetailSerializer(serializers.ModelSerializer):
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
    registered_by_name = serializers.CharField(source='registered_by.username', read_only=True)
    last_modified_by_name = serializers.CharField(source='last_modified_by.username', read_only=True)
    
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
            'privacy_policy_agreed_date', 'member_notes', 'tag_assignments', 'tags',
            'registration_source', 'registered_by_name', 'last_modified_by_name',
            'internal_notes', 'import_batch_id', 'import_validation_overridden'
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

# Rename the second MemberSerializer to avoid conflicts
MemberSerializer = MemberDetailSerializer

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
        
        # Set registration source
        validated_data['registration_source'] = 'public_form'
        
        return super().create(validated_data)

class MemberAdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating members - more flexible validation"""
    
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'email',
            'phone', 'alternate_phone', 'date_of_birth', 'gender', 'address',
            'preferred_contact_method', 'preferred_language', 'accessibility_needs',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'communication_opt_in', 'privacy_policy_agreed', 'is_active',
            'internal_notes', 'registration_source', 'registered_by',
            'import_batch_id', 'import_row_number'
        ]
    
    def validate_email(self, value):
        """Flexible email validation for admins"""
        admin_override = self.context.get('admin_override', False)
        
        queryset = Member.objects.filter(email=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists() and not admin_override:
            raise serializers.ValidationError("A member with this email already exists.")
        
        return value
    
    def validate_date_of_birth(self, value):
        """Flexible date validation for admins"""
        admin_override = self.context.get('admin_override', False)
        
        if value > date.today() and not admin_override:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
    
    def validate_privacy_policy_agreed(self, value):
        """Flexible privacy policy validation for admins"""
        admin_override = self.context.get('admin_override', False)
        
        # Admins can register members without explicit consent (for existing members, etc.)
        if not admin_override and not self.instance and not value:
            raise serializers.ValidationError("Privacy policy must be agreed to register.")
        return value
    
    def create(self, validated_data):
        """Create member with admin context"""
        if not validated_data.get('registration_source'):
            validated_data['registration_source'] = 'admin_portal'
            
        # Auto-agree privacy policy if admin is creating
        if not validated_data.get('privacy_policy_agreed'):
            validated_data['privacy_policy_agreed'] = True
            validated_data['privacy_policy_agreed_date'] = timezone.now()
            
        return super().create(validated_data)

class MemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating members"""
    last_modified_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'phone', 'alternate_phone',
            'date_of_birth', 'gender', 'address', 'preferred_contact_method',
            'preferred_language', 'accessibility_needs', 'photo_url',
            'emergency_contact_name', 'emergency_contact_phone', 'last_contact_date',
            'notes', 'is_active', 'communication_opt_in', 'internal_notes',
            'last_modified_by'
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

class BulkImportErrorSerializer(serializers.ModelSerializer):
    """Serializer for bulk import errors"""
    class Meta:
        model = BulkImportError
        fields = ['id', 'row_number', 'field_name', 'error_message', 'row_data', 'created_at']

class BulkImportLogSerializer(serializers.ModelSerializer):
    """Serializer for bulk import logs"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    import_errors = BulkImportErrorSerializer(many=True, read_only=True)
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkImportLog
        fields = [
            'id', 'batch_id', 'filename', 'total_rows', 'successful_rows', 
            'failed_rows', 'status', 'error_summary', 'started_at', 'completed_at',
            'uploaded_by_name', 'import_errors', 'success_rate'
        ]
    
    def get_success_rate(self, obj):
        if obj.total_rows == 0:
            return 0
        return round((obj.successful_rows / obj.total_rows) * 100, 2)

class BulkImportRequestSerializer(serializers.Serializer):
    """Serializer for bulk import requests"""
    file = serializers.FileField()
    skip_duplicates = serializers.BooleanField(default=True)
    admin_override = serializers.BooleanField(default=False)
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size too large. Maximum size is 10MB.")
        
        # Check file format
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError("Invalid file format. Please upload CSV or Excel files only.")
        
        return value

class BulkImportTemplateSerializer(serializers.Serializer):
    """Serializer for bulk import template information"""
    required_columns = serializers.ListField(child=serializers.CharField())
    optional_columns = serializers.ListField(child=serializers.CharField())
    gender_options = serializers.ListField(child=serializers.CharField())
    contact_method_options = serializers.ListField(child=serializers.CharField())
    date_format_examples = serializers.ListField(child=serializers.CharField())
    boolean_format_examples = serializers.ListField(child=serializers.CharField())

class MemberStatsSerializer(serializers.Serializer):
    """Serializer for member statistics"""
    summary = serializers.DictField()
    demographics = serializers.DictField()
    preferences = serializers.DictField()
    growth = serializers.DictField()