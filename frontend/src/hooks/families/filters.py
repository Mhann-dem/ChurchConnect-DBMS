# backend/churchconnect/families/filters.py

import django_filters
from django.db import models
from .models import Family, FamilyRelationship


class FamilyFilter(django_filters.FilterSet):
    """
    Advanced filtering for families as specified in documentation
    Supports natural language search and complex filtering
    """
    
    # Date range filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')
    
    # Member count filters
    member_count_min = django_filters.NumberFilter(method='filter_member_count_min')
    member_count_max = django_filters.NumberFilter(method='filter_member_count_max')
    member_count_exact = django_filters.NumberFilter(method='filter_member_count_exact')
    
    # Boolean filters
    has_children = django_filters.BooleanFilter(method='filter_has_children')
    has_primary_contact = django_filters.BooleanFilter(method='filter_has_primary_contact')
    missing_primary_contact = django_filters.BooleanFilter(method='filter_missing_primary_contact')
    
    # Family size categories
    family_size = django_filters.ChoiceFilter(
        choices=[
            ('single', 'Single Member (1)'),
            ('small', 'Small Family (2-3)'),
            ('medium', 'Medium Family (4-5)'),
            ('large', 'Large Family (6+)')
        ],
        method='filter_family_size'
    )
    
    # Address-based filters
    address_contains = django_filters.CharFilter(field_name='address', lookup_expr='icontains')
    
    # Primary contact filters
    primary_contact_name = django_filters.CharFilter(method='filter_primary_contact_name')
    primary_contact_email = django_filters.CharFilter(field_name='primary_contact__email', lookup_expr='icontains')
    
    # Relationship type filters
    has_relationship_type = django_filters.CharFilter(method='filter_has_relationship_type')
    
    class Meta:
        model = Family
        fields = {
            'family_name': ['exact', 'icontains', 'istartswith'],
            'primary_contact': ['exact'],
            'created_at': ['exact', 'gte', 'lte'],
            'updated_at': ['exact', 'gte', 'lte'],
        }

    def filter_member_count_min(self, queryset, name, value):
        """Filter families with minimum member count"""
        return queryset.annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count__gte=value)

    def filter_member_count_max(self, queryset, name, value):
        """Filter families with maximum member count"""
        return queryset.annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count__lte=value)

    def filter_member_count_exact(self, queryset, name, value):
        """Filter families with exact member count"""
        return queryset.annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count=value)

    def filter_has_children(self, queryset, name, value):
        """Filter families with or without children"""
        children_count = models.Count(
            'family_relationships',
            filter=models.Q(family_relationships__relationship_type='child')
        )
        
        if value:
            return queryset.annotate(children_count=children_count).filter(children_count__gt=0)
        else:
            return queryset.annotate(children_count=children_count).filter(children_count=0)

    def filter_has_primary_contact(self, queryset, name, value):
        """Filter families with or without primary contact"""
        if value:
            return queryset.filter(primary_contact__isnull=False)
        else:
            return queryset.filter(primary_contact__isnull=True)

    def filter_missing_primary_contact(self, queryset, name, value):
        """Filter families missing primary contact"""
        if value:
            return queryset.filter(primary_contact__isnull=True)
        return queryset

    def filter_family_size(self, queryset, name, value):
        """Filter families by size categories"""
        member_count = models.Count('family_relationships')
        queryset = queryset.annotate(member_count=member_count)
        
        if value == 'single':
            return queryset.filter(member_count=1)
        elif value == 'small':
            return queryset.filter(member_count__in=[2, 3])
        elif value == 'medium':
            return queryset.filter(member_count__in=[4, 5])
        elif value == 'large':
            return queryset.filter(member_count__gte=6)
        
        return queryset

    def filter_primary_contact_name(self, queryset, name, value):
        """Filter by primary contact full name"""
        return queryset.filter(
            models.Q(primary_contact__first_name__icontains=value) |
            models.Q(primary_contact__last_name__icontains=value)
        )

    def filter_has_relationship_type(self, queryset, name, value):
        """Filter families that have a specific relationship type"""
        return queryset.filter(family_relationships__relationship_type=value).distinct()


