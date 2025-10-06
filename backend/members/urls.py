# members/urls.py - FINAL CLEAN VERSION
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

# Register viewsets
router.register(r'', MemberViewSet, basename='member')
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'notes', MemberNoteViewSet, basename='member-note')
# CHANGED: Use 'stats' instead of 'statistics' to avoid collision
router.register(r'stats', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='bulk-import-log')

app_name = 'members'

urlpatterns = [
    # Custom function-based views (must be BEFORE router URLs)
    path('register/', public_member_registration, name='public-registration'),
    path('bulk_import/', bulk_import_members, name='bulk-import'),
    path('template/', get_import_template, name='import-template'),
    path('test-db/', test_database_connection, name='test-db'),
    
    # Include ALL router URLs
    path('', include(router.urls)),
]

# Expected URLs:
# GET  /api/v1/members/                    -> MemberViewSet.list()
# POST /api/v1/members/                    -> MemberViewSet.create()
# GET  /api/v1/members/{id}/               -> MemberViewSet.retrieve()
# PUT  /api/v1/members/{id}/               -> MemberViewSet.update()
# DELETE /api/v1/members/{id}/             -> MemberViewSet.destroy()
# GET  /api/v1/members/recent/             -> MemberViewSet.recent()
# GET  /api/v1/members/search/             -> MemberViewSet.search()
# GET  /api/v1/members/birthdays/          -> MemberViewSet.birthdays()
# GET  /api/v1/members/statistics/         -> MemberViewSet.statistics() (ViewSet action)
# GET  /api/v1/members/export/             -> MemberViewSet.export()
# POST /api/v1/members/bulk_actions/       -> MemberViewSet.bulk_actions()
# GET  /api/v1/members/{id}/activity/      -> MemberViewSet.activity()
# GET  /api/v1/members/{id}/family/        -> MemberViewSet.family_members()
# GET  /api/v1/members/{id}/groups/        -> MemberViewSet.groups()
# GET  /api/v1/members/register/           -> public_member_registration
# POST /api/v1/members/bulk_import/        -> bulk_import_members
# GET  /api/v1/members/template/           -> get_import_template
# GET  /api/v1/members/stats/              -> MemberStatisticsViewSet.list() (NO COLLISION!)
# GET  /api/v1/members/stats/{id}/         -> MemberStatisticsViewSet.retrieve()