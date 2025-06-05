from rest_framework import serializers
from .models import Family, FamilyRelationship
from members.serializers import MemberSerializer

class FamilyRelationshipSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    
    class Meta:
        model = FamilyRelationship
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by')

class FamilySerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    primary_contact = MemberSerializer(read_only=True)
    
    class Meta:
        model = Family
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def get_members(self, obj):
        relationships = obj.relationships.all().select_related('member')
        return FamilyRelationshipSerializer(relationships, many=True).data

class FamilyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        exclude = ('created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class FamilyAddMemberSerializer(serializers.Serializer):
    member_id = serializers.UUIDField()
    relationship_type = serializers.CharField()

    def validate_relationship_type(self, value):
        if value not in dict(FamilyRelationship.RELATIONSHIP_CHOICES):
            raise serializers.ValidationError("Invalid relationship type")
        return value