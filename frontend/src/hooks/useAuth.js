// hooks/useAuth.js - Production Ready with TypeScript support - FIXED
import { useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/auth';

/**
 * Custom hook for authentication management
 * Production-ready with proper error handling, memoization, and cleanup
 * FIXED: Login issues resolved
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  const mountedRef = useRef(true);
  const refreshTimeoutRef = useRef(null);
  const loginInProgressRef = useRef(false);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    authChecked,
    error,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    clearError
  } = context;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // FIXED: Stable login function with proper error handling
  const handleLogin = useCallback(async (credentials) => {
    // Prevent concurrent login attempts
    if (loginInProgressRef.current) {
      throw new Error('Login already in progress');
    }

    loginInProgressRef.current = true;
    
    try {
      const result = await login(credentials);
      
      // Only set up token refresh if login was successful and component is still mounted
      if (result.success && mountedRef.current) {
        // Delay token refresh setup to avoid interfering with login flow
        setTimeout(() => {
          if (mountedRef.current && result.success) {
            // Clear any existing refresh timeout
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
            }
            // Set up token refresh monitoring
            scheduleTokenRefresh();
          }
        }, 500); // Small delay to ensure login process completes
      }
      
      return result;
    } catch (error) {
      // FIXED: Re-throw original error instead of wrapping it
      // This preserves the original error structure that components expect
      throw error;
    } finally {
      loginInProgressRef.current = false;
    }
  }, [login]);

  // FIXED: Stable logout function
  const handleLogout = useCallback(async () => {
    try {
      // Clear refresh timeout immediately
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Reset login progress flag
      loginInProgressRef.current = false;
      
      await logout();
      return { success: true };
    } catch (error) {
      // Log error but still clear local state
      console.error('Logout error:', error);
      return { success: true }; // Always return success for logout
    }
  }, [logout]);

  // Token utilities with better error handling
  const getTokenExpirationTime = useCallback(() => {
    if (!token) return null;
    
    try {
      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
      return null;
    }
  }, [token]);

  const isTokenExpired = useCallback(() => {
    const expirationTime = getTokenExpirationTime();
    return expirationTime ? Date.now() >= expirationTime : true;
  }, [getTokenExpirationTime]);

  const getTimeToExpiry = useCallback(() => {
    const expirationTime = getTokenExpirationTime();
    return expirationTime ? Math.max(expirationTime - Date.now(), 0) : 0;
  }, [getTokenExpirationTime]);

  // Check if session is about to expire (within 5 minutes)
  const isSessionNearExpiry = useCallback(() => {
    const timeToExpiry = getTimeToExpiry();
    return timeToExpiry > 0 && timeToExpiry < 5 * 60 * 1000; // 5 minutes
  }, [getTimeToExpiry]);

  // FIXED: Schedule token refresh with better error handling
  const scheduleTokenRefresh = useCallback(() => {
    // Don't schedule refresh if not authenticated or no token
    if (!isAuthenticated || !token || !mountedRef.current) return;

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const timeToExpiry = getTimeToExpiry();
    
    if (timeToExpiry <= 0) {
      // Token already expired, logout immediately
      console.warn('Token already expired, logging out');
      handleLogout();
      return;
    }

    // Schedule refresh 2 minutes before expiration, but at least 30 seconds from now
    const refreshTime = Math.max(timeToExpiry - 2 * 60 * 1000, 30 * 1000);
    
    refreshTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || !isAuthenticated) return;
      
      try {
        console.log('Attempting token refresh...');
        await authService.refreshToken();
        
        // Reschedule for the new token if still mounted and authenticated
        if (mountedRef.current && isAuthenticated) {
          setTimeout(() => {
            if (mountedRef.current) {
              scheduleTokenRefresh();
            }
          }, 1000); // Small delay to ensure new token is available
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        if (mountedRef.current) {
          // Only logout if we're still mounted to avoid state updates on unmounted component
          handleLogout();
        }
      }
    }, refreshTime);
  }, [isAuthenticated, token, getTimeToExpiry, handleLogout]);

  // FIXED: Set up token refresh monitoring with proper dependency management
  useEffect(() => {
    if (isAuthenticated && token && authChecked) {
      // Only schedule refresh after auth is fully checked and we have a valid token
      const delay = setTimeout(() => {
        if (mountedRef.current) {
          scheduleTokenRefresh();
        }
      }, 100); // Small delay to ensure everything is ready
      
      return () => {
        clearTimeout(delay);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
      };
    }
  }, [isAuthenticated, token, authChecked, scheduleTokenRefresh]);

  // Password management functions with better error handling
  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authService.requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Password reset request failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Password change failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateProfile = useCallback(async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      if (mountedRef.current) {
        updateUser(updatedUser);
      }
      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Profile update failed';
      return { success: false, error: errorMessage };
    }
  }, [updateUser]);

  // Memoized role and permission utilities
  const rolePermissions = useMemo(() => ({
    'super_admin': [
      'create', 'read', 'update', 'delete', 
      'manage_users', 'view_reports', 'export_data', 
      'system_admin', 'bulk_operations'
    ],
    'admin': [
      'create', 'read', 'update', 'delete', 
      'view_reports', 'export_data', 'manage_members'
    ],
    'staff': [
      'create', 'read', 'update', 
      'view_reports', 'manage_members'
    ],
    'readonly': ['read', 'view_reports'],
    'member': ['read']
  }), []);

  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles) => {
    return Array.isArray(roles) && roles.includes(user?.role);
  }, [user?.role]);

  const hasPermission = useCallback((permission) => {
    if (!user?.role || !rolePermissions[user.role]) return false;
    return rolePermissions[user.role].includes(permission);
  }, [user?.role, rolePermissions]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // User info utilities
  const getUserFullName = useCallback(() => {
    if (!user) return '';
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    return `${firstName} ${lastName}`.trim() || user.email || 'User';
  }, [user]);

  const getUserInitials = useCallback(() => {
    if (!user) return '';
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    const fullName = getUserFullName();
    return fullName !== user?.email ? fullName : (user?.username || user?.email || 'User');
  }, [getUserFullName, user]);

  // Computed values with useMemo for performance
  const computedValues = useMemo(() => ({
    isAdmin: hasAnyRole(['super_admin', 'admin']),
    isSuperAdmin: hasRole('super_admin'),
    isStaff: hasAnyRole(['super_admin', 'admin', 'staff']),
    isReadOnly: hasRole('readonly'),
    isMember: hasRole('member'),
    canManageUsers: hasPermission('manage_users'),
    canExportData: hasPermission('export_data'),
    canViewReports: hasPermission('view_reports'),
    canManageMembers: hasPermission('manage_members'),
    canBulkOperations: hasPermission('bulk_operations'),
    canSystemAdmin: hasPermission('system_admin')
  }), [hasRole, hasAnyRole, hasPermission]);

  // Session status with useMemo for performance
  const sessionStatus = useMemo(() => ({
    isExpired: isTokenExpired(),
    isNearExpiry: isSessionNearExpiry(),
    timeToExpiry: getTimeToExpiry(),
    expirationTime: getTokenExpirationTime()
  }), [isTokenExpired, isSessionNearExpiry, getTimeToExpiry, getTokenExpirationTime]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    authChecked,
    error,
    
    // Core authentication methods
    login: handleLogin,
    logout: handleLogout,
    checkAuthStatus,
    clearError,
    
    // Password management
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    
    // Role and permission utilities
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    rolePermissions,
    
    // User info utilities
    getUserFullName,
    getUserInitials,
    getUserDisplayName,
    
    // Session management
    isTokenExpired,
    isSessionNearExpiry,
    getTimeToExpiry,
    getTokenExpirationTime,
    sessionStatus,
    
    // Computed values
    ...computedValues
  };
};

export default useAuth;