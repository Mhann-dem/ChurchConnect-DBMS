from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Member
from .serializers import MemberSerializer, MemberCreateSerializer, MemberExportSerializer
from django.http import HttpResponse
import csv

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'is_active', 'communication_opt_in', 'family']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'preferred_name']
    ordering_fields = ['last_name', 'first_name', 'registration_date']
    ordering = ['last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return MemberCreateSerializer
        return MemberSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def export(self, request):
        members = self.filter_queryset(self.get_queryset())
        serializer = MemberExportSerializer(members, many=True)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="members_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(serializer.child.get_fields().keys())
        
        for member in serializer.data:
            writer.writerow(member.values())
        
        return response

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        member = self.get_object()
        member.is_active = False
        member.save()
        return Response({'status': 'member deactivated'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        member = self.get_object()
        member.is_active = True
        member.save()
        return Response({'status': 'member activated'})