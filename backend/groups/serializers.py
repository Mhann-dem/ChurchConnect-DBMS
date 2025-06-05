from rest_framework import serializers
from .models import Group, MemberGroup
from members.serializers import MemberSerializer

class MemberGroupSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    
    class Meta:
        model = MemberGroup
        fields = '__all__'
        read_only_fields = ('join_date', 'created_by')

class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by')

    def get_members(self, obj):
        memberships = obj.member_groups.all().select_related('member')
        return MemberGroupSerializer(memberships, many=True).data

    def get_member_count(self, obj):
        return obj.member_groups.count()

class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        exclude = ('created_by', 'created_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class AddMemberToGroupSerializer(serializers.Serializer):
    member_id = serializers.UUIDField()
    role = serializers.CharField()

    def validate_role(self, value):
        if value not in dict(MemberGroup.ROLE_CHOICES):
            raise serializers.ValidationError("Invalid role")
        return value