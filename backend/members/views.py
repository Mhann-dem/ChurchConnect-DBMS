# members/views.py - UPDATED VERSION - Cleaned up imports and added template endpoint

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
    MemberTagSerializer, MemberStatsSerializer,
    BulkImportLogSerializer, BulkImportRequestSerializer, BulkImportTemplateSerializer
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_member_registration(request):
    """Public member registration endpoint - no authentication required"""
    try:
        logger.info(f"[Public Registration] Request from IP: {request.META.get('REMOTE_ADDR')}")
        
        # Create serializer with context
        serializer = MemberCreateSerializer(
            data=request.data, 
            context={'request': request, 'is_public': True}
        )
        
        if serializer.is_valid():
            # Save member with public registration defaults
            member = serializer.save(
                registration_source='public_form',
                is_active=True,
                privacy_policy_agreed=True,
                privacy_policy_agreed_date=timezone.now()
            )
            
            logger.info(f"[Public Registration] SUCCESS: {member.email} (ID: {member.id})")
            
            return Response({
                'success': True,
                'message': 'Registration successful! Welcome to our church family.',
                'member_id': str(member.id),
                'member_name': f"{member.first_name} {member.last_name}"
            }, status=status.HTTP_201_CREATED)
        
        else:
            logger.warning(f"[Public Registration] Validation errors: {serializer.errors}")
            
            # Format errors for frontend
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                if isinstance(errors, list):
                    formatted_errors[field] = errors[0] if errors else 'Invalid value'
                else:
                    formatted_errors[field] = str(errors)
            
            return Response({
                'success': False,
                'message': 'Please check the form and correct any errors.',
                'errors': formatted_errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"[Public Registration] Exception: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Registration failed. Please try again later.',
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MemberViewSet(viewsets.ModelViewSet):
    """Complete Members ViewSet with all endpoints"""
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
        'first_name', 'last_name', 'preferred_name', 'email', 'phone', 'notes'
    ]
    ordering_fields = [
        'first_name', 'last_name', 'email', 'registration_date', 'last_updated'
    ]
    ordering = ['-registration_date']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return MemberAdminCreateSerializer if self._is_admin_user() else MemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MemberUpdateSerializer
        elif self.action == 'list':
            return MemberSummarySerializer
        elif self.action == 'export':
            return MemberExportSerializer
        return MemberSerializer
    
    def _is_admin_user(self):
        """Check if current user has admin privileges"""
        user = self.request.user
        return (
            user.is_superuser or 
            user.is_staff or 
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])
        )
    
    def list(self, request, *args, **kwargs):
        """List members with enhanced pagination info"""
        try:
            logger.info(f"[MemberViewSet] List request from: {request.user}")
            
            # Get filtered queryset
            queryset = self.filter_queryset(self.get_queryset())
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)
                
                # Add extra metadata
                paginated_response.data.update({
                    'success': True,
                    'total_count': queryset.count(),
                    'page_size': self.paginator.page_size,
                    'current_page': getattr(self.paginator, 'page', {}).number if hasattr(self.paginator, 'page') else 1
                })
                
                logger.info(f"[MemberViewSet] Returned {len(serializer.data)} members")
                return paginated_response
            
            # Non-paginated response
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data),
                'next': None,
                'previous': None
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] List error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to retrieve members'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        """Create member with admin validation"""
        try:
            if not self._is_admin_user():
                return Response({
                    'error': 'Admin privileges required'
                }, status=status.HTTP_403_FORBIDDEN)
            
            logger.info(f"[MemberViewSet] Admin create from: {request.user}")
            
            serializer = self.get_serializer(
                data=request.data,
                context={'request': request, 'is_admin_creating': True}
            )
            
            if serializer.is_valid():
                member = serializer.save(
                    registered_by=request.user,
                    last_modified_by=request.user,
                    registration_source='admin_portal'
                )
                
                logger.info(f"[MemberViewSet] Member created: {member.email}")
                
                # Return detailed response
                response_serializer = MemberSerializer(member)
                return Response({
                    'success': True,
                    'message': 'Member created successfully',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            else:
                logger.warning(f"[MemberViewSet] Validation errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Please check the form and correct any errors.',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"[MemberViewSet] Create error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to create member'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def perform_update(self, serializer):
        """Set last_modified_by on update"""
        serializer.save(last_modified_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Delete member with admin check"""
        if not self._is_admin_user():
            return Response({
                'error': 'Admin privileges required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        logger.info(f"[MemberViewSet] Deleting member: {instance.email}")
        
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Member deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """Get recently registered members - FIXED ENDPOINT"""
        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)  # Cap at 50
            logger.info(f"[MemberViewSet] Recent members request, limit: {limit}")
            
            recent_members = Member.objects.select_related('family').order_by('-registration_date')[:limit]
            serializer = MemberSummarySerializer(recent_members, many=True)
            
            logger.info(f"[MemberViewSet] Returning {len(serializer.data)} recent members")
            
            return Response({
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data),
                'limit': limit
            })
            
        except ValueError:
            return Response({
                'error': 'Invalid limit parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[MemberViewSet] Recent error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to get recent members'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """Search members by query - ENHANCED"""
        try:
            query = request.query_params.get('q', '').strip()
            logger.info(f"[MemberViewSet] Search request: '{query}'")
            
            if not query:
                return Response({
                    'success': True,
                    'results': [],
                    'count': 0,
                    'message': 'Please provide a search query'
                })
            
            if len(query) < 2:
                return Response({
                    'success': True,
                    'results': [],
                    'count': 0,
                    'message': 'Search query must be at least 2 characters'
                })
            
            # Enhanced search with multiple fields
            search_filters = (
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(phone__icontains=query) |
                Q(preferred_name__icontains=query) |
                Q(address__icontains=query)
            )
            
            members = Member.objects.filter(search_filters).select_related('family').distinct()[:50]
            serializer = MemberSummarySerializer(members, many=True)
            
            logger.info(f"[MemberViewSet] Search returned {len(serializer.data)} results")
            
            return Response({
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data),
                'query': query
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Search error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Search failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        """Get comprehensive member statistics - ENHANCED"""
        try:
            range_param = request.query_params.get('range', '30d')
            logger.info(f"[MemberViewSet] Statistics request, range: {range_param}")
            
            now = timezone.now()
            
            # Parse range parameter
            if range_param == '7d':
                date_threshold = now - timedelta(days=7)
            elif range_param == '30d':
                date_threshold = now - timedelta(days=30)
            elif range_param == '90d':
                date_threshold = now - timedelta(days=90)
            elif range_param == '1y':
                date_threshold = now - timedelta(days=365)
            else:
                date_threshold = now - timedelta(days=30)
            
            # Basic counts
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            recent_registrations = Member.objects.filter(
                registration_date__gte=date_threshold
            ).count()
            
            # Demographics
            gender_stats = Member.objects.values('gender').annotate(count=Count('id'))
            gender_breakdown = {
                item['gender'] or 'not_specified': item['count'] 
                for item in gender_stats
            }
            
            # Age demographics
            today = timezone.now().date()
            age_groups = {
                'under_18': 0, '18_35': 0, '36_55': 0, '56_plus': 0, 'unknown': 0
            }
            
            members_with_birthdate = Member.objects.filter(date_of_birth__isnull=False)
            for member in members_with_birthdate:
                try:
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
                except (ValueError, TypeError):
                    age_groups['unknown'] += 1
            
            age_groups['unknown'] += total_members - members_with_birthdate.count()
            
            # Registration trends (last 6 months)
            monthly_trends = []
            for i in range(6):
                month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
                if i == 0:
                    month_end = now
                else:
                    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_count = Member.objects.filter(
                    registration_date__date__range=[month_start.date(), month_end.date()]
                ).count()
                
                monthly_trends.insert(0, {
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%B %Y'),
                    'registrations': month_count
                })
            
            stats_data = {
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': total_members - active_members,
                    'recent_registrations': recent_registrations,
                    'growth_rate': round(
                        (recent_registrations / max(total_members - recent_registrations, 1)) * 100, 2
                    )
                },
                'demographics': {
                    'gender': gender_breakdown,
                    'age_groups': age_groups
                },
                'trends': {
                    'monthly_registrations': monthly_trends,
                    'range': range_param
                }
            }
            
            logger.info(f"[MemberViewSet] Statistics calculated for {total_members} members")
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Statistics error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to get statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='birthdays')
    def birthdays(self, request):
        """Get members with upcoming birthdays"""
        try:
            days = min(int(request.query_params.get('days', 30)), 365)  # Cap at 365
            
            today = timezone.now().date()
            upcoming_birthdays = []
            
            members = Member.objects.filter(
                date_of_birth__isnull=False,
                is_active=True
            ).select_related('family')
            
            for member in members:
                try:
                    # Calculate this year's birthday
                    birthday_this_year = member.date_of_birth.replace(year=today.year)
                    
                    # If birthday already passed, check next year
                    if birthday_this_year < today:
                        birthday_this_year = member.date_of_birth.replace(year=today.year + 1)
                    
                    days_until = (birthday_this_year - today).days
                    
                    if 0 <= days_until <= days:
                        age_turning = today.year - member.date_of_birth.year
                        if birthday_this_year.year > today.year:
                            age_turning += 1
                        
                        upcoming_birthdays.append({
                            'member': MemberSummarySerializer(member).data,
                            'birthday': birthday_this_year.isoformat(),
                            'days_until': days_until,
                            'age_turning': age_turning
                        })
                        
                except (ValueError, TypeError):
                    continue
            
            # Sort by days until birthday
            upcoming_birthdays.sort(key=lambda x: x['days_until'])
            
            return Response({
                'results': upcoming_birthdays,
                'count': len(upcoming_birthdays),
                'days_ahead': days
            })
            
        except ValueError:
            return Response({
                'error': 'Invalid days parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[MemberViewSet] Birthdays error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to get birthdays'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export members to CSV - Admin only"""
        if not self._is_admin_user():
            return Response({
                'error': 'Admin privileges required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            logger.info(f"[MemberViewSet] Export request from: {request.user}")
            
            # Apply same filters as list view
            queryset = self.filter_queryset(self.get_queryset())
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="members_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'First Name', 'Last Name', 'Preferred Name', 'Email', 'Phone',
                'Date of Birth', 'Gender', 'Address', 'Registration Date',
                'Is Active', 'Family', 'Emergency Contact', 'Emergency Phone'
            ])
            
            for member in queryset.select_related('family'):
                writer.writerow([
                    str(member.id),
                    member.first_name,
                    member.last_name,
                    member.preferred_name or '',
                    member.email,
                    str(member.phone) if member.phone else '',
                    member.date_of_birth.strftime('%Y-%m-%d') if member.date_of_birth else '',
                    member.gender or '',
                    member.address or '',
                    member.registration_date.strftime('%Y-%m-%d %H:%M'),
                    'Yes' if member.is_active else 'No',
                    member.family.family_name if member.family else '',
                    member.emergency_contact_name or '',
                    member.emergency_contact_phone or ''
                ])
            
            logger.info(f"[MemberViewSet] Export completed: {queryset.count()} members")
            return response
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Export error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Export failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='bulk_actions')
    def bulk_actions(self, request):
        """Handle bulk actions on multiple members"""
        if not self._is_admin_user():
            return Response({
                'error': 'Admin privileges required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            action = request.data.get('action')
            member_ids = request.data.get('member_ids', [])
            action_data = request.data.get('data', {})
            
            if not action or not member_ids:
                return Response({
                    'error': 'Action and member_ids are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            members = Member.objects.filter(id__in=member_ids)
            actual_count = members.count()
            
            logger.info(f"[MemberViewSet] Bulk {action} on {actual_count} members")
            
            if action == 'delete':
                deleted_count = members.count()
                members.delete()
                message = f"Successfully deleted {deleted_count} members"
                
            elif action == 'activate':
                updated_count = members.update(
                    is_active=True,
                    last_modified_by=request.user
                )
                message = f"Successfully activated {updated_count} members"
                
            elif action == 'deactivate':
                updated_count = members.update(
                    is_active=False,
                    last_modified_by=request.user
                )
                message = f"Successfully deactivated {updated_count} members"
                
            else:
                return Response({
                    'error': f'Unknown action: {action}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'message': message,
                'processed_count': actual_count
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Bulk action error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Bulk action failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class MemberNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing member notes - Admin only"""
    serializer_class = MemberNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter notes by member if member_id provided"""
        queryset = MemberNote.objects.select_related('member', 'created_by')
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not self._is_admin_user():
            return Response(
                {'error': 'Admin privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
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

class MemberTagViewSet(viewsets.ModelViewSet):
    queryset = MemberTag.objects.all()
    serializer_class = MemberTagSerializer
    permission_classes = [permissions.IsAuthenticated]


class MemberNoteViewSet(viewsets.ModelViewSet):
    serializer_class = MemberNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = MemberNote.objects.select_related('member', 'created_by')
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        return queryset.order_by('-created_at')


class BulkImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BulkImportLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return BulkImportLog.objects.all().order_by('-started_at')
        return BulkImportLog.objects.none()


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