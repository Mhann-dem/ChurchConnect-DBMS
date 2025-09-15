# backend/churchconnect/groups/views.py - COMPLETE FIX

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
import logging
import uuid

from .models import Group, MemberGroupRelationship, GroupCategory
from .serializers import (
    GroupSerializer, GroupSummarySerializer, MemberGroupRelationshipSerializer,
    GroupCategorySerializer, JoinGroupSerializer, UpdateMembershipSerializer,
    GroupStatsSerializer
)
from members.models import Member
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.select_related('leader').prefetch_related(
        'memberships__member', 'categories__category'
    )
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'leader_name', 'leader__first_name', 'leader__last_name']
    ordering_fields = ['name', 'created_at', 'member_count', 'max_capacity']
    ordering = ['name']
    filterset_fields = ['is_active', 'is_public', 'requires_approval', 'leader', 'categories__category']

    def get_serializer_class(self):
        if self.action == 'list':
            return GroupSummarySerializer
        elif self.action in ['public', 'statistics']:
            return GroupSummarySerializer
        return GroupSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
    
        # Filter by category if specified and not "all"
        category_id = self.request.query_params.get('category')
        if category_id and category_id != 'all':
            try:
                # Validate it's a proper UUID
                uuid.UUID(category_id)
                queryset = queryset.filter(categories__category_id=category_id)
            except ValueError:
                # Handle invalid UUID gracefully - skip the filter
                pass
    
        # Filter by member if specified
        member_id = self.request.query_params.get('member')
        if member_id:
            queryset = queryset.filter(memberships__member_id=member_id)
    
        # Filter by leader if specified
        leader_id = self.request.query_params.get('leader_id')
        if leader_id:
            queryset = queryset.filter(leader_id=leader_id)
    
        return queryset.distinct()

    def get_permissions(self):
        """Allow unauthenticated access to public endpoints"""
        if self.action in ['public', 'list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Add a member to a group"""
        group = self.get_object()
        serializer = JoinGroupSerializer(
            data=request.data,
            context={'group_id': group.id}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    member = Member.objects.get(
                        id=serializer.validated_data['member_id'],
                        is_active=True
                    )
                    
                    # Check if group can accept new members
                    can_join, message = group.can_join(member)
                    if not can_join:
                        return Response(
                            {'error': message},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Determine initial status
                    initial_status = 'pending' if group.requires_approval else 'active'
                    
                    # Create membership
                    membership = MemberGroupRelationship.objects.create(
                        group=group,
                        member=member,
                        role=serializer.validated_data.get('role', 'member'),
                        status=initial_status,
                        notes=serializer.validated_data.get('notes', '')
                    )
                    
                    logger.info(f"Member {member.get_full_name()} joined group {group.name}")
                    
                    return Response(
                        MemberGroupRelationshipSerializer(membership).data,
                        status=status.HTTP_201_CREATED
                    )
                    
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Member not found or inactive'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                logger.error(f"Error joining group: {str(e)}")
                return Response(
                    {'error': 'An error occurred while joining the group'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='remove-member/(?P<member_id>[^/.]+)')
    def remove_member(self, request, pk=None, member_id=None):
        """Remove a member from a group"""
        group = self.get_object()
        
        try:
            with transaction.atomic():
                membership = MemberGroupRelationship.objects.get(
                    group=group,
                    member_id=member_id,
                    is_active=True
                )
                
                # Deactivate membership instead of deleting
                membership.is_active = False
                membership.status = 'removed'
                membership.end_date = timezone.now().date()
                membership.save()
                
                logger.info(f"Removed member {membership.member.get_full_name()} from group {group.name}")
                
                return Response(
                    MemberGroupRelationshipSerializer(membership).data
                )
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Member not found in this group'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error removing member: {str(e)}")
            return Response(
                {'error': 'Failed to remove member from group'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='approve-member/(?P<member_id>[^/.]+)')
    def approve_member(self, request, pk=None, member_id=None):
        """Approve a pending member"""
        group = self.get_object()
        
        try:
            with transaction.atomic():
                membership = MemberGroupRelationship.objects.get(
                    group=group,
                    member_id=member_id,
                    status='pending'
                )
                
                # Check capacity before approving
                if group.is_full:
                    return Response(
                        {'error': 'Group is at maximum capacity'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Approve the membership
                membership.status = 'active'
                membership.is_active = True
                membership.start_date = timezone.now().date()
                membership.save()
                
                logger.info(f"Approved membership for {membership.member.get_full_name()} in group {group.name}")
                
                return Response(
                    MemberGroupRelationshipSerializer(membership).data
                )
                
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Pending membership not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error approving member: {str(e)}")
            return Response(
                {'error': 'Failed to approve membership'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='decline-member/(?P<member_id>[^/.]+)')
    def decline_member(self, request, pk=None, member_id=None):
        """Decline a pending member"""
        group = self.get_object()
        
        try:
            membership = MemberGroupRelationship.objects.get(
                group=group,
                member_id=member_id,
                status='pending'
            )
            
            membership.status = 'declined'
            membership.is_active = False
            membership.save()
            
            logger.info(f"Declined membership for {membership.member.get_full_name()} in group {group.name}")
            
            return Response(
                MemberGroupRelationshipSerializer(membership).data
            )
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Pending membership not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error declining member: {str(e)}")
            return Response(
                {'error': 'Failed to decline membership'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive group statistics"""
        try:
            # Basic counts
            total_groups = Group.objects.count()
            active_groups = Group.objects.filter(is_active=True).count()
            public_groups = Group.objects.filter(is_public=True, is_active=True).count()
            
            # Total active memberships
            total_memberships = MemberGroupRelationship.objects.filter(
                is_active=True,
                status='active'
            ).count()
            
            # Average group size
            avg_group_size = Group.objects.filter(is_active=True).annotate(
                member_count=models.Count(
                    'memberships', 
                    filter=models.Q(memberships__is_active=True, memberships__status='active')
                )
            ).aggregate(avg_size=models.Avg('member_count'))['avg_size'] or 0
            
            # Groups by category
            categories_stats = GroupCategory.objects.filter(is_active=True).annotate(
                group_count=models.Count(
                    'groups__group', 
                    filter=models.Q(groups__group__is_active=True)
                )
            ).values('name', 'group_count').order_by('name')

            # Largest group
            largest_group_data = Group.objects.filter(is_active=True).annotate(
                member_count=models.Count(
                    'memberships', 
                    filter=models.Q(memberships__is_active=True, memberships__status='active')
                )
            ).order_by('-member_count').first()
            
            largest_group = None
            if largest_group_data:
                largest_group = {
                    'name': largest_group_data.name,
                    'member_count': largest_group_data.member_count
                }

            # Newest groups (last 5)
            newest_groups = Group.objects.filter(is_active=True).order_by('-created_at')[:5]
            newest_groups_data = [{
                'name': group.name,
                'created_at': group.created_at,
                'member_count': group.memberships.filter(is_active=True, status='active').count()
            } for group in newest_groups]

            stats_data = {
                'total_groups': total_groups,
                'active_groups': active_groups,
                'public_groups': public_groups,
                'total_memberships': total_memberships,
                'average_group_size': round(avg_group_size, 1),
                'categories': list(categories_stats),
                'largest_group': largest_group,
                'newest_groups': newest_groups_data
            }

            serializer = GroupStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating group statistics: {str(e)}")
            return Response(
                {'error': 'Error generating statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get public groups available for joining"""
        queryset = self.get_queryset().filter(is_active=True, is_public=True)
        
        # Apply search and filtering
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(request, queryset, view=self)
        
        # Additional filtering for public view
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__category__name__icontains=category)
        
        has_space = request.query_params.get('has_space')
        if has_space == 'true':
            queryset = [group for group in queryset if not group.is_full]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = GroupSummarySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = GroupSummarySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export group member data"""
        group = self.get_object()
        
        # Get active memberships
        memberships = group.memberships.filter(
            is_active=True, 
            status='active'
        ).select_related('member')
        
        # Prepare data for export
        export_data = []
        for membership in memberships:
            member = membership.member
            export_data.append({
                'name': member.get_full_name() if hasattr(member, 'get_full_name') else f"{member.first_name} {member.last_name}",
                'email': member.email,
                'phone': getattr(member, 'phone', ''),
                'role': membership.get_role_display() if hasattr(membership, 'get_role_display') else membership.role,
                'join_date': membership.join_date.strftime('%Y-%m-%d') if membership.join_date else '',
                'notes': membership.notes or ''
            })
        
        return Response({
            'group_name': group.name,
            'export_date': timezone.now().strftime('%Y-%m-%d'),
            'member_count': len(export_data),
            'members': export_data
        })

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a group"""
        group = self.get_object()
        
        # Filter by status if specified
        status_filter = request.query_params.get('status', 'active')
        
        if status_filter == 'all':
            memberships = group.memberships.all()
        else:
            memberships = group.memberships.filter(status=status_filter)
        
        # Apply ordering
        ordering = request.query_params.get('ordering', '-join_date')
        memberships = memberships.order_by(ordering)
        
        page = self.paginate_queryset(memberships)
        if page is not None:
            serializer = MemberGroupRelationshipSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MemberGroupRelationshipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-membership/(?P<member_id>[^/.]+)')
    def update_membership(self, request, pk=None, member_id=None):
        """Update a member's role or status in a group"""
        group = self.get_object()
        
        try:
            membership = MemberGroupRelationship.objects.get(
                group=group,
                member_id=member_id
            )
            
            serializer = UpdateMembershipSerializer(
                membership,
                data=request.data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated membership for {membership.member.get_full_name()} in group {group.name}")
                return Response(
                    MemberGroupRelationshipSerializer(membership).data
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Member is not part of this group'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating membership: {str(e)}")
            return Response(
                {'error': 'Failed to update membership'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GroupCategoryViewSet(viewsets.ModelViewSet):
    queryset = GroupCategory.objects.all()
    serializer_class = GroupCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset

    @action(detail=True, methods=['get'])
    def groups(self, request, pk=None):
        """Get all groups in this category"""
        category = self.get_object()
        groups = Group.objects.filter(
            categories__category=category,
            is_active=True
        ).distinct()
        
        # Apply pagination
        page = self.paginate_queryset(groups)
        if page is not None:
            serializer = GroupSummarySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = GroupSummarySerializer(groups, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def with_counts(self, request):
        """Get categories with group counts"""
        categories = self.get_queryset().annotate(
            group_count=models.Count(
                'groups__group',
                filter=models.Q(groups__group__is_active=True)
            )
        )
        
        serializer = GroupCategorySerializer(categories, many=True)
        return Response(serializer.data)


class MemberGroupRelationshipViewSet(viewsets.ModelViewSet):
    queryset = MemberGroupRelationship.objects.select_related('member', 'group')
    serializer_class = MemberGroupRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        'member__first_name', 'member__last_name', 'member__email', 
        'group__name'
    ]
    ordering_fields = ['join_date', 'start_date', 'end_date']
    ordering = ['-join_date']
    filterset_fields = ['group', 'member', 'role', 'status', 'is_active']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(join_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(join_date__lte=end_date)
        
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a membership"""
        membership = self.get_object()
        
        # Check if group can accept this member
        if membership.group.is_full and not membership.is_active:
            return Response(
                {'error': 'Group is at maximum capacity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.status = 'active'
        membership.is_active = True
        membership.start_date = timezone.now().date()
        membership.save()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a membership"""
        membership = self.get_object()
        end_date = request.data.get('end_date', timezone.now().date())
        
        membership.is_active = False
        membership.status = 'inactive'
        membership.end_date = end_date
        membership.save()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending memberships"""
        pending_memberships = self.get_queryset().filter(status='pending')
        
        page = self.paginate_queryset(pending_memberships)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pending_memberships, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get membership statistics"""
        total_memberships = self.get_queryset().count()
        active_memberships = self.get_queryset().filter(
            is_active=True, status='active'
        ).count()
        pending_memberships = self.get_queryset().filter(
            status='pending'
        ).count()
        
        # Role distribution
        role_stats = self.get_queryset().filter(
            is_active=True, status='active'
        ).values('role').annotate(count=models.Count('id'))
        
        return Response({
            'total_memberships': total_memberships,
            'active_memberships': active_memberships,
            'pending_memberships': pending_memberships,
            'role_distribution': list(role_stats)
        })