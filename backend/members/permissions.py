from rest_framework import permissions

class IsAuthenticatedOrCreateOnly(permissions.BasePermission):
    """
    Permission that allows:
    - Anyone to create (POST) - for public member registration
    - Only authenticated users for other operations
    """
    def has_permission(self, request, view):
        # Allow POST (create) for everyone (public registration)
        if request.method == 'POST':
            return True
        
        # Allow GET for listing if user is authenticated
        if request.method == 'GET' and view.action == 'list':
            return request.user and request.user.is_authenticated
        
        # Require authentication for all other operations
        return request.user and request.user.is_authenticated

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
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Accept both is_admin and role-based admin
        return (
            request.user and 
            request.user.is_authenticated and 
            (
                (hasattr(request.user, 'is_admin') and request.user.is_admin) or
                (hasattr(request.user, 'role') and request.user.role in ['admin', 'super_admin']) or
                request.user.is_staff or
                request.user.is_superuser
            )
        )


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Permission that allows only super admin users
    """
    def has_permission(self, request, view):
        # Accept both is_superuser and role-based super_admin
        return (
            request.user and 
            request.user.is_authenticated and 
            (
                (hasattr(request.user, 'is_superuser') and request.user.is_superuser) or
                (hasattr(request.user, 'role') and request.user.role == 'super_admin')
            )
        )


class CanManageNotes(permissions.BasePermission):
    """
    Permission for managing member notes:
    - Any admin can read non-private notes
    - Only note creators and super admins can read private notes
    - Only note creators and super admins can edit/delete notes
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Super admins can do anything
        if (
            (hasattr(request.user, 'is_superuser') and request.user.is_superuser) or
            (hasattr(request.user, 'role') and request.user.role == 'super_admin')
        ):
            return True
        
        # For reading notes
        if request.method in permissions.SAFE_METHODS:
            # Can read non-private notes or own notes
            return not obj.is_private or obj.created_by == request.user
        
        # For writing, only note creator or super admin
        return obj.created_by == request.user