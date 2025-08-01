# File: backend/churchconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView, 
    SpectacularRedocView
)

# API versioning patterns
api_v1_patterns = [
    path('auth/', include('authentication.urls')),
    path('members/', include('members.urls')),
    path('families/', include('families.urls')),
    path('groups/', include('groups.urls')),
    path('pledges/', include('pledges.urls')),
    path('reports/', include('reports.urls')),
    path('core/', include('core.urls')),
]

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints with versioning
    path('api/v1/', include(api_v1_patterns)),
    
    # API documentation endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Legacy API endpoints (optional - for backward compatibility)
    # Uncomment these if you want to support both /api/ and /api/v1/ paths
    # path('api/auth/', include('authentication.urls')),
    # path('api/members/', include('members.urls')),
    # path('api/families/', include('families.urls')),
    # path('api/groups/', include('groups.urls')),
    # path('api/pledges/', include('pledges.urls')),
    # path('api/reports/', include('reports.urls')),
    # path('api/core/', include('core.urls')),
    
    # Health check endpoint (uncomment when core.urls has health check)
    # path('health/', include('core.urls')),
    
    # Redirect root to API docs
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom error handlers
handler404 = 'core.views.custom_404'
handler500 = 'core.views.custom_500'

# Admin site configuration
admin.site.site_header = "ChurchConnect Administration"
admin.site.site_title = "ChurchConnect Admin"
admin.site.index_title = "Welcome to ChurchConnect Administration"