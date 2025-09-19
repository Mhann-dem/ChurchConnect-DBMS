# members/urls.py - FINAL FIXED VERSION

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MemberViewSet, MemberTagViewSet, MemberNoteViewSet,
    MemberStatisticsViewSet, BulkImportLogViewSet,
    public_member_registration
)

# Create router for ViewSets
router = DefaultRouter()

# CRITICAL FIX: Use empty string '' for MemberViewSet
# This makes /api/v1/members/ work instead of /api/v1/members/members/
router.register(r'', MemberViewSet, basename='member')

# Other ViewSets with proper prefixes
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'notes', MemberNoteViewSet, basename='member-note')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='bulk-import-log')

app_name = 'members'

urlpatterns = [
    # Public registration endpoint
    path('register/', public_member_registration, name='public-registration'),
    
    # Include all router URLs
    path('', include(router.urls)),
]

# This configuration creates these working URLs:
# GET  /api/v1/members/                    -> MemberViewSet.list()
# POST /api/v1/members/                    -> MemberViewSet.create()
# GET  /api/v1/members/{id}/               -> MemberViewSet.retrieve()
# PUT  /api/v1/members/{id}/               -> MemberViewSet.update()
# DELETE /api/v1/members/{id}/             -> MemberViewSet.destroy()
# GET  /api/v1/members/recent/             -> MemberViewSet.recent()
# GET  /api/v1/members/search/             -> MemberViewSet.search()
# GET  /api/v1/members/birthdays/          -> MemberViewSet.birthdays()
# GET  /api/v1/members/export/             -> MemberViewSet.export()
# POST /api/v1/members/bulk_actions/       -> MemberViewSet.bulk_actions()
# GET  /api/v1/members/register/           -> public_member_registration
# GET  /api/v1/members/statistics/         -> MemberStatisticsViewSet.list()
# GET  /api/v1/members/tags/               -> MemberTagViewSet.list()
# GET  /api/v1/members/notes/              -> MemberNoteViewSet.list()