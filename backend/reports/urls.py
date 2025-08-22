# backend/churchconnect/reports/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.ReportViewSet, basename='report')  # Empty prefix for /api/v1/reports/
router.register(r'runs', views.ReportRunViewSet, basename='reportrun')
router.register(r'templates', views.ReportTemplateViewSet, basename='reporttemplate')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Custom download endpoint
    path('download/<uuid:run_id>/', views.download_report, name='download_report'),
    
    # Legacy CSV endpoints for backward compatibility
    path('members/csv/', views.ReportViewSet.as_view({'get': 'generate'}), 
         {'report_type': 'members', 'format': 'csv'}, name='members_csv'),
    path('pledges/csv/', views.ReportViewSet.as_view({'get': 'generate'}), 
         {'report_type': 'pledges', 'format': 'csv'}, name='pledges_csv'),
    path('stats/', views.ReportViewSet.as_view({'get': 'stats'}), name='report_stats'),
]

# URL patterns will be:
# GET /api/v1/reports/ - List reports
# POST /api/v1/reports/ - Create new report
# GET /api/v1/reports/{id}/ - Retrieve specific report
# PUT /api/v1/reports/{id}/ - Update report
# DELETE /api/v1/reports/{id}/ - Delete report
# POST /api/v1/reports/{id}/generate/ - Generate report
# GET /api/v1/reports/runs/ - List report runs
# POST /api/v1/reports/runs/ - Create report run
# GET /api/v1/reports/runs/{id}/ - Retrieve report run
# GET /api/v1/reports/templates/ - List report templates
# POST /api/v1/reports/templates/ - Create report template
# GET /api/v1/reports/templates/{id}/ - Retrieve report template
# PUT /api/v1/reports/templates/{id}/ - Update report template
# DELETE /api/v1/reports/templates/{id}/ - Delete report template
# GET /api/v1/reports/download/{run_id}/ - Download report file
# GET /api/v1/reports/members/csv/ - Export members CSV (legacy)
# GET /api/v1/reports/pledges/csv/ - Export pledges CSV (legacy)
# GET /api/v1/reports/stats/ - Get report statistics (legacy)