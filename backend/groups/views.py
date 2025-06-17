# backend/churchconnect/groups/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Group, MemberGroupRelationship, GroupCategory
from .serializers import (
    GroupSerializer, GroupSummarySerializer, MemberGroupRelationshipSerializer,
    GroupCategorySerializer, JoinGroupSerializer, UpdateMembershipSerializer
)
from members.models import Member
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.select_related('leader').prefetch_related(
        'memberships__member', 'categories__category'
    )
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'leader_name']
    ordering_fields = ['name', 'created_at', 'member_count']
    ordering = ['name']
    filterset_fields = ['is_active', 'is_public', 'requires_approval', 'leader']

    def get_serializer_class(self):
        if self.action == 'list':
            return GroupSummarySerializer
        return GroupSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category if specified
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__category_id=category_id)
        
        # Filter by member if specified
        member_id = self.request.query_params.get('member')
        if member_id:
            queryset = queryset.filter(memberships__member_id=member_id)
        
        return queryset.distinct()

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
                    member = Member.objects.get(id=serializer.validated_data['member_id'])
                    
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
                    
                    return Response(
                        MemberGroupRelationshipSerializer(membership).data,
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
                membership.deactivate()
                
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Member is not part of this group'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a group"""
        group = self.get_object()
        
        # Filter by status if specified
        status_filter = request.query_params.get('status', 'active')
        memberships = group.memberships.filter(status=status_filter)
        
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
                return Response(
                    MemberGroupRelationshipSerializer(membership).data
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Member is not part of this group'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='approve-member/(?P<member_id>[^/.]+)')
    def approve_member(self, request, pk=None, member_id=None):
        """Approve a pending member"""
        group = self.get_object()
        
        try:
            membership = MemberGroupRelationship.objects.get(
                group=group,
                member_id=member_id,
                status='pending'
            )
            
            membership.status = 'active'
            membership.save()
            
            return Response(
                MemberGroupRelationshipSerializer(membership).data
            )
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Pending membership not found'},
                status=status.HTTP_404_NOT_FOUND
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
            membership.save()
            
            return Response(
                MemberGroupRelationshipSerializer(membership).data
            )
            
        except MemberGroupRelationship.DoesNotExist:
            return Response(
                {'error': 'Pending membership not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get group statistics"""
        total_groups = Group.objects.count()
        active_groups = Group.objects.filter(is_active=True).count()
        public_groups = Group.objects.filter(is_public=True).count()
        
        # Total memberships
        total_memberships = MemberGroupRelationship.objects.filter(
            is_active=True
        ).count()
        
        # Average group size
        avg_group_size = Group.objects.filter(is_active=True).annotate(
            member_count=models.Count('memberships', filter=models.Q(memberships__is_active=True))
        ).aggregate(avg_size=models.Avg('member_count'))['avg_size'] or 0
        
        # Groups by category
        categories_stats = GroupCategory.objects.filter(is_active=True).annotate(
            group_count=models.Count('groups__group', filter=models.Q(groups__group__is_active=True))
        ).values('name', 'group_count')

        return Response({
            'total_groups': total_groups,
            'active_groups': active_groups,
            'public_groups': public_groups,
            'total_memberships': total_memberships,
            'average_group_size': round(avg_group_size, 1),
            'categories': list(categories_stats)
        })

    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get public groups available for joining"""
        queryset = self.get_queryset().filter(is_active=True, is_public=True)
        
        # Apply search and ordering
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(request, queryset, view=self)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = GroupSummarySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = GroupSummarySerializer(queryset, many=True)
        return Response(serializer.data)


class GroupCategoryViewSet(viewsets.ModelViewSet):
    queryset = GroupCategory.objects.all()
    serializer_class = GroupCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def groups(self, request, pk=None):
        """Get all groups in this category"""
        category = self.get_object()
        groups = Group.objects.filter(
            categories__category=category,
            is_active=True
        )
        
        serializer = GroupSummarySerializer(groups, many=True)
        return Response(serializer.data)


class MemberGroupRelationshipViewSet(viewsets.ModelViewSet):
    queryset = MemberGroupRelationship.objects.select_related('member', 'group')
    serializer_class = MemberGroupRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['member__first_name', 'member__last_name', 'group__name']
    ordering_fields = ['join_date', 'start_date', 'end_date']
    ordering = ['-join_date']
    filterset_fields = ['group', 'member', 'role', 'status', 'is_active']

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a membership"""
        membership = self.get_object()
        membership.activate()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a membership"""
        membership = self.get_object()
        end_date = request.data.get('end_date')
        membership.deactivate(end_date)
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)