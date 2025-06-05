from rest_framework import serializers
from .models import Pledge
from members.serializers import MemberSerializer

class PledgeSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    created_by = serializers.StringRelatedField()
    
    class Meta:
        model = Pledge
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by')

class PledgeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pledge
        exclude = ('created_by', 'created_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class PledgeStatsSerializer(serializers.Serializer):
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    by_frequency = serializers.DictField()
    by_status = serializers.DictField()