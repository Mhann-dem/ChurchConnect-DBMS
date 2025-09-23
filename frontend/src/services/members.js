// services/members.js - FIXED: Corrected API endpoints to match Django backend
import apiMethods from './api';

class MembersService {
  constructor() {
    this.baseEndpoint = 'members';
  }

  /**
   * Get recent members - CORRECTED ENDPOINT
   */
  async getRecentMembers(limit = 5) {
    try {
      console.log('[Members Service] Fetching recent members with limit:', limit);
      
      // FIXED: Use the correct endpoint that matches Django @action
      const response = await apiMethods.get(`${this.baseEndpoint}/recent/`, {
        params: { limit }
      });

      // Handle the Django response format
      const data = response.data || response;
      
      return {
        success: true,
        data: data.results || [],
        total: data.count || 0
      };
    } catch (error) {
      console.warn('[Members Service] Recent endpoint failed, using fallback');
      
      // Fallback to regular list endpoint with ordering
      return this.getMembers({
        ordering: '-registration_date',
        limit: limit,
        page_size: limit
      });
    }
  }

  /**
   * Get members with pagination - CORRECTED
   */
  async getMembers(options = {}) {
    try {
      const params = {
        search: options.search || '',
        page: options.page || 1,
        page_size: options.limit || 25,
        ordering: options.ordering || '-registration_date',
        ...options.filters
      };

      console.log('[Members Service] Fetching members with params:', params);
      
      const response = await apiMethods.get(this.baseEndpoint + '/', { params });
      const data = response.data || response;
      
      return {
        success: true,
        data: data.results || [],
        totalMembers: data.count || 0,
        pagination: {
          total_pages: Math.ceil((data.count || 0) / (options.limit || 25)),
          current_page: options.page || 1,
          next: data.next,
          previous: data.previous
        }
      };
    } catch (error) {
      console.error('[Members Service] getMembers error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        totalMembers: 0
      };
    }
  }

