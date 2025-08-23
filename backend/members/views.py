# members/views.py
import csv
from django.http import HttpResponse
from django.db.models import Count, Q, Avg
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta, date

from .models import Member, MemberNote, MemberTag, MemberTagAssignment
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberUpdateSerializer,
    MemberSummarySerializer, MemberExportSerializer, MemberNoteSerializer,
    MemberTagSerializer, MemberStatsSerializer
)
from .filters import MemberFilter
from .permissions import IsAuthenticatedOrCreateOnly


class MemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing members
    - Public: Can create new members (registration form)
    - Authenticated: Full CRUD operations
    """
    queryset = Member.objects.select_related('family').prefetch_related(
        'member_notes', 'tag_assignments__tag'
    ).order_by('-registration_date')
    
    permission_classes = [IsAuthenticatedOrCreateOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MemberFilter
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
            return MemberCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MemberUpdateSerializer
        elif self.action == 'list':
            # Use summary serializer for list view to improve performance
            return MemberSummarySerializer
        elif self.action == 'export':
            return MemberExportSerializer
        return MemberSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions and query params"""
        queryset = super().get_queryset()
        
        # If user is not authenticated, they shouldn't see any members
        if not self.request.user.is_authenticated:
            return Member.objects.none()
        
        # Apply filters from query parameters
        active = self.request.query_params.get('active', None)
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        
        # Age range filter
        age_range = self.request.query_params.get('ageRange', None)
        if age_range:
            today = date.today()
            if age_range == '0-17':
                min_date = today - timedelta(days=18*365)
                queryset = queryset.filter(date_of_birth__gte=min_date)
            elif age_range == '18-25':
                min_date = today - timedelta(days=26*365)
                max_date = today - timedelta(days=18*365)
                queryset = queryset.filter(date_of_birth__lte=max_date, date_of_birth__gt=min_date)
            elif age_range == '26-40':
                min_date = today - timedelta(days=41*365)
                max_date = today - timedelta(days=26*365)
                queryset = queryset.filter(date_of_birth__lte=max_date, date_of_birth__gt=min_date)
            elif age_range == '41-60':
                min_date = today - timedelta(days=61*365)
                max_date = today - timedelta(days=41*365)
                queryset = queryset.filter(date_of_birth__lte=max_date, date_of_birth__gt=min_date)
            elif age_range == '60+':
                max_date = today - timedelta(days=61*365)
                queryset = queryset.filter(date_of_birth__lte=max_date)
        
        # Gender filter
        gender = self.request.query_params.get('gender', None)
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Registration date range filter
        date_range = self.request.query_params.get('registrationDateRange', None)
        if date_range:
            today = timezone.now().date()
            if date_range == 'last_week':
                start_date = today - timedelta(days=7)
                queryset = queryset.filter(registration_date__date__gte=start_date)
            elif date_range == 'last_month':
                start_date = today - timedelta(days=30)
                queryset = queryset.filter(registration_date__date__gte=start_date)
            elif date_range == 'last_year':
                start_date = today - timedelta(days=365)
                queryset = queryset.filter(registration_date__date__gte=start_date)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new member (public registration)"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            member = serializer.save()
            # Return simplified response for public form
            response_data = {
                'success': True,
                'message': 'Registration successful! Thank you for joining our church family.',
                'member_id': str(member.id)
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive member statistics"""
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        inactive_members = total_members - active_members
        
        # Recent registrations (last 30 days)
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
        
        # Communication preferences
        comm_prefs = list(Member.objects.values('preferred_contact_method').annotate(
            count=Count('id')
        ).order_by('preferred_contact_method'))
        
        # Family statistics
        members_with_families = Member.objects.filter(
            family_id__isnull=False
        ).count()
        members_without_families = total_members - members_with_families
        
        stats_data = {
            'summary': {
                'total_members': total_members,
                'active_members': active_members,
                'inactive_members': inactive_members,
                'recent_registrations': recent_registrations,
                'members_with_families': members_with_families,
                'members_without_families': members_without_families,
            },
            'demographics': {
                'gender_distribution': gender_stats,
                'age_ranges': age_ranges,
            },
            'preferences': {
                'communication_methods': comm_prefs,
            },
            'growth': {
                'last_30_days': recent_registrations,
            }
        }
        
        return Response(stats_data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export members to CSV"""
        queryset = self.filter_queryset(self.get_queryset())
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="members_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Full Name', 'First Name', 'Last Name', 'Email', 'Phone',
            'Date of Birth', 'Age', 'Gender', 'Address', 'Contact Method',
            'Language', 'Family', 'Registration Date', 'Active'
        ])
        
        for member in queryset:
            writer.writerow([
                str(member.id),
                member.full_name,
                member.first_name,
                member.last_name,
                member.email,
                str(member.phone) if member.phone else '',
                member.date_of_birth.strftime('%Y-%m-%d') if member.date_of_birth else '',
                member.age or '',
                member.get_gender_display(),
                member.address,
                member.get_preferred_contact_method_display(),
                member.preferred_language,
                member.family.family_name if member.family else '',
                member.registration_date.strftime('%Y-%m-%d %H:%M:%S'),
                'Yes' if member.is_active else 'No'
            ])
        
        return response
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a member"""
        member = self.get_object()
        serializer = MemberNoteSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                member=member,
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get all notes for a member"""
        member = self.get_object()
        notes = member.member_notes.all()
        
        # Filter private notes if user doesn't have permission
        if not request.user.is_superuser:
            notes = notes.filter(
                Q(is_private=False) | Q(created_by=request.user)
            )
        
        serializer = MemberNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_tag(self, request, pk=None):
        """Add a tag to a member"""
        member = self.get_object()
        tag_id = request.data.get('tag_id')
        
        if not tag_id:
            return Response(
                {'error': 'tag_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tag = MemberTag.objects.get(id=tag_id)
        except MemberTag.DoesNotExist:
            return Response(
                {'error': 'Tag not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if assignment already exists
        assignment, created = MemberTagAssignment.objects.get_or_create(
            member=member,
            tag=tag,
            defaults={'assigned_by': request.user}
        )
        
        if created:
            serializer = MemberTagAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'message': 'Tag already assigned to member'}, 
                status=status.HTTP_200_OK
            )
    
    @action(detail=True, methods=['delete'])
    def remove_tag(self, request, pk=None):
        """Remove a tag from a member"""
        member = self.get_object()
        tag_id = request.data.get('tag_id')
        
        if not tag_id:
            return Response(
                {'error': 'tag_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assignment = MemberTagAssignment.objects.get(
                member=member, 
                tag_id=tag_id
            )
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MemberTagAssignment.DoesNotExist:
            return Response(
                {'error': 'Tag assignment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class MemberTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing member tags"""
    queryset = MemberTag.objects.all()
    serializer_class = MemberTagSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MemberStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for member statistics - read-only endpoints for dashboard analytics
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Member.objects.none()  # No specific queryset needed for statistics
    
    def list(self, request):
        """Get comprehensive member statistics for dashboard"""
        # Basic counts
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        inactive_members = total_members - active_members
        
        # Gender distribution
        gender_stats = Member.objects.values('gender').annotate(
            count=Count('id')
        ).order_by('gender')
        
        # Age demographics (calculate age from date_of_birth)
        today = date.today()
        age_ranges = {
            '0-17': Member.objects.filter(
                date_of_birth__gt=today - timedelta(days=18*365)
            ).count(),
            '18-30': Member.objects.filter(
                date_of_birth__lte=today - timedelta(days=18*365),
                date_of_birth__gt=today - timedelta(days=31*365)
            ).count(),
            '31-50': Member.objects.filter(
                date_of_birth__lte=today - timedelta(days=31*365),
                date_of_birth__gt=today - timedelta(days=51*365)
            ).count(),
            '51-70': Member.objects.filter(
                date_of_birth__lte=today - timedelta(days=51*365),
                date_of_birth__gt=today - timedelta(days=71*365)
            ).count(),
            '70+': Member.objects.filter(
                date_of_birth__lte=today - timedelta(days=71*365)
            ).count(),
        }
        
        # Recent registrations (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        recent_registrations = Member.objects.filter(
            registration_date__date__gte=thirty_days_ago
        ).count()
        
        # Communication preferences
        comm_prefs = Member.objects.values('preferred_contact_method').annotate(
            count=Count('id')
        ).order_by('preferred_contact_method')
        
        # Family statistics
        members_with_families = Member.objects.filter(
            family_id__isnull=False
        ).count()
        members_without_families = total_members - members_with_families
        
        return Response({
            'summary': {
                'total_members': total_members,
                'active_members': active_members,
                'inactive_members': inactive_members,
                'recent_registrations': recent_registrations,
                'members_with_families': members_with_families,
                'members_without_families': members_without_families,
            },
            'demographics': {
                'gender_distribution': list(gender_stats),
                'age_ranges': age_ranges,
            },
            'preferences': {
                'communication_methods': list(comm_prefs),
            },
            'growth': {
                'last_30_days': recent_registrations,
            }
        })
    
    @action(detail=False, methods=['get'])
    def gender_distribution(self, request):
        """Get detailed gender distribution statistics"""
        total_members = Member.objects.count()
        stats = Member.objects.values('gender').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Add percentage calculation
        for stat in stats:
            stat['percentage'] = round(
                (stat['count'] * 100.0 / total_members) if total_members > 0 else 0, 2
            )
        
        return Response(list(stats))
    
    @action(detail=False, methods=['get'])
    def age_demographics(self, request):
        """Get detailed age demographics"""
        today = date.today()
        total_members = Member.objects.count()
        
        age_ranges = [
            ('0-17', 0, 18),
            ('18-30', 18, 31),
            ('31-50', 31, 51),
            ('51-70', 51, 71),
            ('70+', 71, 150)  # 150 as upper bound
        ]
        
        demographics = []
        
        for label, min_age, max_age in age_ranges:
            min_date = today - timedelta(days=max_age*365)
            max_date = today - timedelta(days=min_age*365)
            
            if label == '70+':
                count = Member.objects.filter(
                    date_of_birth__lte=min_date
                ).count()
            else:
                count = Member.objects.filter(
                    date_of_birth__gt=min_date,
                    date_of_birth__lte=max_date
                ).count()
            
            percentage = (count * 100.0 / total_members) if total_members > 0 else 0
            
            demographics.append({
                'age_range': label,
                'count': count,
                'percentage': round(percentage, 2)
            })
        
        return Response(demographics)
    
    @action(detail=False, methods=['get'])
    def registration_trends(self, request):
        """Get member registration trends over time"""
        # Last 12 months registration data
        monthly_registrations = []
        today = date.today()
        
        for i in range(12):
            # Calculate month boundaries
            if today.month - i <= 0:
                month = today.month - i + 12
                year = today.year - 1
            else:
                month = today.month - i
                year = today.year
            
            month_start = date(year, month, 1)
            
            # Calculate next month for end date
            if month == 12:
                next_month = 1
                next_year = year + 1
            else:
                next_month = month + 1
                next_year = year
            
            month_end = date(next_year, next_month, 1) - timedelta(days=1)
            
            count = Member.objects.filter(
                registration_date__date__gte=month_start,
                registration_date__date__lte=month_end
            ).count()
            
            monthly_registrations.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count,
                'month_name': month_start.strftime('%B %Y')
            })
        
        return Response(list(reversed(monthly_registrations)))