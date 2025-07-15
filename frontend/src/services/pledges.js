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
};

class PledgesService {
  async getPledges(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.LIST, { params });
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

  async getPledgeStats() {
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

  // Calculate pledge totals
  calculateTotalPledgeAmount(pledges) {
    return pledges.reduce((total, pledge) => {
      if (pledge.status === 'active') {
        return total + parseFloat(pledge.amount);
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