  /**
   * Public registration - CORRECTED
   */
  async publicRegister(memberData) {
    try {
      console.log('[Members Service] Public registration');
      
      const response = await apiMethods.post('members/register/', {
        ...memberData,
        privacy_policy_agreed: true,
        registration_source: 'public_form'
      });

      const data = response.data || response;
      
      if (data.success !== false) {
        return {
          success: true,
          message: data.message || 'Registration successful!',
          memberId: data.member_id
        };
      } else {
        return {
          success: false,
          error: data.message || 'Registration failed',
          errors: data.errors || {}
        };
      }
    } catch (error) {
      console.error('[Members Service] publicRegister error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Admin create member - CORRECTED
   */
  async createMember(memberData) {
    try {
      console.log('[Members Service] Creating member');
      
      const response = await apiMethods.post(this.baseEndpoint + '/', {
        ...memberData,
        registration_source: 'admin_portal'
      });

      const data = response.data || response;
      
      if (data.success !== false) {
        return {
          success: true,
          data: data.data || data,
          message: data.message || 'Member created successfully'
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to create member',
          validationErrors: data.errors || {}
        };
      }
    } catch (error) {
      console.error('[Members Service] createMember error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create member',
        validationErrors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Update member - CORRECTED
   */
  async updateMember(memberId, memberData) {
    try {
      console.log('[Members Service] Updating member:', memberId);
      
      const response = await apiMethods.put(`${this.baseEndpoint}/${memberId}/`, memberData);
      const data = response.data || response;
      
      return {
        success: true,
        data: data.data || data,
        message: 'Member updated successfully'
      };
    } catch (error) {
      console.error('[Members Service] updateMember error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update member',
        validationErrors: error.response?.data?.errors || {}
      };
    }
  }

  /**
   * Delete member - CORRECTED
   */
  async deleteMember(memberId) {
    try {
      console.log('[Members Service] Deleting member:', memberId);
      
      await apiMethods.delete(`${this.baseEndpoint}/${memberId}/`);
      
      return {
        success: true,
        message: 'Member deleted successfully'
      };
    } catch (error) {
      console.error('[Members Service] deleteMember error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete member'
      };
    }
  }

  /**
   * Search members - CORRECTED
   */
  async searchMembers(query, params = {}) {
    try {
      console.log('[Members Service] Searching members:', query);
      
      const response = await apiMethods.get(`${this.baseEndpoint}/search/`, {
        params: { q: query, ...params }
      });

      const data = response.data || response;
      
      return {
        success: true,
        data: data.results || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error('[Members Service] searchMembers error:', error);
      return {
        success: false,
        error: error.message || 'Search failed',
        data: []
      };
    }
  }

  /**
   * Get member statistics - CORRECTED
   */
  async getStatistics(range = '30d') {
    try {
      console.log('[Members Service] Fetching statistics:', range);
      
      const response = await apiMethods.get(`${this.baseEndpoint}/statistics/`, {
        params: { range }
      });

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('[Members Service] getStatistics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        data: {}
      };
    }
  }

  /**
   * Get upcoming birthdays - CORRECTED
   */
  async getBirthdays(days = 30) {
    try {
      console.log('[Members Service] Fetching birthdays for next', days, 'days');
      
      const response = await apiMethods.get(`${this.baseEndpoint}/birthdays/`, {
        params: { days }
      });

      const data = response.data || response;
      
      return {
        success: true,
        data: data.results || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error('[Members Service] getBirthdays error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch birthdays',
        data: []
      };
    }
  }

  /**
   * Export members - CORRECTED
   */
  async exportMembers(format = 'csv') {
    try {
      console.log('[Members Service] Exporting members as', format);
      
      const response = await apiMethods.get(`${this.baseEndpoint}/export/`, {
        params: { format },
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('[Members Service] exportMembers error:', error);
      return {
        success: false,
        error: error.message || 'Export failed'
      };
    }
  }

  /**
   * Bulk import members - CORRECTED
   */
  async importMembers(file, options = {}) {
    try {
      console.log('[Members Service] Importing members from file');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skip_duplicates', options.skipDuplicates || true);
      
      const response = await apiMethods.post('members/bulk_import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data || response;
      
      if (data.success !== false) {
        return {
          success: true,
          data: data.data,
          message: `Import completed: ${data.data?.imported || 0} imported, ${data.data?.failed || 0} failed`
        };
      } else {
        return {
          success: false,
          error: data.error || 'Import failed'
        };
      }
    } catch (error) {
      console.error('[Members Service] importMembers error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Import failed'
      };
    }
  }

  /**
   * Download import template - CORRECTED
   */
  async downloadTemplate() {
    try {
      console.log('[Members Service] Downloading import template');
      
      const response = await apiMethods.get('members/template/', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'member_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('[Members Service] downloadTemplate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to download template'
      };
    }
  }

  /**
   * Bulk actions on members - CORRECTED
   */
  async performBulkAction(action, memberIds, data = {}) {
    try {
      console.log('[Members Service] Bulk action:', action, 'on', memberIds.length, 'members');
      
      const response = await apiMethods.post(`${this.baseEndpoint}/bulk_actions/`, {
        action,
        member_ids: memberIds,
        data
      });

      const responseData = response.data || response;
      
      return {
        success: true,
        message: responseData.message || 'Bulk action completed',
        processed_count: responseData.processed_count || 0
      };
    } catch (error) {
      console.error('[Members Service] performBulkAction error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Bulk action failed'
      };
    }
  }

  /**
   * Get single member by ID - CORRECTED
   */
  async getMember(memberId) {
    try {
      console.log('[Members Service] Fetching member:', memberId);
      
      const response = await apiMethods.get(`${this.baseEndpoint}/${memberId}/`);
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('[Members Service] getMember error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch member'
      };
    }
  }
}

// Export singleton
const membersService = new MembersService();
export default membersService;