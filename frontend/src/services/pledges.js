// services/pledges.js
import { api } from './api';

const PLEDGES_ENDPOINTS = {
  LIST: '/pledges/',
  DETAIL: (id) => `/pledges/${id}/`,
  CREATE: '/pledges/',
  UPDATE: (id) => `/pledges/${id}/`,
  DELETE: (id) => `/pledges/${id}/`,
  STATS: '/pledges/stats/',
  MEMBER_PLEDGES: (memberId) => `/pledges/member/${memberId}/`,
  EXPORT: '/pledges/export/',
  BULK_UPDATE: '/pledges/bulk-update/',
  BULK_DELETE: '/pledges/bulk-delete/',
};

class PledgesService {
  async getPledges(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.LIST, { params });
      return {
        success: true,
        data: response.data,  // Keep full response structure
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch pledges',
      };
    }
  }

  async getPledge(id) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch pledge',
      };
    }
  }

  async createPledge(pledgeData) {
    try {
      const response = await api.post(PLEDGES_ENDPOINTS.CREATE, pledgeData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create pledge',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async updatePledge(id, pledgeData) {
    try {
      const response = await api.put(PLEDGES_ENDPOINTS.UPDATE(id), pledgeData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update pledge',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async deletePledge(id) {
    try {
      await api.delete(PLEDGES_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete pledge',
      };
    }
  }

  // FIXED: Renamed from getPledgeStats to getStatistics to match hook
  async getStatistics() {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch pledge stats',
      };
    }
  }

  // Keep the old method name for backward compatibility
  async getPledgeStats() {
    return this.getStatistics();
  }

  async getMemberPledges(memberId) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.MEMBER_PLEDGES(memberId));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch member pledges',
      };
    }
  }

  // NEW: Export functionality
  async exportPledges(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.EXPORT, { 
        params,
        responseType: 'blob' 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export pledges',
      };
    }
  }

  // NEW: Bulk operations
  async bulkUpdatePledges(pledgeIds, updates) {
    try {
      const response = await api.post(PLEDGES_ENDPOINTS.BULK_UPDATE, {
        pledge_ids: pledgeIds,
        updates: updates
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to bulk update pledges',
      };
    }
  }

  async bulkDeletePledges(pledgeIds) {
    try {
      const response = await api.post(PLEDGES_ENDPOINTS.BULK_DELETE, {
        pledge_ids: pledgeIds
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to bulk delete pledges',
      };
    }
  }

  // Calculate pledge totals
  calculateTotalPledgeAmount(pledges) {
    return pledges.reduce((total, pledge) => {
      if (pledge.status === 'active') {
        return total + parseFloat(pledge.amount || 0);
      }
      return total;
    }, 0);
  }

  // Get pledge frequency display text
  getFrequencyDisplayText(frequency) {
    const frequencyMap = {
      'one-time': 'One-time',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annually': 'Annually',
    };
    return frequencyMap[frequency] || frequency;
  }
}

export default new PledgesService();