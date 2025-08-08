// services/members.js
import { api, publicApiLimiter } from './api';

const MEMBERS_ENDPOINTS = {
  LIST: '/members/',
  DETAIL: (id) => `/members/${id}/`,
  CREATE: '/members/',
  UPDATE: (id) => `/members/${id}/`,
  DELETE: (id) => `/members/${id}/`,
  SEARCH: '/members/search/',
  BULK_UPDATE: '/members/bulk-update/',
  BULK_DELETE: '/members/bulk-delete/',
  STATS: '/members/stats/',
  RECENT: '/members/recent/',
  // Add new endpoints for form saving functionality
  SAVE_FORM: '/forms/save/',
  GET_SAVED_FORM: (id) => `/forms/${id}/`,
  DELETE_SAVED_FORM: (id) => `/forms/${id}/`,
  SEND_CONTINUE_EMAIL: '/forms/send-continue-email/',
};

class MembersService {
  async getMembers(params = {}) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.LIST, { params });
      return {
        success: true,
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch members',
      };
    }
  }

  async getMember(id) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch member',
      };
    }
  }

  async createMember(memberData) {
    try {
      // Use rate limiter for public submissions
      // const response = await publicApiLimiter.makeRequest(() =>
      //   api.post(MEMBERS_ENDPOINTS.CREATE, memberData)
      // );
      
      // For registration page compatibility, return direct response
      return response.data;
    } catch (error) {
      // Throw error for registration page compatibility
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to create member',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async updateMember(id, memberData) {
    try {
      const response = await api.put(MEMBERS_ENDPOINTS.UPDATE(id), memberData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update member',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async deleteMember(id) {
    try {
      await api.delete(MEMBERS_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete member',
      };
    }
  }

  async searchMembers(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const response = await api.get(MEMBERS_ENDPOINTS.SEARCH, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Search failed',
      };
    }
  }

  async bulkUpdateMembers(memberIds, updateData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_UPDATE, {
        member_ids: memberIds,
        update_data: updateData,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk update failed',
      };
    }
  }

  async bulkDeleteMembers(memberIds) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_DELETE, {
        member_ids: memberIds,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk delete failed',
      };
    }
  }

  async getMemberStats() {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch member stats',
      };
    }
  }

  async getRecentMembers(limit = 10) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.RECENT, {
        params: { limit },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent members',
      };
    }
  }

  // NEW METHODS - Form saving functionality
  async saveFormProgress(formData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.SAVE_FORM, {
        data: formData,
        timestamp: new Date().toISOString(),
        email: formData.email
      });
      return response.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to save form progress',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async getSavedForm(formId) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.GET_SAVED_FORM(formId));
      return response.data.data; // Return the actual form data
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to retrieve saved form',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async deleteSavedForm(formId) {
    try {
      await api.delete(MEMBERS_ENDPOINTS.DELETE_SAVED_FORM(formId));
      return true;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to delete saved form',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async sendContinueEmail(email, formId) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.SEND_CONTINUE_EMAIL, {
        email,
        form_id: formId
      });
      return response.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to send continuation email',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  // Client-side validation
  validateMemberData(data) {
    const errors = {};
    
    if (!data.first_name?.trim() && !data.firstName?.trim()) {
      errors.first_name = 'First name is required';
      errors.firstName = 'First name is required';
    }
    
    if (!data.last_name?.trim() && !data.lastName?.trim()) {
      errors.last_name = 'Last name is required';
      errors.lastName = 'Last name is required';
    }
    
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
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

  // Utility method to convert camelCase to snake_case for API compatibility
  formatDataForAPI(data) {
    const formatted = {};
    
    // Common field mappings
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      phoneNumber: 'phone',
      // Add more mappings as needed
    };
    
    Object.keys(data).forEach(key => {
      const apiKey = fieldMap[key] || key;
      formatted[apiKey] = data[key];
    });
    
    return formatted;
  }
}

export default new MembersService();