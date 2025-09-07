// services/api.js - Updated version with proper endpoint mapping and error handling
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

console.log('[API] Base URL configured as:', `${API_BASE_URL}/api/${API_VERSION}/`);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}/`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoint mappings based on your Django URLs
const ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    verify: '/auth/verify/',
    test: '/auth/test/',
    refresh: '/auth/token/refresh/',
    profile: '/auth/profile/',
    changePassword: '/auth/change-password/'
  },
  
  // Member endpoints
  members: {
    list: '/members/',
    create: '/members/',
    detail: (id) => `/members/${id}/`,
    update: (id) => `/members/${id}/`,
    delete: (id) => `/members/${id}/`,
    stats: '/members/statistics/',
    export: '/members/export/',
    tags: '/members/tags/',
    importLogs: '/members/import-logs/',
    publicRegister: '/members/register/'
  },
  
  // Family endpoints
  families: {
    list: '/families/',
    create: '/families/',
    detail: (id) => `/families/${id}/`,
    update: (id) => `/families/${id}/`,
    delete: (id) => `/families/${id}/`,
    addMember: (id) => `/families/${id}/add-member/`,
    removeMember: (id, memberId) => `/families/${id}/remove-member/${memberId}/`,
    members: (id) => `/families/${id}/members/`,
    statistics: '/families/statistics/',
    relationships: '/families/relationships/'
  },
  
  // Group endpoints
  groups: {
    list: '/groups/',
    create: '/groups/',
    detail: (id) => `/groups/${id}/`,
    update: (id) => `/groups/${id}/`,
    delete: (id) => `/groups/${id}/`,
    join: (id) => `/groups/${id}/join/`,
    removeMember: (id, memberId) => `/groups/${id}/remove-member/${memberId}/`,
    members: (id) => `/groups/${id}/members/`,
    statistics: '/groups/statistics/',
    categories: '/groups/categories/',
    memberships: '/groups/memberships/'
  },
  
  // Pledge endpoints
  pledges: {
    list: '/pledges/',
    create: '/pledges/',
    detail: (id) => `/pledges/${id}/`,
    update: (id) => `/pledges/${id}/`,
    delete: (id) => `/pledges/${id}/`,
    stats: '/pledges/stats/',
    statistics: '/pledges/statistics/',
    export: '/pledges/export/',
    overdue: '/pledges/overdue/',
    upcomingPayments: '/pledges/upcoming_payments/',
    bulkAction: '/pledges/bulk_action/',
    payments: '/pledges/payments/',
    reminders: '/pledges/reminders/'
  },
  
  // Report endpoints
  reports: {
    list: '/reports/',
    create: '/reports/',
    detail: (id) => `/reports/${id}/`,
    generate: (id) => `/reports/${id}/generate/`,
    stats: '/reports/stats/',
    runs: '/reports/runs/',
    templates: '/reports/templates/',
    download: (runId) => `/reports/download/${runId}/`,
    membersCsv: '/reports/members/csv/',
    pledgesCsv: '/reports/pledges/csv/'
  },
  
  // Core endpoints
  core: {
    health: '/core/health/',
    status: '/core/status/',
    version: '/core/version/'
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: Object.keys(config.headers || {}),
      hasData: !!config.data,
      params: config.params
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

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata?.startTime;
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response Data]:', {
        hasResults: !!response.data?.results,
        isArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataLength: Array.isArray(response.data) ? response.data.length : 
                   response.data?.results ? response.data.results.length : 'N/A'
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('[API Response Error]:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401) {
      console.log('[API] Unauthorized - attempting token refresh');
      
      if (originalRequest._retry) {
        console.log('[API] Token refresh already attempted, clearing auth data');
        clearAuthData();
        redirectToLogin();
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
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
            
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
        }
      }
      
      clearAuthData();
      redirectToLogin();
    }
    
    // Handle other HTTP errors
    if (error.response?.status === 403) {
      console.warn('[API] Access forbidden - insufficient permissions');
      throw new Error('You do not have permission to perform this action');
    }
    
    if (error.response?.status === 404) {
      console.warn('[API] Endpoint not found:', originalRequest.url);
      throw new Error('The requested resource was not found');
    }
    
    if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response?.status);
      throw new Error('Server error occurred. Please try again later');
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('[API] Network error - no response received');
      throw new Error('Network error. Please check your connection');
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

// Enhanced API methods with endpoint helpers
const apiMethods = {
  // Generic HTTP methods
  get: async (url, config = {}) => {
    try {
      console.log(`[API GET] Requesting: ${url}`, config.params || {});
      const response = await api.get(url, config);
      return response;
    } catch (error) {
      console.error(`[API GET Error] ${url}:`, error.message);
      throw error;
    }
  },
  
  post: async (url, data, config = {}) => {
    try {
      console.log(`[API POST] Requesting: ${url}`, { hasData: !!data });
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API POST Error] ${url}:`, error.message);
      throw error;
    }
  },
  
  put: async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PUT Error] ${url}:`, error.message);
      throw error;
    }
  },
  
  patch: async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response;
    } catch (error) {
      console.error(`[API PATCH Error] ${url}:`, error.message);
      throw error;
    }
  },
  
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      console.error(`[API DELETE Error] ${url}:`, error.message);
      throw error;
    }
  },

  // Specific API methods for dashboard
  dashboard: {
    getStats: () => apiMethods.get(ENDPOINTS.reports.stats),
    getMemberStats: (range = '30d') => apiMethods.get(ENDPOINTS.members.stats, { params: { range } }),
    getPledgeStats: (range = '30d') => apiMethods.get(ENDPOINTS.pledges.stats, { params: { range } }),
    getGroupStats: () => apiMethods.get(ENDPOINTS.groups.statistics),
    getRecentMembers: (limit = 10) => apiMethods.get(ENDPOINTS.members.list, { 
      params: { ordering: '-registration_date', limit } 
    }),
    getRecentPledges: (limit = 10) => apiMethods.get(ENDPOINTS.pledges.list, { 
      params: { ordering: '-created_at', limit } 
    })
  },

  // Member API methods
  members: {
    list: (params = {}) => apiMethods.get(ENDPOINTS.members.list, { params }),
    create: (data) => apiMethods.post(ENDPOINTS.members.create, data),
    get: (id) => apiMethods.get(ENDPOINTS.members.detail(id)),
    update: (id, data) => apiMethods.put(ENDPOINTS.members.update(id), data),
    patch: (id, data) => apiMethods.patch(ENDPOINTS.members.update(id), data),
    delete: (id) => apiMethods.delete(ENDPOINTS.members.delete(id)),
    stats: () => apiMethods.get(ENDPOINTS.members.stats),
    export: () => apiMethods.get(ENDPOINTS.members.export),
    publicRegister: (data) => apiMethods.post(ENDPOINTS.members.publicRegister, data)
  },

  // Pledge API methods
  pledges: {
    list: (params = {}) => apiMethods.get(ENDPOINTS.pledges.list, { params }),
    create: (data) => apiMethods.post(ENDPOINTS.pledges.create, data),
    get: (id) => apiMethods.get(ENDPOINTS.pledges.detail(id)),
    update: (id, data) => apiMethods.put(ENDPOINTS.pledges.update(id), data),
    delete: (id) => apiMethods.delete(ENDPOINTS.pledges.delete(id)),
    stats: () => apiMethods.get(ENDPOINTS.pledges.stats),
    export: () => apiMethods.get(ENDPOINTS.pledges.export),
    overdue: () => apiMethods.get(ENDPOINTS.pledges.overdue),
    upcomingPayments: () => apiMethods.get(ENDPOINTS.pledges.upcomingPayments)
  },

  // Group API methods
  groups: {
    list: (params = {}) => apiMethods.get(ENDPOINTS.groups.list, { params }),
    create: (data) => apiMethods.post(ENDPOINTS.groups.create, data),
    get: (id) => apiMethods.get(ENDPOINTS.groups.detail(id)),
    update: (id, data) => apiMethods.put(ENDPOINTS.groups.update(id), data),
    delete: (id) => apiMethods.delete(ENDPOINTS.groups.delete(id)),
    stats: () => apiMethods.get(ENDPOINTS.groups.statistics),
    categories: () => apiMethods.get(ENDPOINTS.groups.categories),
    memberships: () => apiMethods.get(ENDPOINTS.groups.memberships)
  },

  // Report API methods
  reports: {
    list: (params = {}) => apiMethods.get(ENDPOINTS.reports.list, { params }),
    create: (data) => apiMethods.post(ENDPOINTS.reports.create, data),
    get: (id) => apiMethods.get(ENDPOINTS.reports.detail(id)),
    generate: (id) => apiMethods.post(ENDPOINTS.reports.generate(id)),
    stats: () => apiMethods.get(ENDPOINTS.reports.stats),
    membersCsv: () => apiMethods.get(ENDPOINTS.reports.membersCsv),
    pledgesCsv: () => apiMethods.get(ENDPOINTS.reports.pledgesCsv)
  }
};

// Test connection
const testConnection = async () => {
  try {
    console.log('[API Test] Testing connection...');
    const response = await api.get('/core/health/', {
      timeout: 10000,
      _retryCount: 0
    });
    console.log('[API Test] Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[API Test] Connection failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status
    };
  }
};

// Health check
const healthCheck = async () => {
  try {
    const response = await api.get('/core/health/', { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.warn('[API Health Check] Failed:', error.message);
    return null;
  }
};

// Debug function to check auth state
const checkAuthState = () => {
  const authData = {
    accessToken: localStorage.getItem('access_token'),
    authToken: localStorage.getItem('authToken'),
    refreshToken: localStorage.getItem('refresh_token'),
    user: localStorage.getItem('user')
  };
  
  console.log('[API Auth State]:', {
    hasAccessToken: !!authData.accessToken,
    hasAuthToken: !!authData.authToken,
    hasRefreshToken: !!authData.refreshToken,
    hasUser: !!authData.user
  });
  
  return authData;
};

export default apiMethods;
export { 
  api, 
  testConnection, 
  healthCheck, 
  checkAuthState, 
  ENDPOINTS,
  clearAuthData,
  redirectToLogin
}