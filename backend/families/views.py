from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Family, FamilyRelationship
from .serializers import (
    FamilySerializer,
    FamilyCreateSerializer,
    FamilyAddMemberSerializer,
    FamilyRelationshipSerializer
)
from members.models import Member

class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['family_name']
    search_fields = ['family_name', 'address']
    ordering_fields = ['family_name', 'created_at']
    ordering = ['family_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return FamilyCreateSerializer
        return FamilySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        family = self.get_object()
        serializer = FamilyAddMemberSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                member = Member.objects.get(id=serializer.validated_data['member_id'])
                
                # Check if member already belongs to a family
                if member.family and member.family != family:
                    return Response(
                        {'error': 'Member already belongs to another family'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create relationship
                relationship, created = FamilyRelationship.objects.get_or_create(
                    family=family,
                    member=member,
                    defaults={
                        'relationship_type': serializer.validated_data['relationship_type'],
                        'created_by': request.user
                    }
                )
                
                if not created:
                    return Response(
                        {'error': 'Member already in this family'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update member's family reference
                member.family = family
                member.save()
                
                return Response(
                    FamilyRelationshipSerializer(relationship).data,
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
        family = self.get_object()
        relationships = family.relationships.all().select_related('member')
        serializer = FamilyRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)