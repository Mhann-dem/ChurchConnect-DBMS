# members/filters.py
import django_filters
from django.db import models
from .models import Member

class MemberFilter(django_filters.FilterSet):
    """Filter class for Member model"""
    
    # Text search across multiple fields
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Gender filter
    gender = django_filters.ChoiceFilter(
        choices=Member.GENDER_CHOICES,
        empty_label="All Genders"
    )
    
    # Age range filter
    age_min = django_filters.NumberFilter(method='filter_age_min', label='Min Age')
    age_max = django_filters.NumberFilter(method='filter_age_max', label='Max Age')
    
    # Registration date range
    registration_date_after = django_filters.DateFilter(
        field_name='registration_date',
        lookup_expr='date__gte',
        label='Registered After'
    )
    registration_date_before = django_filters.DateFilter(
        field_name='registration_date',
        lookup_expr='date__lte',
        label='Registered Before'
    )
    
    # Active status
    is_active = django_filters.BooleanFilter(label='Active')
    
    # Communication opt-in
    communication_opt_in = django_filters.BooleanFilter(label='Communication Opt-in')
    
    # Contact method
    preferred_contact_method = django_filters.ChoiceFilter(
        choices=Member.CONTACT_METHOD_CHOICES,
        empty_label="All Contact Methods"
    )
    
    # Has family
    has_family = django_filters.BooleanFilter(
        method='filter_has_family',
        label='Has Family'
    )
    
    # Language
    preferred_language = django_filters.CharFilter(
        lookup_expr='icontains',
        label='Language'
    )
    
    class Meta:
        model = Member
        fields = {
            'first_name': ['icontains'],
            'last_name': ['icontains'],
            'email': ['icontains'],
            'phone': ['icontains'],
        }
    
    def filter_search(self, queryset, name, value):
        """Filter across multiple text fields"""
        if value:
            return queryset.filter(
                models.Q(first_name__icontains=value) |
                models.Q(last_name__icontains=value) |
                models.Q(preferred_name__icontains=value) |
                models.Q(email__icontains=value) |
                models.Q(phone__icontains=value) |
                models.Q(notes__icontains=value)
            )
        return queryset
    
    def filter_age_min(self, queryset, name, value):
        """Filter by minimum age"""
        if value is not None:
            from datetime import date, timedelta
            max_birth_date = date.today() - timedelta(days=value * 365.25)
            return queryset.filter(date_of_birth__lte=max_birth_date)
        return queryset
    
    def filter_age_max(self, queryset, name, value):
        """Filter by maximum age"""
        if value is not None:
            from datetime import date, timedelta
            min_birth_date = date.today() - timedelta(days=(value + 1) * 365.25)
            return queryset.filter(date_of_birth__gt=min_birth_date)
        return queryset
    
    def filter_has_family(self, queryset, name, value):
        """Filter by family association"""
        if value is True:
            return queryset.filter(family__isnull=False)
        elif value is False:
            return queryset.filter(family__isnull=True)
        return queryset