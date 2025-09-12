# File: backend/authentication/urls.py
"""
Enhanced URL configuration for ChurchConnect authentication system
Production-ready with comprehensive security, versioning, and monitoring
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

from .views import (
    # Core authentication views
    LoginView, LogoutView, VerifyTokenView, RefreshTokenView,
    
    # Profile and password management
    UserProfileView, PasswordChangeView,
    PasswordResetRequestView, PasswordResetConfirmView,
    
    # User management (admin only)
    AdminUserListCreateView, AdminUserDetailView,
    AdminUserBulkActionView,
    
    # Security and monitoring
    UserPermissionsView, LoginAttemptsView, ClearLoginAttemptsView,
    SecurityDashboardView, SystemStatsView,
    
    # Account management
    AccountLockView, AccountUnlockView, ForcePasswordResetView,
    
    # API testing and health checks
    TestEndpointView, HealthCheckView,
    
    # Audit and compliance
    AuditLogView, ComplianceReportView,
)

app_name = 'authentication'

# Router for viewsets (if any are added later)
router = DefaultRouter()

# Core authentication endpoints
auth_patterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('verify/', VerifyTokenView.as_view(), name='verify-token'),
    path('refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    
    # Alternative JWT refresh endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh-jwt'),
]

# Profile and self-service endpoints
profile_patterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/permissions/', UserPermissionsView.as_view(), name='user-permissions'),
    path('profile/stats/', 
         cache_page(60 * 5)(UserPermissionsView.as_view()), 
         name='user-stats'),
]

# Password management endpoints
password_patterns = [
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/force-reset/<uuid:user_id>/', ForcePasswordResetView.as_view(), name='password-force-reset'),
]

# User management endpoints (admin access required)
admin_user_patterns = [
    path('users/', AdminUserListCreateView.as_view(), name='admin-users-list'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/bulk-action/', AdminUserBulkActionView.as_view(), name='admin-users-bulk'),
    path('users/<uuid:pk>/lock/', AccountLockView.as_view(), name='account-lock'),
    path('users/<uuid:pk>/unlock/', AccountUnlockView.as_view(), name='account-unlock'),
]

# Security and monitoring endpoints (super admin access)
security_patterns = [
    path('security/', SecurityDashboardView.as_view(), name='security-dashboard'),
    path('security/login-attempts/', LoginAttemptsView.as_view(), name='login-attempts'),
    path('security/login-attempts/clear/', ClearLoginAttemptsView.as_view(), name='clear-login-attempts'),
    path('security/audit-log/', AuditLogView.as_view(), name='audit-log'),
    path('security/compliance-report/', ComplianceReportView.as_view(), name='compliance-report'),
]

# System monitoring endpoints
system_patterns = [
    path('system/health/', HealthCheckView.as_view(), name='health-check'),
    path('system/stats/', SystemStatsView.as_view(), name='system-stats'),
    path('system/test/', TestEndpointView.as_view(), name='test-endpoint'),
]

# Main URL patterns
urlpatterns = [
    # Include router URLs if any viewsets are added
    path('', include(router.urls)),
    
    # Core authentication
    path('auth/', include(auth_patterns)),
    
    # Profile management
    path('', include(profile_patterns)),
    
    # Password management
    path('', include(password_patterns)),
    
    # User management (admin)
    path('admin/', include(admin_user_patterns)),
    
    # Security monitoring
    path('', include(security_patterns)),
    
    # System monitoring
    path('', include(system_patterns)),
    
    # Legacy endpoints for backward compatibility
    # These maintain the original structure from your existing code
    path('login/', LoginView.as_view(), name='login-legacy'),
    path('logout/', LogoutView.as_view(), name='logout-legacy'),
    path('verify/', VerifyTokenView.as_view(), name='verify-token-legacy'),
    path('test/', TestEndpointView.as_view(), name='test-legacy'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh-legacy'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password-legacy'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request-legacy'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm-legacy'),
    path('users/', AdminUserListCreateView.as_view(), name='admin-users-list-legacy'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail-legacy'),
    path('permissions/', UserPermissionsView.as_view(), name='user-permissions-legacy'),
    path('login-attempts/', LoginAttemptsView.as_view(), name='login-attempts-legacy'),
    path('login-attempts/clear/', ClearLoginAttemptsView.as_view(), name='clear-login-attempts-legacy'),
]