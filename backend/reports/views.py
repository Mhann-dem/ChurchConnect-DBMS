from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from members.models import Member
from pledges.models import Pledge
from groups.models import Group
from .serializers import ReportParamsSerializer
from django.http import HttpResponse
import csv
from io import StringIO
from datetime import datetime

class ReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_report_data(self, model, serializer_class, params):
        queryset = model.objects.all()
        
        if params.get('start_date'):
            queryset = queryset.filter(created_at__gte=params['start_date'])
        if params.get('end_date'):
            queryset = queryset.filter(created_at__lte=params['end_date'])
        
        serializer = serializer_class(queryset, many=True)
        return serializer.data

    def post(self, request, report_type):
        serializer = ReportParamsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        params = serializer.validated_data
        format = params.get('format', 'csv')
        
        if report_type == 'members':
            data = self.get_report_data(Member, MemberExportSerializer, params)
            filename = f"members_report_{datetime.now().strftime('%Y%m%d')}"
        elif report_type == 'pledges':
            data = self.get_report_data(Pledge, PledgeSerializer, params)
            filename = f"pledges_report_{datetime.now().strftime('%Y%m%d')}"
        elif report_type == 'groups':
            data = self.get_report_data(Group, GroupSerializer, params)
            filename = f"groups_report_{datetime.now().strftime('%Y%m%d')}"
        else:
            return Response(
                {'error': 'Invalid report type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            
            writer = csv.writer(response)
            if data:
                writer.writerow(data[0].keys())
                for row in data:
                    writer.writerow(row.values())
            
            return response
        
        return Response(data, status=status.HTTP_200_OK)