// hooks/useAuth.js - Authentication hook for managing user authentication state

import { useState, useEffect, useContext, createContext } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const userData = await authService.validateToken(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message || 'Login failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setError(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Password reset failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.resetPassword(token, password);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Password reset failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      setError(error.message || 'Profile update failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      setError(error.message || 'Password change failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      'super_admin': ['read', 'write', 'delete', 'admin'],
      'admin': ['read', 'write', 'delete'],
      'readonly': ['read']
    };
    
    return permissions[user.role]?.includes(permission) || false;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    checkPermission,
    hasRole,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;