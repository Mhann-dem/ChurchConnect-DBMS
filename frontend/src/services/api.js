// services/api.js
import axios from 'axios';

// Updated to use the correct versioned API endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

console.log('API Base URL configured as:', `${API_BASE_URL}/api/${API_VERSION}/`);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}/`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and debug logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      data: config.data ? (config.data.password ? { ...config.data, password: '***' } : config.data) : undefined
    });
    
    // Try to get token from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Added auth token to request');
    } else {
      console.log('[API Request] No auth token found');
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and debug logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error]:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized - clearing auth data');
      localStorage.removeItem('authToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
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

// Test function to check API connectivity
const testConnection = async () => {
  try {
    console.log('[API Test] Testing connection...');
    // Test with a simple endpoint that should exist
    const response = await api.get('/auth/test/'); // Adjust this endpoint as needed
    console.log('[API Test] Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[API Test] Connection failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export default apiMethods;
export { api, testConnection };