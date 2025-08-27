# members/views.py - Fixed version with proper error handling and pagination
import csv
import json
# Add these imports
from datetime import date
from django.utils import timezone
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Member
from .serializers import MemberSerializer, MemberListSerializer
from django.db.models import Q
from django.utils import timezone

# Make sure to import your permissions
from .permissions import IsAuthenticatedOrCreateOnly, IsAdminUserOrReadOnly
from django.http import HttpResponse
from django.db.models import Count, Q, Avg
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta, date
import logging

logger = logging.getLogger(__name__)

from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberUpdateSerializer, MemberAdminCreateSerializer,
    MemberSummarySerializer, MemberExportSerializer, MemberNoteSerializer,
    MemberTagSerializer, MemberTagAssignmentSerializer, MemberStatsSerializer,
    BulkImportLogSerializer, BulkImportRequestSerializer, BulkImportTemplateSerializer
)
from .filters import MemberFilter
from .permissions import IsAuthenticatedOrCreateOnly, IsAdminUserOrReadOnly


class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing members with proper error handling
    """
    queryset = Member.objects.select_related('family').prefetch_related(
        'member_notes', 'tag_assignments__tag'
    ).order_by('-registration_date')
    
    permission_classes = [IsAuthenticatedOrCreateOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MemberFilter if 'MemberFilter' in globals() else None
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
        return (
            user.is_authenticated and (
                user.is_superuser or
                (hasattr(user, 'is_admin') and user.is_admin) or
                (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])
            )
        )
    
    def list(self, request, *args, **kwargs):
        """List members with proper error handling"""
        try:
            logger.info(f"Members list request from user: {request.user}")
            
            # REMOVE THIS MANUAL AUTH CHECK - let permission_classes handle it
            # if not request.user.is_authenticated:
            #     return Response(
            #         {'error': 'Authentication required to view members'}, 
            #         status=status.HTTP_401_UNAUTHORIZED
            #     )
            
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
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Member not found', 'detail': str(e)}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request, *args, **kwargs):
        """Create a new member with proper validation"""
        try:
            logger.info(f"Creating member with data keys: {list(request.data.keys())}")
            
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                # Set additional fields for admin users
                extra_fields = {}
                if self._is_admin_user():
                    extra_fields['registered_by'] = request.user
                    if not serializer.validated_data.get('registration_source'):
                        extra_fields['registration_source'] = 'admin_portal'
                else:
                    extra_fields['registration_source'] = 'public_form'
                
                member = serializer.save(**extra_fields)
                
                # Return appropriate response
                if self._is_admin_user():
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
        """Update member with audit tracking and error handling"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                if self._is_admin_user():
                    serializer.save(last_modified_by=request.user)
                else:
                    serializer.save()
                
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error updating member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to update member', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete member with proper error handling"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to delete member', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive member statistics"""
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
            
            # Age demographics
            today = date.today()
            age_ranges = {
                '0-17': Member.objects.filter(
                    date_of_birth__gte=today - timedelta(days=18*365)
                ).count(),
                '18-25': Member.objects.filter(
                    date_of_birth__lte=today - timedelta(days=18*365),
                    date_of_birth__gt=today - timedelta(days=26*365)
                ).count(),
                '26-40': Member.objects.filter(
                    date_of_birth__lte=today - timedelta(days=26*365),
                    date_of_birth__gt=today - timedelta(days=41*365)
                ).count(),
                '41-60': Member.objects.filter(
                    date_of_birth__lte=today - timedelta(days=41*365),
                    date_of_birth__gt=today - timedelta(days=61*365)
                ).count(),
                '60+': Member.objects.filter(
                    date_of_birth__lte=today - timedelta(days=61*365)
                ).count(),
            }
            
            stats_data = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                    'recent_registrations': recent_registrations,
                },
                'demographics': {
                    'gender_distribution': gender_stats,
                    'age_ranges': age_ranges,
                }
            }
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get statistics', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export members to CSV"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="members_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Full Name', 'First Name', 'Last Name', 'Email', 'Phone',
                'Date of Birth', 'Gender', 'Address', 'Contact Method',
                'Registration Date', 'Active'
            ])
            
            for member in queryset:
                writer.writerow([
                    str(member.id),
                    f"{member.first_name} {member.last_name}",
                    member.first_name,
                    member.last_name,
                    member.email,
                    str(member.phone) if member.phone else '',
                    member.date_of_birth.strftime('%Y-%m-%d') if member.date_of_birth else '',
                    member.get_gender_display() if hasattr(member, 'get_gender_display') else member.gender,
                    member.address or '',
                    member.get_preferred_contact_method_display() if hasattr(member, 'get_preferred_contact_method_display') else member.preferred_contact_method,
                    member.registration_date.strftime('%Y-%m-%d %H:%M:%S'),
                    'Yes' if member.is_active else 'No'
                ])
            
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
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MemberStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for member statistics"""
    permission_classes = [IsAuthenticated]
    
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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return BulkImportLog.objects.all().order_by('-started_at')
        return BulkImportLog.objects.filter(
            uploaded_by=self.request.user
        ).order_by('-started_at')
    
def list(self, request, *args, **kwargs):
    """List members with proper error handling"""
    try:
        logger.info(f"Members list request from user: {request.user}")
        
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