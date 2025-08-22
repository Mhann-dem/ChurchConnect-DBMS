# backend/churchconnect/families/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyViewSet, FamilyRelationshipViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', FamilyViewSet, basename='family')  # Empty prefix for /api/v1/families/
router.register(r'relationships', FamilyRelationshipViewSet, basename='family-relationship')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# URL patterns will be:
# GET /api/v1/families/ - List/Create families
# POST /api/v1/families/ - Create new family
# GET /api/v1/families/{id}/ - Retrieve/Update/Delete family
# PUT /api/v1/families/{id}/ - Update family
# PATCH /api/v1/families/{id}/ - Partial update family
# DELETE /api/v1/families/{id}/ - Delete family
# POST /api/v1/families/{id}/add-member/ - Add member to family
# POST /api/v1/families/{id}/remove-member/{member_id}/ - Remove member from family
# GET /api/v1/families/{id}/members/ - Get family members
# POST /api/v1/families/{id}/update-relationship/{member_id}/ - Update member relationship
# GET /api/v1/families/statistics/ - Get family statistics
# GET /api/v1/families/relationships/ - List/Create family relationships
# POST /api/v1/families/relationships/ - Create family relationship
# GET /api/v1/families/relationships/{id}/ - Retrieve/Update/Delete family relationship
# PUT /api/v1/families/relationships/{id}/ - Update family relationship
# DELETE /api/v1/families/relationships/{id}/ - Delete family relationship