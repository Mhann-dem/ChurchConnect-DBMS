# members/urls.py - COMPLETE DEBUG VERSION
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewSet, MemberTagViewSet, MemberNoteViewSet,
    MemberStatisticsViewSet, BulkImportLogViewSet,
    public_member_registration, bulk_import_members, 
    get_import_template, test_database_connection
)

# Create router
router = DefaultRouter()

# Register viewsets - CRITICAL: Make sure these are registered correctly
router.register(r'', MemberViewSet, basename='member')  # Changed to empty string for root path
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'notes', MemberNoteViewSet, basename='member-note')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='bulk-import-log')

app_name = 'members'

# Print URL patterns for debugging
print(f"[DEBUG] Router URLs: {router.urls}")

urlpatterns = [
    # Custom endpoints - these need to be first and very specific
    path('register/', public_member_registration, name='public-registration'),
    path('bulk_import/', bulk_import_members, name='bulk-import'),
    path('template/', get_import_template, name='import-template'),
    path('test-db/', test_database_connection, name='test-db'),
    
    # Include ALL router URLs at the root level
    path('', include(router.urls)),
]

# DEBUG: Print all URL patterns
print(f"[DEBUG] Final URL patterns:")
for i, pattern in enumerate(urlpatterns):
    print(f"  {i}: {pattern}")

# Expected URLs after this fix:
# GET  /api/v1/members/                    -> MemberViewSet.list()
# POST /api/v1/members/                    -> MemberViewSet.create()
# GET  /api/v1/members/{id}/               -> MemberViewSet.retrieve()
# PUT  /api/v1/members/{id}/               -> MemberViewSet.update()
# DELETE /api/v1/members/{id}/             -> MemberViewSet.destroy()
# GET  /api/v1/members/recent/             -> MemberViewSet.recent() [SHOULD WORK NOW]
# GET  /api/v1/members/search/             -> MemberViewSet.search()
# GET  /api/v1/members/birthdays/          -> MemberViewSet.birthdays()
# GET  /api/v1/members/export/             -> MemberViewSet.export()
# POST /api/v1/members/bulk_actions/       -> MemberViewSet.bulk_actions()
# GET  /api/v1/members/register/           -> public_member_registration
# GET  /api/v1/members/statistics/         -> MemberStatisticsViewSet.list()