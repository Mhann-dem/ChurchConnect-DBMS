# members/urls.py - FIXED VERSION
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewSet, MemberTagViewSet, MemberNoteViewSet,
    MemberStatisticsViewSet, BulkImportLogViewSet,
    public_member_registration, bulk_import_members, 
    get_import_template, test_database_connection
)

# CRITICAL: Use SimpleRouter instead of DefaultRouter to fix @action routing
from rest_framework.routers import SimpleRouter

router = SimpleRouter()
router.register(r'members', MemberViewSet, basename='member')
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'notes', MemberNoteViewSet, basename='member-note')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='bulk-import-log')

app_name = 'members'

urlpatterns = [
    # CRITICAL: Custom endpoints MUST come before router URLs
    path('register/', public_member_registration, name='public-registration'),
    path('bulk_import/', bulk_import_members, name='bulk-import'),
    path('template/', get_import_template, name='import-template'),
    path('test-db/', test_database_connection, name='test-db'),
    
    # Router URLs - This will now correctly handle @action routes
    path('', include(router.urls)),
]

# With SimpleRouter, these URLs are automatically created:
# GET  /api/v1/members/                    -> MemberViewSet.list()
# POST /api/v1/members/                    -> MemberViewSet.create()
# GET  /api/v1/members/{id}/               -> MemberViewSet.retrieve()
# PUT  /api/v1/members/{id}/               -> MemberViewSet.update()
# DELETE /api/v1/members/{id}/             -> MemberViewSet.destroy()
# GET  /api/v1/members/recent/             -> MemberViewSet.recent() [FIXED!]
# GET  /api/v1/members/search/             -> MemberViewSet.search()
# GET  /api/v1/members/birthdays/          -> MemberViewSet.birthdays()
# GET  /api/v1/members/export/             -> MemberViewSet.export()
# POST /api/v1/members/bulk_actions/       -> MemberViewSet.bulk_actions()
# GET  /api/v1/members/statistics/         -> MemberStatisticsViewSet.list()