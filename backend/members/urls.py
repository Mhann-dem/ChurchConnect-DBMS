# members/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, MemberTagViewSet, MemberStatisticsViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', MemberViewSet, basename='member')
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# URL patterns will be:
# GET /api/v1/members/ - List members (with filtering, pagination, search)
# POST /api/v1/members/ - Create new member (public form submission)
# GET /api/v1/members/{id}/ - Retrieve specific member
# PUT /api/v1/members/{id}/ - Update member
# PATCH /api/v1/members/{id}/ - Partial update member
# DELETE /api/v1/members/{id}/ - Delete member
# GET /api/v1/members/statistics/ - Get member statistics
# GET /api/v1/members/export/ - Export members to CSV
# POST /api/v1/members/{id}/add_note/ - Add note to member
# GET /api/v1/members/{id}/notes/ - Get member notes
# POST /api/v1/members/{id}/add_tag/ - Add tag to member
# DELETE /api/v1/members/{id}/remove_tag/ - Remove tag from member
# GET /api/v1/members/tags/ - List all tags
# POST /api/v1/members/tags/ - Create new tag