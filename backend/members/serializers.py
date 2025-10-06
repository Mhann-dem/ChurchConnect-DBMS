# members/serializers.py - FIXED: Removed duplicate code and syntax errors
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from datetime import date
from .validators import validate_and_format_phone
import logging
from rest_framework import serializers
from typing import Optional, Dict, Any, List
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

logger = logging.getLogger(__name__)

User = get_user_model()


def validate_phone_number(value):
    """Serializer-level phone validation using unified validator"""
    if not value or value == '':
        return ''  # Phone is OPTIONAL
    
    is_valid, formatted, error_message = validate_and_format_phone(str(value), 'GH')
    
    if not is_valid:
        logger.warning(f"Phone validation failed: {value} - {error_message}")
        raise serializers.ValidationError(error_message)
    
    return formatted if formatted else ''


class MemberCreateSerializer(serializers.ModelSerializer):
    """Public member creation - phone OPTIONAL"""
    confirm_email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'email', 'confirm_email',
            'phone', 'alternate_phone', 'date_of_birth', 'gender', 'address',
            'preferred_contact_method', 'preferred_language', 'accessibility_needs',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'communication_opt_in', 'privacy_policy_agreed'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            # === PHONE IS NOW OPTIONAL ===
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'alternate_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True, 'allow_null': True},
            'emergency_contact_name': {'required': False, 'allow_blank': True},
            'emergency_contact_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'notes': {'required': False, 'allow_blank': True},
            'internal_notes': {'required': False, 'allow_blank': True},
        }
    
    def validate_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_alternate_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_emergency_contact_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value is None:
            return None
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
    
    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")
        
        email = value.strip().lower()
        
        if Member.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A member with this email already exists.")
        
        return email
    
    def create(self, validated_data):
        if not validated_data.get('registration_source'):
            validated_data['registration_source'] = 'admin_portal'
        
        if not validated_data.get('privacy_policy_agreed'):
            validated_data['privacy_policy_agreed'] = True
            validated_data['privacy_policy_agreed_date'] = timezone.now()
        
        if 'request' in self.context and hasattr(self.context['request'], 'user'):
            validated_data.setdefault('registered_by', self.context['request'].user)
            validated_data.setdefault('last_modified_by', self.context['request'].user)
        
        return super().create(validated_data)


class MemberAdminCreateSerializer(serializers.ModelSerializer):
    """Admin member creation - very flexible"""
    
    class Meta:
        model = Member
        fields = [
            'first_name', 'last_name', 'preferred_name', 'email',
            'phone', 'alternate_phone', 'date_of_birth', 'gender', 'address',
            'preferred_contact_method', 'preferred_language', 'accessibility_needs',
            'emergency_contact_name', 'emergency_contact_phone', 'notes',
            'communication_opt_in', 'privacy_policy_agreed', 'is_active',
            'internal_notes', 'registration_source',
            'import_batch_id', 'import_row_number'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            # Everything else is OPTIONAL
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'alternate_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True, 'allow_null': True},
            'emergency_contact_name': {'required': False, 'allow_blank': True},
            'emergency_contact_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'notes': {'required': False, 'allow_blank': True},
            'internal_notes': {'required': False, 'allow_blank': True},
        }
    
    def validate_phone(self, value):
        """Very flexible phone validation for admin"""
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_alternate_phone(self, value):
        """Flexible alternate phone validation"""
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_emergency_contact_phone(self, value):
        """Flexible emergency contact phone validation"""
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_date_of_birth(self, value):
        """Very flexible date of birth validation for admin"""
        if value is None or value == '':
            return None
            
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        
        return value
    
    def validate_email(self, value):
        """Email validation for admin creation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")
        
        email = value.strip().lower()
        
        # Check if email already exists
        if Member.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A member with this email address already exists.")
        
        return email
    
    def validate_privacy_policy_agreed(self, value):
        """Flexible privacy policy validation for admins"""
        # Admin can override privacy policy requirement
        return True  # Always allow admin to create members
    
    def create(self, validated_data):
        """Create member with admin context"""
        if not validated_data.get('registration_source'):
            validated_data['registration_source'] = 'admin_portal'
            
        # Auto-agree privacy policy for admin creation
        if not validated_data.get('privacy_policy_agreed'):
            validated_data['privacy_policy_agreed'] = True
            validated_data['privacy_policy_agreed_date'] = timezone.now()
            
        # Set admin user if provided in context
        if 'request' in self.context and hasattr(self.context['request'], 'user'):
            validated_data.setdefault('registered_by', self.context['request'].user)
            validated_data.setdefault('last_modified_by', self.context['request'].user)
            
        logger.info(f"Admin creating member: {validated_data.get('email')}")
        return super().create(validated_data)


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


class FamilySummarySerializer(serializers.Serializer):
    """Placeholder for family summary"""
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


# Use MemberDetailSerializer as the main MemberSerializer
MemberSerializer = MemberDetailSerializer


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
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'alternate_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'date_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_blank': True},
            'emergency_contact_phone': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def validate_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_alternate_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_emergency_contact_phone(self, value):
        if not value:
            return None
        return validate_phone_number(value)
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is not in the future"""
        if value is None:
            return None
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
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size too large. Maximum size is 10MB.")
        
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError("Invalid file format. Please upload CSV or Excel files only.")
        
        return value


class MemberStatsSerializer(serializers.Serializer):
    """Serializer for member statistics"""
    summary = serializers.DictField()
    demographics = serializers.DictField()
    preferences = serializers.DictField()
    growth = serializers.DictField()


class BulkImportTemplateSerializer(serializers.Serializer):
    """Serializer for bulk import template generation"""
    format = serializers.ChoiceField(
        choices=[('csv', 'CSV'), ('xlsx', 'Excel')], 
        default='csv',
        help_text="Format for the template file"
    )
    include_examples = serializers.BooleanField(
        default=True,
        help_text="Include example rows in the template"
    )
    include_optional_fields = serializers.BooleanField(
        default=True,
        help_text="Include optional fields in the template"
    )

    def get_template_headers(self):
        """Get the headers for the bulk import template"""
        required_headers = [
            'first_name',
            'last_name', 
            'email'
        ]
        
        optional_headers = [
            'preferred_name',
            'phone',
            'alternate_phone',
            'date_of_birth',  # Format: YYYY-MM-DD
            'gender',
            'address',
            'preferred_contact_method',
            'preferred_language',
            'accessibility_needs',
            'emergency_contact_name',
            'emergency_contact_phone',
            'notes',
            'communication_opt_in',  # true/false
            'is_active'  # true/false
        ]
        
        if self.validated_data.get('include_optional_fields', True):
            return required_headers + optional_headers
        return required_headers

    def get_example_rows(self):
        """Get example rows for the template"""
        if not self.validated_data.get('include_examples', True):
            return []
            
        return [
            {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john.doe@example.com',
                'preferred_name': 'Johnny',
                'phone': '+1234567890',
                'date_of_birth': '1985-06-15',
                'gender': 'male',
                'address': '123 Main St, City, State 12345',
                'preferred_contact_method': 'email',
                'preferred_language': 'English',
                'emergency_contact_name': 'Jane Doe',
                'emergency_contact_phone': '+1234567891',
                'communication_opt_in': 'true',
                'is_active': 'true'
            },
            {
                'first_name': 'Mary',
                'last_name': 'Smith',
                'email': 'mary.smith@example.com',
                'phone': '+1987654321',
                'date_of_birth': '1992-03-22',
                'gender': 'female',
                'preferred_contact_method': 'phone',
                'communication_opt_in': 'true',
                'is_active': 'true'
            }
        ]