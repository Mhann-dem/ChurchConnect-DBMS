# ================================================================

# File: backend/core/permissions.py
from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class IsAdminUserOrReadOnly(BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    Read permissions are allowed to any authenticated user.
    """
    
    def has_permission(self, request, view):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions only for admin users
        return request.user.is_authenticated and request.user.is_staff

class IsSuperAdminUser(BasePermission):
    """
    Custom permission to only allow super admin users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'super_admin'
        )

class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for owners or admin
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or request.user.is_staff
        
        # Default to admin only if no owner field
        return request.user.is_staff
