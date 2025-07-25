# File: backend/churchconnect/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from rest_framework.documentation import include_docs_urls

# API versioning
api_v1_patterns = [
    path('members/', include('members.urls')),
    path('groups/', include('groups.urls')),
    path('pledges/', include('pledges.urls')),
    path('families/', include('families.urls')),
    path('auth/', include('authentication.urls')),
    path('reports/', include('reports.urls')),
    path('core/', include('core.urls')),
]

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/', include(api_v1_patterns)),
    
    # API documentation
    path('api/docs/', include_docs_urls(title='ChurchConnect API')),
    
    # # Health check endpoint
    # path('health/', include('core.urls')),
    
    # Redirect root to API docs
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),
]

# Serve media files in development
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
