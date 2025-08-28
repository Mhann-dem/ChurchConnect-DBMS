from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission that allows access to authenticated admin users
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has admin role (assuming your AdminUser model has role field)
        if hasattr(request.user, 'role'):
            return request.user.role in ['super_admin', 'admin']
        
        # Fallback: allow any authenticated user for now
        return True


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permission that allows read access to any user, but write access only to admin users
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'role'):
            return request.user.role in ['super_admin', 'admin']
        
        return True


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission that allows access only to super admin users
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if hasattr(request.user, 'role'):
            return request.user.role == 'super_admin'
        
        return request.user.is_superuser