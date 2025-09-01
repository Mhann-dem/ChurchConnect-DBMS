// services/members.js - Fixed version with proper auth handling and rate limiting
import api from './api';
import authService from './auth';

const MEMBERS_ENDPOINTS = {
  LIST: 'members/members/',
  DETAIL: (id) => `members/members/${id}/`,
  CREATE: 'members/members/',
  UPDATE: (id) => `members/members/${id}/`,
  DELETE: (id) => `members/members/${id}/`,
  SEARCH: 'members/members/',
  EXPORT: 'members/members/export/',
  STATS: 'members/members/statistics/',
  BULK_IMPORT: 'members/members/bulk_import/',
  IMPORT_TEMPLATE: 'members/members/import_template/',
  IMPORT_LOGS: 'members/members/import_logs/',
  ADD_NOTE: (id) => `members/members/${id}/add_note/`,
  GET_NOTES: (id) => `members/members/${id}/notes/`,
  ADD_TAG: (id) => `members/members/${id}/add_tag/`,
  REMOVE_TAG: (id) => `members/members/${id}/remove_tag/`,
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
    if (!authService.isAuthenticated()) {
      console.warn('[MembersService] Not authenticated, request may fail');
      return false;
    }
    return true;
  }

  // Cache helpers
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  async getMembers(params = {}) {
    try {
      console.log('[MembersService] getMembers called with:', params);
      
      // Check authentication
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Rate limiting
      await this.waitForRateLimit();

      // Check cache first
      const cacheKey = this.getCacheKey({ action: 'getMembers', ...params });
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('[MembersService] Returning cached data');
        return cached;
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
          if (value !== null && value !== undefined && value !== '') {
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
      console.log('[MembersService] Response received:', response.status);

      // Handle different response formats
      let result;
      if (response.data?.results) {
        // Paginated response
        result = {
          success: true,
          data: response.data.results,
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
        // Unexpected format
        console.warn('[MembersService] Unexpected response format:', response.data);
        result = {
          success: true,
          data: [],
          totalMembers: 0,
          pagination: null
        };
      }

      // Cache successful results
      this.setCache(cacheKey, result);
      
      console.log('[MembersService] Processed result:', {
        dataLength: result.data?.length,
        totalMembers: result.totalMembers
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
          error: 'Authentication required'
        };
      }

      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Access denied'
        };
      }

      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
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
          error: 'Not authenticated'
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
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Creating member');
      
      const response = await api.post(MEMBERS_ENDPOINTS.CREATE, memberData);
      
      // Clear cache after successful creation
      this.clearCache();
      
      return {
        success: true,
        data: response.data
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
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Updating member:', memberId);
      
      const response = await api.patch(MEMBERS_ENDPOINTS.UPDATE(memberId), memberData);
      
      // Clear cache after successful update
      this.clearCache();
      
      return {
        success: true,
        data: response.data
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
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Deleting member:', memberId);
      
      await api.delete(MEMBERS_ENDPOINTS.DELETE(memberId));
      
      // Clear cache after successful deletion
      this.clearCache();
      
      return {
        success: true
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
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Searching members:', query);
      
      const searchParams = new URLSearchParams();
      
      if (query?.trim()) {
        searchParams.append('q', query.trim());
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
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

  async bulkAction(action, memberIds, data = {}) {
    try {
      if (!this.ensureAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Bulk action:', action, memberIds.length, 'members');
      
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_ACTIONS, {
        action,
        member_ids: memberIds,
        data
      });
      
      // Clear cache after bulk operation
      this.clearCache();
      
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('[MembersService] bulkAction error:', error);
      
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
          error: 'Not authenticated'
        };
      }

      await this.waitForRateLimit();

      console.log('[MembersService] Exporting members');
      
      const response = await api.get(MEMBERS_ENDPOINTS.EXPORT, {
        params: filters,
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'members.csv'
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
          error: 'Not authenticated'
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

  // Utility methods
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
        return cached.data;
      }
      this.cache.delete(key);
    }
    return null;
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