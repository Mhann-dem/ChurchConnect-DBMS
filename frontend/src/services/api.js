// services/api.js - Fixed version with proper auth handling
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

console.log('API Base URL configured as:', `${API_BASE_URL}/api/${API_VERSION}/`);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}/`,
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor to add auth token and handle retries
api.interceptors.request.use(
  (config) => {
    // Add request ID for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: Object.keys(config.headers || {}),
      hasData: !!config.data
    });
    
    // Get token from multiple possible locations
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Added auth token to request');
    } else {
      console.warn('[API Request] No auth token found - request may fail');
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling and token refresh
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata?.startTime;
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('[API Response Error]:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized - attempting token refresh');
      
      // Prevent infinite loops
      if (originalRequest._retry) {
        console.log('[API] Token refresh already attempted, clearing auth data');
        clearAuthData();
        redirectToLogin();
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !originalRequest.url.includes('/auth/token/refresh/')) {
        try {
          console.log('[API] Attempting token refresh...');
          const refreshResponse = await api.post('/auth/token/refresh/', {
            refresh: refreshToken
          });
          
          if (refreshResponse.data?.access) {
            console.log('[API] Token refreshed successfully');
            localStorage.setItem('access_token', refreshResponse.data.access);
            localStorage.setItem('authToken', refreshResponse.data.access);
            
            // Update the failed request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            
            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
        }
      }
      
      // If refresh failed or no refresh token, clear auth data
      clearAuthData();
      redirectToLogin();
    }
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 5;
      console.warn(`[API] Rate limited, retrying after ${retryAfter}s`);
      
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        await delay(parseInt(retryAfter) * 1000);
        return api(originalRequest);
      }
    }
    
    // Handle network errors with retry
    if (!error.response && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        console.log(`[API] Network error, retrying (${originalRequest._retryCount}/${MAX_RETRIES})`);
        await delay(RETRY_DELAY * originalRequest._retryCount);
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
const clearAuthData = () => {
  const keysToRemove = ['access_token', 'authToken', 'refresh_token', 'user'];
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  console.log('[API] Cleared all auth data');
};

const redirectToLogin = () => {
  if (!window.location.pathname.includes('/login')) {
    console.log('[API] Redirecting to login page');
    window.location.href = '/admin/login';
  }
};

// Enhanced API methods with better error handling
const apiMethods = {
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response;
    } catch (error) {
      console.error(`[API GET Error] ${url}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  post: async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API POST Error] ${url}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  put: async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PUT Error] ${url}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  patch: async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PATCH Error] ${url}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      console.error(`[API DELETE Error] ${url}:`, error.response?.data || error.message);
      throw error;
    }
  },
};

// Test function with better connectivity check
const testConnection = async () => {
  try {
    console.log('[API Test] Testing connection...');
    const response = await api.get('/auth/test/', {
      timeout: 10000,
      _retryCount: 0 // Disable retries for test
    });
    console.log('[API Test] Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[API Test] Connection failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const response = await api.get('/health/', { 
      timeout: 5000,
      _retryCount: 0
    });
    return response.data;
  } catch (error) {
    console.warn('[API Health Check] Failed:', error.message);
    return null;
  }
};

export default apiMethods;
export { api, testConnection, healthCheck };