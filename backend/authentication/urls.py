# authentication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    login_view, logout_view, verify_token, test_endpoint,
    UserProfileView, PasswordChangeView,
    PasswordResetRequestView, PasswordResetConfirmView,
    AdminUserListCreateView, AdminUserDetailView,
    user_permissions, login_attempts, clear_login_attempts
)

app_name = 'authentication'

urlpatterns = [
    # Core authentication endpoints
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('verify/', verify_token, name='verify-token'),
    path('test/', test_endpoint, name='test'),  # Add this for API testing
    
    # JWT token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # User profile management
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('permissions/', user_permissions, name='user-permissions'),
    
    # Password management
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Admin user management (requires super admin)
    path('users/', AdminUserListCreateView.as_view(), name='admin-users-list'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    
    # Security monitoring (requires super admin)
    path('login-attempts/', login_attempts, name='login-attempts'),
    path('login-attempts/clear/', clear_login_attempts, name='clear-login-attempts'),
]