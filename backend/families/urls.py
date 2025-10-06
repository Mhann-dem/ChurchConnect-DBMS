# backend/families/urls.py - CLEAN VERSION
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyViewSet, FamilyRelationshipViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', FamilyViewSet, basename='family')
router.register(r'relationships', FamilyRelationshipViewSet, basename='family-relationship')

app_name = 'families'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# Complete URL patterns available:
# 
# Family Management:
# GET    /api/v1/families/                          - List families
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
# Family Relationships:
# GET    /api/v1/families/relationships/            - List all family relationships
# POST   /api/v1/families/relationships/            - Create new family relationship
# GET    /api/v1/families/relationships/{id}/       - Retrieve relationship details
# PUT    /api/v1/families/relationships/{id}/       - Update relationship (full)
# PATCH  /api/v1/families/relationships/{id}/       - Update relationship (partial)
# DELETE /api/v1/families/relationships/{id}/       - Delete relationship