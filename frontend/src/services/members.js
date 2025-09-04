// services/members.js - FIXED VERSION - Corrected endpoints
import api from './api';
import authService from './auth';

// FIXED: Corrected endpoint structure to match Django URLs
const MEMBERS_ENDPOINTS = {
  LIST: 'members/',  // FIXED: Should be /api/v1/members/ not /api/v1/members/members/
  DETAIL: (id) => `members/${id}/`,
  CREATE: 'members/',
  UPDATE: (id) => `members/${id}/`,
  DELETE: (id) => `members/${id}/`,
  SEARCH: 'members/',
  EXPORT: 'members/export/',
  STATS: 'members/statistics/',
  BULK_ACTIONS: 'members/bulk_actions/', 
  BULK_IMPORT: 'members/bulk_import/',
  IMPORT_TEMPLATE: 'members/import_template/',
  IMPORT_LOGS: 'members/import_logs/',
  ADD_NOTE: (id) => `members/${id}/add_note/`,
  GET_NOTES: (id) => `members/${id}/notes/`,
  ADD_TAG: (id) => `members/${id}/add_tag/`,
  REMOVE_TAG: (id) => `members/${id}/remove_tag/`,
};

class MembersService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Check authentication before making requests
  ensureAuthenticated() {
    try {
      if (!authService || typeof authService.isAuthenticated !== 'function') {
        console.warn('[MembersService] AuthService not properly initialized');
        const token = localStorage.getItem('access_token') || 
                     localStorage.getItem('authToken') ||
                     sessionStorage.getItem('access_token');
        return !!token;
      }
      
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        console.warn('[MembersService] Not authenticated, request may fail');
      }
      return isAuth;
    } catch (error) {
      console.error('[MembersService] Error checking authentication:', error);
      const token = localStorage.getItem('access_token') || 
                   localStorage.getItem('authToken') ||
                   sessionStorage.getItem('access_token');
      return !!token;
    }
  }

  // Cache helpers
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  setCache(key, data, ttl = this.cacheTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const ttl = cached.ttl || this.cacheTTL;
      
      if (age < ttl) {
        console.log('[MembersService] Cache hit for:', key);
        return cached.data;
      }
      this.cache.delete(key);
    }
    return null;
  }

  clearCache() {
    this.cache.clear();
    console.log('[MembersService] Cache cleared');
  }

  async getMembers(params = {}) {
    try {
      console.log('[MembersService] getMembers called with:', params);
      
      // Check authentication with fallback
      const isAuthenticated = this.ensureAuthenticated();
      if (!isAuthenticated) {
        console.error('[MembersService] Authentication check failed');
        return {
          success: false,
          error: 'Not authenticated - please log in again',
          requiresAuth: true
        };
      }

      // Rate limiting
      await this.waitForRateLimit();

      // Check cache first (but not for real-time data)
      if (!params.forceRefresh) {
        const cacheKey = this.getCacheKey({ action: 'getMembers', ...params });
        const cached = this.getCache(cacheKey);
        if (cached) {
          console.log('[MembersService] Returning cached data');
          return cached;
        }
      }

      // Prepare query parameters
      const queryParams = new URLSearchParams();
      
      if (params.page && params.page > 1) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit && params.limit !== 25) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.search?.trim()) {
        queryParams.append('search', params.search.trim());
      }

      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '' && value !== true) {
            queryParams.append(key, value);
          }
        });
      }

      const queryString = queryParams.toString();
      const url = queryString ? `${MEMBERS_ENDPOINTS.LIST}?${queryString}` : MEMBERS_ENDPOINTS.LIST;

      console.log('[MembersService] Making request to:', url);

      // Add abort signal if provided
      const config = {};
      if (params.signal) {
        config.signal = params.signal;
      }

      const response = await api.get(url, config);
      console.log('[MembersService] Response received:', {
        status: response.status,
        dataType: typeof response.data,
        hasResults: !!response.data?.results,
        isArray: Array.isArray(response.data)
      });

      // Handle different response formats
      let result;
      if (response.data?.results) {
        // Paginated response
        result = {
          success: true,
          data: Array.isArray(response.data.results) ? response.data.results : [],
          totalMembers: response.data.count || 0,
          pagination: {
            count: response.data.count || 0,
            next: response.data.next,
            previous: response.data.previous,
            current_page: response.data.current_page || params.page || 1,
            total_pages: response.data.total_pages || Math.ceil((response.data.count || 0) / (params.limit || 25)),
            page_size: response.data.page_size || params.limit || 25
          }
        };
      } else if (Array.isArray(response.data)) {
        // Direct array response
        result = {
          success: true,
          data: response.data,
          totalMembers: response.data.length,
          pagination: {
            count: response.data.length,
            current_page: 1,
            total_pages: 1,
            page_size: response.data.length
          }
        };
      } else {
        // Unexpected format - log for debugging
        console.warn('[MembersService] Unexpected response format:', response.data);
        result = {
          success: true,
          data: [],
          totalMembers: 0,
          pagination: {
            count: 0,
            current_page: 1,
            total_pages: 1,
            page_size: 0
          }
        };
      }

      // Cache successful results (but not empty results on first load)
      if (!params.forceRefresh && (result.data.length > 0 || params.page > 1)) {
        const cacheKey = this.getCacheKey({ action: 'getMembers', ...params });
        this.setCache(cacheKey, result);
      }
      
      console.log('[MembersService] Processed result:', {
        dataLength: result.data?.length,
        totalMembers: result.totalMembers,
        success: result.success
      });
      
      return result;

    } catch (error) {
      console.error('[MembersService] getMembers error:', error);
      
      // Handle specific error cases
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request was cancelled'
        };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication expired - please log in again',
          requiresAuth: true
        };
      }

      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Access denied - insufficient permissions'
        };
      }

      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Members endpoint not found - check API configuration'
        };
      }

      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message ||
                          error.message || 
                          'Failed to fetch members';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async getMember(memberId) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Getting member:', memberId);
      
      const response = await api.get(MEMBERS_ENDPOINTS.DETAIL(memberId));
      
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('[MembersService] getMember error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch member';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async createMember(memberData) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Creating member');
      
      const response = await api.post(MEMBERS_ENDPOINTS.CREATE, memberData);
      
      // Clear cache after successful creation
      this.clearCache();
      
      return {
        success: true,
        data: response.data,
        message: 'Member created successfully'
      };

    } catch (error) {
      console.error('[MembersService] createMember error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to create member';

      return {
        success: false,
        error: errorMessage,
        validationErrors: error.response?.data,
        status: error.response?.status
      };
    }
  }

  async updateMember(memberId, memberData) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Updating member:', memberId);
      
      const response = await api.patch(MEMBERS_ENDPOINTS.UPDATE(memberId), memberData);
      
      // Clear cache after successful update
      this.clearCache();
      
      return {
        success: true,
        data: response.data,
        message: 'Member updated successfully'
      };

    } catch (error) {
      console.error('[MembersService] updateMember error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to update member';

      return {
        success: false,
        error: errorMessage,
        validationErrors: error.response?.data,
        status: error.response?.status
      };
    }
  }

  async deleteMember(memberId) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Deleting member:', memberId);
      
      await api.delete(MEMBERS_ENDPOINTS.DELETE(memberId));
      
      // Clear cache after successful deletion
      this.clearCache();
      
      return {
        success: true,
        message: 'Member deleted successfully'
      };

    } catch (error) {
      console.error('[MembersService] deleteMember error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to delete member';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async searchMembers(query, filters = {}) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Searching members:', query);
      
      const searchParams = new URLSearchParams();
      
      if (query?.trim()) {
        searchParams.append('search', query.trim());
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && value !== true) {
          searchParams.append(key, value);
        }
      });

      const url = `${MEMBERS_ENDPOINTS.SEARCH}?${searchParams.toString()}`;
      const response = await api.get(url);
      
      return {
        success: true,
        data: response.data?.results || response.data || [],
        totalMembers: response.data?.count || 0,
        pagination: response.data?.pagination || null
      };

    } catch (error) {
      console.error('[MembersService] searchMembers error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Search failed';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async performBulkAction(action, memberIds, actionData = {}) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Bulk action:', action, memberIds.length, 'members');
      
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_ACTIONS, {
        action,
        member_ids: memberIds,
        data: actionData
      });
      
      // Clear cache after bulk operation
      this.clearCache();
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || `Bulk action "${action}" completed successfully`
      };

    } catch (error) {
      console.error('[MembersService] performBulkAction error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Bulk action failed';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async exportMembers(filters = {}) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Exporting members');
      
      const response = await api.get(MEMBERS_ENDPOINTS.EXPORT, {
        params: filters,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'members.csv';
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Export completed successfully'
      };

    } catch (error) {
      console.error('[MembersService] exportMembers error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Export failed';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  async getStats() {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          requiresAuth: true
        };
      }

      await this.waitForRateLimit();

      // Check cache first
      const cacheKey = this.getCacheKey({ action: 'getStats' });
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }

      console.log('[MembersService] Getting member statistics');
      
      const response = await api.get(MEMBERS_ENDPOINTS.STATS);
      
      const result = {
        success: true,
        data: response.data
      };

      // Cache stats for shorter time
      this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes
      
      return result;

    } catch (error) {
      console.error('[MembersService] getStats error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to fetch statistics';

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await api.get('/auth/test/', {
        timeout: 5000
      });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }
}

// Export singleton instance
const membersService = new MembersService();
export default membersService;