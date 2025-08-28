// ============================================================================
// context/AuthContext.jsx - Fixed version to prevent infinite loops
// ============================================================================
import React, { createContext, useReducer, useCallback, useEffect, useRef } from 'react';
import authService from '../services/auth';

export const AuthContext = createContext();

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CHECK_AUTH_START: 'CHECK_AUTH_START',
  CHECK_AUTH_SUCCESS: 'CHECK_AUTH_SUCCESS',
  CHECK_AUTH_FAILURE: 'CHECK_AUTH_FAILURE'
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  authChecked: false // ADDED: Track if initial auth check is complete
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload ?? true };
      
    case AUTH_ACTIONS.CHECK_AUTH_START:
      return { ...state, isLoading: true };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authChecked: true // ADDED: Mark auth as checked
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        authChecked: true // ADDED: Mark auth as checked even on failure
      };
      
    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Don't show error for failed auth checks
        authChecked: true // ADDED: Mark auth as checked
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
        authChecked: true // ADDED: Keep auth checked state
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return { 
        ...state, 
        user: { ...state.user, ...action.payload } 
      };
      
    case AUTH_ACTIONS.SET_TOKEN:
      return { ...state, token: action.payload };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
      
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // ADDED: Use refs to prevent duplicate operations
  const isCheckingAuthRef = useRef(false);
  const isLoggingInRef = useRef(false);
  const mountedRef = useRef(true);

  // FIXED: Stable setLoading function
  const setLoading = useCallback((loading) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
    }
  }, []);

  // FIXED: Stable clearError function
  const clearError = useCallback(() => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }
  }, []);

  // FIXED: Stable logout function
  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] Starting logout...');
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('[AuthContext] Logout API error:', error);
    } finally {
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  }, [setLoading]);

  // FIXED: Stable login function with duplicate prevention
  const login = useCallback(async (credentials) => {
    // Prevent duplicate login attempts
    if (isLoggingInRef.current) {
      console.log('[AuthContext] Login already in progress, skipping...');
      return;
    }

    try {
      isLoggingInRef.current = true;
      console.log('[AuthContext] Starting login...');
      setLoading(true);
      clearError();
      
      // Call authService.login which returns { success, user, access_token, refresh_token }
      const result = await authService.login(credentials);
      console.log('[AuthContext] AuthService result:', result);
      
      if (!mountedRef.current) {
        return;
      }
      
      if (result.success) {
        // Map access_token to token for consistency
        const authData = {
          user: result.user,
          token: result.access_token || result.token
        };
        
        console.log('[AuthContext] Login successful, dispatching LOGIN_SUCCESS');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: authData
        });
        
        return { success: true, ...authData };
      } else {
        console.log('[AuthContext] Login failed:', result.error);
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: result.error 
        });
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error.message || 'Login failed';
      
      if (mountedRef.current) {
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: errorMessage 
        });
      }
      throw error;
    } finally {
      isLoggingInRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [setLoading, clearError]);

  // FIXED: Stable updateUser function
  const updateUser = useCallback((userData) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    }
  }, []);

  // FIXED: Stable checkAuthStatus with duplicate prevention
  const checkAuthStatus = useCallback(async () => {
    // Prevent duplicate auth checks
    if (isCheckingAuthRef.current || state.authChecked) {
      console.log('[AuthContext] Auth check already complete or in progress, skipping...');
      return;
    }
    
    try {
      isCheckingAuthRef.current = true;
      console.log('[AuthContext] Checking auth status...');
      
      if (mountedRef.current) {
        dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_START });
      }
      
      // Check if authService has stored auth data
      const isAuth = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      const token = authService.getAccessToken();
      
      console.log('[AuthContext] Stored auth data:', { isAuth, hasUser: !!user, hasToken: !!token });
      
      if (!mountedRef.current) {
        return;
      }
      
      if (isAuth && user && token) {
        console.log('[AuthContext] Found stored auth, verifying...');
        
        dispatch({
          type: AUTH_ACTIONS.CHECK_AUTH_SUCCESS,
          payload: { user, token }
        });
        console.log('[AuthContext] Auth check successful');
      } else {
        // No stored auth data
        console.log('[AuthContext] No valid stored auth data');
        dispatch({
          type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
          payload: 'Not authenticated'
        });
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      if (mountedRef.current) {
        dispatch({
          type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
          payload: error.message || 'Authentication check failed'
        });
      }
    } finally {
      isCheckingAuthRef.current = false;
    }
  }, []); // FIXED: Empty dependency array since we check authChecked state

  // FIXED: Stable setToken function
  const setToken = useCallback((token) => {
    if (mountedRef.current) {
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
    }
  }, []);

  // FIXED: Single effect for initialization only
  useEffect(() => {
    console.log('[AuthContext] Initializing auth context...');
    
    // Only check auth status if not already checked
    if (!state.authChecked) {
      // Small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && !state.authChecked) {
          checkAuthStatus();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []); // Only run on mount

  // FIXED: Memoized context value to prevent unnecessary re-renders
  const contextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    authChecked: state.authChecked, // ADDED: Expose auth check status
    login,
    logout,
    updateUser,
    checkAuthStatus,
    setToken,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;