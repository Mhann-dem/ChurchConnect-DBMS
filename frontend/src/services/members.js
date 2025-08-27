// services/members.js - Fixed version with proper error handling
import api from './api';

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
  async getMembers(params = {}) {
    try {
      console.log('[MembersService] Getting members with params:', params);
      
      // Clean up the parameters to match what the API expects
      const cleanParams = {};
      
      // Handle search
      if (params.search) {
        cleanParams.search = params.search;
      }
      
      // Handle filters - flatten them if they're nested
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key] !== '' && params.filters[key] !== null && params.filters[key] !== undefined) {
            cleanParams[key] = params.filters[key];
          }
        });
      } else {
        // Handle direct filter parameters
        ['gender', 'ageRange', 'pledgeStatus', 'registrationDateRange', 'active'].forEach(key => {
          if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
            cleanParams[key] = params[key];
          }
        });
      }
      
      // Handle pagination
      if (params.page) {
        cleanParams.page = params.page;
      }
      if (params.limit || params.page_size) {
        cleanParams.limit = params.limit || params.page_size;
      }
      
      console.log('[MembersService] Clean params:', cleanParams);
      
      const response = await api.get(MEMBERS_ENDPOINTS.LIST, { params: cleanParams });
      
      console.log('[MembersService] API response:', response.data);
      
      // Handle different response formats
      let members = [];
      let totalMembers = 0;
      let pagination = null;
      
      if (response.data) {
        if (response.data.results) {
          // Paginated response
          members = Array.isArray(response.data.results) ? response.data.results : [];
          totalMembers = response.data.count || members.length;
          pagination = {
            count: response.data.count || members.length,
            next: response.data.next,
            previous: response.data.previous,
            current_page: response.data.current_page || 1,
            total_pages: response.data.total_pages || 1,
          };
        } else if (Array.isArray(response.data)) {
          // Direct array response
          members = response.data;
          totalMembers = members.length;
        } else {
          console.warn('[MembersService] Unexpected response format:', response.data);
          members = [];
          totalMembers = 0;
        }
      }
      
      return {
        success: true,
        data: members,
        totalMembers,
        pagination,
      };
    } catch (error) {
      console.error('[MembersService] Error fetching members:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to fetch members',
        data: [],
        totalMembers: 0,
        pagination: null,
      };
    }
  }

  async getMember(id) {
    try {
      console.log('[MembersService] Getting member:', id);
      const response = await api.get(MEMBERS_ENDPOINTS.DETAIL(id));
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('[MembersService] Error fetching member:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to fetch member',
      };
    }
  }

  async createMember(memberData) {
    try {
      console.log('[MembersService] Creating member with data:', memberData);
      
      // Format the data for the API
      const formattedData = this.formatDataForAPI(memberData);
      
      console.log('[MembersService] Formatted data:', formattedData);
      
      const response = await api.post(MEMBERS_ENDPOINTS.CREATE, formattedData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[MembersService] Error creating member:', error);
      
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || errorData.detail || error.message || 'Failed to create member';
      
      throw {
        response: {
          data: {
            message: errorMessage,
            errors: errorData.errors || errorData
          }
        }
      };
    }
  }

  async updateMember(id, memberData) {
    try {
      console.log('[MembersService] Updating member:', id, memberData);
      const formattedData = this.formatDataForAPI(memberData);
      const response = await api.put(MEMBERS_ENDPOINTS.UPDATE(id), formattedData);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('[MembersService] Error updating member:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to update member',
        validationErrors: error.response?.data?.errors || error.response?.data,
      };
    }
  }

  async deleteMember(id) {
    try {
      console.log('[MembersService] Deleting member:', id);
      await api.delete(MEMBERS_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[MembersService] Error deleting member:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to delete member',
      };
    }
  }

  async searchMembers(query, filters = {}) {
    try {
      console.log('[MembersService] Searching members:', query, filters);
      const params = { search: query, ...filters };
      return await this.getMembers(params);
    } catch (error) {
      console.error('[MembersService] Error searching members:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Search failed',
        data: [],
        totalMembers: 0,
      };
    }
  }

  async getMemberStats() {
    try {
      console.log('[MembersService] Getting member statistics');
      const response = await api.get(MEMBERS_ENDPOINTS.STATS);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('[MembersService] Error fetching stats:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to fetch member stats',
      };
    }
  }

  async exportMembers(memberIds = null, format = 'csv', fields = null) {
    try {
      console.log('[MembersService] Exporting members:', { memberIds, format, fields });
      
      const params = {
        format,
        ...(memberIds && { member_ids: memberIds.join(',') }),
        ...(fields && { fields: fields.join(',') })
      };
      
      const response = await api.get(MEMBERS_ENDPOINTS.EXPORT, { 
        params,
        responseType: 'blob'
      });

      // Create download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `members_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: `Exported ${memberIds ? memberIds.length : 'all'} members` 
      };
    } catch (error) {
      console.error('[MembersService] Error exporting members:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.detail || error.message || 'Export failed',
      };
    }
  }

  // BULK OPERATIONS
  async bulkDeleteMembers(memberIds) {
    try {
      console.log('[MembersService] Bulk deleting members:', memberIds);
      // For now, delete one by one - implement bulk endpoint later
      const promises = memberIds.map(id => this.deleteMember(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      return { 
        success: failed === 0, 
        data: { successful, failed },
        message: `Deleted ${successful} members${failed > 0 ? `, ${failed} failed` : ''}`
      };
    } catch (error) {
      console.error('[MembersService] Error in bulk delete:', error);
      return {
        success: false,
        error: error.message || 'Bulk delete failed',
      };
    }
  }

  async performBulkAction(action, memberIds, actionData = {}) {
    console.log('[MembersService] Performing bulk action:', action, memberIds, actionData);
    
    switch (action) {
      case 'delete':
        return await this.bulkDeleteMembers(memberIds);
      case 'export':
        return await this.exportMembers(memberIds);
      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }
  }

  // UTILITY METHODS
  validateMemberData(data) {
    const errors = {};
    
    if (!data.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!data.date_of_birth && !data.dateOfBirth) {
      errors.date_of_birth = 'Date of birth is required';
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!data.gender) {
      errors.gender = 'Gender is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  formatDataForAPI(data) {
    const formatted = {};
    
    // Field mapping from frontend to API
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      phoneNumber: 'phone',
      preferredName: 'preferred_name',
      alternatePhone: 'alternate_phone',
      preferredContactMethod: 'preferred_contact_method',
      preferredLanguage: 'preferred_language',
      accessibilityNeeds: 'accessibility_needs',
      ministryInterests: 'ministry_interests',
      prayerRequest: 'prayer_request',
      pledgeAmount: 'pledge_amount',
      pledgeFrequency: 'pledge_frequency',
      familyMembers: 'family_members',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      privacyPolicyAgreed: 'privacy_policy_agreed',
      communicationOptIn: 'communication_opt_in',
      internalNotes: 'internal_notes',
      registeredBy: 'registered_by',
      registrationContext: 'registration_context',
      isActive: 'is_active'
    };
    
    // Convert field names and copy values
    Object.keys(data).forEach(key => {
      const apiKey = fieldMap[key] || key;
      let value = data[key];
      
      // Handle special formatting
      if (key === 'dateOfBirth' || key === 'date_of_birth') {
        // Ensure date is in YYYY-MM-DD format
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split('T')[0];
          }
        }
      }
      
      // Only include non-empty values
      if (value !== null && value !== undefined && value !== '') {
        formatted[apiKey] = value;
      }
    });
    
    console.log('[MembersService] Formatted data:', formatted);
    return formatted;
  }
}

// Export both as named and default export for compatibility
export const membersService = new MembersService();
export default membersService;