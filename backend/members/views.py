# members/views.py - FIXED VERSION with corrected phone processing
import csv
import json
import re  # <-- ADD THIS MISSING IMPORT
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q, Sum, Avg # <-- ADD MISSING IMPORTS HERE
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .validators import validate_and_format_phone
import logging

logger = logging.getLogger(__name__)

from .models import Member, MemberNote, MemberTag, MemberTagAssignment, BulkImportLog, BulkImportError
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberUpdateSerializer, MemberAdminCreateSerializer,
    MemberSummarySerializer, MemberExportSerializer, MemberNoteSerializer,
    MemberTagSerializer, MemberStatsSerializer,
    BulkImportLogSerializer, BulkImportRequestSerializer, BulkImportTemplateSerializer
)
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiTypes

# In your views.py, replace the phone processing function:

def process_registration_phone(data: dict, default_country: str = 'GH') -> dict:
    """
    Process phone number in registration data with PhoneNumberField support.
    """
    if 'phone' not in data or not data['phone']:
        return data
    
    phone_input = str(data['phone']).strip()
    if not phone_input:
        return data
    
    # PhoneNumberField will handle the formatting automatically
    # We just need to ensure it's in a format it can parse
    try:
        # Clean the input but let PhoneNumberField handle the validation
        cleaned = re.sub(r'[^\d\+\-\(\)\s]', '', phone_input)
        data['phone'] = cleaned
        logger.info(f"[Registration] Phone cleaned: {phone_input} -> {cleaned}")
    except Exception as e:
        logger.error(f"[Registration] Phone processing error: {e}")
    
    return data


@extend_schema(
    request=BulkImportRequestSerializer,
    responses={
        200: OpenApiResponse(description='Import successful'),
        400: OpenApiResponse(description='Invalid file or data'),
    },
    description='Bulk import members from CSV/Excel file'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_import_members(request):
    """Bulk import with detailed error reporting"""
    from .serializers import BulkImportRequestSerializer
    try:
        from .utils import BulkImportProcessor
        
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file uploaded'
            }, status=400)
        
        processor = BulkImportProcessor(request.user)
        import_log = processor.process_file(
            request.FILES['file'],
            skip_duplicates=request.data.get('skip_duplicates', True)
        )
        
        # Get detailed errors
        errors = []
        if import_log.failed_rows > 0:
            import_errors = BulkImportError.objects.filter(
                import_log=import_log
            ).order_by('row_number')[:20]  # Limit to 20 for performance
            
            errors = [
                {
                    'row_number': err.row_number,
                    'error_message': err.error_message,
                    'row_data': err.row_data
                }
                for err in import_errors
            ]
        
        return Response({
            'success': import_log.status in ['completed', 'completed_with_errors'],
            'data': {
                'imported': import_log.successful_rows,
                'failed': import_log.failed_rows,
                'skipped': import_log.skipped_rows,
                'total': import_log.total_rows,
                'errors': errors
            },
            'import_log_id': str(import_log.id),
            'message': f'Processed {import_log.total_rows} rows: {import_log.successful_rows} imported, {import_log.failed_rows} failed, {import_log.skipped_rows} skipped'
        })
        
    except Exception as e:
        logger.error(f"[BulkImport] Critical error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': f'Import failed: {str(e)}'
        }, status=500)


