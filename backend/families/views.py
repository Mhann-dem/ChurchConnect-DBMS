# backend/churchconnect/families/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Family, FamilyRelationship
from .serializers import (
    FamilySerializer, FamilySummarySerializer, 
    FamilyRelationshipSerializer, AddMemberToFamilySerializer
)
from members.models import Member
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination


class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.select_related('primary_contact').prefetch_related(
        'family_relationships__member'
    )
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['family_name', 'primary_contact__first_name', 'primary_contact__last_name']
    ordering_fields = ['family_name', 'created_at', 'member_count']
    ordering = ['family_name']
    filterset_fields = ['primary_contact']

    def get_serializer_class(self):
        if self.action == 'list':
            return FamilySummarySerializer
        return FamilySerializer

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to a family"""
        family = self.get_object()
        serializer = AddMemberToFamilySerializer(
            data=request.data,
            context={'family_id': family.id}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    member = Member.objects.get(id=serializer.validated_data['member_id'])
                    
                    # Create family relationship
                    relationship = FamilyRelationship.objects.create(
                        family=family,
                        member=member,
                        relationship_type=serializer.validated_data['relationship_type'],
                        notes=serializer.validated_data.get('notes', '')
                    )
                    
                    return Response(
                        FamilyRelationshipSerializer(relationship).data,
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='remove-member/(?P<member_id>[^/.]+)')
    def remove_member(self, request, pk=None, member_id=None):
        """Remove a member from a family"""
        family = self.get_object()
        
        try:
            with transaction.atomic():
                relationship = FamilyRelationship.objects.get(
                    family=family,
                    member_id=member_id
                )
                
                # Update member's family_id to None
                member = relationship.member
                member.family_id = None
                member.save(update_fields=['family_id'])
                
                # Delete the relationship
                relationship.delete()
                
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except FamilyRelationship.DoesNotExist:
            return Response(
                {'error': 'Member is not part of this family'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a family"""
        family = self.get_object()
        relationships = family.family_relationships.all()
        serializer = FamilyRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-relationship/(?P<member_id>[^/.]+)')
    def update_relationship(self, request, pk=None, member_id=None):
        """Update a member's relationship type within a family"""
        family = self.get_object()
        
        try:
            relationship = FamilyRelationship.objects.get(
                family=family,
                member_id=member_id
            )
            
            serializer = FamilyRelationshipSerializer(
                relationship,
                data=request.data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except FamilyRelationship.DoesNotExist:
            return Response(
                {'error': 'Member is not part of this family'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get family statistics"""
        total_families = Family.objects.count()
        single_member_families = Family.objects.filter(
            family_relationships__isnull=False
        ).annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count=1).count()
        
        large_families = Family.objects.filter(
            family_relationships__isnull=False
        ).annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count__gte=5).count()

        return Response({
            'total_families': total_families,
            'single_member_families': single_member_families,
            'large_families': large_families,
            'average_family_size': Family.objects.aggregate(
                avg_size=models.Avg('family_relationships__count')
            )['avg_size'] or 0
        })

    def destroy(self, request, *args, **kwargs):
        """Override destroy to handle member family_id updates"""
        family = self.get_object()
        
        with transaction.atomic():
            # Update all family members' family_id to None
            Member.objects.filter(family_id=family.id).update(family_id=None)
            
            # Delete the family (relationships will cascade)
            family.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)


class FamilyRelationshipViewSet(viewsets.ModelViewSet):
    queryset = FamilyRelationship.objects.select_related('family', 'member')
    serializer_class = FamilyRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['member__first_name', 'member__last_name', 'family__family_name']
    ordering_fields = ['created_at', 'relationship_type']
    ordering = ['-created_at']
    filterset_fields = ['family', 'relationship_type']

    def destroy(self, request, *args, **kwargs):
        """Override destroy to update member's family_id"""
        relationship = self.get_object()
        
        with transaction.atomic():
            # Update member's family_id to None
            member = relationship.member
            member.family_id = None
            member.save(update_fields=['family_id'])
            
            # Delete the relationship
            relationship.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)