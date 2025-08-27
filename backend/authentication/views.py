import secrets
from datetime import timedelta
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import (
    ListCreateAPIView, RetrieveUpdateDestroyAPIView,
    UpdateAPIView, RetrieveUpdateAPIView
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.signals import user_logged_in
from django.db.models import Q
from .models import AdminUser, PasswordResetToken, LoginAttempt
from .serializers import (
    LoginSerializer, AdminUserSerializer, AdminUserListSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserProfileSerializer
)
from .permissions import IsSuperAdmin, IsAdminOrReadOnly


from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .serializers import AdminUserSerializer

from drf_spectacular.openapi import AutoSchema

class MyAPIView(APIView):
    schema = AutoSchema()

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Admin login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if user.is_active:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                return Response({
                    'access': str(access_token),
                    'refresh': str(refresh),
                    'user': AdminUserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Account is deactivated'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'error': 'Login failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout_view(request):
    """Admin logout endpoint"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception:
        return Response({'error': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def verify_token(request):
    """Verify if user is authenticated"""
    return Response({
        'user': AdminUserSerializer(request.user).data
    })


def get_client_ip(request):
    """Get the client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_login_attempt(request, email, success, user_agent=''):
    """Log login attempt for security monitoring"""
    LoginAttempt.objects.create(
        email=email,
        ip_address=get_client_ip(request),
        success=success,
        user_agent=user_agent
    )


def check_rate_limit(request, email):
    """Check if user has exceeded login attempt rate limit"""
    ip_address = get_client_ip(request)
    recent_time = timezone.now() - timedelta(minutes=15)
    
    # Check failed attempts from this IP or email in last 15 minutes
    failed_attempts = LoginAttempt.objects.filter(
        Q(ip_address=ip_address) | Q(email=email),
        success=False,
        attempted_at__gte=recent_time
    ).count()
    
    return failed_attempts >= 5  # Allow 5 failed attempts per 15 minutes


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with rate limiting and logging"""
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Check rate limit
        if check_rate_limit(request, email):
            log_login_attempt(request, email, False, user_agent)
            return Response(
                {'error': 'Too many failed login attempts. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Log successful attempt
            log_login_attempt(request, email, True, user_agent)
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': AdminUserSerializer(user).data
            })
        else:
            # Log failed attempt
            log_login_attempt(request, email, False, user_agent)
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout view"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        logout(request)
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response(
            {'error': 'Invalid token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class UserProfileView(RetrieveUpdateAPIView):
    """View for users to view and update their own profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    """View for users to change their password"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """View to request password reset"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = AdminUser.objects.get(email=email, active=True)
                
                # Generate reset token
                token = secrets.token_urlsafe(32)
                expires_at = timezone.now() + timedelta(hours=24)
                
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
                
                # Send email (implement your email sending logic)
                reset_url = f"{settings.FRONTEND_URL}/admin/password-reset/confirm?token={token}"
                
                try:
                    send_mail(
                        subject='ChurchConnect - Password Reset',
                        message=f'''
                        Hello {user.first_name},
                        
                        You requested a password reset for your ChurchConnect admin account.
                        
                        Click the link below to reset your password:
                        {reset_url}
                        
                        This link will expire in 24 hours.
                        
                        If you didn't request this reset, please ignore this email.
                        
                        Best regards,
                        ChurchConnect Team
                        ''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    # Log email error but don't reveal it to user
                    print(f"Email sending failed: {e}")
                
            except AdminUser.DoesNotExist:
                pass  # Don't reveal if email exists
            
            # Always return success message for security
            return Response({
                'message': 'If the email exists, a password reset link has been sent.'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """View to confirm password reset"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Password reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListCreateView(ListCreateAPIView):
    """View for listing and creating admin users"""
    queryset = AdminUser.objects.all().order_by('-created_at')
    permission_classes = [IsSuperAdmin]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminUserListSerializer
        return AdminUserSerializer

    def get_queryset(self):
        queryset = AdminUser.objects.all().order_by('-created_at')
        
        # Filter by search term
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(active=active.lower() == 'true')
        
        return queryset


class AdminUserDetailView(RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating, and deleting admin users"""
    queryset = AdminUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]

    def perform_destroy(self, instance):
        # Don't actually delete, just deactivate
        instance.active = False
        instance.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """Get current user permissions"""
    user = request.user
    return Response({
        'role': user.role,
        'permissions': {
            'can_create': user.can_create(),
            'can_edit': user.can_edit(),
            'can_delete': user.can_delete(),
            'can_manage_users': user.can_manage_users(),
        }
    })


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def login_attempts(request):
    """Get recent login attempts for security monitoring"""
    attempts = LoginAttempt.objects.all()[:100]  # Last 100 attempts
    
    data = []
    for attempt in attempts:
        data.append({
            'email': attempt.email,
            'ip_address': attempt.ip_address,
            'success': attempt.success,
            'attempted_at': attempt.attempted_at,
            'user_agent': attempt.user_agent[:100] if attempt.user_agent else ''
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def clear_login_attempts(request):
    """Clear old login attempts"""
    older_than = timezone.now() - timedelta(days=30)
    deleted_count, _ = LoginAttempt.objects.filter(
        attempted_at__lt=older_than
    ).delete()
    
    return Response({
        'message': f'Cleared {deleted_count} old login attempts'
    })