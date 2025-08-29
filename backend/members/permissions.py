# members/permissions.py - Fixed version that resolves 403 errors
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)


class IsAuthenticatedOrCreateOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Anyone to create (POST) - for public member registration
    - Only authenticated users for other operations
    """
    
    def has_permission(self, request, view):
        # Allow POST (create) for everyone (public registration)
        if request.method == 'POST':
            logger.info(f"Allowing POST request from {request.META.get('REMOTE_ADDR', 'unknown')}")
            return True
        
        # For all other methods, require authentication
        if not request.user or not request.user.is_authenticated:
            logger.warning(f"Denying {request.method} request - user not authenticated: {request.user}")
            return False
        
        logger.info(f"Allowing {request.method} request for authenticated user: {request.user.email}")
        return True

    def has_object_permission(self, request, view, obj):
        # Require authentication for object-level operations
        return request.user and request.user.is_authenticated


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Read permissions for authenticated users
    - Write permissions only for admin users
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated first
        if not request.user or not request.user.is_authenticated:
            logger.warning(f"Denying request - user not authenticated: {request.user}")
            return False
            
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            logger.info(f"Allowing read access for user: {request.user.email}")
            return True
            
        # Write permissions only for admin users
        is_admin = self._is_admin_user(request.user)
        if not is_admin:
            logger.warning(f"Denying write access - user {request.user.email} is not admin. "
                         f"Role: {getattr(request.user, 'role', 'None')}, "
                         f"Is staff: {request.user.is_staff}, "
                         f"Is superuser: {request.user.is_superuser}")
        else:
            logger.info(f"Allowing write access for admin user: {request.user.email}")
        return is_admin
    
    def _is_admin_user(self, user):
        """Check if user has admin privileges"""
        return (
            user.is_superuser or
            user.is_staff or
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin'])
        )


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Permission that allows only super admin users
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            logger.warning(f"Denying super admin request - user not authenticated: {request.user}")
            return False
            
        is_super_admin = (
            request.user.is_superuser or
            (hasattr(request.user, 'role') and request.user.role == 'super_admin')
        )
        
        if not is_super_admin:
            logger.warning(f"Denying super admin request - user {request.user.email} is not super admin. "
                         f"Role: {getattr(request.user, 'role', 'None')}")
        else:
            logger.info(f"Allowing super admin access for user: {request.user.email}")
            
        return is_super_admin


class CanManageNotes(permissions.BasePermission):
    """
    Permission for managing member notes
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Super admins can do anything
        if (
            request.user.is_superuser or
            (hasattr(request.user, 'role') and request.user.role == 'super_admin')
        ):
            return True
        
        # For reading notes
        if request.method in permissions.SAFE_METHODS:
            # Can read non-private notes or own notes
            return not obj.is_private or obj.created_by == request.user
        
        # For writing, only note creator or super admin
        return obj.created_by == request.user


# Temporary debug permission class
class DebugPermission(permissions.BasePermission):
    """
    Debug permission that logs all permission checks and allows everything
    Use this temporarily to debug permission issues
    """
    
    def has_permission(self, request, view):
        user_info = {
            'user': str(request.user),
            'user_type': type(request.user).__name__,
            'is_authenticated': getattr(request.user, 'is_authenticated', False),
            'is_anonymous': getattr(request.user, 'is_anonymous', True),
            'is_staff': getattr(request.user, 'is_staff', False),
            'is_superuser': getattr(request.user, 'is_superuser', False),
            'role': getattr(request.user, 'role', 'None'),
            'active': getattr(request.user, 'active', 'None'),
            'email': getattr(request.user, 'email', 'None'),
        }
        
        logger.info(f"DEBUG PERMISSION CHECK - Method: {request.method}, "
                   f"View: {view.__class__.__name__}, User info: {user_info}")
        
        # Allow everything for debugging
        return True
    
    def has_object_permission(self, request, view, obj):
        logger.info(f"DEBUG OBJECT PERMISSION - Method: {request.method}, "
                   f"View: {view.__class__.__name__}, Object: {obj}, User: {request.user}")
        return True