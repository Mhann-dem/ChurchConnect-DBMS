# File: backend/authentication/serializers.py
"""
Enhanced serializers for ChurchConnect authentication system
Production-ready with comprehensive validation, security, and audit features
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from datetime import timedelta
import logging
import re
import secrets
import hashlib

from .models import AdminUser, PasswordResetToken, LoginAttempt
from drf_spectacular.utils import extend_schema_field

logger = logging.getLogger('authentication')


class LoginSerializer(serializers.Serializer):
    """
    Enhanced login serializer with security features and audit logging
    """
    email = serializers.EmailField(
        help_text="User's email address",
        error_messages={
            'invalid': 'Please enter a valid email address.',
            'required': 'Email address is required.'
        }
    )
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="User's password",
        error_messages={
            'required': 'Password is required.',
            'blank': 'Password cannot be blank.'
        }
    )
    remember_me = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Keep user logged in for extended period"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.client_ip = None
        
    def validate_email(self, value):
        """Enhanced email validation"""
        if not value:
            raise serializers.ValidationError("Email address is required.")
        
        # Normalize email
        value = value.lower().strip()
        
        # Basic email format validation (additional to DRF's validation)
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Invalid email format.")
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'\.{2,}',  # Multiple consecutive dots
            r'^\.|\.$',  # Starting or ending with dot
            r'[<>"\'\\\x00-\x1f\x7f-\x9f]',  # Control characters or quotes
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, value):
                logger.warning(f"Suspicious email pattern detected: {value}")
                raise serializers.ValidationError("Invalid email format.")
        
        return value

    def validate_password(self, value):
        """Enhanced password validation"""
        if not value:
            raise serializers.ValidationError("Password is required.")
        
        # Check for null bytes or control characters
        if '\x00' in value or any(ord(c) < 32 for c in value if ord(c) != 9):  # Allow tabs
            raise serializers.ValidationError("Invalid characters in password.")
        
        # Basic length check
        if len(value) > 128:  # Prevent excessive memory usage
            raise serializers.ValidationError("Password is too long.")
        
        return value

    def validate(self, attrs):
        """Enhanced validation with rate limiting and security checks"""
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')
        
        request = self.context.get('request')
        if request:
            self.client_ip = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Enhanced rate limiting check
            if self.check_rate_limit(email, self.client_ip):
                logger.warning(f"Rate limit exceeded for login attempt from {email} at {self.client_ip}")
                raise serializers.ValidationError(
                    'Too many failed login attempts. Please try again later.',
                    code='rate_limited'
                )

        if not email or not password:
            raise serializers.ValidationError(
                'Both email and password are required.',
                code='required_fields'
            )

        # Attempt authentication
        user = authenticate(
            request=request,
            username=email,
            password=password
        )

        if not user:
            # Log failed attempt
            self.log_login_attempt(email, self.client_ip, False, 'Invalid credentials')
            
            # Increment failed attempt counter
            self.increment_failed_attempts(email, self.client_ip)
            
            logger.warning(f"Failed login attempt for {email} from {self.client_ip}")
            raise serializers.ValidationError(
                'Invalid email or password.',
                code='authentication_failed'
            )

        # Check if account is active
        if not getattr(user, 'active', False):
            self.log_login_attempt(email, self.client_ip, False, 'Account inactive')
            logger.warning(f"Login attempt on inactive account: {email}")
            raise serializers.ValidationError(
                'Your account has been deactivated. Please contact support.',
                code='account_inactive'
            )

        # Check for account lockout
        if self.is_account_locked(user):
            logger.warning(f"Login attempt on locked account: {email}")
            raise serializers.ValidationError(
                'Account temporarily locked due to security concerns. Please contact support.',
                code='account_locked'
            )

        # Success - log and reset counters
        self.log_login_attempt(email, self.client_ip, True, 'Successful login')
        self.reset_failed_attempts(email, self.client_ip)
        
        attrs['user'] = user
        logger.info(f"Successful authentication for {email}")
        return attrs

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def check_rate_limit(self, email, ip_address):
        """Enhanced rate limiting with multiple factors"""
        current_time = timezone.now()
        
        # Check IP-based rate limiting (more restrictive)
        ip_key = f"login_attempts_ip_{ip_address}"
        ip_attempts = cache.get(ip_key, [])
        
        # Clean old attempts (last 15 minutes)
        recent_ip_attempts = [
            attempt for attempt in ip_attempts 
            if current_time - attempt < timedelta(minutes=15)
        ]
        
        if len(recent_ip_attempts) >= 10:  # Max 10 attempts per IP per 15 minutes
            return True
        
        # Check email-based rate limiting
        email_key = f"login_attempts_email_{hashlib.sha256(email.encode()).hexdigest()[:16]}"
        email_attempts = cache.get(email_key, [])
        
        # Clean old attempts (last 30 minutes)
        recent_email_attempts = [
            attempt for attempt in email_attempts 
            if current_time - attempt < timedelta(minutes=30)
        ]
        
        if len(recent_email_attempts) >= 5:  # Max 5 attempts per email per 30 minutes
            return True
        
        return False

    def increment_failed_attempts(self, email, ip_address):
        """Record failed login attempt"""
        current_time = timezone.now()
        
        # Record IP-based attempt
        ip_key = f"login_attempts_ip_{ip_address}"
        ip_attempts = cache.get(ip_key, [])
        ip_attempts.append(current_time)
        cache.set(ip_key, ip_attempts, 3600)  # 1 hour
        
        # Record email-based attempt
        email_key = f"login_attempts_email_{hashlib.sha256(email.encode()).hexdigest()[:16]}"
        email_attempts = cache.get(email_key, [])
        email_attempts.append(current_time)
        cache.set(email_key, email_attempts, 3600)  # 1 hour

    def reset_failed_attempts(self, email, ip_address):
        """Clear failed attempt counters on successful login"""
        ip_key = f"login_attempts_ip_{ip_address}"
        email_key = f"login_attempts_email_{hashlib.sha256(email.encode()).hexdigest()[:16]}"
        cache.delete(ip_key)
        cache.delete(email_key)

    def is_account_locked(self, user):
        """Check if account should be temporarily locked"""
        # Check for recent successful logins from different IPs (potential compromise)
        recent_time = timezone.now() - timedelta(hours=1)
        recent_logins = LoginAttempt.objects.filter(
            email=user.email,
            successful=True,
            attempted_at__gte=recent_time
        ).values_list('ip_address', flat=True).distinct()
        
        # If more than 3 different IPs in the last hour, flag for review
        if len(recent_logins) > 3:
            logger.warning(f"Multiple IP login pattern detected for {user.email}: {list(recent_logins)}")
            # Don't auto-lock, but log for manual review
            return False
        
        return False

    def log_login_attempt(self, email, ip_address, success, details=''):
        """Log login attempt to database"""
        try:
            request = self.context.get('request')
            user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
            
            LoginAttempt.objects.create(
                email=email,
                ip_address=ip_address or 'unknown',
                success=success,
                user_agent=user_agent[:500],  # Limit length
                details=details[:200] if details else ''
            )
        except Exception as e:
            logger.error(f"Failed to log login attempt: {e}")


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Enhanced admin user serializer with comprehensive validation and security
    """
    @extend_schema_field(serializers.CharField())
    def get_last_login_display(self, obj):
        """Human-readable last login time"""
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M:%S UTC")
        return "Never"

    @extend_schema_field(serializers.IntegerField())
    def get_account_age(self, obj):
        """Calculate account age in days"""
        if obj.created_at:
            return (timezone.now() - obj.created_at).days
        return 0

    @extend_schema_field(serializers.BooleanField())
    def get_is_locked(self, obj):
        """Check if account appears to be locked"""
        return not obj.active

    password = serializers.CharField(
        write_only=True, 
        required=False,
        style={'input_type': 'password'},
        help_text="Password (8+ characters with mixed case, numbers, and symbols)"
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        required=False,
        style={'input_type': 'password'},
        help_text="Confirm password"
    )
    full_name = serializers.ReadOnlyField()
    last_login_display = serializers.SerializerMethodField()
    account_age = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'active', 'last_login', 'last_login_display',
            'created_at', 'updated_at', 'full_name', 'password', 
            'confirm_password', 'account_age', 'is_locked'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at', 'is_locked']

    def get_last_login_display(self, obj):
        """Human-readable last login time"""
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M:%S UTC")
        return "Never"

    def get_account_age(self, obj):
        """Calculate account age in days"""
        if obj.created_at:
            return (timezone.now() - obj.created_at).days
        return 0

    def get_is_locked(self, obj):
        """Check if account appears to be locked"""
        # Simple check - could be enhanced based on business rules
        return not obj.active

    def validate_email(self, value):
        """Enhanced email validation with security checks"""
        if not value:
            raise serializers.ValidationError("Email address is required.")
        
        # Normalize email
        value = value.lower().strip()
        
        # Enhanced email validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Please enter a valid email address.")
        
        # Check for disposable email domains (basic list)
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email'
        ]
        domain = value.split('@')[1].lower()
        if domain in disposable_domains:
            raise serializers.ValidationError("Disposable email addresses are not allowed.")
        
        # Check uniqueness
        if self.instance:
            # Update case - exclude current instance
            if AdminUser.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        else:
            # Create case
            if AdminUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        
        return value

    def validate_username(self, value):
        """Enhanced username validation"""
        if not value:
            raise serializers.ValidationError("Username is required.")
        
        value = value.strip()
        
        # Username requirements
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
        if len(value) > 30:
            raise serializers.ValidationError("Username must be 30 characters or less.")
        
        # Only allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, underscore, and hyphen.")
        
        # Check for reserved usernames
        reserved_usernames = [
            'admin', 'administrator', 'root', 'system', 'api', 'www',
            'mail', 'email', 'support', 'help', 'info', 'contact'
        ]
        if value.lower() in reserved_usernames:
            raise serializers.ValidationError("This username is reserved.")
        
        # Check uniqueness
        if self.instance:
            if AdminUser.objects.filter(username=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        else:
            if AdminUser.objects.filter(username=value).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        
        return value

    def validate_first_name(self, value):
        """Validate first name"""
        if value:
            value = value.strip()
            if len(value) > 30:
                raise serializers.ValidationError("First name must be 30 characters or less.")
            # Basic sanitization - allow letters, spaces, apostrophes, hyphens
            if not re.match(r"^[a-zA-Z\s'-]+$", value):
                raise serializers.ValidationError("First name contains invalid characters.")
        return value

    def validate_last_name(self, value):
        """Validate last name"""
        if value:
            value = value.strip()
            if len(value) > 30:
                raise serializers.ValidationError("Last name must be 30 characters or less.")
            # Basic sanitization
            if not re.match(r"^[a-zA-Z\s'-]+$", value):
                raise serializers.ValidationError("Last name contains invalid characters.")
        return value

    def validate_role(self, value):
        """Validate user role"""
        valid_roles = ['super_admin', 'admin', 'readonly']
        if value not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of: {', '.join(valid_roles)}")
        
        # Check if current user has permission to assign this role
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            current_user_role = getattr(request.user, 'role', None)
            
            # Only super admins can create other super admins
            if value == 'super_admin' and current_user_role != 'super_admin':
                raise serializers.ValidationError("Only super administrators can create super admin accounts.")
        
        return value

    def validate_password(self, value):
        """Enhanced password validation"""
        if value:
            # Check for null bytes or control characters
            if '\x00' in value or any(ord(c) < 32 for c in value if ord(c) not in [9, 10, 13]):
                raise serializers.ValidationError("Password contains invalid characters.")
            
            # Use Django's built-in password validation
            try:
                validate_password(value, user=self.instance)
            except ValidationError as e:
                raise serializers.ValidationError(e.messages)
            
            # Additional security checks
            if len(value) > 128:
                raise serializers.ValidationError("Password is too long (max 128 characters).")
            
            # Check for common patterns
            common_patterns = [
                r'(.)\1{3,}',  # 4 or more repeated characters
                r'(012|123|234|345|456|567|678|789|890)',  # Sequential numbers
                r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn)',  # Sequential letters
            ]
            
            for pattern in common_patterns:
                if re.search(pattern, value.lower()):
                    raise serializers.ValidationError("Password contains predictable patterns.")
        
        return value

    def validate(self, attrs):
        """Enhanced validation with comprehensive security checks"""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        # Password confirmation validation
        if password or confirm_password:
            if not password:
                raise serializers.ValidationError({
                    'password': 'Password is required when confirm_password is provided.'
                })
            if not confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Password confirmation is required.'
                })
            if password != confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Passwords do not match.'
                })
        
        # Check if trying to create super admin inappropriately
        request = self.context.get('request')
        if (not self.instance and  # Creating new user
            attrs.get('role') == 'super_admin' and
            request and hasattr(request, 'user') and
            getattr(request.user, 'role', None) != 'super_admin'):
            raise serializers.ValidationError({
                'role': 'Only super administrators can create super admin accounts.'
            })
        
        # Remove confirm_password from attrs as it's not a model field
        attrs.pop('confirm_password', None)
        return attrs

    def create(self, validated_data):
        """Enhanced user creation with audit logging"""
        password = validated_data.pop('password', None)
        
        # Set default values
        validated_data.setdefault('is_staff', True)
        validated_data.setdefault('is_active', validated_data.get('active', True))
        
        # Create user
        user = AdminUser.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        # Log user creation
        logger.info(f"New admin user created: {user.email} with role {user.role}")
        
        return user

    def update(self, instance, validated_data):
        """Enhanced user update with change tracking"""
        password = validated_data.pop('password', None)
        
        # Track changes for logging
        changes = []
        for attr, value in validated_data.items():
            old_value = getattr(instance, attr, None)
            if old_value != value:
                changes.append(f"{attr}: {old_value} -> {value}")
        
        # Apply changes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Sync active with is_active
        if 'active' in validated_data:
            instance.is_active = validated_data['active']
        
        # Handle password change
        if password:
            instance.set_password(password)
            changes.append("password: changed")
        
        instance.save()
        
        # Log changes
        if changes:
            logger.info(f"Admin user {instance.email} updated: {'; '.join(changes)}")
        
        return instance


class AdminUserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing admin users with essential info only
    """
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    last_login_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'role_display',
            'active', 'last_login', 'last_login_display', 'created_at', 'status_display'
        ]

    def get_last_login_display(self, obj):
        """Human-readable last login"""
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M")
        return "Never"

    def get_status_display(self, obj):
        """Status indicator"""
        if not obj.active:
            return "Inactive"
        if obj.last_login and (timezone.now() - obj.last_login).days > 30:
            return "Dormant"
        return "Active"


class PasswordChangeSerializer(serializers.Serializer):
    """
    Enhanced password change serializer with security validations
    """
    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Current password for verification"
    )
    new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="New password (8+ characters with complexity requirements)"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirm new password"
    )

    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        
        if not value:
            raise serializers.ValidationError('Current password is required.')
        
        if not user.check_password(value):
            logger.warning(f"Incorrect current password provided by {user.email}")
            raise serializers.ValidationError('Current password is incorrect.')
        
        return value

    def validate_new_password(self, value):
        """Enhanced new password validation"""
        if not value:
            raise serializers.ValidationError('New password is required.')
        
        user = self.context['request'].user
        
        # Use Django's password validation
        try:
            validate_password(value, user=user)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        # Additional checks
        if len(value) > 128:
            raise serializers.ValidationError('Password is too long.')
        
        # Check for null bytes and control characters
        if '\x00' in value or any(ord(c) < 32 for c in value if ord(c) not in [9, 10, 13]):
            raise serializers.ValidationError('Password contains invalid characters.')
        
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        user = self.context['request'].user
        
        # Check password confirmation
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })
        
        # Check that new password is different from current
        if user.check_password(new_password):
            raise serializers.ValidationError({
                'new_password': 'New password must be different from current password.'
            })
        
        # Check against recent passwords (if implemented)
        # This would require storing password hashes history
        
        return attrs

    def save(self):
        """Save new password with audit logging"""
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        
        # Change password
        user.set_password(new_password)
        user.updated_at = timezone.now()
        user.save(update_fields=['password', 'updated_at'])
        
        # Log password change
        logger.info(f"Password changed for user {user.email}")
        
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Enhanced password reset request serializer with security features
    """
    email = serializers.EmailField(
        help_text="Email address associated with your account"
    )
    
    def validate_email(self, value):
        """Enhanced email validation for password reset"""
        if not value:
            raise serializers.ValidationError("Email address is required.")
        
        # Normalize email
        value = value.lower().strip()
        
        # Basic validation - Fixed the missing closing quote
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Please enter a valid email address.")
        
        # Rate limiting for password reset requests
        request = self.context.get('request')
        if request:
            client_ip = self.get_client_ip(request)
            cache_key = f"password_reset_rate_{client_ip}"
            recent_requests = cache.get(cache_key, 0)
            
            if recent_requests >= 3:  # Max 3 requests per hour per IP
                logger.warning(f"Password reset rate limit exceeded from IP {client_ip}")
                raise serializers.ValidationError(
                    "Too many password reset requests. Please try again later."
                )
        
        # For security, don't reveal if email exists or not in error messages
        # Just validate format and let the view handle existence check
        return value
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Enhanced password reset confirmation serializer
    """
    token = serializers.CharField(
        help_text="Password reset token from email"
    )
    new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="New password"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirm new password"
    )

    def validate_token(self, value):
        """Enhanced token validation"""
        if not value:
            raise serializers.ValidationError("Reset token is required.")
        
        # Basic token format validation
        if len(value) < 10 or len(value) > 100:
            raise serializers.ValidationError("Invalid token format.")
        
        # Check for suspicious characters - Fixed the missing closing quote
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError("Invalid token format.")
        
        try:
            reset_token = PasswordResetToken.objects.get(
                token=value,
                used=False
            )
            
            if reset_token.is_expired():
                logger.info(f"Expired password reset token used: {value[:8]}...")
                raise serializers.ValidationError('Reset token has expired.')
            
            # Check if token is too old (additional safety check)
            if (timezone.now() - reset_token.created_at).days > 1:
                raise serializers.ValidationError('Reset token has expired.')
            
            self.reset_token = reset_token
            return value
            
        except PasswordResetToken.DoesNotExist:
            logger.warning(f"Invalid password reset token used: {value[:8]}...")
            raise serializers.ValidationError('Invalid or expired reset token.')

    def validate_new_password(self, value):
        """Enhanced new password validation"""
        if not value:
            raise serializers.ValidationError('New password is required.')
        
        # Use Django's password validation
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        # Additional security checks
        if len(value) > 128:
            raise serializers.ValidationError('Password is too long.')
        
        if '\x00' in value or any(ord(c) < 32 for c in value if ord(c) not in [9, 10, 13]):
            raise serializers.ValidationError('Password contains invalid characters.')
        
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        
        return attrs

    def save(self):
        """Save new password and mark token as used"""
        user = self.reset_token.user
        new_password = self.validated_data['new_password']
        
        # Update password
        user.set_password(new_password)
        user.updated_at = timezone.now()
        user.save(update_fields=['password', 'updated_at'])
        
        # Mark token as used
        self.reset_token.used = True
        self.reset_token.save(update_fields=['used'])
        
        # Invalidate any other unused tokens for this user (security measure)
        PasswordResetToken.objects.filter(
            user=user,
            used=False
        ).exclude(id=self.reset_token.id).update(used=True)
        
        # Log password reset
        logger.info(f"Password reset completed for user {user.email}")
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Enhanced user profile serializer for self-service profile updates
    """
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    account_stats = serializers.SerializerMethodField()
    permissions_summary = serializers.SerializerMethodField()

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'last_login', 
            'created_at', 'updated_at', 'account_stats', 'permissions_summary'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'last_login', 'created_at', 'updated_at'
        ]

    def get_account_stats(self, obj):
        """Get account statistics"""
        return {
            'account_age_days': (timezone.now() - obj.created_at).days if obj.created_at else 0,
            'last_login_ago_days': (timezone.now() - obj.last_login).days if obj.last_login else None,
            'total_login_attempts': LoginAttempt.objects.filter(
                email=obj.email, success=True
            ).count() if hasattr(obj, 'email') else 0
        }

    def get_permissions_summary(self, obj):
        """Get user permissions summary"""
        return {
            'can_create': obj.can_create() if hasattr(obj, 'can_create') else False,
            'can_edit': obj.can_edit() if hasattr(obj, 'can_edit') else False,
            'can_delete': obj.can_delete() if hasattr(obj, 'can_delete') else False,
            'can_manage_users': obj.can_manage_users() if hasattr(obj, 'can_manage_users') else False,
        }

    def validate_email(self, value):
        """Enhanced email validation for profile updates"""
        if not value:
            raise serializers.ValidationError("Email address is required.")
        
        # Normalize email
        value = value.lower().strip()
        
        # Validate format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Please enter a valid email address.")
        
        # Check uniqueness (exclude current user)
        if (self.instance and 
            AdminUser.objects.filter(email=value).exclude(id=self.instance.id).exists()):
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value

    def validate_first_name(self, value):
        """Validate first name"""
        if value:
            value = value.strip()
            if len(value) > 30:
                raise serializers.ValidationError("First name must be 30 characters or less.")
            if not re.match(r"^[a-zA-Z\s'-]+$", value):
                raise serializers.ValidationError("First name contains invalid characters.")
        return value

    def validate_last_name(self, value):
        """Validate last name"""
        if value:
            value = value.strip()
            if len(value) > 30:
                raise serializers.ValidationError("Last name must be 30 characters or less.")
            if not re.match(r"^[a-zA-Z\s'-]+$", value):
                raise serializers.ValidationError("Last name contains invalid characters.")
        return value


