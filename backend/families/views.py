# backend/churchconnect/families/views.py - RATE LIMITING FIXED

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models, IntegrityError
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
import logging

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

logger = logging.getLogger(__name__)

class FamilyViewSet(viewsets.ModelViewSet):
    """
    Enhanced ViewSet for managing families with rate limiting removed
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
    
    # REMOVED throttle_classes to fix 429 errors

    def get_queryset(self):
        """Enhanced queryset with better annotations"""
        try:
            queryset = super().get_queryset()
            
            # Add computed fields for filtering and ordering
            queryset = queryset.annotate(
                member_count=models.Count('family_relationships', distinct=True),
                children_count=models.Count(
                    'family_relationships',
                    filter=models.Q(family_relationships__relationship_type='child'),
                    distinct=True
                ),
                adults_count=models.Count(
                    'family_relationships',
                    filter=models.Q(family_relationships__relationship_type__in=['head', 'spouse']),
                    distinct=True
                ),
                dependents_count=models.Count(
                    'family_relationships',
                    filter=models.Q(family_relationships__relationship_type='dependent'),
                    distinct=True
                )
            )
            
            # Apply custom filters with validation
            member_count_min = self.request.query_params.get('member_count_min')
            member_count_max = self.request.query_params.get('member_count_max')
            has_children = self.request.query_params.get('has_children')
            missing_primary_contact = self.request.query_params.get('missing_primary_contact')
            
            if member_count_min:
                try:
                    min_count = int(member_count_min)
                    if min_count >= 0:
                        queryset = queryset.filter(member_count__gte=min_count)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid member_count_min value: {member_count_min}")
                    
            if member_count_max:
                try:
                    max_count = int(member_count_max)
                    if max_count >= 0:
                        queryset = queryset.filter(member_count__lte=max_count)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid member_count_max value: {member_count_max}")
                    
            if has_children in ['true', 'false']:
                if has_children == 'true':
                    queryset = queryset.filter(children_count__gt=0)
                else:
                    queryset = queryset.filter(children_count=0)
                    
            if missing_primary_contact == 'true':
                queryset = queryset.filter(primary_contact__isnull=True)
            
            return queryset
            
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return super().get_queryset()

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
        """Add member to family with enhanced error handling"""
        try:
            family = self.get_object()
            serializer = AddMemberToFamilySerializer(
                data=request.data,
                context={'family_id': family.id, 'request': request}
            )
            
            if serializer.is_valid():
                try:
                    with transaction.atomic():
                        member = Member.objects.select_for_update().get(
                            id=serializer.validated_data['member_id']
                        )
                        
                        # Validate member isn't already in another family
                        if hasattr(member, 'family_relationship') and member.family_relationship:
                            return Response(
                                {'error': 'Member is already assigned to another family'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        # Validate relationship constraints
                        relationship_type = serializer.validated_data['relationship_type']
                        
                        if relationship_type == 'head':
                            if family.family_relationships.filter(relationship_type='head').exists():
                                return Response(
                                    {'error': 'Family already has a head of household'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                        
                        elif relationship_type == 'spouse':
                            if family.family_relationships.filter(relationship_type='spouse').exists():
                                return Response(
                                    {'error': 'Family already has a spouse'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                        
                        # Create family relationship
                        relationship = FamilyRelationship.objects.create(
                            family=family,
                            member=member,
                            relationship_type=relationship_type,
                            notes=serializer.validated_data.get('notes', '')
                        )
                        
                        # Update member's family_id
                        member.family_id = family.id
                        member.save(update_fields=['family_id'])
                        
                        logger.info(
                            f"Member {member.get_full_name()} added to family '{family.family_name}' "
                            f"as {relationship_type}"
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
                except IntegrityError as e:
                    logger.error(f"Integrity error adding member to family: {str(e)}")
                    return Response(
                        {'error': 'Database constraint violation. Member may already be assigned.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    logger.error(f"Unexpected error adding member to family: {str(e)}")
                    return Response(
                        {'error': 'Failed to add member to family'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error in add_member action: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'], url_path='remove-member/(?P<member_id>[^/.]+)')
    def remove_member(self, request, pk=None, member_id=None):
        """Remove member from family"""
        try:
            family = self.get_object()
            
            with transaction.atomic():
                try:
                    relationship = FamilyRelationship.objects.select_for_update().get(
                        family=family,
                        member_id=member_id
                    )
                    
                    member = relationship.member
                    member_name = member.get_full_name()
                    relationship_type = relationship.get_relationship_type_display()
                    
                    # Check if removing primary contact
                    if family.primary_contact and family.primary_contact.id == member.id:
                        family.primary_contact = None
                        family.save(update_fields=['primary_contact'])
                        logger.info(f"Primary contact cleared for family '{family.family_name}'")
                    
                    # Update member's family_id to None
                    member.family_id = None
                    member.save(update_fields=['family_id'])
                    
                    # Delete the relationship
                    relationship.delete()
                    
                    logger.info(
                        f"Member {member_name} ({relationship_type}) removed from family "
                        f"'{family.family_name}'"
                    )
                    
                    return Response(
                        {
                            'message': f'{member_name} removed from family',
                            'member_name': member_name,
                            'relationship_type': relationship_type
                        },
                        status=status.HTTP_200_OK
                    )
                    
                except FamilyRelationship.DoesNotExist:
                    return Response(
                        {'error': 'Member is not part of this family'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                    
        except Exception as e:
            logger.error(f"Error removing member from family: {str(e)}")
            return Response(
                {'error': 'Failed to remove member from family'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def set_primary_contact(self, request, pk=None):
        """Set or change the primary contact for a family"""
        try:
            family = self.get_object()
            member_id = request.data.get('member_id')
            
            if not member_id:
                return Response(
                    {'error': 'member_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                try:
                    # Verify member is part of this family
                    relationship = FamilyRelationship.objects.get(
                        family=family,
                        member_id=member_id
                    )
                    
                    # Update family's primary contact
                    family.primary_contact = relationship.member
                    family.save(update_fields=['primary_contact', 'updated_at'])
                    
                    logger.info(
                        f"Primary contact for family '{family.family_name}' set to "
                        f"{relationship.member.get_full_name()}"
                    )
                    
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
            logger.error(f"Error setting primary contact: {str(e)}")
            return Response(
                {'error': 'Failed to set primary contact'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive family statistics - NO RATE LIMITING"""
        try:
            # Basic family counts
            family_stats = Family.objects.aggregate(
                total_families=models.Count('id')
            )
            
            # Family size distributions
            families_with_counts = Family.objects.annotate(
                member_count=models.Count('family_relationships', distinct=True)
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
            avg_size_result = families_with_counts.aggregate(
                avg_size=models.Avg('member_count')
            )
            avg_size = round(avg_size_result['avg_size'] or 0, 2)

            # Growth statistics
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_families = Family.objects.filter(created_at__gte=thirty_days_ago).count()

            response_data = {
                **family_stats,
                **size_distributions,
                'families_with_children': families_with_children,
                'families_without_primary_contact': families_without_primary_contact,
                'average_family_size': avg_size,
                'recent_families_30_days': recent_families,
                **relationship_stats
            }
            
            serializer = FamilyStatisticsSerializer(response_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating family statistics: {str(e)}")
            return Response(
                {'error': 'Failed to generate statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Perform bulk operations on families"""
        try:
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
                    
                    logger.info(f"Bulk deleted {deleted_count} families")
                    
                    return Response({
                        'message': f'Successfully deleted {deleted_count} families',
                        'deleted_count': deleted_count
                    })
            
            elif operation == 'export':
                # Return summary data for export
                family_data = []
                for family in families.prefetch_related('family_relationships__member'):
                    family_info = FamilySummarySerializer(family).data
                    family_info['relationships'] = FamilyRelationshipSummarySerializer(
                        family.family_relationships.all(), many=True
                    ).data
                    family_data.append(family_info)
                
                return Response({
                    'message': 'Export data prepared',
                    'family_count': len(family_data),
                    'families': family_data
                })
            
            else:
                return Response(
                    {'error': 'Invalid operation. Supported operations: delete, export'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error in bulk operations: {str(e)}")
            return Response(
                {'error': 'Failed to perform bulk operation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Enhanced destroy with proper cleanup"""
        try:
            family = self.get_object()
            family_name = family.family_name
            member_count = family.member_count
            
            with transaction.atomic():
                # Update all family members' family_id to None
                Member.objects.filter(family_id=family.id).update(family_id=None)
                
                logger.info(f"Family '{family_name}' deleted. {member_count} members updated.")
                
                # Delete the family (relationships will cascade)
                family.delete()
                
            return Response({
                'message': f'Family "{family_name}" deleted successfully. {member_count} members updated.',
                'deleted_family': family_name,
                'members_updated': member_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error deleting family: {str(e)}")
            return Response(
                {'error': 'Failed to delete family'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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