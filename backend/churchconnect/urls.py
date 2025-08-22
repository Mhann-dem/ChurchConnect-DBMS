# File: backend/churchconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView, 
    SpectacularRedocView
)

# API health check view
def api_health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'ChurchConnect API is running',
        'version': '1.0.0'
    })

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
    
    # API health check
    path('api/health/', api_health_check, name='api_health'),
    
    # API endpoints with versioning
    path('api/v1/', include(api_v1_patterns)),
    
    # API documentation endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Legacy API endpoints (for backward compatibility)
    # Uncomment these if you want to support both /api/ and /api/v1/ paths
    # path('api/auth/', include('authentication.urls')),
    # path('api/members/', include('members.urls')),
    # path('api/families/', include('families.urls')),
    # path('api/groups/', include('groups.urls')),
    # path('api/pledges/', include('pledges.urls')),
    # path('api/reports/', include('reports.urls')),
    # path('api/core/', include('core.urls')),
    
    # Redirect root to API docs
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom error handlers - make sure these views exist in core.views
# If they don't exist, comment out these lines or create the views
try:
    from core.views import custom_404, custom_500
    handler404 = custom_404
    handler500 = custom_500
except ImportError:
    # Fallback to default handlers if custom views don't exist
    pass

# Admin site configuration
admin.site.site_header = "ChurchConnect Administration"
admin.site.site_title = "ChurchConnect Admin"
admin.site.index_title = "Welcome to ChurchConnect Administration"