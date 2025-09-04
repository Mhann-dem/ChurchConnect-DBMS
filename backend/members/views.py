# members/views.py - SECURE VERSION - Remove debug endpoint and fix permissions

import csv
import json
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.db.models import Count
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
import logging

logger = logging.getLogger(__name__)

from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberUpdateSerializer, MemberAdminCreateSerializer,
    MemberSummarySerializer, MemberExportSerializer, MemberNoteSerializer,
    MemberTagSerializer, MemberTagAssignmentSerializer, MemberStatsSerializer,
    BulkImportLogSerializer, BulkImportRequestSerializer, BulkImportTemplateSerializer
)

# SECURITY FIX: Remove the debug endpoint entirely
# @api_view(['GET'])
# @permission_classes([permissions.AllowAny])
# def debug_auth(request):
#     """DEBUG ENDPOINT REMOVED FOR SECURITY"""
#     pass

# Create separate views for public and authenticated operations
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_member_registration(request):
    """Public member registration endpoint - separate from admin operations"""
    try:
        logger.info("Public member registration attempt")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth']
        for field in required_fields:
            if not request.data.get(field):
                return Response(
                    {'error': f'{field.replace("_", " ").title()} is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check for duplicate email
        if Member.objects.filter(email=request.data['email']).exists():
            return Response(
                {'error': 'A member with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create member with public registration source
        serializer = MemberCreateSerializer(data=request.data)
        if serializer.is_valid():
            member = serializer.save(
                registration_source='public_form',
                privacy_policy_agreed=True,
                privacy_policy_agreed_date=timezone.now()
            )
            
            return Response({
                'success': True,
                'message': 'Registration successful! Thank you for joining our church family.',
                'member_id': str(member.id)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Public registration error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Registration failed. Please try again.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class MemberViewSet(viewsets.ModelViewSet):
    """
    SECURE ViewSet for managing members - AUTHENTICATION REQUIRED
    """
    queryset = Member.objects.select_related('family').prefetch_related(
        'member_notes', 'tag_assignments__tag'
    ).order_by('-registration_date')
    
    # SECURITY FIX: Simple, clear permissions
    permission_classes = [permissions.IsAuthenticated]
    
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'gender': ['exact'],
        'is_active': ['exact'],
        'registration_date': ['gte', 'lte', 'exact'],
        'family': ['exact'],
    }
    search_fields = [
        'first_name', 'last_name', 'preferred_name', 'email', 
        'phone', 'notes'
    ]
    ordering_fields = [
        'first_name', 'last_name', 'email', 'registration_date', 
        'last_updated', 'date_of_birth'
    ]
    ordering = ['-registration_date']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            if self._is_admin_user():
                return MemberAdminCreateSerializer
            return MemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MemberUpdateSerializer
        elif self.action == 'list':
            return MemberSummarySerializer
        elif self.action == 'export':
            return MemberExportSerializer
        return MemberSerializer
    
    def _is_admin_user(self):
        """Check if current user is admin - simplified logic"""
        user = self.request.user
        return (
            user.is_superuser or
            user.is_staff or
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])
        )
    
    def list(self, request, *args, **kwargs):
        """List members with proper error handling"""
        try:
            # SECURITY: Only log minimal information
            logger.info(f"Members list request from user: {request.user.email}")
            
            # Get queryset and apply filters
            queryset = self.filter_queryset(self.get_queryset())
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            # If no pagination
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data,
                'next': None,
                'previous': None
            })
            
        except Exception as e:
            logger.error(f"Error in members list view: {str(e)}")
            # SECURITY: Don't expose internal error details
            return Response(
                {'error': 'Failed to retrieve members'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Create a new member - ADMIN ONLY"""
        try:
            if not self._is_admin_user():
                return Response(
                    {'error': 'Admin privileges required'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            logger.info(f"Admin member creation by: {request.user.email}")
            
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                member = serializer.save(
                    registered_by=request.user,
                    last_modified_by=request.user,
                    registration_source='admin_portal'
                )
                
                response_serializer = MemberSerializer(member)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating member: {str(e)}")
            return Response(
                {'error': 'Failed to create member'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Update member - set last_modified_by"""
        if hasattr(request, 'data') and isinstance(request.data, dict):
            request.data['last_modified_by'] = request.user.id
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update member - set last_modified_by"""
        if hasattr(request, 'data') and isinstance(request.data, dict):
            request.data['last_modified_by'] = request.user.id
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete member - admin only"""
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get basic member statistics"""
        try:
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            
            # Recent registrations (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_registrations = Member.objects.filter(
                registration_date__gte=thirty_days_ago
            ).count()
            
            stats_data = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                    'recent_registrations': recent_registrations,
                }
            }
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return Response(
                {'error': 'Failed to get statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export members to CSV - Admin only"""
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = MemberExportSerializer(queryset, many=True)
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="members_export_{timezone.now().strftime("%Y%m%d")}.csv"'
            
            if serializer.data:
                writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
                writer.writeheader()
                writer.writerows(serializer.data)
            
            return response
            
        except Exception as e:
            logger.error(f"Error exporting members: {str(e)}")
            return Response(
                {'error': 'Failed to export members'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MemberTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing member tags - Admin only"""
    queryset = MemberTag.objects.all()
    serializer_class = MemberTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        # All authenticated users can view tags
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        # Only admins can create tags
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admins can update tags
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admins can delete tags
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    def _is_admin_user(self):
        """Check if current user is admin"""
        user = self.request.user
        return (
            user.is_superuser or
            user.is_staff or
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MemberStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for member statistics - Authenticated users only"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Member.objects.none()
    
    def list(self, request):
        """Get dashboard statistics"""
        try:
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            
            return Response({
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                }
            })
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return Response(
                {'error': 'Failed to get statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bulk import logs - Admin only"""
    serializer_class = BulkImportLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only admins can view import logs
        user = self.request.user
        if (user.is_superuser or user.is_staff or 
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])):
            return BulkImportLog.objects.all().order_by('-started_at')
        else:
            # Return empty queryset for non-admin users
            return BulkImportLog.objects.none()