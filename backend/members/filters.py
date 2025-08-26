# members/filters.py
import django_filters
from django.db.models import Q
from datetime import datetime, timedelta, date
from .models import Member

class MemberFilter(django_filters.FilterSet):
    """Advanced filtering for members"""
    
    # Text search across multiple fields
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Basic filters
    gender = django_filters.ChoiceFilter(choices=Member.GENDER_CHOICES)
    preferred_contact_method = django_filters.ChoiceFilter(choices=Member.CONTACT_METHOD_CHOICES)
    is_active = django_filters.BooleanFilter()
    communication_opt_in = django_filters.BooleanFilter()
    
    # Date range filters
    registration_date_from = django_filters.DateFilter(field_name='registration_date', lookup_expr='gte')
    registration_date_to = django_filters.DateFilter(field_name='registration_date', lookup_expr='lte')
    birth_year = django_filters.NumberFilter(field_name='date_of_birth__year')
    
    # Age range filter
    age_min = django_filters.NumberFilter(method='filter_age_min')
    age_max = django_filters.NumberFilter(method='filter_age_max')
    age_range = django_filters.CharFilter(method='filter_age_range')
    
    # Registration source
    registration_source = django_filters.ChoiceFilter(choices=Member.REGISTRATION_SOURCE_CHOICES)
    
    # Has family
    has_family = django_filters.BooleanFilter(method='filter_has_family')
    
    # Has tags
    has_tags = django_filters.CharFilter(method='filter_has_tags')
    
    # Recent activity
    recent_activity = django_filters.CharFilter(method='filter_recent_activity')
    
    class Meta:
        model = Member
        fields = {
            'first_name': ['icontains'],
            'last_name': ['icontains'],
            'email': ['icontains'],
            'preferred_language': ['exact'],
            'registration_date': ['exact', 'gte', 'lte'],
        }
    
    def filter_search(self, queryset, name, value):
        """Search across multiple fields"""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(preferred_name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone__icontains=value) |
            Q(notes__icontains=value) |
            Q(internal_notes__icontains=value)
        )
    
    def filter_age_min(self, queryset, name, value):
        """Filter by minimum age"""
        if not value:
            return queryset
        
        cutoff_date = date.today() - timedelta(days=value * 365)
        return queryset.filter(date_of_birth__lte=cutoff_date)
    
    def filter_age_max(self, queryset, name, value):
        """Filter by maximum age"""
        if not value:
            return queryset
        
        cutoff_date = date.today() - timedelta(days=value * 365)
        return queryset.filter(date_of_birth__gte=cutoff_date)
    
    def filter_age_range(self, queryset, name, value):
        """Filter by age range"""
        if not value:
            return queryset
        
        today = date.today()
        
        age_ranges = {
            'youth': (0, 18),
            '18-25': (18, 26),
            '26-40': (26, 41),
            '41-60': (41, 61),
            'seniors': (61, 150)
        }
        
        if value not in age_ranges:
            return queryset
        
        min_age, max_age = age_ranges[value]
        min_date = today - timedelta(days=max_age * 365)
        max_date = today - timedelta(days=min_age * 365)
        
        if value == 'seniors':
            return queryset.filter(date_of_birth__lte=min_date)
        else:
            return queryset.filter(date_of_birth__gt=min_date, date_of_birth__lte=max_date)
    
    def filter_has_family(self, queryset, name, value):
        """Filter by whether member has family assigned"""
        if value is True:
            return queryset.filter(family__isnull=False)
        elif value is False:
            return queryset.filter(family__isnull=True)
        return queryset
    
    def filter_has_tags(self, queryset, name, value):
        """Filter by tag names (comma-separated)"""
        if not value:
            return queryset
        
        tag_names = [tag.strip() for tag in value.split(',')]
        return queryset.filter(tag_assignments__tag__name__in=tag_names).distinct()
    
    def filter_recent_activity(self, queryset, name, value):
        """Filter by recent activity"""
        if not value:
            return queryset
        
        periods = {
            'today': 1,
            'week': 7,
            'month': 30,
            'quarter': 90
        }
        
        if value not in periods:
            return queryset
        
        cutoff_date = timezone.now() - timedelta(days=periods[value])
        
        return queryset.filter(
            Q(registration_date__gte=cutoff_date) |
            Q(last_updated__gte=cutoff_date) |
            Q(last_contact_date__gte=cutoff_date)
        )