# backend/churchconnect/members/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', MemberViewSet, basename='member')  # Empty prefix for /api/v1/members/

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]

# URL patterns will be:
# GET /api/v1/members/ - List members (with filtering, pagination, search)
# POST /api/v1/members/ - Create new member (public form submission)
# GET /api/v1/members/{id}/ - Retrieve specific member
# PUT /api/v1/members/{id}/ - Update member
# PATCH /api/v1/members/{id}/ - Partial update member
# DELETE /api/v1/members/{id}/ - Delete member