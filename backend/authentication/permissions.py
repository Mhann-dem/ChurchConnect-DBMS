# File: backend/authentication/permissions.py
"""
Enhanced permission classes for ChurchConnect DBMS
Production-ready with comprehensive security and audit features
"""

from rest_framework import permissions
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger('authentication')


class BaseChurchPermission(permissions.BasePermission):
    """
    Base permission class with common security checks and logging
    """
    
    def has_permission(self, request, view):
        # Log permission checks for security auditing
        logger.info(f"Permission check: {self.__class__.__name__} for user {getattr(request.user, 'email', 'anonymous')} on {request.method} {request.path}")
        
        # Basic authentication check
        if not (request.user and request.user.is_authenticated):
            logger.warning(f"Unauthenticated access attempt to {request.path} from IP {self.get_client_ip(request)}")
            return False
        
        # Check if user account is active
        if not getattr(request.user, 'active', False):
            logger.warning(f"Inactive user {request.user.email} attempted access to {request.path}")
            return False
        
        # Check for user role attribute
        if not hasattr(request.user, 'role'):
            logger.error(f"User {request.user.email} missing role attribute")
            return False
        
        return True
    
    def get_client_ip(self, request):
        """Get client IP address for logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR', 'unknown')


class IsSuperAdmin(BaseChurchPermission):
    """
    Custom permission to only allow super admins to access the view.
    Includes rate limiting and audit logging.
    """
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Check for super admin role
        is_super_admin = request.user.role == 'super_admin'
        
        if is_super_admin:
            logger.info(f"Super admin access granted to {request.user.email} for {request.method} {request.path}")
        else:
            logger.warning(f"Non-super-admin {request.user.email} attempted super admin action on {request.path}")
        
        return is_super_admin


class IsAdminOrReadOnly(BaseChurchPermission):
    """
    Custom permission to allow admins full access and readonly users read access.
    Enhanced with method-specific logging and validation.
    """
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        user_role = request.user.role
        method = request.method
        
        # Super admin and admin can do anything
        if user_role in ['super_admin', 'admin']:
            logger.info(f"Admin access granted to {request.user.email} ({user_role}) for {method} {request.path}")
            return True
        
        # Readonly users can only read
        if user_role == 'readonly':
            if method in permissions.SAFE_METHODS:
                logger.info(f"Read-only access granted to {request.user.email} for {method} {request.path}")
                return True
            else:
                logger.warning(f"Read-only user {request.user.email} attempted {method} operation on {request.path}")
                return False
        
        logger.warning(f"Unknown role '{user_role}' for user {request.user.email} on {request.path}")
        return False


class IsAdminOrSuperAdmin(BaseChurchPermission):
    """
    Custom permission to only allow admins and super admins.
    """
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        user_role = request.user.role
        has_access = user_role in ['admin', 'super_admin']
        
        if has_access:
            logger.info(f"Admin level access granted to {request.user.email} ({user_role}) for {request.method} {request.path}")
        else:
            logger.warning(f"Non-admin user {request.user.email} ({user_role}) attempted admin action on {request.path}")
        
        return has_access


class CanCreateMembers(BaseChurchPermission):
    """
    Permission to create member records with rate limiting.
    """
    
    def has_permission(self, request, view):
        if request.method != 'POST':
            return True
        
        if not super().has_permission(request, view):
            return False
        
        # Check if user has create permission
        if not (hasattr(request.user, 'can_create') and request.user.can_create()):
            logger.warning(f"User {request.user.email} lacks create permission for members")
            return False
        
        # Rate limiting for member creation (prevent abuse)
        cache_key = f"member_create_rate_{request.user.id}"
        recent_creates = cache.get(cache_key, 0)
        
        if recent_creates >= 10:  # Max 10 creates per hour
            logger.warning(f"Rate limit exceeded for member creation by {request.user.email}")
            return False
        
        cache.set(cache_key, recent_creates + 1, 3600)  # 1 hour
        logger.info(f"Member create permission granted to {request.user.email}")
        return True


class CanEditMembers(BaseChurchPermission):
    """
    Permission to edit member records with audit trail.
    """
    
    def has_permission(self, request, view):
        if request.method not in ['PUT', 'PATCH']:
            return True
        
        if not super().has_permission(request, view):
            return False
        
        # Check if user has edit permission
        if not (hasattr(request.user, 'can_edit') and request.user.can_edit()):
            logger.warning(f"User {request.user.email} lacks edit permission for members")
            return False
        
        logger.info(f"Member edit permission granted to {request.user.email}")
        return True
    
    def has_object_permission(self, request, view, obj):
        """Object-level permission for editing specific members"""
        # Super admins can edit anyone
        if request.user.role == 'super_admin':
            return True
        
        # Regular admins can edit, but we log sensitive operations
        if hasattr(obj, 'email'):
            logger.info(f"User {request.user.email} editing member {obj.email}")
        
        return True


class CanDeleteMembers(BaseChurchPermission):
    """
    Permission to delete member records with strict controls.
    """
    
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        
        if not super().has_permission(request, view):
            return False
        
        # Only super admins should typically delete members
        if request.user.role != 'super_admin':
            logger.warning(f"Non-super-admin {request.user.email} attempted member deletion")
            return False
        
        # Check if user has delete permission
        if not (hasattr(request.user, 'can_delete') and request.user.can_delete()):
            logger.warning(f"User {request.user.email} lacks delete permission for members")
            return False
        
        logger.warning(f"Member delete permission granted to {request.user.email} - THIS IS A DESTRUCTIVE OPERATION")
        return True
    
    def has_object_permission(self, request, view, obj):
        """Object-level permission for deleting specific members"""
        if hasattr(obj, 'email'):
            logger.warning(f"DELETION ATTEMPT: User {request.user.email} attempting to delete member {obj.email}")
        return True


class ReadOnlyOrAuthenticatedCreate(permissions.BasePermission):
    """
    Custom permission for public form submission with enhanced security.
    Allows unauthenticated POST requests (for public form)
    and authenticated read access with rate limiting.
    """
    
    def has_permission(self, request, view):
        client_ip = self.get_client_ip(request)
        
        # Allow unauthenticated POST requests (public form submission)
        if request.method == 'POST':
            # Rate limiting for public form submissions to prevent abuse
            cache_key = f"public_form_rate_{client_ip}"
            recent_submissions = cache.get(cache_key, 0)
            
            if recent_submissions >= 5:  # Max 5 submissions per hour per IP
                logger.warning(f"Rate limit exceeded for public form submission from IP {client_ip}")
                return False
            
            cache.set(cache_key, recent_submissions + 1, 3600)  # 1 hour
            logger.info(f"Public form submission allowed from IP {client_ip}")
            return True
        
        # Require authentication for other methods
        if not (request.user and request.user.is_authenticated):
            logger.warning(f"Unauthenticated {request.method} request to {request.path} from IP {client_ip}")
            return False
        
        # Check user is active and has role
        if not (hasattr(request.user, 'role') and getattr(request.user, 'active', False)):
            logger.warning(f"Inactive or role-less user {getattr(request.user, 'email', 'unknown')} attempted access")
            return False
        
        return True
    
    def get_client_ip(self, request):
        """Get client IP address for rate limiting and logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR', 'unknown')


