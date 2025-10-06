# File: backend/authentication/urls.py
"""
FIXED URL configuration - removed all duplicates causing operationId collisions
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.decorators.cache import cache_page

from .views import (
    LoginView, LogoutView, VerifyTokenView, RefreshTokenView,
    UserProfileView, PasswordChangeView,
    PasswordResetRequestView, PasswordResetConfirmView,
    AdminUserListCreateView, AdminUserDetailView,
    AdminUserBulkActionView,
    UserPermissionsView, LoginAttemptsView, ClearLoginAttemptsView,
    SecurityDashboardView, SystemStatsView,
    AccountLockView, AccountUnlockView, ForcePasswordResetView,
    TestEndpointView, HealthCheckView,
    AuditLogView, ComplianceReportView,
)

app_name = 'authentication'

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    # ============================================
    # CORE AUTHENTICATION ENDPOINTS
    # ============================================
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('verify/', VerifyTokenView.as_view(), name='verify-token'),
    path('refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh-jwt'),
    path('test/', TestEndpointView.as_view(), name='test-endpoint'),
    
    # ============================================
    # PROFILE & SELF-SERVICE ENDPOINTS
    # ============================================
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('permissions/', UserPermissionsView.as_view(), name='user-permissions'),
    path('profile/stats/', cache_page(60 * 5)(UserPermissionsView.as_view()), name='user-stats'),
    
    # ============================================
    # PASSWORD MANAGEMENT ENDPOINTS (Hyphenated only)
    # ============================================
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/force-reset/<uuid:user_id>/', ForcePasswordResetView.as_view(), name='password-force-reset'),
    
    # ============================================
    # USER MANAGEMENT ENDPOINTS (Admin)
    # ============================================
    path('users/', AdminUserListCreateView.as_view(), name='admin-users-list'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/bulk-action/', AdminUserBulkActionView.as_view(), name='admin-users-bulk'),
    path('users/<uuid:pk>/lock/', AccountLockView.as_view(), name='account-lock'),
    path('users/<uuid:pk>/unlock/', AccountUnlockView.as_view(), name='account-unlock'),
    
    # ============================================
    # SECURITY & MONITORING ENDPOINTS (Super Admin)
    # ============================================
    path('security/', SecurityDashboardView.as_view(), name='security-dashboard'),
    path('security/login-attempts/', LoginAttemptsView.as_view(), name='security-login-attempts'),
    path('security/login-attempts/clear/', ClearLoginAttemptsView.as_view(), name='security-clear-attempts'),
    path('security/audit-log/', AuditLogView.as_view(), name='audit-log'),
    path('security/compliance-report/', ComplianceReportView.as_view(), name='compliance-report'),
    
    # ============================================
    # SYSTEM MONITORING ENDPOINTS
    # ============================================
    path('system/health/', HealthCheckView.as_view(), name='health-check'),
    path('system/stats/', SystemStatsView.as_view(), name='system-stats'),
]

# Available URL patterns after this configuration:
#
# Authentication:
# - POST /api/v1/auth/login/                              - User login
# - POST /api/v1/auth/logout/                             - User logout
# - POST /api/v1/auth/verify/                             - Verify JWT token
# - POST /api/v1/auth/refresh/                            - Refresh JWT token
# - POST /api/v1/auth/token/refresh/                      - Alternative refresh endpoint
# - GET  /api/v1/auth/test/                               - Test endpoint
#
# Profile:
# - GET/PUT/PATCH /api/v1/auth/profile/                   - User profile management
# - GET  /api/v1/auth/permissions/                        - User permissions
# - GET  /api/v1/auth/profile/permissions/                - Alternative permissions endpoint
# - GET  /api/v1/auth/profile/stats/                      - User statistics (cached)
#
# Password Management:
# - POST /api/v1/auth/password/change/                    - Change password
# - POST /api/v1/auth/password/reset/request/             - Request password reset
# - POST /api/v1/auth/password/reset/confirm/             - Confirm password reset
# - POST /api/v1/auth/password/force-reset/{user_id}/     - Force password reset (admin)
#
# User Management (Admin):
# - GET/POST  /api/v1/auth/users/                         - List/Create users
# - GET/PUT/PATCH/DELETE /api/v1/auth/users/{id}/         - User CRUD operations
# - POST /api/v1/auth/users/bulk-action/                  - Bulk user actions
# - POST /api/v1/auth/users/{id}/lock/                    - Lock user account
# - POST /api/v1/auth/users/{id}/unlock/                  - Unlock user account
#
# Security Monitoring (Super Admin):
# - GET  /api/v1/auth/security/                           - Security dashboard
# - GET  /api/v1/auth/security/login-attempts/            - View login attempts
# - POST /api/v1/auth/security/login-attempts/clear/      - Clear login attempts
# - GET  /api/v1/auth/security/audit-log/                 - View audit log
# - GET  /api/v1/auth/security/compliance-report/         - Compliance report
#
# System Monitoring:
# - GET  /api/v1/auth/system/health/                      - Health check
# - GET  /api/v1/auth/system/stats/                       - System statistics