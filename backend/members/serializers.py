from rest_framework import serializers
from .models import Member
from django.contrib.auth import get_user_model

User = get_user_model()

class MemberSummarySerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'age']
    
    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
class MemberSerializer(serializers.ModelSerializer):
    # family = FamilySerializer(read_only=True)  # Remove this line
    family = serializers.SerializerMethodField()  # Add this line
    age = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField()
    
    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ('registration_date', 'last_updated', 'created_by')
    
    def get_family(self, obj):
        if obj.family:
            # Import inside the method to avoid circular import
            from families.serializers import FamilySummarySerializer
            return FamilySummarySerializer(obj.family).data
        return None
    
    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None

class MemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        exclude = ('created_by', 'registration_date', 'last_updated')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class MemberExportSerializer(serializers.ModelSerializer):
    family_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = (
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 
            'gender', 'address', 'family_name', 'registration_date'
        )
    
    def get_family_name(self, obj):
        return obj.family.family_name if obj.family else None