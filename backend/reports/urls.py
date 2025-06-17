# backend/churchconnect/reports/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'reports', views.ReportViewSet)
router.register(r'runs', views.ReportRunViewSet, basename='reportrun')
router.register(r'templates', views.ReportTemplateViewSet)

urlpatterns = [
    # API routes
    path('api/', include(router.urls)),
    
    # Custom download endpoint
    path('api/reports/download/<uuid:run_id>/', views.download_report, name='download_report'),
    
    # Legacy CSV endpoints for backward compatibility
    path('api/reports/members/csv/', views.ReportViewSet.as_view({'get': 'generate'}), 
         {'report_type': 'members', 'format': 'csv'}, name='members_csv'),
    path('api/reports/pledges/csv/', views.ReportViewSet.as_view({'get': 'generate'}), 
         {'report_type': 'pledges', 'format': 'csv'}, name='pledges_csv'),
    path('api/reports/stats/', views.ReportViewSet.as_view({'get': 'stats'}), name='report_stats'),
]