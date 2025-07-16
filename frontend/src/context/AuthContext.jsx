import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: []
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: action.payload.permissions || []
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        permissions: []
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: []
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const token = localStorage.getItem('token');
        
        if (token) {
          const user = await authService.getCurrentUser();
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { 
              user, 
              permissions: user.permissions || [] 
            } 
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.login(credentials);
      
      localStorage.setItem('token', response.token);
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          permissions: response.user.permissions || [] 
        } 
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const resetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const confirmPasswordReset = async (token, newPassword) => {
    try {
      await authService.confirmPasswordReset(token, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasPermission = (permission) => {
    return state.permissions.includes(permission) || state.user?.role === 'super_admin';
  };

  const value = {
    ...state,
    login,
    logout,
    resetPassword,
    confirmPasswordReset,
    updateProfile,
    clearError,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;