class FamilyRelationshipFilter(django_filters.FilterSet):
    """
    Advanced filtering for family relationships
    """
    
    # Date range filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Family filters
    family_name = django_filters.CharFilter(field_name='family__family_name', lookup_expr='icontains')
    family_has_children = django_filters.BooleanFilter(method='filter_family_has_children')
    
    # Member filters
    member_name = django_filters.CharFilter(method='filter_member_name')
    member_email = django_filters.CharFilter(field_name='member__email', lookup_expr='icontains')
    member_gender = django_filters.CharFilter(field_name='member__gender')
    
    # Age-based filters (for members)
    member_age_min = django_filters.NumberFilter(method='filter_member_age_min')
    member_age_max = django_filters.NumberFilter(method='filter_member_age_max')
    
    # Relationship type groupings
    adults_only = django_filters.BooleanFilter(method='filter_adults_only')
    children_only = django_filters.BooleanFilter(method='filter_children_only')
    parents_only = django_filters.BooleanFilter(method='filter_parents_only')
    
    class Meta:
        model = FamilyRelationship
        fields = {
            'family': ['exact'],
            'relationship_type': ['exact'],
            'created_at': ['exact', 'gte', 'lte'],
        }

    def filter_family_has_children(self, queryset, name, value):
        """Filter relationships where the family has children"""
        if value:
            families_with_children = Family.objects.filter(
                family_relationships__relationship_type='child'
            ).distinct()
            return queryset.filter(family__in=families_with_children)
        else:
            families_without_children = Family.objects.exclude(
                family_relationships__relationship_type='child'
            )
            return queryset.filter(family__in=families_without_children)

    def filter_member_name(self, queryset, name, value):
        """Filter by member full name"""
        return queryset.filter(
            models.Q(member__first_name__icontains=value) |
            models.Q(member__last_name__icontains=value) |
            models.Q(member__preferred_name__icontains=value)
        )

    def filter_member_age_min(self, queryset, name, value):
        """Filter by minimum member age"""
        from datetime import date, timedelta
        max_birth_date = date.today() - timedelta(days=365 * value)
        return queryset.filter(member__date_of_birth__lte=max_birth_date)

    def filter_member_age_max(self, queryset, name, value):
        """Filter by maximum member age"""
        from datetime import date, timedelta
        min_birth_date = date.today() - timedelta(days=365 * value)
        return queryset.filter(member__date_of_birth__gte=min_birth_date)

    def filter_adults_only(self, queryset, name, value):
        """Filter for adult relationships only"""
        if value:
            return queryset.filter(relationship_type__in=['head', 'spouse'])
        return queryset

    def filter_children_only(self, queryset, name, value):
        """Filter for child relationships only"""
        if value:
            return queryset.filter(relationship_type='child')
        return queryset

    def filter_parents_only(self, queryset, name, value):
        """Filter for parent relationships (head and spouse with children in family)"""
        if value:
            # Find families that have children
            families_with_children = Family.objects.filter(
                family_relationships__relationship_type='child'
            ).distinct()
            
            # Return head and spouse relationships from those families
            return queryset.filter(
                relationship_type__in=['head', 'spouse'],
                family__in=families_with_children
            )
        return queryset


class FamilySearchFilter(django_filters.FilterSet):
    """
    Natural language search filter for families
    As specified in the documentation for advanced search capabilities
    """
    
    # Natural language search
    search = django_filters.CharFilter(method='filter_search')
    
    # Quick filters for common searches
    new_families = django_filters.BooleanFilter(method='filter_new_families')
    incomplete_families = django_filters.BooleanFilter(method='filter_incomplete_families')
    large_families = django_filters.BooleanFilter(method='filter_large_families')
    
    class Meta:
        model = Family
        fields = ['search', 'new_families', 'incomplete_families', 'large_families']

    def filter_search(self, queryset, name, value):
        """
        Natural language search across multiple fields
        Supports typo tolerance and flexible matching
        """
        if not value:
            return queryset

        # Split search terms
        terms = value.lower().split()
        
        # Build complex Q object for searching
        search_query = models.Q()
        
        for term in terms:
            term_query = (
                models.Q(family_name__icontains=term) |
                models.Q(primary_contact__first_name__icontains=term) |
                models.Q(primary_contact__last_name__icontains=term) |
                models.Q(primary_contact__email__icontains=term) |
                models.Q(address__icontains=term) |
                models.Q(notes__icontains=term) |
                models.Q(family_relationships__member__first_name__icontains=term) |
                models.Q(family_relationships__member__last_name__icontains=term)
            )
            search_query &= term_query
        
        return queryset.filter(search_query).distinct()

    def filter_new_families(self, queryset, name, value):
        """Filter for recently created families (last 30 days)"""
        if value:
            from datetime import date, timedelta
            thirty_days_ago = date.today() - timedelta(days=30)
            return queryset.filter(created_at__gte=thirty_days_ago)
        return queryset

    def filter_incomplete_families(self, queryset, name, value):
        """Filter families that need attention (missing primary contact, no members, etc.)"""
        if value:
            return queryset.filter(
                models.Q(primary_contact__isnull=True) |
                models.Q(family_relationships__isnull=True)
            ).distinct()
        return queryset

    def filter_large_families(self, queryset, name, value):
        """Filter families with 5 or more members"""
        if value:
            return queryset.annotate(
                member_count=models.Count('family_relationships')
            ).filter(member_count__gte=5)
        return queryset