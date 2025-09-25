// context/AuthContext.jsx - Enhanced version with proper backend integration
import React, { createContext, useReducer, useCallback, useEffect, useRef } from 'react';
import authService from '../services/auth';
import { checkAuthState } from '../services/api';

export const AuthContext = createContext();

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT_START: 'LOGOUT_START',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CHECK_AUTH_START: 'CHECK_AUTH_START',
  CHECK_AUTH_SUCCESS: 'CHECK_AUTH_SUCCESS',
  CHECK_AUTH_FAILURE: 'CHECK_AUTH_FAILURE',
  TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE'
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authChecked: false,
  lastActivity: null,
  sessionExpiry: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload ?? true };
      
    case AUTH_ACTIONS.LOGIN_START:
      return { 
        ...state, 
        isLoading: true, 
        error: null 
      };
      
    case AUTH_ACTIONS.CHECK_AUTH_START:
      return { ...state, isLoading: true };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
    case AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.access_token || action.payload.token, // FIXED: Handle both formats
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authChecked: true,
        lastActivity: new Date().toISOString(),
        sessionExpiry: action.payload.sessionExpiry || action.payload.expires_at || null // FIXED: Handle both formats
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        authChecked: true,
        lastActivity: null,
        sessionExpiry: null
      };
      
    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
    case AUTH_ACTIONS.TOKEN_REFRESH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        authChecked: true,
        lastActivity: null,
        sessionExpiry: null
      };
      
    case AUTH_ACTIONS.LOGOUT_START:
      return {
        ...state,
        isLoading: true
      };
      
    case AUTH_ACTIONS.LOGOUT_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        authChecked: true
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return { 
        ...state, 
        user: { ...state.user, ...action.payload },
        lastActivity: new Date().toISOString()
      };
      
    case AUTH_ACTIONS.SET_TOKEN:
      return { 
        ...state, 
        token: action.payload,
        lastActivity: new Date().toISOString()
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
      
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const isCheckingAuthRef = useRef(false);
  const isLoggingInRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionTimeoutRef = useRef(null);

  // Activity tracking for session management
  const updateLastActivity = useCallback(() => {
    if (state.isAuthenticated) {
      dispatch({ 
        type: AUTH_ACTIONS.UPDATE_USER, 
        payload: { last_activity: new Date().toISOString() } 
      });
    }
  }, [state.isAuthenticated]);

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    console.log('[AuthContext] Session timeout - logging out');
    logout();
  }, []);

  // Setup session timeout
  const setupSessionTimeout = useCallback((expiryTime) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    if (expiryTime) {
      const timeUntilExpiry = new Date(expiryTime) - new Date();
      if (timeUntilExpiry > 0) {
        sessionTimeoutRef.current = setTimeout(handleSessionTimeout, timeUntilExpiry);
        console.log('[AuthContext] Session timeout set for', new Date(expiryTime));
      }
    }
  }, [handleSessionTimeout]);

  const setLoading = useCallback((loading) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
    }
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }
  }, []);

  // Enhanced logout with proper cleanup
  const logout = useCallback(async (redirect = true) => {
    if (isLoggingOutRef.current) {
      console.log('[AuthContext] Logout already in progress');
      return;
    }

    try {
      isLoggingOutRef.current = true;
      console.log('[AuthContext] Starting logout process...');
      
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT_START });
      }

      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      // Call backend logout
      await authService.logout();
      
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT_SUCCESS });
      }

      // Redirect to login if requested
      if (redirect && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }

    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Still clear local state even if server logout fails
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT_SUCCESS });
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  // Enhanced login with better error handling
  const login = useCallback(async (credentials) => {
    if (isLoggingInRef.current) {
      console.log('[AuthContext] Login already in progress');
      return { success: false, error: 'Login already in progress' };
    }

    try {
      isLoggingInRef.current = true;
      console.log('[AuthContext] Starting login process...');
      
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      }
      
      clearError();
      
      const result = await authService.login(credentials);
      console.log('[AuthContext] AuthService login result:', result);
      
      if (!mountedRef.current) {
        return;
      }
      
      if (result.success) {
        const authData = {
          user: result.user,
          access_token: result.access_token || result.token, // FIXED: Handle your auth service format
          token: result.access_token || result.token, // FIXED: Add fallback
          sessionExpiry: result.expires_at || result.sessionExpiry || null
        };
        
        console.log('[AuthContext] Login successful');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: authData // FIXED: Use corrected structure
        });
        return result;
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      
      if (mountedRef.current) {
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: errorMessage 
        });
      }
      return { success: false, error: errorMessage };
    } finally {
      isLoggingInRef.current = false;
    }
  }, [clearError, setupSessionTimeout, updateLastActivity]);

  const updateUser = useCallback((userData) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
      updateLastActivity();
    }
  }, [updateLastActivity]);

  // Enhanced auth check with token refresh
  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuthRef.current || state.authChecked) {
      console.log('[AuthContext] Auth check skipped - already checked or in progress');
      return;
    }
    
    try {
      isCheckingAuthRef.current = true;
      console.log('[AuthContext] Checking authentication status...');
      
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_START });
      }
      
      // Check stored auth data
      const isAuth = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      const token = authService.getAccessToken();
      
      console.log('[AuthContext] Stored auth check:', { 
        isAuth, 
        hasUser: !!user, 
        hasToken: !!token,
        tokenExpired: authService.isTokenExpired()
      });
      
      if (!mountedRef.current) {
        return;
      }
      
      if (isAuth && user && token) {
        // Verify token with backend
        try {
          const verified = await authService.verifyToken();
          
          if (verified && mountedRef.current) {
            const authData = {
              user: authService.getCurrentUser(),
              token: authService.getAccessToken()
            };
            
            console.log('[AuthContext] Token verified successfully');
            dispatch({
              type: AUTH_ACTIONS.CHECK_AUTH_SUCCESS,
              payload: authData
            });
            
            updateLastActivity();
            return;
          }
        } catch (verifyError) {
          console.log('[AuthContext] Token verification failed, attempting refresh...');
          
          // Try to refresh token
          const refreshed = await authService.refreshToken();
          if (refreshed && mountedRef.current) {
            const authData = {
              user: authService.getCurrentUser(),
              token: authService.getAccessToken()
            };
            
            console.log('[AuthContext] Token refreshed successfully');
            dispatch({
              type: AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS,
              payload: authData
            });
            
            updateLastActivity();
            return;
          }
        }
      }
      
      // If we get here, authentication failed
      console.log('[AuthContext] Authentication check failed');
      if (mountedRef.current) {
        dispatch({
          type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
          payload: 'Authentication expired'
        });
      }
      
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      if (mountedRef.current) {
        dispatch({
          type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
          payload: error.message || 'Authentication check failed'
        });
      }
    } finally {
      isCheckingAuthRef.current = false;
    }
  }, [state.authChecked, updateLastActivity]);

  const setToken = useCallback((token) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      updateLastActivity();
    }
  }, [updateLastActivity]);

  // Refresh token manually
  const refreshToken = useCallback(async () => {
    try {
      console.log('[AuthContext] Manual token refresh requested...');
      const refreshed = await authService.refreshToken();
      
      if (refreshed && mountedRef.current) {
        const authData = {
          user: authService.getCurrentUser(),
          token: authService.getAccessToken()
        };
        
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS,
          payload: authData
        });
        
        updateLastActivity();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AuthContext] Token refresh failed:', error);
      if (mountedRef.current) {
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH_FAILURE,
          payload: error.message
        });
      }
      return false;
    }
  }, [updateLastActivity]);

  // Check user permissions
  const hasPermission = useCallback((permission) => {
    if (!state.user || !state.isAuthenticated) return false;
    
    const userRole = state.user.role;
    
    // Super admin has all permissions
    if (userRole === 'super_admin') return true;
    
    // Define role-based permissions
    const rolePermissions = {
      admin: [
        'view_members', 'add_members', 'edit_members', 'delete_members',
        'view_groups', 'add_groups', 'edit_groups', 'delete_groups',
        'view_pledges', 'add_pledges', 'edit_pledges', 'delete_pledges',
        'view_reports', 'generate_reports'
      ],
      readonly: [
        'view_members', 'view_groups', 'view_pledges', 'view_reports'
      ]
    };
    
    return rolePermissions[userRole]?.includes(permission) || false;
  }, [state.user, state.isAuthenticated]);

  // Activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      updateLastActivity();
    };

    // Throttle activity updates
    let lastUpdate = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // Update max once per minute
        lastUpdate = now;
        activityHandler();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler, true);
      });
    };
  }, [state.isAuthenticated, updateLastActivity]);

  // Initial auth check
  useEffect(() => {
    console.log('[AuthContext] Initializing...');
    
    if (!state.authChecked) {
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && !state.authChecked) {
          checkAuthStatus();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      mountedRef.current = false;
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [checkAuthStatus, state.authChecked]);

  // Debug auth state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] State Update:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        hasToken: !!state.token,
        authChecked: state.authChecked,
        isLoading: state.isLoading,
        userRole: state.user?.role,
        lastActivity: state.lastActivity
      });
      
      // Log auth storage state
      checkAuthState();
    }
  }, [state]);

  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    authChecked: state.authChecked,
    lastActivity: state.lastActivity,
    sessionExpiry: state.sessionExpiry,
    
    // Actions
    login,
    logout,
    updateUser,
    checkAuthStatus,
    refreshToken,
    setToken,
    clearError,
    hasPermission,
    
    // Utility methods
    isAdmin: () => state.user?.role === 'admin' || state.user?.role === 'super_admin',
    isSuperAdmin: () => state.user?.role === 'super_admin',
    getUserRole: () => state.user?.role || null,
    getFullName: () => state.user ? `${state.user.first_name} ${state.user.last_name}` : null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;