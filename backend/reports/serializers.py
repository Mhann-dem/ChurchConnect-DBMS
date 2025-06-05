from rest_framework import serializers
from members.serializers import MemberExportSerializer
from pledges.serializers import PledgeSerializer
from groups.serializers import GroupSerializer

class ReportParamsSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    format = serializers.ChoiceField(
        choices=['csv', 'json', 'pdf'],
        default='csv'
    )