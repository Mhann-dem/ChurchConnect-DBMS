// services/api.js
import axios from 'axios';

// Use HTTPS Django development server URL now that your backend supports it
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:8000/api';

console.log('API Base URL configured as:', API_BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for debugging
  headers: {
    'Content-Type': 'application/json',
  },
  // Important: Allow self-signed certificates in development
  httpsAgent: process.env.NODE_ENV === 'development' ? {
    rejectUnauthorized: false
  } : undefined,
});

// Request interceptor to add auth token and debug logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    });
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Added auth token to request');
    } else {
      console.log('[API Request] No auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and debug logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error] Response interceptor error:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response object',
      request: error.request ? {
        readyState: error.request.readyState,
        status: error.request.status,
        responseURL: error.request.responseURL
      } : 'No request object',
      config: error.config ? {
        method: error.config.method,
        url: error.config.url,
        baseURL: error.config.baseURL
      } : 'No config object'
    });
    
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized - clearing local storage and redirecting');
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('[API] Forbidden - insufficient permissions');
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('[API] Server error occurred');
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('[API] Network error - cannot connect to server');
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods with additional debugging
const apiMethods = {
  get: async (url, config = {}) => {
    try {
      console.log(`[API GET] Requesting: ${url}`);
      const response = await api.get(url, config);
      return response;
    } catch (error) {
      console.error(`[API GET Error] Failed to GET ${url}:`, error);
      throw error;
    }
  },
  
  post: async (url, data, config = {}) => {
    try {
      console.log(`[API POST] Posting to: ${url}`, data);
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API POST Error] Failed to POST ${url}:`, error);
      throw error;
    }
  },
  
  put: async (url, data, config = {}) => {
    try {
      console.log(`[API PUT] Putting to: ${url}`, data);
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PUT Error] Failed to PUT ${url}:`, error);
      throw error;
    }
  },
  
  patch: async (url, data, config = {}) => {
    try {
      console.log(`[API PATCH] Patching: ${url}`, data);
      const response = await api.patch(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PATCH Error] Failed to PATCH ${url}:`, error);
      throw error;
    }
  },
  
  delete: async (url, config = {}) => {
    try {
      console.log(`[API DELETE] Deleting: ${url}`);
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      console.error(`[API DELETE Error] Failed to DELETE ${url}:`, error);
      throw error;
    }
  },
};

// Rate limiting for public endpoints (unchanged)
const publicApiLimiter = {
  lastRequest: 0,
  minInterval: 1000, // 1 second between requests
  
  async makeRequest(requestFn) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      console.log(`[Rate Limiter] Waiting ${waitTime}ms before next request`);
      await new Promise(resolve => 
        setTimeout(resolve, waitTime)
      );
    }
    
    this.lastRequest = Date.now();
    return requestFn();
  }
};

// Test function to check API connectivity
const testConnection = async () => {
  try {
    console.log('[API Test] Testing connection to:', API_BASE_URL);
    const response = await api.get('/health/');
    console.log('[API Test] Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[API Test] Connection failed:', error);
    return { success: false, error: error.message };
  }
};

export default apiMethods;
export { api, publicApiLimiter, testConnection };