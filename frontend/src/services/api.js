// services/api.js - COMPLETE CORRECTED VERSION
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

console.log('[API] Base URL configured as:', `${API_BASE_URL}/api/${API_VERSION}/`);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}/`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// CORRECTED ENDPOINTS - Only URL strings, no methods
const ENDPOINTS = {
  auth: {
    login: 'auth/login/',
    logout: 'auth/logout/',
    verify: 'auth/verify/',
    test: 'auth/test/',
    refresh: 'auth/token/refresh/',
    profile: 'auth/profile/',
    changePassword: 'auth/change-password/'
  },
  
  members: {
    list: 'members/',
    create: 'members/',
    detail: (id) => `members/${id}/`,
    update: (id) => `members/${id}/`,
    delete: (id) => `members/${id}/`,
    statistics: 'members/statistics/',
    recent: 'members/recent/',
    search: 'members/search/',
    birthdays: 'members/birthdays/',
    export: 'members/export/',
    tags: 'members/tags/',
    importLogs: 'members/import-logs/',
    publicRegister: 'members/register/',
    bulkActions: 'members/bulk_actions/',
    bulkImport: 'members/bulk_import/',
    importTemplate: 'members/import_template/'
  },
  
  families: {
    list: 'families/',
    create: 'families/',
    detail: (id) => `families/${id}/`,
    update: (id) => `families/${id}/`,
    delete: (id) => `families/${id}/`,
    addMember: (id) => `families/${id}/add-member/`,
    removeMember: (id, memberId) => `families/${id}/remove-member/${memberId}/`,
    members: (id) => `families/${id}/members/`,
    statistics: 'families/statistics/',
    recent: 'families/recent-families/',
    setPrimaryContact: (id) => `families/${id}/set-primary-contact/`,
    bulkOperations: 'families/bulk-operations/',
    needingAttention: 'families/families-needing-attention/'
  },
  
  groups: {
    list: 'groups/',
    create: 'groups/',
    detail: (id) => `groups/${id}/`,
    update: (id) => `groups/${id}/`,
    delete: (id) => `groups/${id}/`,
    join: (id) => `groups/${id}/join/`,
    removeMember: (id, memberId) => `groups/${id}/remove-member/${memberId}/`,
    approveMember: (id, memberId) => `groups/${id}/approve-member/${memberId}/`,
    declineMember: (id, memberId) => `groups/${id}/decline-member/${memberId}/`,
    updateMembership: (id, memberId) => `groups/${id}/update-membership/${memberId}/`,
    members: (id) => `groups/${id}/members/`,
    export: (id) => `groups/${id}/export/`,
    statistics: 'groups/statistics/',
    public: 'groups/public/',
    categories: 'groups/categories/',
    memberships: 'groups/memberships/'
  },
  
  pledges: {
    list: 'pledges/',
    create: 'pledges/',
    detail: (id) => `pledges/${id}/`,
    update: (id) => `pledges/${id}/`,
    delete: (id) => `pledges/${id}/`,
    statistics: 'pledges/stats/',  // Primary endpoint Django expects
    stats: 'pledges/statistics/',  // Alternative endpoint
    export: 'pledges/export/',
    recent: 'pledges/recent/',
    trends: 'pledges/trends/',
    overdue: 'pledges/overdue/',
    upcomingPayments: 'pledges/upcoming-payments/',
    bulkAction: 'pledges/bulk-action/',
    bulkUpdate: 'pledges/bulk-update/',
    bulkDelete: 'pledges/bulk-delete/',
    summaryReport: 'pledges/summary-report/',
    addPayment: (pledgeId) => `pledges/${pledgeId}/add-payment/`,
    paymentHistory: (pledgeId) => `pledges/${pledgeId}/payment-history/`
  },
  
  events: {
    list: 'events/',
    create: 'events/',
    detail: (id) => `events/${id}/`,
    update: (id) => `events/${id}/`,
    delete: (id) => `events/${id}/`,
    statistics: 'events/statistics/',
    recent: 'events/recent/'
  },
  
  core: {
    health: 'core/health/',
    status: 'core/status/',
    version: 'core/version/'
  },

  dashboard: {
    overview: 'core/dashboard/overview/',
    stats: 'core/dashboard/stats/',
    health: 'core/dashboard/health/',
    alerts: 'core/dashboard/alerts/',
    config: (userId) => `core/dashboard/config/${userId}/`
  }
};

// Request interceptor with enhanced auth handling
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      hasData: !!config.data,
      params: config.params
    });
    
    // Get token from storage
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Auth token added');
    } else if (!config.url.includes('auth/login') && !config.url.includes('core/health')) {
      console.warn('[API Request] No auth token found for protected endpoint:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling and retry logic
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata?.startTime;
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response]:', {
        status: response.status,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        pagination: response.data?.count ? {
          count: response.data.count,
          next: !!response.data.next,
          previous: !!response.data.previous,
          results: response.data.results?.length
        } : null
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    
    console.error('[API Response Error]:', {
      status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      message: error.message,
      responseData: error.response?.data
    });
    
    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('[API] Unauthorized response - attempting token refresh...');
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !originalRequest.url.includes('auth/token/refresh')) {
        try {
          console.log('[API] Attempting token refresh...');
          const refreshResponse = await api.post(ENDPOINTS.auth.refresh, {
            refresh: refreshToken
          });
          
          if (refreshResponse.data?.access) {
            const newToken = refreshResponse.data.access;
            localStorage.setItem('access_token', newToken);
            localStorage.setItem('authToken', newToken);
            
            // Update refresh token if provided
            if (refreshResponse.data.refresh) {
              localStorage.setItem('refresh_token', refreshResponse.data.refresh);
            }
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log('[API] Token refreshed, retrying original request...');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          clearAuthData();
          redirectToLogin();
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      } else {
        clearAuthData();
        redirectToLogin();
        return Promise.reject(new Error('Authentication required'));
      }
    }
    
    // Handle other HTTP errors
    let errorMessage = 'An error occurred';
    
    switch (status) {
      case 400:
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      'Bad request. Please check your input.';
        break;
      case 403:
        errorMessage = 'Access forbidden. You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Internal server error. Please try again later.';
        break;
      case 503:
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        if (!error.response) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
    }
    
    // Create enhanced error object
    const enhancedError = new Error(errorMessage);
    enhancedError.status = status;
    enhancedError.response = error.response;
    enhancedError.originalError = error;
    
    return Promise.reject(enhancedError);
  }
);

// Helper functions
const clearAuthData = () => {
  const keysToRemove = ['access_token', 'authToken', 'refresh_token', 'user'];
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  console.log('[API] Auth data cleared');
};

// Helper function to safely clean objects for JSON serialization
const cleanObjectForJSON = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForJSON);
  }
  
  // Handle plain objects
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip React-specific properties and DOM elements
    if (key.startsWith('_') || key.startsWith('__') || 
        key.includes('react') || key.includes('React') ||
        value instanceof HTMLElement) {
      continue;
    }
    
    // Recursively clean nested objects
    if (value !== null && typeof value === 'object') {
      try {
        // Test if this object can be serialized
        JSON.stringify(value);
        cleaned[key] = cleanObjectForJSON(value);
      } catch (e) {
        // If it can't be serialized, skip it or convert to string
        cleaned[key] = '[Unserializable Object]';
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

const redirectToLogin = () => {
  if (!window.location.pathname.includes('/login')) {
    console.log('[API] Redirecting to login page');
    window.location.href = '/admin/login';
  }
};

// Enhanced API methods with proper error handling and data formatting
const apiMethods = {
  // Generic HTTP methods with enhanced error handling
  get: async (endpoint, config = {}) => {
    try {
      console.log(`[API GET] ${endpoint}`, config.params || {});
      const response = await api.get(endpoint, config);
      return response;
    } catch (error) {
      console.error(`[API GET Error] ${endpoint}:`, error.message);
      throw error;
    }
  },
  
  post: async (endpoint, data = null, config = {}) => {
    try {
      // SAFE DATA CLEANING: Remove any circular references or React-specific properties
      const cleanData = data ? cleanObjectForJSON(data) : null;
      
      console.log(`[API POST] ${endpoint}`, { 
        hasData: !!cleanData, 
        dataSize: cleanData ? JSON.stringify(cleanData).length : 0 
      });
      
      const response = await api.post(endpoint, cleanData, config);
      return response;
    } catch (error) {
      console.error(`[API POST Error] ${endpoint}:`, error.message);
      throw error;
    }
  },
  
  put: async (endpoint, data = null, config = {}) => {
    try {
      console.log(`[API PUT] ${endpoint}`, { hasData: !!data });
      const response = await api.put(endpoint, data, config);
      return response;
    } catch (error) {
      console.error(`[API PUT Error] ${endpoint}:`, error.message);
      throw error;
    }
  },
  
  patch: async (endpoint, data = null, config = {}) => {
    try {
      console.log(`[API PATCH] ${endpoint}`, { hasData: !!data });
      const response = await api.patch(endpoint, data, config);
      return response;
    } catch (error) {
      console.error(`[API PATCH Error] ${endpoint}:`, error.message);
      throw error;
    }
  },
  
  delete: async (endpoint, config = {}) => {
    try {
      console.log(`[API DELETE] ${endpoint}`);
      const response = await api.delete(endpoint, config);
      return response;
    } catch (error) {
      console.error(`[API DELETE Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  dashboard: {
    getOverview: async () => {
      try {
        const response = await apiMethods.get(ENDPOINTS.dashboard.overview);
        return response.data;
      } catch (error) {
        console.warn('[Dashboard API] Overview failed, using stats endpoint');
        return await apiMethods.dashboard.getStats();
      }
    },

    getStats: async () => {
      try {
        console.log('[Dashboard API] Fetching dashboard stats...');
        const response = await apiMethods.get(ENDPOINTS.dashboard.stats);
        console.log('[Dashboard API] Stats response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[Dashboard API] Stats failed:', error);
        // Fallback to individual stats aggregation
        return await apiMethods.dashboard.getAggregatedStats();
      }
    },

    getMemberStats: async (range = '30d') => {
      try {
        // Use the working endpoint from your Django logs
        const response = await apiMethods.get('members/statistics/', { 
          params: { range } 
        });
        console.log('[API] Member stats response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Member stats failed:', error);
        return { 
          summary: { 
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0 
          } 
        };
      }
    },

    getPledgeStats: async (range = '30d') => {
      try {
        const response = await apiMethods.get(ENDPOINTS.pledges.statistics, { 
          params: { range } 
        });
        return response.data;
      } catch (error) {
        console.error('[Dashboard API] Pledge stats failed:', error);
        return { total_amount: 0, active_pledges: 0, monthly_total: 0 };
      }
    },

    getGroupStats: async () => {
      try {
        const response = await apiMethods.get(ENDPOINTS.groups.statistics);
        return response.data;
      } catch (error) {
        console.error('[Dashboard API] Group stats failed:', error);
        return { total_groups: 0, active_groups: 0 };
      }
    },

    getFamilyStats: async () => {
      try {
        const response = await apiMethods.get(ENDPOINTS.families.statistics);
        return response.data;
      } catch (error) {
        console.error('[Dashboard API] Family stats failed:', error);
        return { total_families: 0, new_families: 0 };
      }
    },

    // FIXED: Corrected recent members method with fallback
    getRecentMembers: async (limit = 10) => {
      try {
        console.log(`[Dashboard API] Fetching recent members with limit: ${limit}`);
        
        // First try the recent endpoint
        try {
          const response = await apiMethods.get(ENDPOINTS.members.recent, { 
            params: { limit } 
          });
          console.log('[Dashboard API] Recent members response:', response.data);
          
          // Handle different response formats
          if (response.data.results) {
            return response.data.results;
          } else if (Array.isArray(response.data)) {
            return response.data;
          } else {
            return response.data;
          }
        } catch (recentError) {
          console.warn('[Dashboard API] Recent endpoint failed, using fallback:', recentError.message);
          
          // Fallback to regular list with ordering (this is the working endpoint from your logs)
          const response = await apiMethods.get(ENDPOINTS.members.list, { 
            params: { 
              ordering: '-registration_date', 
              limit: limit,
              page_size: limit
            } 
          });
          
          // Handle paginated response from list endpoint
          if (response.data.results) {
            return response.data.results;
          } else if (Array.isArray(response.data)) {
            return response.data;
          } else {
            return [];
          }
        }
      } catch (error) {
        console.error('[Dashboard API] All recent members endpoints failed:', error);
        return [];
      }
    },

    getRecentPledges: async (limit = 10) => {
      try {
        const response = await apiMethods.get(ENDPOINTS.pledges.recent, { 
          params: { limit } 
        });
        
        if (response.data.results) {
          return response.data.results;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          return response.data;
        }
      } catch (error) {
        console.warn('[Dashboard API] Recent pledges endpoint failed, using list with ordering');
        try {
          const response = await apiMethods.get(ENDPOINTS.pledges.list, { 
            params: { ordering: '-created_at', limit } 
          });
          
          if (response.data.results) {
            return response.data.results;
          } else if (Array.isArray(response.data)) {
            return response.data;
          } else {
            return [];
          }
        } catch (fallbackError) {
          console.error('[Dashboard API] Fallback for recent pledges also failed:', fallbackError);
          return [];
        }
      }
    },

    getSystemHealth: async () => {
      try {
        const response = await apiMethods.get(ENDPOINTS.dashboard.health);
        return response.data;
      } catch (error) {
        console.warn('[Dashboard API] Health endpoint failed, using core health');
        try {
          const response = await apiMethods.get(ENDPOINTS.core.health);
          return { status: 'healthy', ...response.data };
        } catch (coreError) {
          return { status: 'unknown', error: coreError.message };
        }
      }
    },

    getAlerts: async () => {
      try {
        const response = await apiMethods.get(ENDPOINTS.dashboard.alerts);
        return response.data;
      } catch (error) {
        console.warn('[Dashboard API] Alerts endpoint failed, returning empty');
        return { results: [] };
      }
    },

    markAlertRead: async (alertId) => {
      const response = await apiMethods.patch(`${ENDPOINTS.dashboard.alerts}${alertId}/`, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      return response.data;
    },

    getDashboardConfig: async (userId) => {
      try {
        const response = await apiMethods.get(ENDPOINTS.dashboard.config(userId));
        return response.data;
      } catch (error) {
        if (error.status === 404) {
          return null;
        }
        throw error;
      }
    },

    saveDashboardConfig: async (userId, config) => {
      const response = await apiMethods.post(ENDPOINTS.dashboard.config(userId), config);
      return response.data;
    }
  },
  // Member API methods
  members: {
    list: async (params = {}) => {
      const response = await apiMethods.get(ENDPOINTS.members.list, { params });
      return response.data;
    },

    create: async (memberData) => {
      const response = await apiMethods.post(ENDPOINTS.members.create, memberData);
      return response.data;
    },

    get: async (id) => {
      const response = await apiMethods.get(ENDPOINTS.members.detail(id));
      return response.data;
    },

    update: async (id, memberData) => {
      const response = await apiMethods.put(ENDPOINTS.members.update(id), memberData);
      return response.data;
    },

    patch: async (id, memberData) => {
      const response = await apiMethods.patch(ENDPOINTS.members.update(id), memberData);
      return response.data;
    },

    delete: async (id) => {
      const response = await apiMethods.delete(ENDPOINTS.members.delete(id));
      return response.data;
    },

    search: async (query, params = {}) => {
      const response = await apiMethods.get(ENDPOINTS.members.search, {
        params: { q: query, ...params }
      });
      return response.data;
    },

    getStats: async (range = '30d') => {
      const response = await apiMethods.get(ENDPOINTS.members.statistics, {
        params: { range }
      });
      return response.data;
    },

    export: async (format = 'csv') => {
      const response = await apiMethods.get(ENDPOINTS.members.export, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    },

    publicRegister: async (memberData) => {
      const response = await apiMethods.post(ENDPOINTS.members.publicRegister, memberData);
      return response.data;
    },

    getBirthdays: async (days = 30) => {
      const response = await apiMethods.get(ENDPOINTS.members.birthdays, {
        params: { days }
      });
      return response.data;
    },

    getDemographics: async (type = 'age') => {
      const endpoint = type === 'age' ? 
        ENDPOINTS.members.demographics?.age : 
        ENDPOINTS.members.demographics?.gender;
      if (!endpoint) {
        return { results: [] };
      }
      const response = await apiMethods.get(endpoint);
      return response.data;
    }
  },

  // Group API methods
  groups: {
    list: async (params = {}) => {
      const response = await apiMethods.get(ENDPOINTS.groups.list, { params });
      return response.data;
    },

    create: async (groupData) => {
      const response = await apiMethods.post(ENDPOINTS.groups.create, groupData);
      return response.data;
    },

    get: async (id) => {
      const response = await apiMethods.get(ENDPOINTS.groups.detail(id));
      return response.data;
    },

    update: async (id, groupData) => {
      const response = await apiMethods.put(ENDPOINTS.groups.update(id), groupData);
      return response.data;
    },

    delete: async (id) => {
      const response = await apiMethods.delete(ENDPOINTS.groups.delete(id));
      return response.data;
    },

    getMembers: async (id) => {
      const response = await apiMethods.get(ENDPOINTS.groups.members(id));
      return response.data;
    },

    addMember: async (groupId, memberId) => {
      const response = await apiMethods.post(ENDPOINTS.groups.join(groupId), {
        member_id: memberId
      });
      return response.data;
    },

    removeMember: async (groupId, memberId) => {
      const response = await apiMethods.delete(ENDPOINTS.groups.removeMember(groupId, memberId));
      return response.data;
    },

    getStats: async () => {
      const response = await apiMethods.get(ENDPOINTS.groups.statistics);
      return response.data;
    },

    getCategories: async () => {
      const response = await apiMethods.get(ENDPOINTS.groups.categories);
      return response.data;
    }
  },

  // Pledge API methods
  pledges: {
    list: async (params = {}) => {
      const response = await apiMethods.get(ENDPOINTS.pledges.list, { params });
      return response.data;
    },

    create: async (pledgeData) => {
      const response = await apiMethods.post(ENDPOINTS.pledges.create, pledgeData);
      return response.data;
    },

    get: async (id) => {
      const response = await apiMethods.get(ENDPOINTS.pledges.detail(id));
      return response.data;
    },

    update: async (id, pledgeData) => {
      const response = await apiMethods.put(ENDPOINTS.pledges.update(id), pledgeData);
      return response.data;
    },

    delete: async (id) => {
      const response = await apiMethods.delete(ENDPOINTS.pledges.delete(id));
      return response.data;
    },

    getStats: async (range = '30d') => {
      const response = await apiMethods.get(ENDPOINTS.pledges.statistics, {
        params: { range }
      });
      return response.data;
    },

    export: async (format = 'csv') => {
      const response = await apiMethods.get(ENDPOINTS.pledges.export, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    },

    getOverdue: async () => {
      const response = await apiMethods.get(ENDPOINTS.pledges.overdue);
      return response.data;
    },

    getUpcomingPayments: async (days = 7) => {
      const response = await apiMethods.get(ENDPOINTS.pledges.upcomingPayments, {
        params: { days }
      });
      return response.data;
    },

    getTrends: async (range = '12m') => {
      const response = await apiMethods.get(ENDPOINTS.pledges.trends, {
        params: { range }
      });
      return response.data;
    }
  },

  // Family API methods
  families: {
    // List families with filters and pagination
    list: async (params = {}) => {
      try {
        console.log('[API] Fetching families list with params:', params);
        const response = await apiMethods.get(ENDPOINTS.families.list, { params });
        console.log('[API] Families list response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching families:', error);
        throw error;
      }
    },

    // Create new family
    create: async (familyData) => {
      try {
        console.log('[API] Creating family:', familyData);
        const response = await apiMethods.post(ENDPOINTS.families.create, familyData);
        console.log('[API] Family created:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error creating family:', error);
        throw error;
      }
    },

    // Get single family by ID
    get: async (id) => {
      try {
        console.log('[API] Fetching family:', id);
        const response = await apiMethods.get(ENDPOINTS.families.detail(id));
        console.log('[API] Family details:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching family:', error);
        throw error;
      }
    },

    // Update family (full update)
    update: async (id, familyData) => {
      try {
        console.log('[API] Updating family:', id, familyData);
        const response = await apiMethods.put(ENDPOINTS.families.update(id), familyData);
        console.log('[API] Family updated:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error updating family:', error);
        throw error;
      }
    },

    // Partial update family
    patch: async (id, familyData) => {
      try {
        console.log('[API] Patching family:', id, familyData);
        const response = await apiMethods.patch(ENDPOINTS.families.update(id), familyData);
        console.log('[API] Family patched:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error patching family:', error);
        throw error;
      }
    },

    // Delete family
    delete: async (id) => {
      try {
        console.log('[API] Deleting family:', id);
        const response = await apiMethods.delete(ENDPOINTS.families.delete(id));
        console.log('[API] Family deleted successfully');
        return response.data;
      } catch (error) {
        console.error('[API] Error deleting family:', error);
        throw error;
      }
    },

    // Get family members
    getMembers: async (id) => {
      try {
        console.log('[API] Fetching family members:', id);
        const response = await apiMethods.get(ENDPOINTS.families.members(id));
        console.log('[API] Family members:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching family members:', error);
        throw error;
      }
    },

    // Add member to family
    addMember: async (familyId, memberData) => {
      try {
        console.log('[API] Adding member to family:', familyId, memberData);
        const response = await apiMethods.post(
          ENDPOINTS.families.addMember(familyId),
          memberData
        );
        console.log('[API] Member added to family:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error adding member to family:', error);
        throw error;
      }
    },

    // Remove member from family
    removeMember: async (familyId, memberId) => {
      try {
        console.log('[API] Removing member from family:', familyId, memberId);
        const response = await apiMethods.delete(
          ENDPOINTS.families.removeMember(familyId, memberId)
        );
        console.log('[API] Member removed from family');
        return response.data;
      } catch (error) {
        console.error('[API] Error removing member from family:', error);
        throw error;
      }
    },

    // Set primary contact for family
    setPrimaryContact: async (familyId, memberId) => {
      try {
        console.log('[API] Setting primary contact:', familyId, memberId);
        const response = await apiMethods.post(
          ENDPOINTS.families.setPrimaryContact(familyId),
          { member_id: memberId }
        );
        console.log('[API] Primary contact set:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error setting primary contact:', error);
        throw error;
      }
    },

    // Get family statistics
    getStats: async () => {
      try {
        console.log('[API] Fetching family statistics');
        const response = await apiMethods.get(ENDPOINTS.families.statistics);
        console.log('[API] Family statistics:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching family statistics:', error);
        throw error;
      }
    },

    // Get recent families
    getRecent: async (days = 30) => {
      try {
        console.log('[API] Fetching recent families, days:', days);
        const response = await apiMethods.get(ENDPOINTS.families.recent, {
          params: { days }
        });
        console.log('[API] Recent families:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching recent families:', error);
        throw error;
      }
    },

    // Get families needing attention
    getNeedingAttention: async () => {
      try {
        console.log('[API] Fetching families needing attention');
        const response = await apiMethods.get(ENDPOINTS.families.needingAttention);
        console.log('[API] Families needing attention:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error fetching families needing attention:', error);
        throw error;
      }
    },

    // Bulk operations (delete, export)
    bulkOperations: async (operation, familyIds) => {
      try {
        console.log('[API] Bulk operation:', operation, 'on families:', familyIds);
        const response = await apiMethods.post(ENDPOINTS.families.bulkOperations, {
          operation,
          family_ids: familyIds
        });
        console.log('[API] Bulk operation completed:', response.data);
        return response.data;
      } catch (error) {
        console.error('[API] Error in bulk operation:', error);
        throw error;
      }
    }
  },

  // Core API methods
  core: {
    health: async () => {
      const response = await apiMethods.get(ENDPOINTS.core.health);
      return response.data;
    },

    status: async () => {
      const response = await apiMethods.get(ENDPOINTS.core.status);
      return response.data;
    },

    version: async () => {
      const response = await apiMethods.get(ENDPOINTS.core.version);
      return response.data;
    }
  }
};

// Enhanced pledges API methods with better error handling
const pledgesApi = {
  // Get pledges with enhanced error handling
  async list(params = {}) {
    try {
      console.log('[API] Fetching pledges with params:', params);
      const response = await api.get(ENDPOINTS.pledges.list, { params });
      
      // Handle both paginated and non-paginated responses
      if (response.data.results) {
        return {
          success: true,
          data: response.data.results,
          pagination: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            totalPages: Math.ceil(response.data.count / (params.limit || 25)),
            currentPage: params.page || 1
          }
        };
      } else if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          pagination: {
            count: response.data.length,
            totalPages: 1,
            currentPage: 1
          }
        };
      } else {
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('[API] Error fetching pledges:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pledges',
        data: []
      };
    }
  },

  // Create pledge with validation
  async create(pledgeData) {
    try {
      console.log('[API] Creating pledge:', pledgeData);
      
      // Validate required fields
      if (!pledgeData.member_id) {
        throw new Error('Member ID is required');
      }
      if (!pledgeData.amount || pledgeData.amount <= 0) {
        throw new Error('Valid amount is required');
      }

      const response = await api.post(ENDPOINTS.pledges.create, pledgeData);
      console.log('[API] Pledge created successfully:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[API] Error creating pledge:', error);
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        const errorMessage = Object.values(validationErrors).flat()[0] || 'Validation failed';
        return {
          success: false,
          error: errorMessage,
          validationErrors
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create pledge'
      };
    }
  },

  // Get statistics with fallback
  async getStatistics(params = {}) {
    try {
      console.log('[API] Fetching pledge statistics:', params);
      const response = await api.get(ENDPOINTS.pledges.statistics, { params });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[API] Error fetching statistics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        data: {}
      };
    }
  },

  // Update pledge
  async update(id, pledgeData) {
    try {
      console.log('[API] Updating pledge:', id, pledgeData);
      const response = await api.put(ENDPOINTS.pledges.update(id), pledgeData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[API] Error updating pledge:', error);
      return {
        success: false,
        error: error.message || 'Failed to update pledge'
      };
    }
  }
};

// Test connection with comprehensive checks
const testConnection = async () => {
  try {
    console.log('[API Test] Testing connection to:', API_BASE_URL);
    
    // Test core health endpoint first
    const healthResponse = await api.get(ENDPOINTS.core.health, {
      timeout: 10000,
      _retryCount: 0
    });
    
    console.log('[API Test] Health check successful:', healthResponse.data);
    
    // Test authentication endpoint
    try {
      const authTestResponse = await api.get(ENDPOINTS.auth.test, {
        timeout: 5000
      });
      console.log('[API Test] Auth endpoint accessible:', authTestResponse.status === 200);
    } catch (authError) {
      console.warn('[API Test] Auth endpoint test failed (this may be normal):', authError.message);
    }
    
    return { 
      success: true, 
      data: healthResponse.data,
      timestamp: new Date().toISOString(),
      baseUrl: API_BASE_URL
    };
  } catch (error) {
    console.error('[API Test] Connection failed:', error);
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      baseUrl: API_BASE_URL,
      timestamp: new Date().toISOString()
    };
  }
};

