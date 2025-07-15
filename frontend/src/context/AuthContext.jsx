// context/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: [],
  lastActivity: null
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
        permissions: action.payload.permissions || [],
        lastActivity: new Date().toISOString()
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
        ...initialState,
        isLoading: false
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date().toISOString()
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
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('churchconnect_token');
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
        console.error('Auth initialization error:', error);
        localStorage.removeItem('churchconnect_token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auto-logout on token expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('churchconnect_token');
      if (token && state.isAuthenticated) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp < currentTime) {
            logout();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          logout();
        }
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  // Activity tracking for auto-logout
  useEffect(() => {
    if (state.isAuthenticated) {
      const handleActivity = () => {
        dispatch({ type: 'UPDATE_ACTIVITY' });
      };

      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [state.isAuthenticated]);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('churchconnect_token', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          permissions: response.permissions || []
        }
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('churchconnect_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasPermission = (permission) => {
    return state.permissions.includes(permission) || state.user?.role === 'super_admin';
  };

  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    clearError,
    hasPermission,
    hasRole
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
