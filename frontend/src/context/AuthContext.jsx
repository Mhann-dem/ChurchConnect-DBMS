import React, { createContext, useReducer, useCallback, useEffect } from 'react';

// Note: Make sure this import exists and is properly configured
// import authService from '../services/auth';

// Mock authService for now - replace with your actual service
const authService = {
  login: async (credentials) => {
    // Your login implementation
    throw new Error('authService.login not implemented');
  },
  logout: async () => {
    // Your logout implementation
    console.log('Logging out...');
  },
  verifyToken: async (token) => {
    // Your token verification implementation
    throw new Error('authService.verifyToken not implemented');
  },
  setAuthToken: (token) => {
    // Set token in service
    console.log('Setting auth token:', token);
  },
  clearAuthToken: () => {
    // Clear token from service
    console.log('Clearing auth token');
  }
};

export const AuthContext = createContext();

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_TOKEN: 'SET_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

const initialState = {
  user: null,
  token: null, // Don't initialize from localStorage here
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
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
      return { ...state, user: { ...state.user, ...action.payload } };
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
      if (state.token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      setLoading(false);
    }
  }, [state.token, setLoading]);

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      clearError();
      const response = await authService.login(credentials);
      
      if (response.token && response.user) {
        localStorage.setItem('auth_token', response.token);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token: response.token }
        });
        return response;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError]);

  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authService.verifyToken(token);
      
      if (response?.user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token }
        });
      } else {
        localStorage.removeItem('auth_token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
    } else {
      setLoading(false);
    }
  }, [setLoading]);

  // Set auth token in service when token changes
  useEffect(() => {
    if (state.token) {
      authService.setAuthToken(state.token);
    } else {
      authService.clearAuthToken();
    }
  }, [state.token]);

  // Handle token expiry - FIXED version
  useEffect(() => {
    if (!state.token) return;
    
    let timeoutId;
    
    const handleTokenExpiry = async () => {
      try {
        const tokenParts = state.token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const tokenData = JSON.parse(atob(tokenParts[1]));
        const expiryTime = tokenData.exp * 1000;
        const timeToExpiry = expiryTime - Date.now();

        if (timeToExpiry <= 0) {
          // Token is already expired
          await logout();
        } else {
          // Set timeout for future expiry
          timeoutId = setTimeout(async () => {
            await logout();
          }, timeToExpiry);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        await logout();
      }
    };

    handleTokenExpiry();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.token]); // Removed logout from dependencies to prevent infinite loop

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