// Enhanced health check with detailed metrics
const healthCheck = async () => {
  try {
    const startTime = Date.now();
    const response = await api.get(ENDPOINTS.core.health, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('[API Health Check] Failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Enhanced auth state debugging
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
    hasUser: !!authData.user,
    tokenLength: authData.accessToken?.length || 0,
    userParsed: authData.user ? JSON.parse(authData.user) : null
  });
  
  return authData;
};

// Batch request utility
const batchRequests = async (requests) => {
  try {
    console.log(`[API Batch] Executing ${requests.length} requests...`);
    const results = await Promise.allSettled(requests);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[API Batch] Completed: ${successful} successful, ${failed} failed`);
    
    return results;
  } catch (error) {
    console.error('[API Batch] Batch request failed:', error);
    throw error;
  }
};

// Add this to test your API endpoints
const testAPIs = async () => {
  const endpoints = [
    'members/',
    'members/statistics/',
    'members/recent/',
    'groups/statistics/',
    'families/statistics/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`✅ ${endpoint}:`, {
        status: response.status,
        hasData: !!data,
        keys: Object.keys(data),
        sampleData: data
      });
    } catch (error) {
      console.error(`❌ ${endpoint}:`, error.message);
    }
  }
};

// Request queue for handling rate limits
class RequestQueue {
  constructor(maxConcurrent = 5, delayMs = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delayMs = delayMs;
    this.queue = [];
    this.running = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      // Add delay to prevent overwhelming the server
      setTimeout(() => this.process(), this.delayMs);
    }
  }
}

const requestQueue = new RequestQueue();

export default apiMethods;
export { 
  api, 
  testConnection, 
  healthCheck, 
  checkAuthState, 
  ENDPOINTS,
  clearAuthData,
  redirectToLogin,
  batchRequests,
  requestQueue,
  pledgesApi,
  testAPIs
};