@extend_schema(
    responses={
        200: OpenApiResponse(description='CSV template file'),
    },
    description='Download member import template'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_import_template(request):
    """Download CSV template with proper headers - UPDATED"""
    try:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="member_import_template.csv"'
        
        writer = csv.writer(response)
        
        # UPDATED: Headers matching your CSV format
        headers = [
            'First Name',      # Required
            'Last Name',       # Required
            'Email',           # Required
            'Phone',           # Optional - any format
            'Date of Birth',   # Optional - YYYY-MM-DD
            'Gender',          # Optional - male/female/other
            'Address',         # Optional - NEW
            'Emergency Contact Name',  # Optional - NEW
            'Emergency Contact Phone'  # Optional - NEW
        ]
        
        writer.writerow(headers)
        
        # Sample row 1
        writer.writerow([
            'John',
            'Doe',
            'john.doe@example.com',
            '0241234567',
            '1990-01-15',
            'male',
            '123 Main St, Accra, Ghana',
            'Jane Doe',
            '0242345678'
        ])
        
        # Sample row 2 - minimal (only required fields)
        writer.writerow([
            'Jane',
            'Smith',
            'jane.smith@example.com',
            '',  # No phone - OK
            '',  # No DOB - OK
            '',  # No gender - OK
            '',  # No address - OK
            '',  # No emergency contact - OK
            ''
        ])
        
        # Sample row 3 - international phone format
        writer.writerow([
            'Michael',
            'Johnson',
            'michael.j@example.com',
            '+233501234567',  # International format
            '1985-07-22',
            'male',
            'PO Box 123, Kumasi',
            'Sarah Johnson',
            '+233502345678'
        ])
        
        logger.info(f"[Template] Downloaded by: {request.user.email}")
        return response
        
    except Exception as e:
        logger.error(f"[Template] Download error: {str(e)}")
        return Response({
            'error': 'Failed to download template'
        }, status=500)

@extend_schema(
    request=MemberCreateSerializer,
    responses={
        201: OpenApiResponse(description='Registration successful'),
        400: OpenApiResponse(description='Validation errors'),
    },
    description='Public member registration endpoint'
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def public_member_registration(request):
    """Public member registration endpoint with enhanced phone processing"""
    try:
        logger.info(f"[Public Registration] Request from IP: {request.META.get('REMOTE_ADDR')}")
        
        # FIXED: Enhanced phone number processing with international support
        data = request.data.copy()
        
        # Process phone number with international support
        data = process_registration_phone(data, default_country='GH')
        
        # Also process emergency contact phone if provided
        if 'emergency_contact_phone' in data and data['emergency_contact_phone']:
            emergency_phone = str(data['emergency_contact_phone']).strip()
            if emergency_phone:
                try:
                    is_valid, formatted, error = validate_and_format_phone(emergency_phone, 'GH')
                    if is_valid:
                        data['emergency_contact_phone'] = formatted
                except Exception as e:
                    logger.warning(f"[Registration] Emergency phone processing failed: {e}")
        
        serializer = MemberCreateSerializer(data=data)
        
        if serializer.is_valid():
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
            
            return Response({
                'success': False,
                'message': 'Please check the form and correct any errors.',
                'errors': serializer.errors
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
        'family': ['exact', 'isnull'],  # ✅ ADDED 'isnull'
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
        """
        List members with enhanced pagination info and comprehensive count fields
        FIXED: Returns all count variations for maximum frontend compatibility
        """
        try:
            logger.info(f"[MemberViewSet] List request from: {request.user.email}")
            logger.info(f"[MemberViewSet] Query params: {request.query_params.dict()}")
            
            # Get the base queryset BEFORE any filtering
            base_queryset = self.get_queryset()
            
            # Calculate TOTAL counts (without filters) - for overall stats
            total_members_count = base_queryset.count()
            total_active_count = base_queryset.filter(is_active=True).count()
            total_inactive_count = total_members_count - total_active_count
            
            # Now apply filters from request
            filtered_queryset = self.filter_queryset(base_queryset)
            
            # Get filtered counts - what's actually shown
            filtered_count = filtered_queryset.count()
            filtered_active = filtered_queryset.filter(is_active=True).count()
            filtered_inactive = filtered_count - filtered_active
            
            logger.info(
                f"[MemberViewSet] Counts - "
                f"Total DB: {total_members_count} (active: {total_active_count}), "
                f"Filtered: {filtered_count} (active: {filtered_active})"
            )
            
            # Apply pagination
            page = self.paginate_queryset(filtered_queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)
                
                # === CRITICAL FIX ===
                # Add ALL count variations at root level for frontend compatibility
                response_data = paginated_response.data
                
                # Standard DRF pagination fields
                response_data['count'] = filtered_count
                response_data['next'] = response_data.get('next')
                response_data['previous'] = response_data.get('previous')
                response_data['results'] = response_data.get('results', [])
                
                # Additional count fields - ALL VARIATIONS
                # Filtered counts (what matches current search/filters)
                response_data['active_count'] = filtered_active
                response_data['inactive_count'] = filtered_inactive
                response_data['filtered_count'] = filtered_count
                response_data['filtered_active'] = filtered_active
                response_data['filtered_inactive'] = filtered_inactive
                
                # Total counts (overall database stats without filters)
                response_data['total_count'] = total_members_count
                response_data['total_members'] = total_members_count
                response_data['total_active'] = total_active_count
                response_data['total_inactive'] = total_inactive_count
                response_data['active_members'] = total_active_count
                response_data['inactive_members'] = total_inactive_count
                
                # Pagination metadata
                response_data['page_size'] = self.paginator.page_size
                response_data['current_page'] = getattr(
                    getattr(self.paginator, 'page', None), 
                    'number', 
                    1
                )
                response_data['total_pages'] = (
                    response_data.get('total_pages') or 
                    ((filtered_count + self.paginator.page_size - 1) // self.paginator.page_size)
                )
                
                # API metadata
                response_data['success'] = True
                
                logger.info(
                    f"[MemberViewSet] Returned {len(serializer.data)} members "
                    f"on page {response_data.get('current_page')} "
                    f"of {response_data.get('total_pages')}"
                )
                
                # DEBUG: Log actual response structure
                logger.debug(f"[MemberViewSet] Response keys: {list(response_data.keys())}")
                logger.debug(f"[MemberViewSet] Count: {response_data['count']}")
                logger.debug(f"[MemberViewSet] Active: {response_data['active_count']}")
                logger.debug(f"[MemberViewSet] Total: {response_data['total_members']}")
                
                return Response(response_data)
            
            # Non-paginated response (when pagination is disabled)
            serializer = self.get_serializer(filtered_queryset, many=True)
            
            non_paginated_response = {
                'success': True,
                'results': serializer.data,
                
                # Standard count
                'count': filtered_count,
                
                # Filtered counts - ALL VARIATIONS
                'active_count': filtered_active,
                'inactive_count': filtered_inactive,
                'filtered_count': filtered_count,
                'filtered_active': filtered_active,
                'filtered_inactive': filtered_inactive,
                
                # Total counts - ALL VARIATIONS
                'total_count': total_members_count,
                'total_members': total_members_count,
                'total_active': total_active_count,
                'total_inactive': total_inactive_count,
                'active_members': total_active_count,
                'inactive_members': total_inactive_count,
                
                # Pagination markers
                'next': None,
                'previous': None,
                'page_size': None,
                'current_page': 1,
                'total_pages': 1
            }
            
            return Response(non_paginated_response)
            
        except Exception as e:
            logger.error(f"[MemberViewSet] List error: {str(e)}", exc_info=True)
            
            # Return safe defaults on error
            error_response = {
                'success': False,
                'error': 'Failed to retrieve members',
                
                # All count fields set to 0
                'count': 0,
                'active_count': 0,
                'inactive_count': 0,
                'total_count': 0,
                'total_members': 0,
                'total_active': 0,
                'total_inactive': 0,
                'active_members': 0,
                'inactive_members': 0,
                
                # Empty results
                'results': [],
                'next': None,
                'previous': None
            }
            
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        """Create member with admin validation and phone processing"""
        try:
            if not self._is_admin_user():
                return Response({
                    'error': 'Admin privileges required'
                }, status=status.HTTP_403_FORBIDDEN)
            
            logger.info(f"[MemberViewSet] Admin create from: {request.user}")
            
            # Process phone numbers in the request data
            data = request.data.copy()
            data = process_registration_phone(data, default_country='GH')
            
            # Process emergency contact phone if provided
            if 'emergency_contact_phone' in data and data['emergency_contact_phone']:
                try:
                    is_valid, formatted, error = validate_and_format_phone(
                        data['emergency_contact_phone'], 'GH'
                    )
                    if is_valid:
                        data['emergency_contact_phone'] = formatted
                except Exception as e:
                    logger.warning(f"[MemberViewSet] Emergency phone processing failed: {e}")
            
            serializer = self.get_serializer(
                data=data,
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
        # PhoneNumberField handles phone formatting automatically
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
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently registered members - FIXED RESPONSE FORMAT"""
        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)  # Cap at 50
            logger.info(f"[MemberViewSet] Recent members request, limit: {limit}")
            
            recent_members = Member.objects.select_related('family').order_by('-registration_date')[:limit]
            serializer = MemberSummarySerializer(recent_members, many=True)
            
            # FIXED: Ensure consistent response format that frontend expects
            response_data = {
                'success': True,
                'results': serializer.data,
                'count': len(serializer.data),
                'limit': limit
            }
            
            logger.info(f"[MemberViewSet] Returning {len(serializer.data)} recent members")
            
            return Response(response_data)
            
        except ValueError:
            return Response({
                'success': False,
                'error': 'Invalid limit parameter',
                'results': [],
                'count': 0
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[MemberViewSet] Recent error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get recent members',
                'results': [],
                'count': 0
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
        """
        Get comprehensive member statistics
        FIXED: Returns counts at BOTH root level AND nested summary level
        for compatibility with different frontend code paths
        """
        try:
            range_param = request.query_params.get('range', '30d')
            logger.info(f"[MemberViewSet] Statistics request, range: {range_param}")
            
            now = timezone.now()
            
            # Parse range parameter
            range_map = {
                '7d': 7,
                '30d': 30,
                '90d': 90,
                '1y': 365,
                'all': None
            }
            days = range_map.get(range_param, 30)
            
            if days:
                date_threshold = now - timedelta(days=days)
            else:
                date_threshold = None
            
            # === CORE COUNTS - These are what matter ===
            total_members = Member.objects.count()
            active_members = Member.objects.filter(is_active=True).count()
            inactive_members = total_members - active_members
            
            # Recent registrations
            if date_threshold:
                recent_registrations = Member.objects.filter(
                    registration_date__gte=date_threshold.date()
                ).count()
            else:
                recent_registrations = total_members
            
            # Calculate growth rate
            growth_rate = 0
            if date_threshold:
                previous_period_start = date_threshold - (now - date_threshold)
                previous_period_registrations = Member.objects.filter(
                    registration_date__gte=previous_period_start.date(),
                    registration_date__lt=date_threshold.date()
                ).count()
                
                if previous_period_registrations > 0:
                    growth_rate = ((recent_registrations - previous_period_registrations) 
                                / previous_period_registrations) * 100
                elif recent_registrations > 0:
                    growth_rate = 100.0
            
            # Gender demographics
            gender_stats = Member.objects.values('gender').annotate(count=Count('id'))
            gender_breakdown = {
                item['gender'] or 'not_specified': item['count'] 
                for item in gender_stats
            }
            
            # Age demographics
            today = timezone.now().date()
            age_groups = {
                'under_18': 0,
                '18_35': 0,
                '36_55': 0,
                '56_plus': 0,
                'unknown': 0
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
            
            # === CRITICAL FIX ===
            # Return counts at MULTIPLE levels for maximum frontend compatibility
            stats_data = {
                # ROOT LEVEL - For React useMembers hook
                'count': total_members,
                'total_count': total_members,
                'active_count': active_members,
                'inactive_count': inactive_members,
                'total_members': total_members,
                'active_members': active_members,
                'inactive_members': inactive_members,
                'new_members': recent_registrations,
                'recent_registrations': recent_registrations,
                'growth_rate': round(growth_rate, 2),
                
                # NESTED SUMMARY - For dashboard components
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'inactive_members': inactive_members,
                    'recent_registrations': recent_registrations,
                    'growth_rate': round(growth_rate, 2)
                },
                
                # DEMOGRAPHICS
                'demographics': {
                    'gender': gender_breakdown,
                    'age_groups': age_groups
                },
                
                # METADATA
                'trends': {
                    'range': range_param,
                    'date_threshold': date_threshold.isoformat() if date_threshold else None
                },
                
                # API metadata
                'success': True,
                'timestamp': now.isoformat()
            }
            
            logger.info(
                f"[MemberViewSet] Statistics SUCCESS - "
                f"Total: {total_members}, Active: {active_members}, "
                f"Recent: {recent_registrations}"
            )
            
            # DEBUG: Log the actual response structure
            logger.debug(f"[MemberViewSet] Response keys: {list(stats_data.keys())}")
            logger.debug(f"[MemberViewSet] Root count: {stats_data['count']}")
            logger.debug(f"[MemberViewSet] Root active_count: {stats_data['active_count']}")
            
            return Response(stats_data)
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Statistics ERROR: {str(e)}", exc_info=True)
            
            # Return safe defaults even on error
            error_response = {
                'success': False,
                'error': 'Failed to get statistics',
                
                # Root level defaults
                'count': 0,
                'total_count': 0,
                'active_count': 0,
                'inactive_count': 0,
                'total_members': 0,
                'active_members': 0,
                'inactive_members': 0,
                'new_members': 0,
                'recent_registrations': 0,
                'growth_rate': 0,
                
                # Nested defaults
                'summary': {
                    'total_members': 0,
                    'active_members': 0,
                    'inactive_members': 0,
                    'recent_registrations': 0,
                    'growth_rate': 0
                },
                'demographics': {
                    'gender': {},
                    'age_groups': {}
                }
            }
            
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, pk=None):
        """Get member activity history"""
        try:
            member = self.get_object()
            logger.info(f"[MemberViewSet] Activity request for member: {member.email}")
            
            activities = []
            
            # 1. Registration activity
            activities.append({
                'type': 'registration',
                'description': f"Registered via {member.registration_source or 'admin portal'}",
                'timestamp': member.registration_date.isoformat() if member.registration_date else timezone.now().isoformat(),
                'author': 'System'
            })
            
            # 2. Notes as activities
            notes = member.member_notes.select_related('created_by').order_by('-created_at')[:20]
            for note in notes:
                activities.append({
                    'type': 'note',
                    'description': f"Note added: {note.content[:100]}{'...' if len(note.content) > 100 else ''}",
                    'timestamp': note.created_at.isoformat(),
                    'author': note.created_by.get_full_name() if note.created_by else 'Unknown'
                })
            
            # 3. Family changes
            if member.family:
                try:
                    family_rel = member.family_relationships.first()
                    if family_rel:
                        activities.append({
                            'type': 'family',
                            'description': f"Added to family '{member.family.family_name}' as {family_rel.get_relationship_type_display()}",
                            'timestamp': family_rel.created_at.isoformat(),
                            'author': 'System'
                        })
                except Exception as e:
                    logger.warning(f"Error getting family activity: {e}")
            
            # 4. Group memberships
            try:
                from groups.models import MemberGroupRelationship
                group_memberships = MemberGroupRelationship.objects.filter(
                    member=member
                ).select_related('group').order_by('-join_date')[:10]
                
                for membership in group_memberships:
                    activities.append({
                        'type': 'group',
                        'description': f"Joined group '{membership.group.name}' as {membership.get_role_display()}",
                        'timestamp': membership.join_date.isoformat(),
                        'author': 'System'
                    })
            except ImportError:
                pass
            except Exception as e:
                logger.warning(f"Error getting group activity: {e}")
            
            # 5. Pledge activity
            try:
                from pledges.models import Pledge
                pledges = Pledge.objects.filter(member=member).order_by('-created_at')[:10]
                
                for pledge in pledges:
                    activities.append({
                        'type': 'pledge',
                        'description': f"Created pledge: ${pledge.amount} {pledge.get_frequency_display()}",
                        'timestamp': pledge.created_at.isoformat(),
                        'author': 'System'
                    })
            except ImportError:
                pass
            except Exception as e:
                logger.warning(f"Error getting pledge activity: {e}")
            
            # Sort by timestamp (newest first)
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            # Limit to 50 most recent
            activities = activities[:50]
            
            logger.info(f"[MemberViewSet] Returning {len(activities)} activity items")
            
            return Response({
                'success': True,
                'results': activities,
                'count': len(activities)
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Activity error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get activity',
                'results': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'], url_path='groups')
    def groups(self, request, pk=None):
        """Get groups/ministries the member belongs to"""
        try:
            member = self.get_object()
            logger.info(f"[MemberViewSet] Groups request for member: {member.email}")
            
            try:
                from groups.models import MemberGroupRelationship
                from groups.serializers import GroupSummarySerializer
                
                # Get active memberships
                memberships = MemberGroupRelationship.objects.filter(
                    member=member,
                    is_active=True,
                    status='active'
                ).select_related('group').order_by('-join_date')
                
                groups_data = []
                for membership in memberships:
                    groups_data.append({
                        'id': str(membership.group.id),
                        'name': membership.group.name,
                        'description': membership.group.description or '',
                        'role': membership.get_role_display(),
                        'join_date': membership.join_date.isoformat() if membership.join_date else None,
                        'status': membership.status,
                        'group_leader': membership.group.get_leader_name() if hasattr(membership.group, 'get_leader_name') else None
                    })
                
                logger.info(f"[MemberViewSet] Returning {len(groups_data)} groups")
                
                return Response({
                    'success': True,
                    'results': groups_data,
                    'count': len(groups_data)
                })
                
            except ImportError:
                logger.warning("[MemberViewSet] Groups module not available")
                return Response({
                    'success': True,
                    'results': [],
                    'count': 0,
                    'message': 'Groups functionality not available'
                })
                
        except Exception as e:
            logger.error(f"[MemberViewSet] Groups error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get groups',
                'results': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'], url_path='family')
    def family_members(self, request, pk=None):
        """Get family members"""
        try:
            member = self.get_object()
            logger.info(f"[MemberViewSet] Family request for member: {member.email}")
            
            if not member.family:
                return Response({
                    'success': True,
                    'results': [],
                    'count': 0,
                    'family_name': None,
                    'message': 'Member not assigned to a family'
                })
            
            # Get other family members (exclude current member)
            family_members = Member.objects.filter(
                family=member.family
            ).exclude(
                id=member.id
            ).select_related('family')
            
            members_data = []
            for fam_member in family_members:
                # Get relationship type
                relationship_type = 'other'
                try:
                    rel = fam_member.family_relationships.filter(family=member.family).first()
                    if rel:
                        relationship_type = rel.get_relationship_type_display()
                except:
                    pass
                
                members_data.append({
                    'id': str(fam_member.id),
                    'first_name': fam_member.first_name,
                    'last_name': fam_member.last_name,
                    'email': fam_member.email,
                    'phone': str(fam_member.phone) if fam_member.phone else '',
                    'relationship': relationship_type,
                    'date_of_birth': fam_member.date_of_birth.isoformat() if fam_member.date_of_birth else None,
                    'photo_url': fam_member.photo_url if hasattr(fam_member, 'photo_url') else None
                })
            
            logger.info(f"[MemberViewSet] Returning {len(members_data)} family members")
            
            return Response({
                'success': True,
                'results': members_data,
                'count': len(members_data),
                'family_name': member.family.family_name
            })
            
        except Exception as e:
            logger.error(f"[MemberViewSet] Family error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Failed to get family members',
                'results': []
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
    serializer_class = MemberStatsSerializer 
    
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
        # FIX: Add proper queryset to resolve schema generation warning
        if getattr(self, 'swagger_fake_view', False):
            # Return empty queryset for schema generation
            return BulkImportLog.objects.none()
            
        user = self.request.user
        if (user.is_superuser or user.is_staff or 
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])):
            logger.info(f"[BulkImportLogViewSet] Import logs request from admin: {user.email}")
            return BulkImportLog.objects.all().order_by('-started_at')
        else:
            logger.warning(f"[BulkImportLogViewSet] Non-admin user {user.email} attempted to access import logs")
            return BulkImportLog.objects.none()
        
# Add to members/views.py
@extend_schema(
    responses={
        200: OpenApiResponse(description='Database status'),
    },
    description='Test database connectivity'
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def test_database_connection(request):
    """Test database connectivity and return system status"""
    try:
        from django.db import connection
        
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
        
        # Test member model
        member_count = Member.objects.count()
        
        return Response({
            'success': True,
            'database': db_status,
            'member_count': member_count,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'database': 'disconnected'
        }, status=500)