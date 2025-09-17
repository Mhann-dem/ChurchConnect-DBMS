# members/views.py - UPDATED VERSION - Added missing recent endpoint

import csv
import json
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q
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
            
            logger.info(f"Public registration successful for: {member.email}")
            
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
    FIXED ViewSet for managing members - AUTHENTICATION REQUIRED
    """
    queryset = Member.objects.select_related('family').prefetch_related(
        'member_notes', 'tag_assignments__tag'
    ).order_by('-registration_date')
    
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
        """FIXED: List members with proper logging and error handling"""
        try:
            logger.info(f"[MemberViewSet] Members list request from user: {request.user.email}")
            logger.info(f"[MemberViewSet] Query params: {request.query_params}")
            
            # Get queryset and apply filters
            queryset = self.filter_queryset(self.get_queryset())
            
            # Log queryset info
            logger.info(f"[MemberViewSet] Filtered queryset count: {queryset.count()}")
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                result = self.get_paginated_response(serializer.data)
                logger.info(f"[MemberViewSet] Returning paginated response with {len(serializer.data)} items")
                return result

            # If no pagination
            serializer = self.get_serializer(queryset, many=True)
            result = Response({
                'count': queryset.count(),
                'results': serializer.data,
                'next': None,
                'previous': None
            })
            logger.info(f"[MemberViewSet] Returning non-paginated response with {len(serializer.data)} items")
            return result
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error in members list view: {str(e)}", exc_info=True)
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
            
            logger.info(f"[MemberViewSet] Admin member creation by: {request.user.email}")
            
            # Add admin context
            serializer = self.get_serializer(
                data=request.data,
                context={
                    'request': request,
                    'is_admin_creating': True,
                    'admin_override': True
                }
            )
            
            if serializer.is_valid():
                member = serializer.save(
                    registered_by=request.user,
                    last_modified_by=request.user,
                    registration_source='admin_portal'
                )
                
                logger.info(f"[MemberViewSet] Member created successfully: {member.email}")
                
                response_serializer = MemberSerializer(member)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"[MemberViewSet] Member creation validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"[MemberViewSet] Error creating member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create member'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Update member - set last_modified_by"""
        try:
            logger.info(f"[MemberViewSet] Member update request by: {request.user.email}")
            if hasattr(request, 'data') and isinstance(request.data, dict):
                request.data['last_modified_by'] = request.user.id
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"[MemberViewSet] Error updating member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to update member'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update member - set last_modified_by"""
        try:
            logger.info(f"[MemberViewSet] Member partial update request by: {request.user.email}")
            if hasattr(request, 'data') and isinstance(request.data, dict):
                request.data['last_modified_by'] = request.user.id
            return super().partial_update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"[MemberViewSet] Error partially updating member: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to update member'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete member - admin only"""
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        logger.info(f"[MemberViewSet] Member delete request by: {request.user.email}")
        return super().destroy(request, *args, **kwargs)
    
    # FIXED: Added missing recent endpoint
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently registered members"""
        try:
            limit = int(request.query_params.get('limit', 10))
            logger.info(f"[MemberViewSet] Recent members request from: {request.user.email}, limit: {limit}")
            
            recent_members = Member.objects.order_by('-registration_date')[:limit]
            serializer = MemberSummarySerializer(recent_members, many=True)
            
            logger.info(f"[MemberViewSet] Returning {len(serializer.data)} recent members")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data)
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error getting recent members: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get recent members'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # FIXED: Added missing search endpoint
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search members by query"""
        try:
            query = request.query_params.get('q', '').strip()
            logger.info(f"[MemberViewSet] Search request: '{query}' from: {request.user.email}")
            
            if not query:
                return Response({
                    'results': [],
                    'count': 0,
                    'message': 'Please provide a search query'
                })
            
            # Search across multiple fields
            members = Member.objects.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(phone__icontains=query) |
                Q(preferred_name__icontains=query)
            ).distinct()[:50]  # Limit to 50 results
            
            serializer = MemberSummarySerializer(members, many=True)
            
            logger.info(f"[MemberViewSet] Search returned {len(serializer.data)} results")
            
            return Response({
                'results': serializer.data,
                'count': len(serializer.data),
                'query': query
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error in search: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Search failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # FIXED: Added missing birthdays endpoint
    @action(detail=False, methods=['get'])
    def birthdays(self, request):
        """Get members with upcoming birthdays"""
        try:
            days = int(request.query_params.get('days', 30))
            logger.info(f"[MemberViewSet] Birthdays request for next {days} days from: {request.user.email}")
            
            today = timezone.now().date()
            upcoming_birthdays = []
            
            # Get all members with birthdates
            members = Member.objects.filter(date_of_birth__isnull=False)
            
            for member in members:
                # Calculate this year's birthday
                birthday_this_year = member.date_of_birth.replace(year=today.year)
                
                # If birthday already passed this year, check next year
                if birthday_this_year < today:
                    birthday_this_year = member.date_of_birth.replace(year=today.year + 1)
                
                # Check if birthday is within the specified days
                days_until = (birthday_this_year - today).days
                if 0 <= days_until <= days:
                    upcoming_birthdays.append({
                        'member': MemberSummarySerializer(member).data,
                        'birthday': birthday_this_year,
                        'days_until': days_until,
                        'age_turning': today.year - member.date_of_birth.year
                    })
            
            # Sort by days until birthday
            upcoming_birthdays.sort(key=lambda x: x['days_until'])
            
            logger.info(f"[MemberViewSet] Found {len(upcoming_birthdays)} upcoming birthdays")
            
            return Response({
                'results': upcoming_birthdays,
                'count': len(upcoming_birthdays),
                'days_ahead': days
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error getting birthdays: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get upcoming birthdays'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get basic member statistics"""
        try:
            logger.info(f"[MemberViewSet] Statistics request from: {request.user.email}")
            
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            
            # Recent registrations (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_registrations = Member.objects.filter(
                registration_date__gte=thirty_days_ago
            ).count()
            
            # Gender breakdown
            gender_stats = Member.objects.values('gender').annotate(count=Count('id'))
            gender_breakdown = {item['gender']: item['count'] for item in gender_stats}
            
            # Age demographics (if date_of_birth exists)
            age_groups = {
                'under_18': 0,
                '18_35': 0,
                '36_55': 0,
                '56_plus': 0,
                'unknown': 0
            }
            
            today = timezone.now().date()
            members_with_birthdate = Member.objects.filter(date_of_birth__isnull=False)
            
            for member in members_with_birthdate:
                age = today.year - member.date_of_birth.year
                if member.date_of_birth.replace(year=today.year) > today:
                    age -= 1
                
                if age < 18:
                    age_groups['under_18'] += 1
                elif age <= 35:
                    age_groups['18_35'] += 1
                elif age <= 55:
                    age_groups['36_55'] += 1
                else:
                    age_groups['56_plus'] += 1
            
            age_groups['unknown'] = total_members - members_with_birthdate.count()
            
            stats_data = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                    'recent_registrations': recent_registrations,
                },
                'demographics': {
                    'gender': gender_breakdown,
                    'age_groups': age_groups
                }
            }
            
            logger.info(f"[MemberViewSet] Statistics returned: {stats_data}")
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error getting statistics: {str(e)}", exc_info=True)
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
            logger.info(f"[MemberViewSet] Export request from: {request.user.email}")
            
            queryset = self.filter_queryset(self.get_queryset())
            serializer = MemberExportSerializer(queryset, many=True)
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="members_export_{timezone.now().strftime("%Y%m%d")}.csv"'
            
            if serializer.data:
                writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
                writer.writeheader()
                writer.writerows(serializer.data)
            
            logger.info(f"[MemberViewSet] Export completed with {len(serializer.data)} records")
            
            return response
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error exporting members: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to export members'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_actions(self, request):
        """Handle bulk actions on members - Admin only"""
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            action = request.data.get('action')
            member_ids = request.data.get('member_ids', [])
            action_data = request.data.get('data', {})
            
            logger.info(f"[MemberViewSet] Bulk action request: {action} for {len(member_ids)} members by {request.user.email}")
            
            if not action or not member_ids:
                return Response(
                    {'error': 'Action and member_ids are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get members queryset
            members = Member.objects.filter(id__in=member_ids)
            actual_count = members.count()
            
            if actual_count != len(member_ids):
                logger.warning(f"[MemberViewSet] Some member IDs not found: requested {len(member_ids)}, found {actual_count}")
            
            result_message = ""
            
            if action == 'delete':
                deleted_count = members.count()
                members.delete()
                result_message = f"Successfully deleted {deleted_count} members"
                
            elif action == 'activate':
                updated_count = members.update(is_active=True, last_modified_by=request.user)
                result_message = f"Successfully activated {updated_count} members"
                
            elif action == 'deactivate':
                updated_count = members.update(is_active=False, last_modified_by=request.user)
                result_message = f"Successfully deactivated {updated_count} members"
                
            elif action == 'export':
                # Export selected members
                serializer = MemberExportSerializer(members, many=True)
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="selected_members_{timezone.now().strftime("%Y%m%d")}.csv"'
                
                if serializer.data:
                    writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
                    writer.writeheader()
                    writer.writerows(serializer.data)
                
                return response
                
            elif action == 'tag':
                tag_id = action_data.get('tag_id')
                if not tag_id:
                    return Response(
                        {'error': 'tag_id is required for tag action'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    tag = MemberTag.objects.get(id=tag_id)
                    created_count = 0
                    for member in members:
                        obj, created = MemberTagAssignment.objects.get_or_create(
                            member=member,
                            tag=tag,
                            defaults={'assigned_by': request.user}
                        )
                        if created:
                            created_count += 1
                    
                    result_message = f"Successfully tagged {created_count} members with '{tag.name}'"
                    
                except MemberTag.DoesNotExist:
                    return Response(
                        {'error': 'Tag not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            else:
                return Response(
                    {'error': f'Unknown action: {action}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"[MemberViewSet] Bulk action completed: {result_message}")
            
            return Response({
                'success': True,
                'message': result_message,
                'processed_count': actual_count
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Error in bulk action: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Bulk action failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MemberTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing member tags - Admin only"""
    queryset = MemberTag.objects.all()
    serializer_class = MemberTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        logger.info(f"[MemberTagViewSet] Tag list request from: {request.user.email}")
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        logger.info(f"[MemberTagViewSet] Tag creation by: {request.user.email}")
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        logger.info(f"[MemberTagViewSet] Tag update by: {request.user.email}")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        logger.info(f"[MemberTagViewSet] Tag delete by: {request.user.email}")
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
            logger.info(f"[MemberStatisticsViewSet] Statistics request from: {request.user.email}")
            
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            
            result = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                }
            }
            
            logger.info(f"[MemberStatisticsViewSet] Returning statistics: {result}")
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"[MemberStatisticsViewSet] Error getting statistics: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to get statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bulk import logs - Admin only"""
    serializer_class = BulkImportLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if (user.is_superuser or user.is_staff or 
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])):
            logger.info(f"[BulkImportLogViewSet] Import logs request from admin: {user.email}")
            return BulkImportLog.objects.all().order_by('-started_at')
        else:
            logger.warning(f"[BulkImportLogViewSet] Non-admin user {user.email} attempted to access import logs")
            return BulkImportLog.objects.none()