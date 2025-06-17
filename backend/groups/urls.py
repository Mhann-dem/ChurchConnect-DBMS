# backend/churchconnect/groups/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupViewSet, GroupCategoryViewSet, MemberGroupRelationshipViewSet

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'group-categories', GroupCategoryViewSet, basename='group-category')
router.register(r'group-memberships', MemberGroupRelationshipViewSet, basename='group-membership')

urlpatterns = [
    path('', include(router.urls)),
]

# URL patterns will be:
# /api/groups/ - List/Create groups
# /api/groups/{id}/ - Retrieve/Update/Delete group
# /api/groups/{id}/join/ - Add member to group
# /api/groups/{id}/remove-member/{member_id}/ - Remove member from group
# /api/groups/{id}/members/ - Get group members
# /api/groups/{id}/update-membership/{member_id}/ - Update member's role/status
# /api/groups/{id}/approve-member/{member_id}/ - Approve pending member
# /api/groups/{id}/decline-member/{member_id}/ - Decline pending member
# /api/groups/statistics/ - Get group statistics
# /api/groups/public/ - Get public groups
# /api/group-categories/ - List/Create categories
# /api/group-categories/{id}/ - Retrieve/Update/Delete category
# /api/group-categories/{id}/groups/ - Get groups in category
# /api/group-memberships/ - List/Create memberships
# /api/group-memberships/{id}/ - Retrieve/Update/Delete membership
# /api/group-memberships/{id}/activate/ - Activate membership
# /api/group-memberships/{id}/deactivate/ - Deactivate membership