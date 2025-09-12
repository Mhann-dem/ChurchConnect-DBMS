# backend/churchconnect/reports/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.ReportViewSet, basename='report')
router.register(r'runs', views.ReportRunViewSet, basename='reportrun')
router.register(r'templates', views.ReportTemplateViewSet, basename='reporttemplate')

app_name = 'reports'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Custom download endpoint
    path('download/<uuid:run_id>/', views.download_report, name='download_report'),
]

# Available URL patterns:
# GET    /api/v1/reports/                     - List reports
# POST   /api/v1/reports/                     - Create new report
# GET    /api/v1/reports/{id}/                - Retrieve specific report
# PUT    /api/v1/reports/{id}/                - Update report
# PATCH  /api/v1/reports/{id}/                - Partially update report
# DELETE /api/v1/reports/{id}/                - Delete report
# POST   /api/v1/reports/{id}/run/            - Run specific report
# POST   /api/v1/reports/generate/            - Generate ad-hoc report
# GET    /api/v1/reports/stats/               - Get report statistics
# POST   /api/v1/reports/bulk_action/         - Perform bulk actions

# GET    /api/v1/reports/runs/                - List report runs
# GET    /api/v1/reports/runs/{id}/           - Retrieve specific report run

# GET    /api/v1/reports/templates/           - List report templates
# POST   /api/v1/reports/templates/           - Create new template
# GET    /api/v1/reports/templates/{id}/      - Retrieve specific template
# PUT    /api/v1/reports/templates/{id}/      - Update template
# PATCH  /api/v1/reports/templates/{id}/      - Partially update template
# DELETE /api/v1/reports/templates/{id}/      - Delete template
# POST   /api/v1/reports/templates/{id}/use_template/ - Create report from template

# GET    /api/v1/reports/download/{run_id}/   - Download report file