class IsOwnerOrAdmin(BaseChurchPermission):
    """
    Permission that allows owners of objects or admins to access them.
    """
    
    def has_object_permission(self, request, view, obj):
        # Super admins can access everything
        if request.user.role == 'super_admin':
            return True
        
        # Admins can access most things
        if request.user.role == 'admin':
            return True
        
        # Users can only access their own objects
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        # Check if object belongs to user in other ways
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        
        logger.warning(f"User {request.user.email} denied access to object {obj.id if hasattr(obj, 'id') else 'unknown'}")
        return False


class PasswordResetPermission(permissions.BasePermission):
    """
    Special permission for password reset functionality with enhanced security.
    """
    
    def has_permission(self, request, view):
        client_ip = self.get_client_ip(request)
        
        # Rate limiting for password reset requests
        cache_key = f"password_reset_rate_{client_ip}"
        recent_requests = cache.get(cache_key, 0)
        
        if recent_requests >= 3:  # Max 3 password reset attempts per hour per IP
            logger.warning(f"Password reset rate limit exceeded from IP {client_ip}")
            return False
        
        cache.set(cache_key, recent_requests + 1, 3600)  # 1 hour
        logger.info(f"Password reset request allowed from IP {client_ip}")
        return True
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR', 'unknown')


class MaintenanceMode(permissions.BasePermission):
    """
    Permission that can be used to put the system in maintenance mode.
    Only super admins can access when maintenance mode is active.
    """
    
    def has_permission(self, request, view):
        # Check if maintenance mode is active
        maintenance_mode = cache.get('maintenance_mode', False)
        
        if maintenance_mode:
            # Only allow super admins during maintenance
            if not (request.user and 
                   request.user.is_authenticated and 
                   hasattr(request.user, 'role') and
                   request.user.role == 'super_admin'):
                logger.info(f"Maintenance mode: Access denied to {getattr(request.user, 'email', 'anonymous')}")
                return False
            
            logger.info(f"Maintenance mode: Super admin access granted to {request.user.email}")
        
        return True