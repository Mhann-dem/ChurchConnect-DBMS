from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Group, MemberGroup
from .serializers import (
    GroupSerializer,
    GroupCreateSerializer,
    AddMemberToGroupSerializer,
    MemberGroupSerializer
)
from members.models import Member

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['group_type', 'active']
    search_fields = ['name', 'description', 'leader_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'create':
            return GroupCreateSerializer
        return GroupSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        serializer = AddMemberToGroupSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                member = Member.objects.get(id=serializer.validated_data['member_id'])
                
                membership, created = MemberGroup.objects.get_or_create(
                    group=group,
                    member=member,
                    defaults={
                        'role': serializer.validated_data['role'],
                        'created_by': request.user
                    }
                )
                
                if not created:
                    return Response(
                        {'error': 'Member already in this group'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                return Response(
                    MemberGroupSerializer(membership).data,
                    status=status.HTTP_201_CREATED
                )
            
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Member not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        group = self.get_object()
        memberships = group.member_groups.all().select_related('member')
        serializer = MemberGroupSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        group = self.get_object()
        group.active = False
        group.save()
        return Response({'status': 'group deactivated'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        group = self.get_object()
        group.active = True
        group.save()
        return Response({'status': 'group activated'})