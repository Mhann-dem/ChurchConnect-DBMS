import { useContext, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/auth';

/**
 * Custom hook for authentication management
 * Fixed version that prevents infinite loops and duplicate auth checks
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  const mountedRef = useRef(true);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    authChecked,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    clearError
  } = context;

  // REMOVED: Duplicate auth check effect that was causing loops
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // FIXED: Stable login function that doesn't trigger re-renders
  const handleLogin = useCallback(async (credentials) => {
    try {
      const result = await login(credentials);
      return result; // Return the result directly
    } catch (error) {
      // Re-throw the error so LoginPage can catch it
      throw error;
    }
  }, [login]);

  // FIXED: Stable logout function
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
      return { success: true }; // Always return success for logout
    }
  }, [logout]);

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authService.requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password reset request failed' 
      };
    }
  }, []);

  // Password reset confirmation
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password reset failed' 
      };
    }
  }, []);

  // Change password (authenticated user)
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Password change failed' 
      };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      if (mountedRef.current) {
        updateUser(updatedUser);
      }
      return { success: true, data: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  }, [updateUser]);

  // FIXED: Stable utility functions
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user?.role]);

  const hasPermission = useCallback((permission) => {
    const rolePermissions = {
      'super_admin': ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports', 'export_data'],
      'admin': ['create', 'read', 'update', 'delete', 'view_reports', 'export_data'],
      'readonly': ['read', 'view_reports']
    };

    return rolePermissions[user?.role]?.includes(permission) || false;
  }, [user?.role]);

  const getUserFullName = useCallback(() => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }, [user]);

  const getUserInitials = useCallback(() => {
    if (!user) return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [user]);

  // Check if session is about to expire
  const isSessionNearExpiry = useCallback(() => {
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
  }, [token]);

  // Refresh token if needed
  const refreshTokenIfNeeded = useCallback(async () => {
    if (isSessionNearExpiry()) {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }
  }, [isSessionNearExpiry, logout]);

  // FIXED: Auto-refresh token with proper cleanup
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (mountedRef.current) {
          refreshTokenIfNeeded();
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshTokenIfNeeded]);

  // Computed values based on hasRole and hasAnyRole
  const isAdmin = hasAnyRole(['super_admin', 'admin']);
  const isSuperAdmin = hasRole('super_admin');
  const isReadOnly = hasRole('readonly');
  const canManageUsers = hasPermission('manage_users');
  const canExportData = hasPermission('export_data');
  const canViewReports = hasPermission('view_reports');

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    authChecked, // ADDED: Expose auth check status
    
    // Methods - use the stable functions
    login: handleLogin,
    logout: handleLogout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    checkAuthStatus, // Only use this if you really need to force a check
    clearError,
    
    // Utility methods - all stable references
    hasRole,
    hasAnyRole,
    hasPermission,
    getUserFullName,
    getUserInitials,
    isSessionNearExpiry,
    refreshTokenIfNeeded,
    
    // User info helpers - computed from stable functions
    isAdmin,
    isSuperAdmin,
    isReadOnly,
    canManageUsers,
    canExportData,
    canViewReports
  };
};

export default useAuth;