# backend/churchconnect/pledges/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Import only existing views - you'll need to create PledgeViewSet in views.py
# For now, let's create a simple URL structure
from . import views

urlpatterns = [
    # Add basic pledge endpoints here
    # You'll need to create these views in pledges/views.py
    # path('', views.pledge_list, name='pledge_list'),
    # path('<uuid:pk>/', views.pledge_detail, name='pledge_detail'),
]

# For now, return empty list to prevent 404 errors
# You can add proper URLs once you create the pledge views