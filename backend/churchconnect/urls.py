# File: backend/churchconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView, 
    SpectacularRedocView
)

# API health check view - SIMPLE AND BULLETPROOF
@csrf_exempt
def api_health_check(request):
    """Simple health check endpoint - no database or complex checks"""
    try:
        return JsonResponse({
            'status': 'healthy',
            'message': 'ChurchConnect API is running',
            'version': '1.0.0',
            'timestamp': __import__('datetime').datetime.utcnow().isoformat()
        }, status=200)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Health check failed: {str(e)}'
        }, status=500)

# API versioning patterns
api_v1_patterns = [
    path('auth/', include('authentication.urls')),
    path('members/', include('members.urls')),
    path('families/', include('families.urls')),
    path('groups/', include('groups.urls')),
    path('pledges/', include('pledges.urls')),
    path('reports/', include('reports.urls')),
    path('core/', include('core.urls')),
    path('events/', include('events.urls')),
]

urlpatterns = [
    # Root test endpoint - SIMPLEST POSSIBLE
    path('test/', lambda request: JsonResponse({'status': 'ok'}), name='root_test'),
    
    # API health check
    path('api/health/', api_health_check, name='api_health'),
    
    # Admin interface (disabled for now)
    # path('admin/', admin.site.urls),
    
    # API endpoints with versioning (disabled temporarily to debug)
    # path('api/v1/', include(api_v1_patterns)),
    
    # API documentation endpoints (disabled temporarily to debug)
    # path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
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