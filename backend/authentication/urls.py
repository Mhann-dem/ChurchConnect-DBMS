# File: backend/authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login_view, name='admin_login'),
    path('logout/', views.logout_view, name='admin_logout'),
    path('verify/', views.verify_token, name='verify_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password management
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User profile and permissions
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('permissions/', views.user_permissions, name='user_permissions'),
    
    # Admin user management (Super Admin only)
    path('users/', views.AdminUserListCreateView.as_view(), name='admin_users'),
    path('users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin_user_detail'),
    
    # Security monitoring (Super Admin only)
    path('login-attempts/', views.login_attempts, name='login_attempts'),
    path('login-attempts/clear/', views.clear_login_attempts, name='clear_login_attempts'),
]