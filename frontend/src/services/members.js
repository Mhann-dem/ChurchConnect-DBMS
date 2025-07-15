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
      const response = await publicApiLimiter.makeRequest(() =>
        api.post(MEMBERS_ENDPOINTS.CREATE, memberData)
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create member',
        validationErrors: error.response?.data?.errors,
      };
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

  // Client-side validation
  validateMemberData(data) {
    const errors = {};
    
    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!data.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    }
    
    if (!data.gender) {
      errors.gender = 'Gender is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export default new MembersService();