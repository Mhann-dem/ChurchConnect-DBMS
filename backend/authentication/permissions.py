from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow super admins to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'super_admin' and
            request.user.active
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow admins full access and readonly users read access.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if not (hasattr(request.user, 'role') and request.user.active):
            return False
        
        # Super admin and admin can do anything
        if request.user.role in ['super_admin', 'admin']:
            return True
        
        # Readonly users can only read
        if request.user.role == 'readonly':
            return request.method in permissions.SAFE_METHODS
        
        return False


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins and super admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['admin', 'super_admin'] and
            request.user.active
        )


class CanCreateMembers(permissions.BasePermission):
    """
    Permission to create member records.
    """
    
    def has_permission(self, request, view):
        if request.method == 'POST':
            return (
                request.user and
                request.user.is_authenticated and
                hasattr(request.user, 'can_create') and
                request.user.can_create() and
                request.user.active
            )
        return True


class CanEditMembers(permissions.BasePermission):
    """
    Permission to edit member records.
    """
    
    def has_permission(self, request, view):
        if request.method in ['PUT', 'PATCH']:
            return (
                request.user and
                request.user.is_authenticated and
                hasattr(request.user, 'can_edit') and
                request.user.can_edit() and
                request.user.active
            )
        return True


class CanDeleteMembers(permissions.BasePermission):
    """
    Permission to delete member records.
    """
    
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return (
                request.user and
                request.user.is_authenticated and
                hasattr(request.user, 'can_delete') and
                request.user.can_delete() and
                request.user.active
            )
        return True


class ReadOnlyOrAuthenticatedCreate(permissions.BasePermission):
    """
    Custom permission for public form submission.
    Allows unauthenticated POST requests (for public form)
    and authenticated read access.
    """
    
    def has_permission(self, request, view):
        # Allow unauthenticated POST requests (public form submission)
        if request.method == 'POST':
            return True
        
        # Require authentication for other methods
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.active
        )