class LoginAttemptSerializer(serializers.ModelSerializer):
    """
    Serializer for login attempt records (read-only for security monitoring)
    """
    user_agent_preview = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = LoginAttempt
        fields = [
            'id', 'email', 'ip_address', 'success', 'attempted_at',
            'user_agent', 'user_agent_preview', 'time_ago'
        ]
        read_only_fields = [
        'id', 'email', 'ip_address', 'success', 'attempted_at',
        'user_agent']

    def get_user_agent_preview(self, obj):
        """Get truncated user agent for display"""
        if obj.user_agent:
            return obj.user_agent[:50] + "..." if len(obj.user_agent) > 50 else obj.user_agent
        return "Unknown"

    def get_time_ago(self, obj):
        """Get human-readable time difference"""
        if obj.attempted_at:
            diff = timezone.now() - obj.attempted_at
            if diff.days > 0:
                return f"{diff.days} days ago"
            elif diff.seconds > 3600:
                hours = diff.seconds // 3600
                return f"{hours} hours ago"
            elif diff.seconds > 60:
                minutes = diff.seconds // 60
                return f"{minutes} minutes ago"
            else:
                return "Just now"
        return "Unknown"


class SystemStatsSerializer(serializers.Serializer):
    """
    Serializer for system statistics (read-only)
    """
    total_users = serializers.IntegerField(read_only=True)
    active_users = serializers.IntegerField(read_only=True)
    inactive_users = serializers.IntegerField(read_only=True)
    super_admins = serializers.IntegerField(read_only=True)
    admins = serializers.IntegerField(read_only=True)
    readonly_users = serializers.IntegerField(read_only=True)
    recent_logins_24h = serializers.IntegerField(read_only=True)
    failed_login_attempts_24h = serializers.IntegerField(read_only=True)
    last_updated = serializers.DateTimeField(read_only=True)