import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import authService from '../services/auth';

// Create the AuthContext
export const AuthContext = createContext();

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
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
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set loading state
  const setLoading = useCallback((loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      clearError();

      const response = await authService.login(credentials);
      
      if (response.token && response.user) {
        // Store token in localStorage
        localStorage.setItem('auth_token', response.token);
        
        // Update state
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });

        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call logout API if token exists
      if (state.token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API fails
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      setLoading(false);
    }
  }, [state.token, setLoading]);

  // Update user function
  const updateUser = useCallback((userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Verify token with backend
      const response = await authService.verifyToken(token);
      
      if (response.user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: token
          }
        });
      } else {
        // Token is invalid
        localStorage.removeItem('auth_token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Remove invalid token
      localStorage.removeItem('auth_token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Update token (for refresh)
  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    
    dispatch({
      type: AUTH_ACTIONS.SET_TOKEN,
      payload: token
    });
  }, []);

  // Set up axios interceptor for token
  useEffect(() => {
    const token = state.token;
    
    if (token) {
      // Set default authorization header
      authService.setAuthToken(token);
    } else {
      // Remove authorization header
      authService.clearAuthToken();
    }
  }, [state.token]);

  // Auto-logout on token expiry
  useEffect(() => {
    if (state.token) {
      try {
        const tokenData = JSON.parse(atob(state.token.split('.')[1]));
        const expiryTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        const timeToExpiry = expiryTime - currentTime;

        if (timeToExpiry <= 0) {
          // Token already expired
          logout();
        } else {
          // Set timeout for token expiry
          const timeoutId = setTimeout(() => {
            logout();
          }, timeToExpiry);

          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Token parsing error:', error);
        logout();
      }
    }
  }, [state.token, logout]);

  // Context value
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