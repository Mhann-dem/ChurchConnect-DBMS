// frontend/src/services/members.js - COMPLETE REPLACEMENT FILE
// This bridges your existing membersAPI to work with useMembers hook

import apiMethods from './api';

console.log('[Members Service Bridge] Initializing...');

/**
 * Service class that bridges membersAPI to useMembers hook expectations
 */
class MembersServiceBridge {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.requestQueue = new Map(); // Prevent duplicate requests
  }

  // Cache management
  _getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  _getFromCache(key) {
    const entry = this.cache.get(key);
    if (entry && (Date.now() - entry.timestamp) < this.cacheTimeout) {
      return entry.data;
    }
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  _clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Prevent duplicate requests
  async _executeRequest(key, requestFn) {
    if (this.requestQueue.has(key)) {
      console.log('[Members Service] Waiting for existing request:', key);
      return await this.requestQueue.get(key);
    }

    const requestPromise = requestFn();
    this.requestQueue.set(key, requestPromise);

    try {
      const result = await requestPromise;
      this.requestQueue.delete(key);
      return result;
    } catch (error) {
      this.requestQueue.delete(key);
      throw error;
    }
  }

  /**
   * Get members - matches useMembers hook expectations
   */
  async getMembers(options = {}) {
    const {
      search = '',
      filters = {},
      page = 1,
      limit = 25,
      forceRefresh = false,
      signal
    } = options;

    const requestKey = `getMembers_${page}_${limit}_${search}`;
    
    return this._executeRequest(requestKey, async () => {
      try {
        // Build API parameters
        const params = {
          search: search?.trim() || '',
          page,
          page_size: limit,
          ...filters
        };

        // Check cache first
        const cacheKey = this._getCacheKey('getMembers', params);
        if (!forceRefresh) {
          const cached = this._getFromCache(cacheKey);
          if (cached) {
            console.log('[Members Service] Cache hit for getMembers');
            return cached;
          }
        }

        console.log('[Members Service] Fetching members from API:', params);

        // Check for abort signal
        if (signal?.aborted) {
          throw new Error('Request aborted');
        }

        // Make API call using your existing API structure
        const response = await apiMethods.get('members/members/', { params });

        if (response.status === 200 && response.data) {
          const result = {
            success: true,
            data: Array.isArray(response.data.results) ? response.data.results : [],
            totalMembers: response.data.count || 0,
            pagination: {
              current_page: page,
              total_pages: Math.ceil((response.data.count || 0) / limit),
              per_page: limit,
              total_count: response.data.count || 0,
              next: response.data.next,
              previous: response.data.previous
            }
          };

          // Cache successful response
          this._setCache(cacheKey, result);
          
          console.log('[Members Service] Members fetched successfully:', {
            count: result.data.length,
            total: result.totalMembers
          });

          return result;
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        console.error('[Members Service] Error fetching members:', error);
        
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request cancelled' };
        }

        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           error.message || 
                           'Failed to fetch members';

        return {
          success: false,
          error: errorMessage,
          data: [],
          totalMembers: 0
        };
      }
    });
  }

  /**
   * Create member - admin function
   */
  async createMember(memberData) {
    try {
      console.log('[Members Service] Creating member (admin)...');

      // Validate required fields
      const requiredFields = ['first_name', 'last_name', 'email'];
      const missingFields = requiredFields.filter(field => !memberData[field]?.trim());
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          validationErrors: missingFields.reduce((acc, field) => {
            acc[field] = 'This field is required';
            return acc;
          }, {})
        };
      }

      // Format and clean data
      const formattedData = this._formatMemberData(memberData);
      
      const response = await apiMethods.post('members/members/', formattedData);

      if (response.status === 201 && response.data) {
        // Clear cache after successful creation
        this._clearCache('getMembers');
        
        console.log('[Members Service] Member created successfully');
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || 'Member created successfully'
        };
      } else {
        throw new Error('Failed to create member');
      }

    } catch (error) {
      console.error('[Members Service] Error creating member:', error);
      
      const errorData = error.response?.data || {};
      
      return {
        success: false,
        error: errorData.message || error.message || 'Failed to create member',
        validationErrors: errorData.errors || {}
      };
    }
  }

  /**
   * Public registration - no auth required
   */
  async publicRegister(memberData) {
    try {
      console.log('[Members Service] Public registration...');

      // Format data for public registration
      const formattedData = this._formatMemberData(memberData);
      formattedData.privacy_policy_agreed = true;
      formattedData.communication_opt_in = memberData.communication_opt_in !== false;

      const response = await apiMethods.post('members/register/', formattedData);

      if (response.status === 201 && response.data) {
        console.log('[Members Service] Public registration successful');
        return {
          success: response.data.success !== false,
          message: response.data.message || 'Registration successful!',
          memberId: response.data.member_id,
          memberName: response.data.member_name
        };
      } else {
        throw new Error('Registration failed');
      }

    } catch (error) {
      console.error('[Members Service] Public registration error:', error);
      
      const errorData = error.response?.data || {};
      
      return {
        success: false,
        error: errorData.message || error.message || 'Registration failed',
        validationErrors: errorData.errors || {},
        message: errorData.message || 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Update member
   */
  async updateMember(memberId, memberData) {
    try {
      console.log('[Members Service] Updating member:', memberId);

      const formattedData = this._formatMemberData(memberData);
      const response = await apiMethods.put(`members/members/${memberId}/`, formattedData);

      if (response.status === 200 && response.data) {
        // Clear cache after update
        this._clearCache();
        
        return {
          success: true,
          data: response.data.data || response.data,
          message: 'Member updated successfully'
        };
      } else {
        throw new Error('Failed to update member');
      }

    } catch (error) {
      console.error('[Members Service] Update error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update member'
      };
    }
  }

  /**
   * Delete member
   */
  async deleteMember(memberId) {
    try {
      console.log('[Members Service] Deleting member:', memberId);

      const response = await apiMethods.delete(`members/members/${memberId}/`);

      if (response.status === 204 || response.status === 200) {
        // Clear cache after deletion
        this._clearCache();
        
        return {
          success: true,
          message: 'Member deleted successfully'
        };
      } else {
        throw new Error('Failed to delete member');
      }

    } catch (error) {
      console.error('[Members Service] Delete error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete member'
      };
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(memberId) {
    try {
      console.log('[Members Service] Getting member by ID:', memberId);

      const response = await apiMethods.get(`members/members/${memberId}/`);

      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        throw new Error('Member not found');
      }

    } catch (error) {
      console.error('[Members Service] Get member error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get member');
    }
  }

  /**
   * Get recent members
   */
  async getRecentMembers(limit = 10) {
    const requestKey = `getRecentMembers_${limit}`;
    
    return this._executeRequest(requestKey, async () => {
      try {
        const cacheKey = this._getCacheKey('getRecentMembers', { limit });
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }

        console.log('[Members Service] Getting recent members, limit:', limit);

        const response = await apiMethods.get('members/members/recent/', {
          params: { limit }
        });

        if (response.status === 200 && response.data) {
          const result = {
            success: response.data.success !== false,
            data: response.data.results || [],
            count: response.data.count || 0
          };

          this._setCache(cacheKey, result);
          return result;
        } else {
          throw new Error('Failed to get recent members');
        }

      } catch (error) {
        console.error('[Members Service] Recent members error:', error);
        
        return {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get recent members',
          data: []
        };
      }
    });
  }

  /**
   * Get member statistics
   */
  async getStatistics(range = '30d') {
    try {
      const cacheKey = this._getCacheKey('getStatistics', { range });
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      console.log('[Members Service] Getting statistics, range:', range);

      const response = await apiMethods.get('members/members/statistics/', {
        params: { range }
      });

      if (response.status === 200 && response.data) {
        const result = {
          success: true,
          data: response.data
        };

        this._setCache(cacheKey, result);
        return result;
      } else {
        throw new Error('Failed to get statistics');
      }

    } catch (error) {
      console.error('[Members Service] Statistics error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to get statistics'
      };
    }
  }

  /**
   * Search members
   */
  async searchMembers(query, options = {}) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: true,
          data: [],
          count: 0,
          message: 'Please enter at least 2 characters to search'
        };
      }

      console.log('[Members Service] Searching members:', query);

      const response = await apiMethods.get('members/members/search/', {
        params: { q: query, ...options }
      });

      if (response.status === 200 && response.data) {
        return {
          success: response.data.success !== false,
          data: response.data.results || [],
          count: response.data.count || 0,
          query
        };
      } else {
        throw new Error('Search failed');
      }

    } catch (error) {
      console.error('[Members Service] Search error:', error);
      
      return {
        success: false,
        error: error.message || 'Search failed',
        data: []
      };
    }
  }

  /**
   * Perform bulk actions
   */
  async performBulkAction(action, memberIds, data = {}, options = {}) {
    try {
      console.log('[Members Service] Bulk action:', { action, count: memberIds.length });

      const requestData = {
        action,
        member_ids: memberIds,
        data
      };

      const response = await apiMethods.post('members/members/bulk_actions/', requestData);

      if (response.status === 200 && response.data) {
        // Clear cache after bulk action
        this._clearCache();
        
        return {
          success: response.data.success !== false,
          data: response.data,
          message: response.data.message || `Bulk ${action} completed successfully`
        };
      } else {
        throw new Error('Bulk action failed');
      }

    } catch (error) {
      console.error('[Members Service] Bulk action error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Bulk action failed'
      };
    }
  }

  /**
   * Export members
   */
  async exportMembers(options = {}) {
    try {
      console.log('[Members Service] Exporting members...');
      
      const response = await apiMethods.get('members/members/export/', {
        params: options,
        responseType: 'blob'
      });

      if (response.status === 200 && response.data) {
        // Create download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `members_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Export completed successfully' };
      } else {
        throw new Error('Export failed');
      }

    } catch (error) {
      console.error('[Members Service] Export error:', error);
      
      return {
        success: false,
        error: error.message || 'Export failed'
      };
    }
  }

  /**
   * Format member data for API
   */
  _formatMemberData(data) {
    const formatted = { ...data };
    
    // Clean phone numbers - remove formatting, add country code if needed
    if (formatted.phone) {
      formatted.phone = this._formatPhoneNumber(formatted.phone);
    }
    if (formatted.alternate_phone) {
      formatted.alternate_phone = this._formatPhoneNumber(formatted.alternate_phone);
    }
    if (formatted.emergency_contact_phone) {
      formatted.emergency_contact_phone = this._formatPhoneNumber(formatted.emergency_contact_phone);
    }
    
    // Format date of birth
    if (formatted.date_of_birth && typeof formatted.date_of_birth === 'string') {
      formatted.date_of_birth = formatted.date_of_birth.split('T')[0]; // Remove time component
    }
    
    // Convert empty strings to null for optional fields
    const optionalFields = [
      'preferred_name', 'alternate_phone', 'address', 'accessibility_needs',
      'emergency_contact_name', 'emergency_contact_phone', 'notes'
    ];
    
    optionalFields.forEach(field => {
      if (formatted[field] === '') {
        formatted[field] = null;
      }
    });
    
    // Ensure boolean fields are proper booleans
    formatted.is_active = Boolean(formatted.is_active);
    formatted.communication_opt_in = Boolean(formatted.communication_opt_in);
    formatted.privacy_policy_agreed = Boolean(formatted.privacy_policy_agreed);
    
    return formatted;
  }

  /**
   * Format phone number - basic formatting
   */
  _formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add +1 for US numbers if needed
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else {
      return `+${digits}`;
    }
  }

  /**
   * Cache management methods
   */
  invalidateCache(pattern = null) {
    this._clearCache(pattern);
    console.log('[Members Service] Cache invalidated:', pattern || 'all');
  }

  clearCache() {
    this._clearCache();
  }
}

// Create singleton instance
const membersService = new MembersServiceBridge();

// Export both default and named for compatibility
export default membersService;
export { membersService };