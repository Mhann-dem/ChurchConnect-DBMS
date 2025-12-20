/**
 * Axios API Client Instance
 * Configured with authentication, error handling, and request interceptors
 * Production-ready with token refresh and error recovery
 */

import axios from 'axios';
import { API_CONFIG } from './api';

/**
 * Create an Axios instance with default configuration
 */
const apiClient = axios.create(API_CONFIG);

/**
 * Token management utilities
 */
const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

/**
 * Request Interceptor
 * Adds authentication token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh on 401 errors
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Add request to queue while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Request new access token
        const response = await axios.post(
          `${API_CONFIG.baseURL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
          {
            timeout: API_CONFIG.timeout,
            withCredentials: API_CONFIG.withCredentials,
          }
        );

        const { access } = response.data;
        tokenManager.setTokens(access, refreshToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Process queued requests
        processQueue(null, access);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('Resource not found:', error.config.url);
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { tokenManager };
