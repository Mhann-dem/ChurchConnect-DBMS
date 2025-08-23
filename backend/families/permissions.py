# backend/churchconnect/families/permissions.py

from rest_framework import permissions


class FamilyPermission(permissions.BasePermission):
    """
    Custom permission class for family operations
    Based on the documentation requirements for role-based access
    """

    def has_permission(self, request, view):
        """
        Check if user has permission to access family endpoints
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # All authenticated admin users can view families
        if request.method in permissions.SAFE_METHODS:
            return hasattr(request.user, 'role')

        # Only admins and super admins can modify families
        if hasattr(request.user, 'role'):
            return request.user.role in ['admin', 'super_admin']

        return False

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access specific family object
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for all authenticated admin users
        if request.method in permissions.SAFE_METHODS:
            return hasattr(request.user, 'role')

        # Write permissions only for admins and super admins
        if hasattr(request.user, 'role'):
            return request.user.role in ['admin', 'super_admin']

        return False


class FamilyRelationshipPermission(permissions.BasePermission):
    """
    Custom permission class for family relationship operations
    """

    def has_permission(self, request, view):
        """
        Check if user has permission to access family relationship endpoints
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Read-only users can view relationships
        if request.method in permissions.SAFE_METHODS:
            return hasattr(request.user, 'role')

        # Only admins and super admins can modify relationships
        if hasattr(request.user, 'role'):
            return request.user.role in ['admin', 'super_admin']

        return False

    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access specific relationship object
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for all authenticated admin users
        if request.method in permissions.SAFE_METHODS:
            return hasattr(request.user, 'role')

        # Write permissions only for admins and super admins
        if hasattr(request.user, 'role'):
            return request.user.role in ['admin', 'super_admin']

        return False


class CanManageFamilies(permissions.BasePermission):
    """
    Permission for bulk family management operations
    Only super admins can perform bulk operations
    """

    def has_permission(self, request, view):
        """
        Check if user can perform bulk family operations
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Only super admins can perform bulk operations
        if hasattr(request.user, 'role'):
            return request.user.role == 'super_admin'

        return False


class CanViewFamilyStatistics(permissions.BasePermission):
    """
    Permission for viewing family statistics and reports
    Available to all admin users
    """

    def has_permission(self, request, view):
        """
        Check if user can view family statistics
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # All admin users can view statistics
        return hasattr(request.user, 'role') and request.user.role in ['readonly', 'admin', 'super_admin']


class CanExportFamilyData(permissions.BasePermission):
    """
    Permission for exporting family data
    Available to admins and super admins
    """

    def has_permission(self, request, view):
        """
        Check if user can export family data
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins and super admins can export data
        if hasattr(request.user, 'role'):
            return request.user.role in ['admin', 'super_admin']

        return False