# members/views.py - Fixed permissions and authentication
import csv
import json
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.db.models import Count
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
import logging

logger = logging.getLogger(__name__)

from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from .permissions import IsAuthenticatedOrCreateOnly, IsAdminUserOrReadOnly
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberUpdateSerializer, MemberAdminCreateSerializer,
    MemberSummarySerializer, MemberExportSerializer, MemberNoteSerializer,
    MemberTagSerializer, MemberTagAssignmentSerializer, MemberStatsSerializer,
    BulkImportLogSerializer, BulkImportRequestSerializer, BulkImportTemplateSerializer
)

class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing members with proper permissions
    """
    queryset = Member.objects.select_related('family').prefetch_related(
        'member_notes', 'tag_assignments__tag'
    ).order_by('-registration_date')
    
    # Use custom permission class that allows public registration but requires auth for viewing
    permission_classes = [IsAuthenticatedOrCreateOnly]
    
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
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
            if self.request.user.is_authenticated and self._is_admin_user():
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
        """Check if current user is admin"""
        user = self.request.user
        if not user.is_authenticated:
            return False
        return (
            user.is_superuser or
            user.is_staff or
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin']) or
            (hasattr(user, 'is_admin') and user.is_admin)
        )
    
    def list(self, request, *args, **kwargs):
        """List members with proper error handling and authentication check"""
        try:
            # Explicit authentication check
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication credentials were not provided.'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            logger.info(f"Members list request from authenticated user: {request.user}")
            
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
            logger.error(f"Error in members list view: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve members', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single member with error handling"""
        try:
            # Explicit authentication check
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication credentials were not provided.'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve member', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Create a new member - allows public registration"""
        try:
            logger.info(f"Creating member. User authenticated: {request.user.is_authenticated}")
            logger.info(f"Request data keys: {list(request.data.keys())}")
            
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                # Set additional fields for admin users
                extra_fields = {}
                if request.user.is_authenticated and self._is_admin_user():
                    extra_fields['registered_by'] = request.user
                    extra_fields['last_modified_by'] = request.user
                    if not serializer.validated_data.get('registration_source'):
                        extra_fields['registration_source'] = 'admin_portal'
                else:
                    extra_fields['registration_source'] = 'public_form'
                
                member = serializer.save(**extra_fields)
                
                # Return appropriate response
                if request.user.is_authenticated and self._is_admin_user():
                    response_serializer = MemberSerializer(member)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        'success': True,
                        'message': 'Registration successful! Thank you for joining our church family.',
                        'member_id': str(member.id)
                    }, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"Member creation validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create member', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Update member - requires authentication"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication credentials were not provided.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Set last_modified_by
        if hasattr(request, 'data') and isinstance(request.data, dict):
            request.data['last_modified_by'] = request.user.id
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update member - requires authentication"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication credentials were not provided.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Set last_modified_by
        if hasattr(request, 'data') and isinstance(request.data, dict):
            request.data['last_modified_by'] = request.user.id
        
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete member - requires admin permissions"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication credentials were not provided.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin permissions required to delete members.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def statistics(self, request):
        """Get comprehensive member statistics - requires authentication"""
        try:
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            
            # Recent registrations
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_registrations = Member.objects.filter(
                registration_date__gte=thirty_days_ago
            ).count()
            
            # Gender distribution
            gender_stats = list(Member.objects.values('gender').annotate(
                count=Count('id')
            ).order_by('gender'))
            
            stats_data = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                    'recent_registrations': recent_registrations,
                },
                'demographics': {
                    'gender_distribution': gender_stats,
                }
            }
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get statistics', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUserOrReadOnly])
    def export(self, request):
        """Export members to CSV - admin only"""
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
            logger.error(f"Error exporting members: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to export members', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MemberTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing member tags"""
    queryset = MemberTag.objects.all()
    serializer_class = MemberTagSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MemberStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for member statistics"""
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
            logger.error(f"Error getting statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bulk import logs"""
    serializer_class = BulkImportLogSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.is_superuser or (hasattr(self.request.user, 'role') and self.request.user.role == 'super_admin'):
            return BulkImportLog.objects.all().order_by('-started_at')
        return BulkImportLog.objects.filter(
            uploaded_by=self.request.user
        ).order_by('-started_at')