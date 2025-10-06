# backend/churchconnect/families/serializers.py
import logging
from rest_framework import serializers
from django.db import transaction
from .models import Family, FamilyRelationship
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

class FamilyRelationshipSerializer(serializers.ModelSerializer):
    """Serializer for family relationships with full member details"""
    
    # Read-only fields for member information
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    member_email = serializers.EmailField(source='member.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_date_of_birth = serializers.DateField(source='member.date_of_birth', read_only=True)
    member_gender = serializers.CharField(source='member.get_gender_display', read_only=True)
    
    # Write-only field for adding members
    member_id = serializers.UUIDField(write_only=True, required=False)
    
    # Display fields
    relationship_type_display = serializers.CharField(
        source='get_relationship_type_display', 
        read_only=True
    )
    
    # Additional computed fields
    is_adult = serializers.BooleanField(read_only=True)
    is_child = serializers.BooleanField(read_only=True)
    relationship_priority = serializers.IntegerField(source='get_relationship_priority', read_only=True)

    class Meta:
        model = FamilyRelationship
        fields = [
            'id', 'member_id', 'member_name', 'member_email', 'member_phone',
            'member_date_of_birth', 'member_gender', 'relationship_type', 
            'relationship_type_display', 'notes', 'created_at', 'is_adult',
            'is_child', 'relationship_priority'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_member_id(self, value):
        """Validate that member exists and isn't already in a family"""
        if value:
            from members.models import Member
            try:
                member = Member.objects.get(id=value)
                if hasattr(member, 'family_relationship') and member.family_relationship:
                    raise serializers.ValidationError(
                        "This member is already assigned to a family."
                    )
                return value
            except Member.DoesNotExist:
                raise serializers.ValidationError("Member does not exist.")
        return value

    def validate(self, attrs):
        """Additional validation for family relationships"""
        relationship_type = attrs.get('relationship_type')
        family = self.context.get('family') or (self.instance.family if self.instance else None)
        
        if relationship_type and family:
            # Check for head of household constraint
            if relationship_type == 'head':
                existing_head = FamilyRelationship.objects.filter(
                    family=family,
                    relationship_type='head'
                )
                if self.instance:
                    existing_head = existing_head.exclude(id=self.instance.id)
                
                if existing_head.exists():
                    raise serializers.ValidationError({
                        'relationship_type': 'A family can only have one head of household.'
                    })
            
            # Check for spouse constraint
            elif relationship_type == 'spouse':
                existing_spouse = FamilyRelationship.objects.filter(
                    family=family,
                    relationship_type='spouse'
                )
                if self.instance:
                    existing_spouse = existing_spouse.exclude(id=self.instance.id)
                
                if existing_spouse.exists():
                    raise serializers.ValidationError({
                        'relationship_type': 'A family can only have one spouse.'
                    })
        
        return attrs


class FamilyRelationshipSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for family relationships in listings"""
    
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    relationship_type_display = serializers.CharField(
        source='get_relationship_type_display', 
        read_only=True
    )

    class Meta:
        model = FamilyRelationship
        fields = ['id', 'member_name', 'relationship_type', 'relationship_type_display']


class FamilySerializer(serializers.ModelSerializer):
    """Complete serializer for family with all relationships and details"""
    
    # Read-only primary contact information
    primary_contact_name = serializers.CharField(
        source='primary_contact.get_full_name', 
        read_only=True
    )
    primary_contact_email = serializers.EmailField(
        source='primary_contact.email', 
        read_only=True
    )
    primary_contact_phone = serializers.CharField(
        source='primary_contact.phone', 
        read_only=True
    )
    
    # Write-only field for setting primary contact
    primary_contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    # Family relationships
    family_relationships = FamilyRelationshipSummarySerializer(many=True, read_only=True)
    
    # Computed properties
    member_count = serializers.IntegerField(read_only=True)
    children_count = serializers.IntegerField(read_only=True)
    adults_count = serializers.IntegerField(read_only=True)
    dependents_count = serializers.IntegerField(read_only=True)
    
    # Family summary information
    family_summary = serializers.ReadOnlyField(source='get_family_summary')
    contact_info = serializers.ReadOnlyField(source='get_contact_info')
    
    # Head of household information
    head_of_household = serializers.SerializerMethodField()
    spouse_info = serializers.SerializerMethodField()

    class Meta:
        model = Family
        fields = [
            'id', 'family_name', 'primary_contact_id', 'primary_contact_name',
            'primary_contact_email', 'primary_contact_phone', 'address', 'notes',
            'created_at', 'updated_at', 'family_relationships', 'member_count',
            'children_count', 'adults_count', 'dependents_count', 'family_summary',
            'contact_info', 'head_of_household', 'spouse_info'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_head_of_household(self, obj):
        """Get head of household information"""
        head = obj.get_head_of_household()
        if head:
            return {
                'id': head.id,
                'name': head.full_name,  # REMOVE the ()
                'email': head.email,
                'phone': head.phone
            }
        return None

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_spouse_info(self, obj):
        """Get spouse information"""
        spouse = obj.get_spouse()
        if spouse:
            return {
                'id': spouse.id,
                'name': spouse.full_name,  # REMOVE the ()
                'email': spouse.email,
                'phone': spouse.phone
            }
        return None
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_family_summary(self, obj):
        return obj.get_family_summary()
    
    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_contact_info(self, obj):
        return obj.get_contact_info()

    def validate_primary_contact_id(self, value):
        """Validate primary contact assignment"""
        if value:
            from members.models import Member
            try:
                member = Member.objects.get(id=value)
                # Check if member is already primary contact for another family
                existing_primary = Family.objects.filter(primary_contact=member)
                if self.instance:
                    existing_primary = existing_primary.exclude(id=self.instance.id)
                
                if existing_primary.exists():
                    raise serializers.ValidationError(
                        "This member is already a primary contact for another family."
                    )
                return value
            except Member.DoesNotExist:
                raise serializers.ValidationError("Member does not exist.")
        return value

    def validate_family_name(self, value):
        """Validate family name is not empty and unique"""
        if not value or not value.strip():
            raise serializers.ValidationError("Family name cannot be empty.")
        
        # Check for duplicate family names (optional business rule)
        existing_family = Family.objects.filter(family_name__iexact=value.strip())
        if self.instance:
            existing_family = existing_family.exclude(id=self.instance.id)
        
        if existing_family.exists():
            raise serializers.ValidationError(
                "A family with this name already exists."
            )
        
        return value.strip()


class FamilySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for family listings"""
    
    primary_contact_name = serializers.CharField(
        source='primary_contact.get_full_name', 
        read_only=True
    )
    # These will come from annotations, not properties
    member_count = serializers.IntegerField(read_only=True)
    children_count = serializers.IntegerField(read_only=True)
    adults_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Family
        fields = [
            'id', 'family_name', 'primary_contact_name', 
            'member_count', 'children_count', 'adults_count', 'created_at'
        ]


class AddMemberToFamilySerializer(serializers.Serializer):
    """Serializer for adding a member to a family"""
    
    member_id = serializers.UUIDField()
    relationship_type = serializers.ChoiceField(
        choices=FamilyRelationship.RELATIONSHIP_CHOICES
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_member_id(self, value):
        """Validate member exists and isn't already in a family"""
        from members.models import Member
        try:
            member = Member.objects.get(id=value)
            if hasattr(member, 'family_relationship') and member.family_relationship:
                raise serializers.ValidationError(
                    "This member is already assigned to a family."
                )
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist.")

    def validate(self, attrs):
        """Validate family relationship constraints"""
        relationship_type = attrs.get('relationship_type')
        family_id = self.context.get('family_id')
        
        if relationship_type and family_id:
            # Check if trying to add another head of household
            if relationship_type == 'head':
                existing_head = FamilyRelationship.objects.filter(
                    family_id=family_id,
                    relationship_type='head'
                ).exists()
                
                if existing_head:
                    raise serializers.ValidationError({
                        'relationship_type': 'A family can only have one head of household.'
                    })
            
            # Check if trying to add another spouse
            elif relationship_type == 'spouse':
                existing_spouse = FamilyRelationship.objects.filter(
                    family_id=family_id,
                    relationship_type='spouse'
                ).exists()
                
                if existing_spouse:
                    raise serializers.ValidationError({
                        'relationship_type': 'A family can only have one spouse.'
                    })
        
        return attrs


class FamilyStatisticsSerializer(serializers.Serializer):
    """Serializer for family statistics"""
    
    total_families = serializers.IntegerField()
    single_member_families = serializers.IntegerField()
    large_families = serializers.IntegerField()
    average_family_size = serializers.FloatField()
    families_with_children = serializers.IntegerField()
    families_without_primary_contact = serializers.IntegerField()
    
    # Relationship type distributions
    total_heads_of_household = serializers.IntegerField()
    total_spouses = serializers.IntegerField()
    total_children = serializers.IntegerField()
    total_dependents = serializers.IntegerField()

class CreateFamilySerializer(serializers.ModelSerializer):
    """Serializer for creating families with initial members"""
    initial_members = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Family
        fields = ['id', 'family_name', 'address', 'notes', 'primary_contact_id', 'initial_members']
        read_only_fields = ['id']

    def validate_initial_members(self, value):
        """Validate initial members data"""
        if not value:
            return []
        
        for member_data in value:
            if 'member_id' not in member_data:
                raise serializers.ValidationError("Each member must have a member_id")
            if 'relationship_type' not in member_data:
                raise serializers.ValidationError("Each member must have a relationship_type")
            
            # Validate relationship type
            valid_types = ['head', 'spouse', 'child', 'dependent', 'other']
            if member_data['relationship_type'] not in valid_types:
                raise serializers.ValidationError(
                    f"Invalid relationship_type: {member_data['relationship_type']}"
                )
        
        return value

    def create(self, validated_data):
        """Create family with initial members"""
        from members.models import Member
        
        initial_members = validated_data.pop('initial_members', [])
        primary_contact_id = validated_data.pop('primary_contact_id', None)
        
        # Create the family
        family = Family.objects.create(**validated_data)
        
        # Add initial members
        for member_data in initial_members:
            member_id = member_data['member_id']
            relationship_type = member_data['relationship_type']
            notes = member_data.get('notes', '')
            
            try:
                member = Member.objects.get(id=member_id)
                
                # Create the relationship (this will update member.family_id via save())
                FamilyRelationship.objects.create(
                    family=family,
                    member=member,
                    relationship_type=relationship_type,
                    notes=notes
                )
                
            except Member.DoesNotExist:
                # Log but continue with other members
                logger.warning(f"Member {member_id} not found, skipping")
                continue
        
        # Set primary contact if provided
        if primary_contact_id:
            try:
                primary_contact = Member.objects.get(id=primary_contact_id)
                # Verify they're in the family
                if FamilyRelationship.objects.filter(family=family, member=primary_contact).exists():
                    family.primary_contact = primary_contact
                    family.save(update_fields=['primary_contact'])
            except Member.DoesNotExist:
                logger.warning(f"Primary contact {primary_contact_id} not found")
        
        return family