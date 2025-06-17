# File: backend/core/urls.py
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Health check endpoint
    path('health/', views.health_check, name='health_check'),
    
    # System status
    path('status/', views.system_status, name='system_status'),
    
    # API version info
    path('version/', views.api_version, name='api_version'),
]
