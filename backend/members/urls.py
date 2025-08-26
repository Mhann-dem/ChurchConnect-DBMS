# members/urls.py
from django.urls import path, include
from django.http import HttpResponseRedirect
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .views import MemberViewSet, MemberTagViewSet, MemberStatisticsViewSet, BulkImportLogViewSet

app_name = 'members'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'members', MemberViewSet, basename='member')
router.register(r'tags', MemberTagViewSet, basename='member-tag')
router.register(r'statistics', MemberStatisticsViewSet, basename='member-statistics')
router.register(r'import-logs', BulkImportLogViewSet, basename='import-log')

@api_view(['GET', 'POST'])
def new_member_redirect(request):
    """
    Handle /new/ endpoint for backward compatibility
    Maintains backward compatibility for existing frontend code
    """
    if request.method == 'GET':
        # For GET requests, return info about using the standard endpoint
        return Response({
            'message': 'Please use POST /api/v1/members/members/ for member registration',
            'redirect_url': '/api/v1/members/members/',
            'deprecated': True
        }, status=status.HTTP_301_MOVED_PERMANENTLY)
    
    elif request.method == 'POST':
        # For POST requests, proxy to the actual member creation logic
        # This avoids redirect issues with POST data
        from .views import MemberViewSet
        
        # Create a viewset instance and call create method
        viewset = MemberViewSet()
        viewset.request = request
        viewset.format_kwarg = None
        
        try:
            response = viewset.create(request)
            # Add deprecation header
            response['X-Deprecated'] = 'Please use POST /api/v1/members/members/ instead'
            return response
        except Exception as e:
            return Response({
                'error': 'Please use the standard endpoint: POST /api/v1/members/members/',
                'redirect_url': '/api/v1/members/members/'
            }, status=status.HTTP_302_FOUND)

urlpatterns = [
    # Backward compatibility redirect
    path('new/', new_member_redirect, name='member-new-redirect'),
    
    # Include router URLs
    path('', include(router.urls)),
]

# Final URL patterns will be:
# Public endpoints:
# POST /api/v1/members/members/ - Create new member (public registration)

# Authenticated endpoints:
# GET /api/v1/members/members/ - List members (with filtering, pagination, search)
# GET /api/v1/members/members/{id}/ - Retrieve specific member
# PUT /api/v1/members/members/{id}/ - Update member
# PATCH /api/v1/members/members/{id}/ - Partial update member
# DELETE /api/v1/members/members/{id}/ - Delete member

# Statistics endpoints:
# GET /api/v1/members/statistics/ - Get member statistics
# GET /api/v1/members/statistics/gender_distribution/ - Get gender distribution
# GET /api/v1/members/statistics/age_demographics/ - Get age demographics
# GET /api/v1/members/statistics/registration_trends/ - Get registration trends

# Member-specific endpoints:
# GET /api/v1/members/members/export/ - Export members to CSV
# POST /api/v1/members/members/{id}/add_note/ - Add note to member
# GET /api/v1/members/members/{id}/notes/ - Get member notes
# POST /api/v1/members/members/{id}/add_tag/ - Add tag to member
# DELETE /api/v1/members/members/{id}/remove_tag/ - Remove tag from member

# Admin-only endpoints:
# POST /api/v1/members/members/bulk_import/ - Bulk import members from file
# GET /api/v1/members/members/import_template/ - Get import template info
# GET /api/v1/members/members/import_logs/ - Get recent import logs

# Tag management endpoints:
# GET /api/v1/members/tags/ - List all tags
# POST /api/v1/members/tags/ - Create new tag
# GET /api/v1/members/tags/{id}/ - Get specific tag
# PUT /api/v1/members/tags/{id}/ - Update tag
# DELETE /api/v1/members/tags/{id}/ - Delete tag

# Import log endpoints:
# GET /api/v1/members/import-logs/ - List import logs
# GET /api/v1/members/import-logs/{id}/ - Get specific import log details