# Add this to your members/views.py file

from django.db.models import Count, Avg
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from datetime import datetime, timedelta
from .models import Member
from .serializers import MemberSerializer

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

class MemberStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for member statistics - read-only endpoints for dashboard analytics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Member.objects.none()  # No specific queryset needed for statistics
    
    def list(self, request):
        """
        Get comprehensive member statistics for dashboard
        """
        # Basic counts
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        inactive_members = total_members - active_members
        
        # Gender distribution
        gender_stats = Member.objects.values('gender').annotate(
            count=Count('id')
        ).order_by('gender')
        
        # Age demographics (calculate age from date_of_birth)
        today = datetime.now().date()
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
            registration_date__gte=thirty_days_ago
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
                # You can add more growth metrics here
            }
        })
    
    @action(detail=False, methods=['get'])
    def gender_distribution(self, request):
        """Get detailed gender distribution statistics"""
        stats = Member.objects.values('gender').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / Member.objects.count()
        ).order_by('-count')
        
        return Response(list(stats))
    
    @action(detail=False, methods=['get'])
    def age_demographics(self, request):
        """Get detailed age demographics"""
        today = datetime.now().date()
        
        age_ranges = [
            ('0-17', 0, 18),
            ('18-30', 18, 31),
            ('31-50', 31, 51),
            ('51-70', 51, 71),
            ('70+', 71, 150)  # 150 as upper bound
        ]
        
        demographics = []
        total_members = Member.objects.count()
        
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
        today = datetime.now().date()
        
        for i in range(12):
            month_start = today.replace(day=1) - timedelta(days=i*30)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            count = Member.objects.filter(
                registration_date__gte=month_start,
                registration_date__lte=month_end
            ).count()
            
            monthly_registrations.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })
        
        return Response(list(reversed(monthly_registrations)))