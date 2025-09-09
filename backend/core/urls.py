# Step 2: Update core/urls.py with complete endpoints
# File: backend/churchconnect/core/urls.py

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Core system endpoints
    path('health/', views.health_check, name='health-check'),
    path('status/', views.system_status, name='system-status'),
    path('version/', views.api_version, name='api-version'),
    
    # Dashboard endpoints (FIXED)
    path('dashboard/overview/', views.dashboard_overview, name='dashboard-overview'),
    path('dashboard/health/', views.dashboard_health, name='dashboard-health'),
    path('dashboard/alerts/', views.dashboard_alerts, name='dashboard-alerts'),
    path('dashboard/config/<str:user_id>/', views.dashboard_config, name='dashboard-config'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
]

# URL Structure created:
# GET /api/v1/core/health/ - Basic health check (public)
# GET /api/v1/core/status/ - Detailed system status (public)
# GET /api/v1/core/version/ - API version info (public)
# GET /api/v1/core/dashboard/overview/ - Dashboard overview stats (authenticated)
# GET /api/v1/core/dashboard/health/ - Dashboard health status (authenticated)
# GET /api/v1/core/dashboard/alerts/ - Dashboard alerts/notifications (authenticated)
# GET/POST /api/v1/core/dashboard/config/<user_id>/ - Dashboard configuration (authenticated)