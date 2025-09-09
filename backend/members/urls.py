# members/urls.py - FIXED VERSION - Added missing endpoints
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewSet, MemberTagViewSet, MemberStatisticsViewSet, 
    BulkImportLogViewSet, public_member_registration
)

app_name = 'members'

# Create router for authenticated endpoints
router = DefaultRouter()
router.register(r'', MemberViewSet, basename='member')  # Empty prefix for /api/v1/members/
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='import-log')

urlpatterns = [
    # PUBLIC endpoint for member registration
    path('register/', public_member_registration, name='public-registration'),
    
    # AUTHENTICATED endpoints - router handles the rest
    path('', include(router.urls)),
]

# URL Structure created by this configuration:
# Public endpoints:
# POST /api/v1/members/register/ - Public member registration

# Authenticated endpoints (require Bearer token):
# GET /api/v1/members/ - List members (admin/staff only)
# POST /api/v1/members/ - Create member (admin only)  
# GET /api/v1/members/{id}/ - Get member details
# PUT /api/v1/members/{id}/ - Update member
# PATCH /api/v1/members/{id}/ - Partial update member
# DELETE /api/v1/members/{id}/ - Delete member (admin only)

# Custom member endpoints:
# GET /api/v1/members/recent/ - Get recently registered members
# GET /api/v1/members/search/ - Search members by query  
# GET /api/v1/members/birthdays/ - Get upcoming birthdays
# GET /api/v1/members/statistics/ - Member statistics
# GET /api/v1/members/export/ - Export members (admin only)
# POST /api/v1/members/bulk_actions/ - Bulk actions on members (admin only)

# Tag management:
# GET /api/v1/members/tags/ - List tags
# POST /api/v1/members/tags/ - Create tag (admin only)
# GET /api/v1/members/tags/{id}/ - Get tag
# PUT /api/v1/members/tags/{id}/ - Update tag (admin only)
# DELETE /api/v1/members/tags/{id}/ - Delete tag (admin only)

# Statistics:
# GET /api/v1/members/statistics/ - Member statistics

# Import logs:
# GET /api/v1/members/import-logs/ - List import logs (admin only)