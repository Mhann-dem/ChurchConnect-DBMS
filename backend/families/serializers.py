# backend/churchconnect/families/serializers.py

from rest_framework import serializers
from .models import Family, FamilyRelationship
from members.serializers import MemberSummarySerializer


class FamilyRelationshipSerializer(serializers.ModelSerializer):
    member = MemberSummarySerializer(read_only=True)
    member_id = serializers.UUIDField(write_only=True)
    relationship_type_display = serializers.CharField(
        source='get_relationship_type_display', 
        read_only=True
    )

    class Meta:
        model = FamilyRelationship
        fields = [
            'id', 'member', 'member_id', 'relationship_type', 
            'relationship_type_display', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_member_id(self, value):
        from members.models import Member
        try:
            member = Member.objects.get(id=value)
            if hasattr(member, 'family_relationship'):
                raise serializers.ValidationError(
                    "This member is already assigned to a family."
                )
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist.")


class FamilySerializer(serializers.ModelSerializer):
    primary_contact = MemberSummarySerializer(read_only=True)
    primary_contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    family_relationships = FamilyRelationshipSerializer(many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    children_count = serializers.ReadOnlyField()
    adults_count = serializers.ReadOnlyField()

    class Meta:
        model = Family
        fields = [
            'id', 'family_name', 'primary_contact', 'primary_contact_id',
            'address', 'notes', 'created_at', 'updated_at',
            'family_relationships', 'member_count', 'children_count', 'adults_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_primary_contact_id(self, value):
        if value:
            from members.models import Member
            try:
                member = Member.objects.get(id=value)
                # Check if member is already primary contact for another family
                if hasattr(member, 'primary_families') and member.primary_families.exists():
                    existing_family = member.primary_families.first()
                    if existing_family.id != self.instance.id if self.instance else None:
                        raise serializers.ValidationError(
                            "This member is already a primary contact for another family."
                        )
                return value
            except Member.DoesNotExist:
                raise serializers.ValidationError("Member does not exist.")
        return value


class FamilySummarySerializer(serializers.ModelSerializer):
    primary_contact_name = serializers.CharField(
        source='primary_contact.get_full_name', 
        read_only=True
    )
    member_count = serializers.ReadOnlyField()

    class Meta:
        model = Family
        fields = [
            'id', 'family_name', 'primary_contact_name', 
            'member_count', 'created_at'
        ]


class AddMemberToFamilySerializer(serializers.Serializer):
    member_id = serializers.UUIDField()
    relationship_type = serializers.ChoiceField(
        choices=FamilyRelationship.RELATIONSHIP_CHOICES
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_member_id(self, value):
        from members.models import Member
        try:
            member = Member.objects.get(id=value)
            if hasattr(member, 'family_relationship'):
                raise serializers.ValidationError(
                    "This member is already assigned to a family."
                )
            return value
        except Member.DoesNotExist:
            raise serializers.ValidationError("Member does not exist.")

    def validate(self, attrs):
        # Check if trying to add another head of household
        if attrs.get('relationship_type') == 'head':
            family_id = self.context.get('family_id')
            if family_id:
                existing_head = FamilyRelationship.objects.filter(
                    family_id=family_id,
                    relationship_type='head'
                ).exists()
                
                if existing_head:
                    raise serializers.ValidationError(
                        "A family can only have one head of household."
                    )
        
        return attrs