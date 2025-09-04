# members/urls.py - SECURE VERSION - Remove debug endpoints and separate public/private
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewSet, MemberTagViewSet, MemberStatisticsViewSet, 
    BulkImportLogViewSet, public_member_registration
)

app_name = 'members'

# Create router for authenticated endpoints only
router = DefaultRouter()
router.register(r'members', MemberViewSet, basename='member')
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='import-log')

urlpatterns = [
    # PUBLIC endpoint for member registration
    path('register/', public_member_registration, name='public-registration'),
    
    # AUTHENTICATED endpoints only
    path('', include(router.urls)),
]

# URL Structure after fixes:
# Public endpoints:
# POST /api/v1/members/register/ - Public member registration

# Authenticated endpoints (require Bearer token):
# GET /api/v1/members/members/ - List members (admin/staff only)
# POST /api/v1/members/members/ - Create member (admin only)
# GET /api/v1/members/members/{id}/ - Get member details
# PUT /api/v1/members/members/{id}/ - Update member
# PATCH /api/v1/members/members/{id}/ - Partial update member
# DELETE /api/v1/members/members/{id}/ - Delete member (admin only)
# GET /api/v1/members/members/statistics/ - Member statistics
# GET /api/v1/members/members/export/ - Export members (admin only)

# Tag management (authenticated users can view, admins can modify):
# GET /api/v1/members/tags/ - List tags
# POST /api/v1/members/tags/ - Create tag (admin only)
# GET /api/v1/members/tags/{id}/ - Get tag
# PUT /api/v1/members/tags/{id}/ - Update tag (admin only)
# DELETE /api/v1/members/tags/{id}/ - Delete tag (admin only)

# Statistics (authenticated users only):
# GET /api/v1/members/statistics/ - Member statistics

# Import logs (admin only):
# GET /api/v1/members/import-logs/ - List import logs