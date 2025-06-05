from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="ChurchConnect API",
      default_version='v1',
      description="API documentation for ChurchConnect DBMS",
      contact=openapi.Contact(email="admin@churchconnect.org"),
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/members/', include('members.urls')),
    path('api/families/', include('families.urls')),
    path('api/groups/', include('groups.urls')),
    path('api/pledges/', include('pledges.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/core/', include('core.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]