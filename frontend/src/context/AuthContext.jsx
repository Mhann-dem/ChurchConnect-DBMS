// ============================================================================
// context/AuthContext.jsx - Fixed version
// ============================================================================
import React, { createContext, useReducer, useCallback, useEffect } from 'react';
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
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
    case AUTH_ACTIONS.CHECK_AUTH_START:
      return { ...state, isLoading: action.payload ?? true };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.CHECK_AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
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

  const setLoading = useCallback((loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [setLoading]);

  const login = useCallback(async (credentials) => {
    try {
      console.log('[AuthContext] Starting login...');
      setLoading(true);
      clearError();
      
      // Call authService.login which returns { success, user, access_token, refresh_token }
      const result = await authService.login(credentials);
      console.log('[AuthContext] AuthService result:', result);
      
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
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError]);

  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    console.log('[AuthContext] Checking auth status...');
    dispatch({ type: AUTH_ACTIONS.CHECK_AUTH_START });
    
    try {
      // Check if authService has stored auth data
      const isAuth = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      const token = authService.getAccessToken();
      
      console.log('[AuthContext] Stored auth data:', { isAuth, hasUser: !!user, hasToken: !!token });
      
      if (isAuth && user && token) {
        console.log('[AuthContext] Found stored auth, verifying...');
        
        // For now, trust the stored data. You can add token verification later
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
      dispatch({
        type: AUTH_ACTIONS.CHECK_AUTH_FAILURE,
        payload: error.message || 'Authentication check failed'
      });
    }
  }, []);

  const setToken = useCallback((token) => {
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
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
