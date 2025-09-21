# backend/churchconnect/families/views.py

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Family, FamilyRelationship
from .serializers import (
    FamilySerializer, FamilySummarySerializer, 
    FamilyRelationshipSerializer, AddMemberToFamilySerializer,
    FamilyStatisticsSerializer, CreateFamilySerializer,
    FamilyRelationshipSummarySerializer
)
from members.models import Member
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination


class FamilyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing families with comprehensive functionality
    as specified in the ChurchConnect DBMS documentation.
    
    Supports:
    - Full CRUD operations for families
    - Family member management
    - Search and filtering
    - Statistics and reporting
    - Bulk operations
    """
    
    queryset = Family.objects.select_related('primary_contact').prefetch_related(
        'family_relationships__member'
    )
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        'family_name', 
        'primary_contact__first_name', 
        'primary_contact__last_name',
        'primary_contact__email',
        'address',
        'notes'
    ]
    ordering_fields = ['family_name', 'created_at', 'updated_at']
    ordering = ['family_name']
    filterset_fields = {
        'primary_contact': ['exact'],
        'created_at': ['gte', 'lte', 'exact'],
        'updated_at': ['gte', 'lte', 'exact'],
    }

    def get_queryset(self):
        """Add annotations for computed fields used in ordering and filtering"""
        queryset = super().get_queryset()
        
        # Add computed fields for filtering and ordering
        queryset = queryset.annotate(
            member_count=models.Count('family_relationships'),
            children_count=models.Count(
                'family_relationships',
                filter=models.Q(family_relationships__relationship_type='child')
            ),
            adults_count=models.Count(
                'family_relationships',
                filter=models.Q(family_relationships__relationship_type__in=['head', 'spouse'])
            )
        )
        
        # Apply custom filters
        member_count_min = self.request.query_params.get('member_count_min')
        member_count_max = self.request.query_params.get('member_count_max')
        has_children = self.request.query_params.get('has_children')
        missing_primary_contact = self.request.query_params.get('missing_primary_contact')
        
        if member_count_min:
            queryset = queryset.filter(member_count__gte=int(member_count_min))
        if member_count_max:
            queryset = queryset.filter(member_count__lte=int(member_count_max))
        if has_children == 'true':
            queryset = queryset.filter(children_count__gt=0)
        elif has_children == 'false':
            queryset = queryset.filter(children_count=0)
        if missing_primary_contact == 'true':
            queryset = queryset.filter(primary_contact__isnull=True)
        
        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return FamilySummarySerializer
        elif self.action == 'create':
            return CreateFamilySerializer
        elif self.action == 'add_member':
            return AddMemberToFamilySerializer
        return FamilySerializer

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """
        Add a member to a family
        
        Expected payload:
        {
            "member_id": "uuid",
            "relationship_type": "head|spouse|child|dependent|other",
            "notes": "optional notes"
        }
        """
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
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Member not found'},
                    status=status.HTTP_404_NOT_FOUND
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
                
                return Response(
                    {'message': f'Member {member.get_full_name()} removed from family'},
                    status=status.HTTP_200_OK
                )
                
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
        """Get all members of a family with detailed information"""
        family = self.get_object()
        relationships = family.family_relationships.select_related('member').all()
        
        # Sort by relationship priority (head, spouse, children, dependents, others)
        relationships = sorted(relationships, key=lambda x: x.get_relationship_priority())
        
        serializer = FamilyRelationshipSerializer(relationships, many=True)
        return Response({
            'family': FamilySummarySerializer(family).data,
            'members': serializer.data,
            'summary': family.get_family_summary()
        })

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
                partial=True,
                context={'family': family}
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

    @action(detail=True, methods=['post'])
    def set_primary_contact(self, request, pk=None):
        """Set or change the primary contact for a family"""
        family = self.get_object()
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify member is part of this family
            relationship = FamilyRelationship.objects.get(
                family=family,
                member_id=member_id
            )
            
            # Update family's primary contact
            family.primary_contact = relationship.member
            family.save(update_fields=['primary_contact', 'updated_at'])
            
            return Response({
                'message': f'Primary contact set to {relationship.member.get_full_name()}',
                'primary_contact': {
                    'id': relationship.member.id,
                    'name': relationship.member.get_full_name(),
                    'email': relationship.member.email,
                    'phone': relationship.member.phone
                }
            })
            
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

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive family statistics"""
        
        # Basic family counts
        family_stats = Family.objects.aggregate(
            total_families=models.Count('id')
        )
        
        # Family size distributions
        families_with_counts = Family.objects.annotate(
            member_count=models.Count('family_relationships')
        )
        
        size_distributions = {
            'single_member_families': families_with_counts.filter(member_count=1).count(),
            'small_families': families_with_counts.filter(member_count__in=[2, 3]).count(),
            'medium_families': families_with_counts.filter(member_count__in=[4, 5]).count(),
            'large_families': families_with_counts.filter(member_count__gte=6).count(),
        }
        
        # Families with children
        families_with_children = Family.objects.filter(
            family_relationships__relationship_type='child'
        ).distinct().count()
        
        # Families without primary contact
        families_without_primary_contact = Family.objects.filter(
            primary_contact__isnull=True
        ).count()
        
        # Relationship type distributions
        relationship_stats = FamilyRelationship.objects.aggregate(
            total_heads_of_household=models.Count('id', filter=models.Q(relationship_type='head')),
            total_spouses=models.Count('id', filter=models.Q(relationship_type='spouse')),
            total_children=models.Count('id', filter=models.Q(relationship_type='child')),
            total_dependents=models.Count('id', filter=models.Q(relationship_type='dependent')),
            total_others=models.Count('id', filter=models.Q(relationship_type='other')),
        )
        
        # Average family size
        avg_size = families_with_counts.aggregate(
            avg_size=models.Avg('member_count')
        )['avg_size'] or 0

        # Growth statistics (families created in last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_families = Family.objects.filter(created_at__gte=thirty_days_ago).count()

        response_data = {
            **family_stats,
            **size_distributions,
            'families_with_children': families_with_children,
            'families_without_primary_contact': families_without_primary_contact,
            'average_family_size': round(avg_size, 2),
            'recent_families_30_days': recent_families,
            **relationship_stats
        }
        
        serializer = FamilyStatisticsSerializer(response_data)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Perform bulk operations on families"""
        operation = request.data.get('operation')
        family_ids = request.data.get('family_ids', [])
        
        if not operation or not family_ids:
            return Response(
                {'error': 'operation and family_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        families = Family.objects.filter(id__in=family_ids)
        
        if operation == 'delete':
            with transaction.atomic():
                # Update all members' family_id to None
                Member.objects.filter(family_id__in=family_ids).update(family_id=None)
                
                # Delete families
                deleted_count = families.count()
                families.delete()
                
                return Response({
                    'message': f'Successfully deleted {deleted_count} families',
                    'deleted_count': deleted_count
                })
        
        elif operation == 'export':
            # This would integrate with the export functionality
            return Response({
                'message': 'Export functionality would be implemented here',
                'family_count': families.count()
            })
        
        else:
            return Response(
                {'error': 'Invalid operation. Supported operations: delete, export'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def recent_families(self, request):
        """Get recently created families"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now() - timedelta(days=days)
        
        recent_families = self.get_queryset().filter(
            created_at__gte=since_date
        ).order_by('-created_at')
        
        page = self.paginate_queryset(recent_families)
        if page is not None:
            serializer = FamilySummarySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = FamilySummarySerializer(recent_families, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def families_needing_attention(self, request):
        """Get families that need attention (missing primary contact, etc.)"""
        issues = []
        
        # Families without primary contact
        no_primary_contact = Family.objects.filter(
            primary_contact__isnull=True
        ).values('id', 'family_name')
        
        for family in no_primary_contact:
            issues.append({
                'family_id': family['id'],
                'family_name': family['family_name'],
                'issue': 'Missing primary contact'
            })
        
        # Families without any members
        no_members = Family.objects.annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count=0).values('id', 'family_name')
        
        for family in no_members:
            issues.append({
                'family_id': family['id'],
                'family_name': family['family_name'],
                'issue': 'No members assigned'
            })
        
        # Families without head of household
        no_head = Family.objects.exclude(
            family_relationships__relationship_type='head'
        ).values('id', 'family_name')
        
        for family in no_head:
            issues.append({
                'family_id': family['id'],
                'family_name': family['family_name'],
                'issue': 'No head of household'
            })
        
        return Response({
            'issues': issues,
            'total_issues': len(issues)
        })

    def destroy(self, request, *args, **kwargs):
        """Override destroy to handle member family_id updates"""
        family = self.get_object()
        family_name = family.family_name
        member_count = family.member_count
        
        with transaction.atomic():
            # Update all family members' family_id to None
            Member.objects.filter(family_id=family.id).update(family_id=None)
            
            # Delete the family (relationships will cascade)
            family.delete()
            
        return Response({
            'message': f'Family "{family_name}" deleted successfully. {member_count} members updated.',
            'deleted_family': family_name,
            'members_updated': member_count
        }, status=status.HTTP_200_OK)


class FamilyRelationshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family relationships directly
    """
    
    queryset = FamilyRelationship.objects.select_related('family', 'member')
    serializer_class = FamilyRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        'member__first_name', 
        'member__last_name', 
        'family__family_name',
        'notes'
    ]
    ordering_fields = ['created_at', 'relationship_type']
    ordering = ['-created_at']
    filterset_fields = {
        'family': ['exact'],
        'relationship_type': ['exact'],
        'created_at': ['gte', 'lte', 'exact'],
    }

    def get_queryset(self):
        """Add custom filtering options"""
        queryset = super().get_queryset()
        
        # Filter by member age (if needed for children vs adults)
        adults_only = self.request.query_params.get('adults_only')
        children_only = self.request.query_params.get('children_only')
        
        if adults_only == 'true':
            queryset = queryset.filter(relationship_type__in=['head', 'spouse'])
        elif children_only == 'true':
            queryset = queryset.filter(relationship_type='child')
        
        return queryset

    def perform_create(self, serializer):
        """Override create to handle family assignment"""
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Override destroy to update member's family_id"""
        relationship = self.get_object()
        member_name = relationship.member.get_full_name()
        family_name = relationship.family.family_name
        
        with transaction.atomic():
            # Update member's family_id to None
            member = relationship.member
            member.family_id = None
            member.save(update_fields=['family_id'])
            
            # Delete the relationship
            relationship.delete()
            
        return Response({
            'message': f'{member_name} removed from family "{family_name}"',
            'member': member_name,
            'family': family_name
        }, status=status.HTTP_200_OK)