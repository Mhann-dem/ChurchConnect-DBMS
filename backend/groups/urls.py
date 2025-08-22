# backend/churchconnect/groups/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupViewSet, GroupCategoryViewSet, MemberGroupRelationshipViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', GroupViewSet, basename='group')  # Empty prefix for /api/v1/groups/
router.register(r'categories', GroupCategoryViewSet, basename='group-category')
router.register(r'memberships', MemberGroupRelationshipViewSet, basename='group-membership')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# URL patterns will be:
# GET /api/v1/groups/ - List/Create groups
# POST /api/v1/groups/ - Create new group
# GET /api/v1/groups/{id}/ - Retrieve/Update/Delete group
# PUT /api/v1/groups/{id}/ - Update group
# PATCH /api/v1/groups/{id}/ - Partial update group
# DELETE /api/v1/groups/{id}/ - Delete group
# POST /api/v1/groups/{id}/join/ - Add member to group
# POST /api/v1/groups/{id}/remove-member/{member_id}/ - Remove member from group
# GET /api/v1/groups/{id}/members/ - Get group members
# POST /api/v1/groups/{id}/update-membership/{member_id}/ - Update member's role/status
# POST /api/v1/groups/{id}/approve-member/{member_id}/ - Approve pending member
# POST /api/v1/groups/{id}/decline-member/{member_id}/ - Decline pending member
# GET /api/v1/groups/statistics/ - Get group statistics
# GET /api/v1/groups/public/ - Get public groups
# GET /api/v1/groups/categories/ - List/Create categories
# POST /api/v1/groups/categories/ - Create category
# GET /api/v1/groups/categories/{id}/ - Retrieve/Update/Delete category
# PUT /api/v1/groups/categories/{id}/ - Update category
# DELETE /api/v1/groups/categories/{id}/ - Delete category
# GET /api/v1/groups/categories/{id}/groups/ - Get groups in category
# GET /api/v1/groups/memberships/ - List/Create memberships
# POST /api/v1/groups/memberships/ - Create membership
# GET /api/v1/groups/memberships/{id}/ - Retrieve/Update/Delete membership
# PUT /api/v1/groups/memberships/{id}/ - Update membership
# DELETE /api/v1/groups/memberships/{id}/ - Delete membership
# POST /api/v1/groups/memberships/{id}/activate/ - Activate membership
# POST /api/v1/groups/memberships/{id}/deactivate/ - Deactivate membership