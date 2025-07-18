import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/auth';

/**
 * Custom hook for authentication management
 * Provides authentication state and methods throughout the app
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  } = context;

  // Auto-check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Enhanced login with error handling
  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  // Enhanced logout with cleanup
  const handleLogout = async () => {
    try {
      await logout();
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
      return { success: true }; // Always return success for logout
    }
  };

  // Password reset request
  const requestPasswordReset = async (email) => {
    try {
      await authService.requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password reset request failed' 
      };
    }
  };

  // Password reset confirmation
  const resetPassword = async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password reset failed' 
      };
    }
  };

  // Change password (authenticated user)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password change failed' 
      };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      updateUser(updatedUser);
      return { success: true, data: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user has permission for specific action
  const hasPermission = (permission) => {
    const rolePermissions = {
      'super_admin': ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports', 'export_data'],
      'admin': ['create', 'read', 'update', 'delete', 'view_reports', 'export_data'],
      'readonly': ['read', 'view_reports']
    };

    return rolePermissions[user?.role]?.includes(permission) || false;
  };

  // Get user's full name
  const getUserFullName = () => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user) return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Check if session is about to expire
  const isSessionNearExpiry = () => {
    if (!token) return false;
    
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      // Return true if token expires in less than 5 minutes
      return timeToExpiry < 5 * 60 * 1000;
    } catch (error) {
      return false;
    }
  };

  // Refresh token if needed
  const refreshTokenIfNeeded = async () => {
    if (isSessionNearExpiry()) {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }
  };

  // Auto-refresh token
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshTokenIfNeeded, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    
    // Methods
    login: handleLogin,
    logout: handleLogout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    checkAuthStatus,
    
    // Utility methods
    hasRole,
    hasAnyRole,
    hasPermission,
    getUserFullName,
    getUserInitials,
    isSessionNearExpiry,
    refreshTokenIfNeeded,
    
    // User info helpers
    isAdmin: hasAnyRole(['super_admin', 'admin']),
    isSuperAdmin: hasRole('super_admin'),
    isReadOnly: hasRole('readonly'),
    canManageUsers: hasPermission('manage_users'),
    canExportData: hasPermission('export_data'),
    canViewReports: hasPermission('view_reports')
  };
};

export default useAuth;