# File: backend/authentication/views.py
"""
Enhanced views for ChurchConnect authentication system
Production-ready with comprehensive security, audit logging, and monitoring
"""

import secrets
import hashlib
from datetime import timedelta, datetime
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q, Count
from django.db import transaction
from django.contrib.auth import authenticate
from django.http import Http404
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from django.views.decorators.cache import cache_page

from rest_framework import status, permissions, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import (
    ListCreateAPIView, RetrieveUpdateDestroyAPIView,
    UpdateAPIView, RetrieveUpdateAPIView, ListAPIView
)
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django_filters.rest_framework import DjangoFilterBackend

from .models import AdminUser, PasswordResetToken, LoginAttempt
from .serializers import (
    LoginSerializer, AdminUserSerializer, AdminUserListSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserProfileSerializer,
    LoginAttemptSerializer, SystemStatsSerializer
)
from .permissions import (
    IsSuperAdmin, IsAdminOrReadOnly, IsAdminOrSuperAdmin,
    PasswordResetPermission, MaintenanceMode
)

import logging
logger = logging.getLogger('authentication')


class StandardResultsSetPagination(PageNumberPagination):
    """
    Custom pagination class with enhanced metadata
    """
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data
        })


def get_client_info(request):
    """
    Extract comprehensive client information for security logging
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    ip_address = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR', 'unknown')
    
    return {
        'ip_address': ip_address,
        'user_agent': request.META.get('HTTP_USER_AGENT', '')[:500],
        'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', '')[:100],
        'referer': request.META.get('HTTP_REFERER', '')[:200],
        'x_forwarded_for': x_forwarded_for[:200] if x_forwarded_for else None,
        'x_real_ip': request.META.get('HTTP_X_REAL_IP', '')[:50],
    }


def log_security_event(event_type, user_email, details, request=None, severity='INFO'):
    """
    Enhanced security event logging
    """
    client_info = get_client_info(request) if request else {}
    
    log_data = {
        'event_type': event_type,
        'user_email': user_email,
        'details': details,
        'timestamp': timezone.now().isoformat(),
        'severity': severity,
        **client_info
    }
    
    if severity == 'ERROR':
        logger.error(f"SECURITY EVENT: {event_type} - {details}", extra=log_data)
    elif severity == 'WARNING':
        logger.warning(f"SECURITY EVENT: {event_type} - {details}", extra=log_data)
    else:
        logger.info(f"SECURITY EVENT: {event_type} - {details}", extra=log_data)


class LoginView(APIView):
    """
    Enhanced login view with comprehensive security features
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        """Enhanced login with security monitoring and rate limiting"""
        client_info = get_client_info(request)
        
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            remember_me = serializer.validated_data.get('remember_me', False)
            
            # Generate JWT tokens with appropriate lifetime
            refresh = RefreshToken.for_user(user)
            if remember_me:
                refresh.set_exp(lifetime=timedelta(days=30))
            
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Log successful login
            log_security_event(
                'LOGIN_SUCCESS', 
                user.email, 
                f"Successful login from {client_info['ip_address']}", 
                request
            )
            
            # Prepare response data
            response_data = {
                'access': str(access_token),
                'refresh': str(refresh),
                'user': AdminUserSerializer(user).data,
                'expires_in': int(access_token.payload['exp'] - timezone.now().timestamp()),
                'token_type': 'Bearer'
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        else:
            # Log failed login attempt
            email = request.data.get('email', 'unknown')
            log_security_event(
                'LOGIN_FAILED', 
                email, 
                f"Failed login from {client_info['ip_address']}: {serializer.errors}", 
                request,
                'WARNING'
            )
            
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    Enhanced logout view with token blacklisting
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None 

    def post(self, request):
        """Logout with token blacklisting and audit logging"""
        try:
            refresh_token = request.data.get('refresh')
            user_email = getattr(request.user, 'email', 'unknown')
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            logout(request)
            
            log_security_event(
                'LOGOUT_SUCCESS', 
                user_email, 
                'User logged out successfully', 
                request
            )
            
            return Response({
                'message': 'Successfully logged out',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            log_security_event(
                'LOGOUT_ERROR', 
                getattr(request.user, 'email', 'unknown'), 
                f'Invalid refresh token on logout: {str(e)}', 
                request,
                'WARNING'
            )
            return Response(
                {'error': 'Invalid token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Logout error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Logout failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyTokenView(APIView):
    """
    Enhanced token verification with detailed user information
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None

    def get(self, request):
        """Verify token and return comprehensive user data"""
        try:
            user_data = AdminUserSerializer(request.user).data
            
            # Add additional context
            response_data = {
                'user': user_data,
                'authenticated': True,
                'permissions': {
                    'can_create': request.user.can_create() if hasattr(request.user, 'can_create') else False,
                    'can_edit': request.user.can_edit() if hasattr(request.user, 'can_edit') else False,
                    'can_delete': request.user.can_delete() if hasattr(request.user, 'can_delete') else False,
                    'can_manage_users': request.user.can_manage_users() if hasattr(request.user, 'can_manage_users') else False,
                },
                'session_info': {
                    'last_activity': timezone.now().isoformat(),
                    'client_ip': get_client_info(request)['ip_address'],
                },
                'verified_at': timezone.now().isoformat()
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Token verification failed'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


class RefreshTokenView(BaseTokenRefreshView):
    """
    Enhanced token refresh with security monitoring
    """
    serializer_class = None  # Use default serializer
    
    def post(self, request, *args, **kwargs):
        """Override to add security logging"""
        user_email = getattr(request.user, 'email', 'unknown') if request.user.is_authenticated else 'anonymous'
        
        try:
            response = super().post(request, *args, **kwargs)
            
            log_security_event(
                'TOKEN_REFRESH_SUCCESS', 
                user_email, 
                'Token refreshed successfully', 
                request
            )
            
            return response
            
        except Exception as e:
            log_security_event(
                'TOKEN_REFRESH_FAILED', 
                user_email, 
                f'Token refresh failed: {str(e)}', 
                request,
                'WARNING'
            )
            raise


class UserProfileView(RetrieveUpdateAPIView):
    """
    Enhanced user profile view with change tracking
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Override to log profile changes"""
        old_data = UserProfileSerializer(self.get_object()).data
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == 200:
            new_data = response.data
            changes = []
            
            for key in ['email', 'first_name', 'last_name']:
                if old_data.get(key) != new_data.get(key):
                    changes.append(f"{key}: '{old_data.get(key)}' -> '{new_data.get(key)}'")
            
            if changes:
                log_security_event(
                    'PROFILE_UPDATE', 
                    request.user.email, 
                    f"Profile updated: {'; '.join(changes)}", 
                    request
                )
        
        return response


class PasswordChangeView(APIView):
    """
    Enhanced password change view with security validations
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    def post(self, request):
        """Change password with enhanced security logging"""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            log_security_event(
                'PASSWORD_CHANGE_SUCCESS', 
                request.user.email, 
                'Password changed successfully', 
                request
            )
            
            return Response({
                'message': 'Password changed successfully',
                'changed_at': timezone.now().isoformat()
            })
        
        log_security_event(
            'PASSWORD_CHANGE_FAILED', 
            request.user.email, 
            f'Password change failed: {serializer.errors}', 
            request,
            'WARNING'
        )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Enhanced password reset request with comprehensive security
    """
    permission_classes = [permissions.AllowAny, PasswordResetPermission]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        """Request password reset with enhanced security measures"""
        serializer = PasswordResetRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            client_info = get_client_info(request)
            
            try:
                user = AdminUser.objects.get(email=email, active=True)
                
                # Generate secure reset token
                token = secrets.token_urlsafe(32)
                expires_at = timezone.now() + timedelta(hours=1)  # Shorter expiry for security
                
                # Deactivate old tokens for this user
                PasswordResetToken.objects.filter(
                    user=user,
                    used=False
                ).update(used=True)
                
                # Create new token
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=expires_at
                )
                
                # Generate reset URL
                reset_url = f"{settings.FRONTEND_URL}/admin/password-reset/confirm?token={token}"
                
                # Send email with enhanced template
                email_context = {
                    'user_name': user.first_name or user.username,
                    'reset_url': reset_url,
                    'expires_in_hours': 1,
                    'client_ip': client_info['ip_address'],
                    'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
                    'support_email': getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)
                }
                
                try:
                    send_mail(
                        subject='ChurchConnect - Password Reset Request',
                        message=f'''
Hello {email_context['user_name']},

You requested a password reset for your ChurchConnect admin account.

Reset your password: {reset_url}

This link will expire in {email_context['expires_in_hours']} hour(s).

Request details:
- Time: {email_context['timestamp']}
- IP Address: {email_context['client_ip']}

If you didn't request this reset, please contact support immediately at {email_context['support_email']}.

Best regards,
ChurchConnect Security Team
                        ''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    
                    log_security_event(
                        'PASSWORD_RESET_REQUESTED', 
                        email, 
                        f'Password reset requested from {client_info["ip_address"]}', 
                        request
                    )
                    
                except Exception as e:
                    logger.error(f"Password reset email failed for {email}: {e}")
                    log_security_event(
                        'PASSWORD_RESET_EMAIL_FAILED', 
                        email, 
                        f'Failed to send reset email: {str(e)}', 
                        request,
                        'ERROR'
                    )
                
            except AdminUser.DoesNotExist:
                # Log attempt but don't reveal if email exists
                log_security_event(
                    'PASSWORD_RESET_INVALID_EMAIL', 
                    email, 
                    f'Password reset requested for non-existent email from {client_info["ip_address"]}', 
                    request,
                    'WARNING'
                )
            
            # Always return same response for security
            return Response({
                'message': 'If the email address exists in our system, a password reset link has been sent.',
                'estimated_delivery': '5-10 minutes'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    Enhanced password reset confirmation with security validations
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        """Confirm password reset with enhanced security"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            client_info = get_client_info(request)
            
            log_security_event(
                'PASSWORD_RESET_COMPLETED', 
                user.email, 
                f'Password reset completed from {client_info["ip_address"]}', 
                request
            )
            
            return Response({
                'message': 'Password reset successfully',
                'reset_at': timezone.now().isoformat()
            })
        
        # Log failed reset attempt
        token = request.data.get('token', 'unknown')
        log_security_event(
            'PASSWORD_RESET_FAILED', 
            'unknown', 
            f'Password reset failed for token {token[:8]}...: {serializer.errors}', 
            request,
            'WARNING'
        )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListCreateView(ListCreateAPIView):
    """
    Enhanced admin user management with filtering and bulk operations
    """
    queryset = AdminUser.objects.all().order_by('-created_at')
    permission_classes = [IsSuperAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'active']
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['created_at', 'last_login', 'email', 'role']
    ordering = ['-created_at']
    serializer_class = AdminUserListSerializer

    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminUserListSerializer
        return AdminUserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Additional custom filters
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        # Filter by last login date range
        last_login_after = self.request.query_params.get('last_login_after')
        if last_login_after:
            try:
                date_after = datetime.fromisoformat(last_login_after.replace('Z', '+00:00'))
                queryset = queryset.filter(last_login__gte=date_after)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        """Override to log user creation"""
        user = serializer.save()
        
        log_security_event(
            'ADMIN_USER_CREATED', 
            user.email, 
            f'New admin user created by {self.request.user.email} with role {user.role}', 
            self.request
        )


class AdminUserDetailView(RetrieveUpdateDestroyAPIView):
    """
    Enhanced admin user detail view with change tracking
    """
    queryset = AdminUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]
    lookup_field = 'pk'

    def perform_update(self, serializer):
        """Override to log user updates"""
        old_instance = self.get_object()
        old_data = AdminUserSerializer(old_instance).data
        
        updated_user = serializer.save()
        new_data = AdminUserSerializer(updated_user).data
        
        # Track changes
        changes = []
        for key in ['email', 'role', 'active', 'first_name', 'last_name']:
            if old_data.get(key) != new_data.get(key):
                changes.append(f"{key}: '{old_data.get(key)}' -> '{new_data.get(key)}'")
        
        if changes:
            log_security_event(
                'ADMIN_USER_UPDATED', 
                updated_user.email, 
                f'Admin user updated by {self.request.user.email}: {"; ".join(changes)}', 
                self.request
            )

    def perform_destroy(self, instance):
        """Override to deactivate instead of delete and log action"""
        instance.active = False
        instance.save()
        
        log_security_event(
            'ADMIN_USER_DEACTIVATED', 
            instance.email, 
            f'Admin user deactivated by {self.request.user.email}', 
            self.request,
            'WARNING'
        )


class AdminUserBulkActionView(APIView):
    """
    Bulk operations for admin users
    """
    permission_classes = [IsSuperAdmin]
    pagination_class = StandardResultsSetPagination
    serializer_class = None  # No serializer needed for bulk actions

    def post(self, request):
        """Perform bulk actions on admin users"""
        action = request.data.get('action')
        user_ids = request.data.get('user_ids', [])
        
        if not action or not user_ids:
            return Response({
                'error': 'Both action and user_ids are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        valid_actions = ['activate', 'deactivate', 'delete', 'change_role']
        if action not in valid_actions:
            return Response({
                'error': f'Invalid action. Must be one of: {valid_actions}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        users = AdminUser.objects.filter(id__in=user_ids)
        
        if not users.exists():
            return Response({
                'error': 'No users found with provided IDs'
            }, status=status.HTTP_404_NOT_FOUND)
        
        results = []
        
        with transaction.atomic():
            for user in users:
                try:
                    if action == 'activate':
                        user.active = True
                        user.save()
                        results.append({'user_id': user.id, 'status': 'activated'})
                        
                    elif action == 'deactivate':
                        user.active = False
                        user.save()
                        results.append({'user_id': user.id, 'status': 'deactivated'})
                        
                    elif action == 'delete':
                        user.active = False  # Soft delete
                        user.save()
                        results.append({'user_id': user.id, 'status': 'deleted'})
                        
                    elif action == 'change_role':
                        new_role = request.data.get('new_role')
                        if new_role and new_role in ['super_admin', 'admin', 'readonly']:
                            user.role = new_role
                            user.save()
                            results.append({'user_id': user.id, 'status': f'role changed to {new_role}'})
                        else:
                            results.append({'user_id': user.id, 'status': 'error: invalid role'})
                    
                    # Log individual action
                    log_security_event(
                        f'BULK_USER_{action.upper()}', 
                        user.email, 
                        f'Bulk action {action} performed by {request.user.email}', 
                        request
                    )
                    
                except Exception as e:
                    results.append({'user_id': user.id, 'status': f'error: {str(e)}'})
        
        # Log bulk operation
        log_security_event(
            'BULK_USER_OPERATION', 
            request.user.email, 
            f'Bulk operation {action} on {len(user_ids)} users', 
            request
        )
        
        return Response({
            'message': f'Bulk {action} completed',
            'results': results,
            'total_processed': len(results)
        })


@method_decorator(vary_on_headers('User-Agent', 'Accept-Language'), name='get')
class UserPermissionsView(APIView):
    """
    Enhanced user permissions view with detailed capability information
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None  # No serializer needed for this view

    def get(self, request):
        """Get comprehensive user permissions and capabilities"""
        user = request.user
        
        permissions_data = {
            'role': user.role,
            'role_display': user.get_role_display(),
            'permissions': {
                'can_create': user.can_create() if hasattr(user, 'can_create') else False,
                'can_edit': user.can_edit() if hasattr(user, 'can_edit') else False,
                'can_delete': user.can_delete() if hasattr(user, 'can_delete') else False,
                'can_manage_users': user.can_manage_users() if hasattr(user, 'can_manage_users') else False,
            },
            'access_levels': {
                'members': 'full' if user.role in ['super_admin', 'admin'] else 'read',
                'groups': 'full' if user.role in ['super_admin', 'admin'] else 'read',
                'pledges': 'full' if user.role in ['super_admin', 'admin'] else 'read',
                'reports': 'full' if user.role in ['super_admin', 'admin'] else 'limited',
                'settings': 'full' if user.role == 'super_admin' else 'none',
                'user_management': 'full' if user.role == 'super_admin' else 'none',
            },
            'limitations': self._get_user_limitations(user),
            'last_permission_check': timezone.now().isoformat()
        }
        
        return Response(permissions_data)
    
    def _get_user_limitations(self, user):
        """Get user-specific limitations"""
        limitations = []
        
        if user.role == 'readonly':
            limitations.extend([
                'Cannot create new records',
                'Cannot edit existing records', 
                'Cannot delete records',
                'Cannot access user management',
                'Cannot modify system settings'
            ])
        elif user.role == 'admin':
            limitations.extend([
                'Cannot create super admin accounts',
                'Cannot delete other admin accounts',
                'Cannot access system configuration'
            ])
        
        return limitations


class LoginAttemptsView(ListAPIView):
    """
    Enhanced login attempts monitoring with filtering
    """
    queryset = LoginAttempt.objects.all().order_by('-attempted_at')
    serializer_class = LoginAttemptSerializer
    permission_classes = [IsSuperAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['success']
    search_fields = ['email', 'ip_address']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        days_back = self.request.query_params.get('days_back', 7)
        try:
            days_back = int(days_back)
            since = timezone.now() - timedelta(days=days_back)
            queryset = queryset.filter(attempted_at__gte=since)
        except ValueError:
            pass
        
        # Filter by success status
        success = self.request.query_params.get('success')
        if success is not None:
            queryset = queryset.filter(success=success.lower() == 'true')
        
        return queryset


class ClearLoginAttemptsView(APIView):
    """
    Enhanced login attempts cleanup
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    def post(self, request):
        """Clear old login attempts with configurable retention"""
        days_to_keep = request.data.get('days_to_keep', 30)
        
        try:
            days_to_keep = int(days_to_keep)
            if days_to_keep < 1 or days_to_keep > 365:
                return Response({
                    'error': 'days_to_keep must be between 1 and 365'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'error': 'days_to_keep must be a valid integer'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        older_than = timezone.now() - timedelta(days=days_to_keep)
        deleted_count, _ = LoginAttempt.objects.filter(
            attempted_at__lt=older_than
        ).delete()
        
        log_security_event(
            'LOGIN_ATTEMPTS_CLEARED', 
            request.user.email, 
            f'Cleared {deleted_count} login attempts older than {days_to_keep} days', 
            request
        )
        
        return Response({
            'message': f'Cleared {deleted_count} login attempts',
            'older_than_days': days_to_keep,
            'cleared_at': timezone.now().isoformat()
        })


class SecurityDashboardView(APIView):
    """
    Comprehensive security dashboard with metrics and alerts
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request):
        """Get security dashboard data"""
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        # Login statistics
        login_stats = {
            'successful_logins_24h': LoginAttempt.objects.filter(
                success=True, attempted_at__gte=last_24h
            ).count(),
            'failed_logins_24h': LoginAttempt.objects.filter(
                success=False, attempted_at__gte=last_24h
            ).count(),
            'unique_ips_24h': LoginAttempt.objects.filter(
                attempted_at__gte=last_24h
            ).values_list('ip_address', flat=True).distinct().count(),
            'total_attempts_7d': LoginAttempt.objects.filter(
                attempted_at__gte=last_7d
            ).count(),
        }
        
        # User statistics
        user_stats = {
            'total_users': AdminUser.objects.count(),
            'active_users': AdminUser.objects.filter(active=True).count(),
            'super_admins': AdminUser.objects.filter(role='super_admin', active=True).count(),
            'regular_admins': AdminUser.objects.filter(role='admin', active=True).count(),
            'readonly_users': AdminUser.objects.filter(role='readonly', active=True).count(),
            'recently_created': AdminUser.objects.filter(created_at__gte=last_7d).count(),
        }
        
        # Security alerts
        alerts = self._generate_security_alerts(last_24h, last_7d)
        
        # Top suspicious IPs (most failed attempts)
        suspicious_ips = list(LoginAttempt.objects.filter(
            success=False, attempted_at__gte=last_24h
        ).values('ip_address').annotate(
            failed_count=Count('id')
        ).order_by('-failed_count')[:10])
        
        # Recent password resets
        recent_resets = PasswordResetToken.objects.filter(
            created_at__gte=last_7d
        ).count()
        
        dashboard_data = {
            'login_statistics': login_stats,
            'user_statistics': user_stats,
            'security_alerts': alerts,
            'suspicious_ips': suspicious_ips,
            'recent_password_resets': recent_resets,
            'generated_at': now.isoformat(),
            'data_retention': {
                'login_attempts': '90 days',
                'audit_logs': '1 year',
                'password_reset_tokens': '24 hours after use'
            }
        }
        
        return Response(dashboard_data)
    
    def _generate_security_alerts(self, last_24h, last_7d):
        """Generate security alerts based on patterns"""
        alerts = []
        
        # High number of failed logins
        failed_24h = LoginAttempt.objects.filter(
            success=False, attempted_at__gte=last_24h
        ).count()
        
        if failed_24h > 50:
            alerts.append({
                'severity': 'high',
                'type': 'excessive_failed_logins',
                'message': f'{failed_24h} failed login attempts in the last 24 hours',
                'action_required': 'Review IP addresses and consider blocking suspicious IPs'
            })
        
        # Dormant admin accounts
        dormant_admins = AdminUser.objects.filter(
            role__in=['admin', 'super_admin'],
            active=True,
            last_login__lt=timezone.now() - timedelta(days=90)
        ).count()
        
        if dormant_admins > 0:
            alerts.append({
                'severity': 'medium',
                'type': 'dormant_admin_accounts',
                'message': f'{dormant_admins} admin accounts have not logged in for 90+ days',
                'action_required': 'Review and consider deactivating unused accounts'
            })
        
        # Multiple password reset requests
        reset_requests_24h = PasswordResetToken.objects.filter(
            created_at__gte=last_24h
        ).count()
        
        if reset_requests_24h > 10:
            alerts.append({
                'severity': 'medium',
                'type': 'excessive_password_resets',
                'message': f'{reset_requests_24h} password reset requests in the last 24 hours',
                'action_required': 'Verify legitimacy of reset requests'
            })
        
        return alerts


class SystemStatsView(APIView):
    """
    System statistics and health metrics
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemStatsSerializer  # No serializer needed for this view

    @method_decorator(cache_page(60 * 10))  # Cache for 10 minutes
    def get(self, request):
        """Get comprehensive system statistics"""
        now = timezone.now()
        
        # Calculate statistics
        stats_data = {
            'total_users': AdminUser.objects.count(),
            'active_users': AdminUser.objects.filter(active=True).count(),
            'inactive_users': AdminUser.objects.filter(active=False).count(),
            'super_admins': AdminUser.objects.filter(role='super_admin', active=True).count(),
            'admins': AdminUser.objects.filter(role='admin', active=True).count(),
            'readonly_users': AdminUser.objects.filter(role='readonly', active=True).count(),
            'recent_logins_24h': LoginAttempt.objects.filter(
                success=True,
                attempted_at__gte=now - timedelta(hours=24)
            ).count(),
            'failed_login_attempts_24h': LoginAttempt.objects.filter(
                success=False,
                attempted_at__gte=now - timedelta(hours=24)
            ).count(),
            'last_updated': now
        }
        
        serializer = SystemStatsSerializer(data=stats_data)
        if serializer.is_valid():
            return Response(serializer.data)
        
        return Response(stats_data)


class AccountLockView(APIView):
    """
    Lock user account for security reasons
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    def post(self, request, pk):
        """Lock a user account"""
        try:
            user = AdminUser.objects.get(pk=pk)
            
            if user.role == 'super_admin' and request.user.role != 'super_admin':
                return Response({
                    'error': 'Cannot lock super admin account'
                }, status=status.HTTP_403_FORBIDDEN)
            
            user.active = False
            user.save()
            
            log_security_event(
                'ACCOUNT_LOCKED', 
                user.email, 
                f'Account locked by {request.user.email}', 
                request,
                'WARNING'
            )
            
            return Response({
                'message': f'Account for {user.email} has been locked',
                'locked_at': timezone.now().isoformat()
            })
            
        except AdminUser.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class AccountUnlockView(APIView):
    """
    Unlock user account
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    def post(self, request, pk):
        """Unlock a user account"""
        try:
            user = AdminUser.objects.get(pk=pk)
            
            user.active = True
            user.save()
            
            log_security_event(
                'ACCOUNT_UNLOCKED', 
                user.email, 
                f'Account unlocked by {request.user.email}', 
                request
            )
            
            return Response({
                'message': f'Account for {user.email} has been unlocked',
                'unlocked_at': timezone.now().isoformat()
            })
            
        except AdminUser.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class ForcePasswordResetView(APIView):
    """
    Force password reset for a user account
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    def post(self, request, user_id):
        """Force password reset for a user"""
        try:
            user = AdminUser.objects.get(id=user_id)
            
            # Invalidate all existing tokens for this user
            PasswordResetToken.objects.filter(
                user=user,
                used=False
            ).update(used=True)
            
            # Generate new reset token
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=24)
            
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
            
            # Send notification email
            reset_url = f"{settings.FRONTEND_URL}/admin/password-reset/confirm?token={token}"
            
            try:
                send_mail(
                    subject='ChurchConnect - Password Reset Required',
                    message=f'''
Hello {user.first_name or user.username},

Your password has been reset by a system administrator for security reasons.

Please use this link to set a new password:
{reset_url}

This link will expire in 24 hours.

If you have any questions, please contact support.

Best regards,
ChurchConnect Security Team
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Failed to send forced reset email: {e}")
            
            log_security_event(
                'FORCED_PASSWORD_RESET', 
                user.email, 
                f'Password reset forced by {request.user.email}', 
                request,
                'WARNING'
            )
            
            return Response({
                'message': f'Password reset initiated for {user.email}',
                'reset_token_expires': expires_at.isoformat()
            })
            
        except AdminUser.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class AuditLogView(ListAPIView):
    """
    Comprehensive audit log view
    """
    permission_classes = [IsSuperAdmin]
    pagination_class = StandardResultsSetPagination
    serializer_class = LoginAttemptSerializer # Placeholder, would need a proper AuditLogSerializer

    # FIX: Add queryset to resolve schema generation warning
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            # Return empty queryset for schema generation
            return LoginAttempt.objects.none()
            
        queryset = LoginAttempt.objects.all().order_by('-attempted_at')
        
        # Apply filters
        days_back = self.request.query_params.get('days_back', 30)
        try:
            days_back = int(days_back)
            since = timezone.now() - timedelta(days=days_back)
            queryset = queryset.filter(attempted_at__gte=since)
        except ValueError:
            pass
        
        return queryset

    def list(self, request):
        """Get audit log entries with filtering"""
        queryset = self.get_queryset()
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        # Convert to audit log format
        audit_entries = []
        for attempt in page:
            audit_entries.append({
                'id': attempt.id,
                'timestamp': attempt.attempted_at,
                'event_type': 'LOGIN_SUCCESS' if attempt.success else 'LOGIN_FAILED',
                'user_email': attempt.email,
                'ip_address': attempt.ip_address,
                'details': f"Login {'successful' if attempt.success else 'failed'}",
                'user_agent': attempt.user_agent[:100] if attempt.user_agent else '',
            })
        
        return paginator.get_paginated_response(audit_entries)

    def get(self, request):
        """Get audit log entries with filtering"""
        # This would require implementing an audit log model
        # For now, we'll return login attempts as a basic audit log
        
        queryset = LoginAttempt.objects.all().order_by('-attempted_at')
        
        # Apply filters
        days_back = request.query_params.get('days_back', 30)
        try:
            days_back = int(days_back)
            since = timezone.now() - timedelta(days=days_back)
            queryset = queryset.filter(attempted_at__gte=since)
        except ValueError:
            pass
        
        event_type = request.query_params.get('event_type')
        if event_type:
            # This would filter by event type if we had proper audit logging
            pass
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        # Convert to audit log format
        audit_entries = []
        for attempt in page:
            audit_entries.append({
                'id': attempt.id,
                'timestamp': attempt.attempted_at,
                'event_type': 'LOGIN_SUCCESS' if attempt.success else 'LOGIN_FAILED',
                'user_email': attempt.email,
                'ip_address': attempt.ip_address,
                'details': f"Login {'successful' if attempt.success else 'failed'}",
                'user_agent': attempt.user_agent[:100] if attempt.user_agent else '',
            })
        
        return paginator.get_paginated_response(audit_entries)


class ComplianceReportView(APIView):
    """
    Generate compliance reports for auditing
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # No serializer needed for this view

    def get(self, request):
        """Generate compliance report"""
        report_type = request.query_params.get('type', 'security')
        days_back = int(request.query_params.get('days_back', 30))
        
        since = timezone.now() - timedelta(days=days_back)
        
        if report_type == 'security':
            return self._generate_security_report(since)
        elif report_type == 'user_access':
            return self._generate_user_access_report(since)
        else:
            return Response({
                'error': 'Invalid report type. Use "security" or "user_access"'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _generate_security_report(self, since):
        """Generate security compliance report"""
        report = {
            'report_type': 'security_compliance',
            'period_start': since.isoformat(),
            'period_end': timezone.now().isoformat(),
            'metrics': {
                'total_login_attempts': LoginAttempt.objects.filter(attempted_at__gte=since).count(),
                'successful_logins': LoginAttempt.objects.filter(
                    attempted_at__gte=since, success=True
                ).count(),
                'failed_logins': LoginAttempt.objects.filter(
                    attempted_at__gte=since, success=False
                ).count(),
                'unique_users_logged_in': LoginAttempt.objects.filter(
                    attempted_at__gte=since, success=True
                ).values_list('email', flat=True).distinct().count(),
                'password_resets': PasswordResetToken.objects.filter(
                    created_at__gte=since
                ).count(),
            },
            'security_incidents': [],  # Would be populated from incident tracking
            'recommendations': self._get_security_recommendations(),
            'generated_at': timezone.now().isoformat(),
            'generated_by': self.request.user.email
        }
        
        return Response(report)
    
    def _generate_user_access_report(self, since):
        """Generate user access report"""
        users = AdminUser.objects.filter(active=True)
        
        user_access_data = []
        for user in users:
            last_login = user.last_login
            login_count = LoginAttempt.objects.filter(
                email=user.email,
                success=True,
                attempted_at__gte=since
            ).count()
            
            user_access_data.append({
                'user_id': str(user.id),
                'email': user.email,
                'role': user.role,
                'last_login': last_login.isoformat() if last_login else None,
                'login_count_period': login_count,
                'account_age_days': (timezone.now() - user.created_at).days,
                'status': 'active' if user.active else 'inactive'
            })
        
        report = {
            'report_type': 'user_access',
            'period_start': since.isoformat(),
            'period_end': timezone.now().isoformat(),
            'total_users': len(user_access_data),
            'users': user_access_data,
            'summary': {
                'active_users': len([u for u in user_access_data if u['status'] == 'active']),
                'users_with_recent_login': len([u for u in user_access_data if u['login_count_period'] > 0]),
                'dormant_users': len([u for u in user_access_data if u['login_count_period'] == 0]),
            },
            'generated_at': timezone.now().isoformat(),
            'generated_by': self.request.user.email
        }
        
        return Response(report)
    
    def _get_security_recommendations(self):
        """Get security recommendations based on current state"""
        recommendations = []
        
        # Check for weak password policies
        recommendations.append({
            'category': 'password_policy',
            'priority': 'medium',
            'recommendation': 'Implement password complexity requirements',
            'current_status': 'Django default validation in use'
        })
        
        # Check for dormant accounts
        dormant_count = AdminUser.objects.filter(
            active=True,
            last_login__lt=timezone.now() - timedelta(days=90)
        ).count()
        
        if dormant_count > 0:
            recommendations.append({
                'category': 'account_management',
                'priority': 'high',
                'recommendation': f'Review {dormant_count} dormant accounts for deactivation',
                'current_status': f'{dormant_count} accounts inactive for 90+ days'
            })
        
        return recommendations


class HealthCheckView(APIView):
    """
    System health check endpoint
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = None  # No serializer needed for this view

    def get(self, request):
        """Basic health check"""
        health_data = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'ChurchConnect Authentication API',
            'version': '1.0.0',
            'checks': {
                'database': self._check_database(),
                'cache': self._check_cache(),
                'email': self._check_email(),
            }
        }
        
        # Determine overall status
        all_healthy = all(check['status'] == 'healthy' for check in health_data['checks'].values())
        health_data['status'] = 'healthy' if all_healthy else 'degraded'
        
        status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(health_data, status=status_code)
    
    def _check_database(self):
        """Check database connectivity"""
        try:
            AdminUser.objects.count()
            return {'status': 'healthy', 'message': 'Database accessible'}
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Database error: {str(e)}'}
    
    def _check_cache(self):
        """Check cache functionality"""
        try:
            cache.set('health_check', 'test', 30)
            value = cache.get('health_check')
            if value == 'test':
                return {'status': 'healthy', 'message': 'Cache working'}
            else:
                return {'status': 'unhealthy', 'message': 'Cache read/write failed'}
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Cache error: {str(e)}'}
    
    def _check_email(self):
        """Check email configuration"""
        try:
            # Just check if settings are configured, don't send actual email
            if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
                return {'status': 'healthy', 'message': 'Email configured'}
            else:
                return {'status': 'warning', 'message': 'Email not fully configured'}
        except Exception as e:
            return {'status': 'unhealthy', 'message': f'Email config error: {str(e)}'}


class TestEndpointView(APIView):
    """
    Enhanced test endpoint for API connectivity and authentication testing
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = None  # No serializer needed for this view

    def get(self, request):
        """Comprehensive API test endpoint"""
        client_info = get_client_info(request)
        
        response_data = {
            'status': 'success',
            'message': 'ChurchConnect Authentication API is operational',
            'timestamp': timezone.now().isoformat(),
            'api_version': '1.0.0',
            'authentication': {
                'authenticated': request.user.is_authenticated,
                'user': request.user.email if request.user.is_authenticated else None,
                'user_role': getattr(request.user, 'role', None) if request.user.is_authenticated else None,
            },
            'client_info': {
                'ip_address': client_info['ip_address'],
                'user_agent': client_info['user_agent'][:100] if client_info['user_agent'] else None,
            },
            'server_info': {
                'django_version': '4.2+',
                'python_version': '3.8+',
                'environment': 'production' if not settings.DEBUG else 'development',
            },
            'available_endpoints': [
                '/api/v1/auth/login/',
                '/api/v1/auth/logout/',
                '/api/v1/auth/verify/',
                '/api/v1/profile/',
                '/api/v1/password/change/',
                '/api/v1/admin/users/',
                '/api/v1/security/',
                '/api/v1/system/health/',
            ]
        }
        
        return Response(response_data)

    def post(self, request):
        """Test POST endpoint"""
        return Response({
            'status': 'success',
            'message': 'POST request successful',
            'received_data': request.data,
            'timestamp': timezone.now().isoformat()
        })


# Legacy function-based views for backward compatibility
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Legacy login view - redirects to class-based view"""
    view = LoginView()
    view.request = request
    return view.post(request)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Legacy logout view - redirects to class-based view"""
    view = LogoutView()
    view.request = request
    return view.post(request)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_token(request):
    """Legacy token verification view"""
    view = VerifyTokenView()
    view.request = request
    return view.get(request)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """Legacy user permissions view"""
    view = UserPermissionsView()
    view.request = request
    return view.get(request)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def login_attempts(request):
    """Legacy login attempts view"""
    view = LoginAttemptsView()
    view.request = request
    view.kwargs = {}
    
    queryset = view.get_queryset()[:100]  # Limit to 100 for legacy endpoint
    serializer = LoginAttemptSerializer(queryset, many=True)
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def clear_login_attempts(request):
    """Legacy clear login attempts view"""
    view = ClearLoginAttemptsView()
    view.request = request
    return view.post(request)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def test_endpoint(request):
    """Legacy test endpoint"""
    view = TestEndpointView()
    view.request = request
    return view.get(request)