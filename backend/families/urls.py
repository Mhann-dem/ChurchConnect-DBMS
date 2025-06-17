# backend/churchconnect/families/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FamilyViewSet, FamilyRelationshipViewSet

router = DefaultRouter()
router.register(r'families', FamilyViewSet, basename='family')
router.register(r'family-relationships', FamilyRelationshipViewSet, basename='family-relationship')

urlpatterns = [
    path('', include(router.urls)),
]

# URL patterns will be:
# /api/families/ - List/Create families
# /api/families/{id}/ - Retrieve/Update/Delete family
# /api/families/{id}/add-member/ - Add member to family
# /api/families/{id}/remove-member/{member_id}/ - Remove member from family
# /api/families/{id}/members/ - Get family members
# /api/families/{id}/update-relationship/{member_id}/ - Update member relationship
# /api/families/statistics/ - Get family statistics
# /api/family-relationships/ - List/Create family relationships
# /api/family-relationships/{id}/ - Retrieve/Update/Delete family relationship