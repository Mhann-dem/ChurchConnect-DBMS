# backend/churchconnect/families/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyViewSet, FamilyRelationshipViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', FamilyViewSet, basename='family')
router.register(r'relationships', FamilyRelationshipViewSet, basename='family-relationship')

# App name for namespacing
app_name = 'families'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# Complete URL patterns available:
# 
# Family Management:
# GET    /api/v1/families/                          - List families (paginated, searchable, filterable)
# POST   /api/v1/families/                          - Create new family
# GET    /api/v1/families/{id}/                     - Retrieve family details
# PUT    /api/v1/families/{id}/                     - Update family (full)
# PATCH  /api/v1/families/{id}/                     - Update family (partial)
# DELETE /api/v1/families/{id}/                     - Delete family
#
# Family Member Management:
# POST   /api/v1/families/{id}/add-member/          - Add member to family
# DELETE /api/v1/families/{id}/remove-member/{member_id}/  - Remove member from family
# GET    /api/v1/families/{id}/members/             - Get all family members
# PATCH  /api/v1/families/{id}/update-relationship/{member_id}/  - Update member relationship
# POST   /api/v1/families/{id}/set-primary-contact/ - Set primary contact for family
#
# Family Analytics & Reports:
# GET    /api/v1/families/statistics/               - Get family statistics
# GET    /api/v1/families/recent-families/          - Get recently created families
# GET    /api/v1/families/families-needing-attention/  - Get families needing attention
# POST   /api/v1/families/bulk-operations/          - Perform bulk operations
#
# Family Relationships (Direct Management):
# GET    /api/v1/families/relationships/            - List all family relationships
# POST   /api/v1/families/relationships/            - Create new family relationship
# GET    /api/v1/families/relationships/{id}/       - Retrieve relationship details
# PUT    /api/v1/families/relationships/{id}/       - Update relationship (full)
# PATCH  /api/v1/families/relationships/{id}/       - Update relationship (partial)
# DELETE /api/v1/families/relationships/{id}/       - Delete relationship
#
# Query Parameters for Filtering/Searching:
# 
# Family List (/api/v1/families/):
# - search: Search family name, primary contact name/email, address, notes
# - primary_contact: Filter by primary contact ID
# - created_at__gte: Filter relationships created after date
# - created_at__lte: Filter relationships created before date
# - ordering: Sort by created_at, relationship_type (add - for descending)
#
# Examples:
# GET /api/v1/families/relationships/?family=uuid&relationship_type=child
# GET /api/v1/families/relationships/?adults_only=true&ordering=-created_at
# GET /api/v1/families/relationships/?search=John&relationship_type=head: Filter families created after date
# - created_at__lte: Filter families created before date
# - member_count_min: Minimum number of members
# - member_count_max: Maximum number of members
# - has_children: true/false - families with/without children
# - missing_primary_contact: true - families without primary contact
# - ordering: Sort by family_name, created_at, updated_at (add - for descending)
# - page: Page number for pagination
# - page_size: Number of results per page
#
# Examples:
# GET /api/v1/families/?search=Smith&has_children=true
# GET /api/v1/families/?member_count_min=3&ordering=-created_at
# GET /api/v1/families/?missing_primary_contact=true
#
# Family Relationships List (/api/v1/families/relationships/):
# - search: Search member name, family name, notes
# - family: Filter by family ID
# - relationship_type: Filter by relationship type (head, spouse, child, dependent, other)
# - adults_only: true - only adult relationships (head, spouse)
# - children_only: true - only child relationships
# - created_at__gte