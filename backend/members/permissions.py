# members/permissions.py - Fixed permissions with better error handling
from rest_framework import permissions


class IsAuthenticatedOrCreateOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Anyone to create (POST) - for public member registration
    - Only authenticated users for other operations
    """
    
    message = "Authentication credentials were not provided."
    
    def has_permission(self, request, view):
        # Allow POST (create) for everyone (public registration)
        if request.method == 'POST':
            return True
        
        # For all other methods, require authentication
        if not request.user or not request.user.is_authenticated:
            # Provide specific error message for debugging
            self.message = f"Authentication required. User: {request.user}, Is authenticated: {request.user.is_authenticated if request.user else 'No user'}"
            return False
        
        return True

    def has_object_permission(self, request, view, obj):
        # Require authentication for object-level operations
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required for object access."
            return False
        return True


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Read permissions for authenticated users
    - Write permissions only for admin users
    """
    
    message = "Admin permissions required."
    
    def has_permission(self, request, view):
        # Check if user is authenticated first
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required."
            return False
            
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions only for admin users
        is_admin = self._is_admin_user(request.user)
        if not is_admin:
            self.message = f"Admin permissions required. User role: {getattr(request.user, 'role', 'None')}, Is staff: {request.user.is_staff}, Is superuser: {request.user.is_superuser}"
        return is_admin
    
    def _is_admin_user(self, user):
        """Check if user has admin privileges"""
        return (
            user.is_superuser or
            user.is_staff or
            (hasattr(user, 'role') and user.role in ['admin', 'super_admin']) or
            (hasattr(user, 'is_admin') and user.is_admin)
        )


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Permission that allows only super admin users
    """
    
    message = "Super admin permissions required."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required."
            return False
            
        is_super_admin = (
            user.is_superuser or
            (hasattr(user, 'role') and user.role == 'super_admin')
        )
        
        if not is_super_admin:
            self.message = f"Super admin permissions required. User: {request.user.username}, Role: {getattr(request.user, 'role', 'None')}"
            
        return is_super_admin


class CanManageNotes(permissions.BasePermission):
    """
    Permission for managing member notes:
    - Any authenticated user can read non-private notes
    - Only note creators and super admins can read private notes
    - Only note creators and super admins can edit/delete notes
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


# Debug permission class for troubleshooting
class DebugPermission(permissions.BasePermission):
    """
    Debug permission that logs all permission checks
    Use this temporarily to debug permission issues
    """
    
    def has_permission(self, request, view):
        import logging
        logger = logging.getLogger(__name__)
        
        user_info = {
            'user': str(request.user),
            'is_authenticated': request.user.is_authenticated if request.user else False,
            'is_anonymous': request.user.is_anonymous if request.user else True,
            'is_staff': getattr(request.user, 'is_staff', False),
            'is_superuser': getattr(request.user, 'is_superuser', False),
            'role': getattr(request.user, 'role', 'None'),
            'is_admin': getattr(request.user, 'is_admin', False),
        }
        
        logger.info(f"Permission check - Method: {request.method}, View: {view.__class__.__name__}, User info: {user_info}")
        
        # Allow everything for debugging
        return True
    
    def has_object_permission(self, request, view, obj):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Object permission check - Method: {request.method}, View: {view.__class__.__name__}, Object: {obj}")
        return True