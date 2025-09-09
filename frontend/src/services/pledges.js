// services/pledges.js - Complete Implementation
import { api } from './api';

const PLEDGES_ENDPOINTS = {
  LIST: '/pledges/',
  DETAIL: (id) => `/pledges/${id}/`,
  CREATE: '/pledges/',
  UPDATE: (id) => `/pledges/${id}/`,
  DELETE: (id) => `/pledges/${id}/`,
  STATS: '/pledges/stats/',
  STATISTICS: '/pledges/statistics/', // Alternative endpoint
  MEMBER_PLEDGES: (memberId) => `/members/${memberId}/pledges/`,
  EXPORT: '/pledges/export/',
  BULK_UPDATE: '/pledges/bulk-action/',
  BULK_DELETE: '/pledges/bulk-delete/',
  PAYMENTS: '/pledges/payments/',
  PAYMENT_DETAIL: (id) => `/pledges/payments/${id}/`,
  ADD_PAYMENT: (pledgeId) => `/pledges/${pledgeId}/add-payment/`,
  PAYMENT_HISTORY: (pledgeId) => `/pledges/${pledgeId}/payment-history/`,
  OVERDUE: '/pledges/overdue/',
  UPCOMING: '/pledges/upcoming-payments/',
  SUMMARY_REPORT: '/pledges/summary-report/',
};

class PledgesService {
  // GET: Fetch all pledges with filtering and pagination
  async getPledges(params = {}) {
    try {
      console.log('PledgesService.getPledges called with params:', params);
      
      // Clean up params
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });

      const response = await api.get(PLEDGES_ENDPOINTS.LIST, { params: cleanParams });
      console.log('PledgesService.getPledges response:', response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('PledgesService.getPledges error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch pledges',
        details: error.response?.data
      };
    }
  }

  // GET: Fetch single pledge by ID
  async getPledge(id) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch pledge',
      };
    }
  }

  // POST: Create new pledge
  async createPledge(pledgeData) {
    try {
      console.log('PledgesService.createPledge called with data:', pledgeData);
      
      // Validate required fields
      if (!pledgeData.member_id) {
        return {
          success: false,
          error: 'Member ID is required',
          validationErrors: { member_id: ['This field is required'] }
        };
      }

      if (!pledgeData.amount || pledgeData.amount <= 0) {
        return {
          success: false,
          error: 'Valid pledge amount is required',
          validationErrors: { amount: ['Amount must be greater than 0'] }
        };
      }

      const response = await api.post(PLEDGES_ENDPOINTS.CREATE, pledgeData);
      console.log('PledgesService.createPledge response:', response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('PledgesService.createPledge error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to create pledge',
        validationErrors: error.response?.data?.errors || error.response?.data,
      };
    }
  }

  // PUT/PATCH: Update existing pledge
  async updatePledge(id, pledgeData) {
    try {
      console.log('PledgesService.updatePledge called:', id, pledgeData);
      const response = await api.put(PLEDGES_ENDPOINTS.UPDATE(id), pledgeData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('PledgesService.updatePledge error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to update pledge',
        validationErrors: error.response?.data?.errors || error.response?.data,
      };
    }
  }

  // DELETE: Delete pledge
  async deletePledge(id) {
    try {
      await api.delete(PLEDGES_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to delete pledge',
      };
    }
  }

  // GET: Fetch pledge statistics
  async getStatistics(params = {}) {
    try {
      console.log('PledgesService.getStatistics called with params:', params);
      
      // Try primary endpoint first, fall back to alternative
      let response;
      try {
        response = await api.get(PLEDGES_ENDPOINTS.STATS, { params });
      } catch (primaryError) {
        console.log('Primary stats endpoint failed, trying alternative...');
        response = await api.get(PLEDGES_ENDPOINTS.STATISTICS, { params });
      }
      
      console.log('PledgesService.getStatistics response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('PledgesService.getStatistics error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch pledge statistics',
      };
    }
  }

  // Alias for backward compatibility
  async getPledgeStats(params = {}) {
    return this.getStatistics(params);
  }

  // GET: Fetch pledges for a specific member
  async getMemberPledges(memberId, params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.MEMBER_PLEDGES(memberId), { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch member pledges',
      };
    }
  }

  // GET: Export pledges data
  async exportPledges(params = {}, format = 'csv') {
    try {
      const exportParams = { ...params, format };
      const response = await api.get(PLEDGES_ENDPOINTS.EXPORT, { 
        params: exportParams,
        responseType: 'blob' 
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pledges_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to export pledges',
      };
    }
  }

  // POST: Bulk update pledges
  async bulkUpdatePledges(pledgeIds, updates) {
    try {
      const response = await api.post(PLEDGES_ENDPOINTS.BULK_UPDATE, {
        pledge_ids: pledgeIds,
        updates: updates,
        action: 'update'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to bulk update pledges',
      };
    }
  }

  // POST: Bulk delete pledges
  async bulkDeletePledges(pledgeIds) {
    try {
      const response = await api.post(PLEDGES_ENDPOINTS.BULK_DELETE, {
        pledge_ids: pledgeIds
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to bulk delete pledges',
      };
    }
  }

  // Payment Management Methods

  // GET: Fetch all payments
  async getPayments(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.PAYMENTS, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch payments',
      };
    }
  }

  // POST: Add payment to a pledge
  async addPayment(pledgeId, paymentData) {
    try {
      console.log('PledgesService.addPayment called:', pledgeId, paymentData);
      const response = await api.post(PLEDGES_ENDPOINTS.ADD_PAYMENT(pledgeId), paymentData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('PledgesService.addPayment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to add payment',
        validationErrors: error.response?.data?.errors || error.response?.data,
      };
    }
  }

  // GET: Fetch payment history for a pledge
  async getPaymentHistory(pledgeId) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.PAYMENT_HISTORY(pledgeId));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch payment history',
      };
    }
  }

  // PUT: Update a payment
  async updatePayment(paymentId, paymentData) {
    try {
      const response = await api.put(PLEDGES_ENDPOINTS.PAYMENT_DETAIL(paymentId), paymentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to update payment',
        validationErrors: error.response?.data?.errors || error.response?.data,
      };
    }
  }

  // DELETE: Delete a payment
  async deletePayment(paymentId) {
    try {
      await api.delete(PLEDGES_ENDPOINTS.PAYMENT_DETAIL(paymentId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to delete payment',
      };
    }
  }

  // Special Reports and Queries

  // GET: Fetch overdue pledges
  async getOverduePledges(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.OVERDUE, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch overdue pledges',
      };
    }
  }

  // GET: Fetch upcoming payments
  async getUpcomingPayments(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.UPCOMING, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to fetch upcoming payments',
      };
    }
  }

  // GET: Generate summary report
  async getSummaryReport(params = {}) {
    try {
      const response = await api.get(PLEDGES_ENDPOINTS.SUMMARY_REPORT, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.detail || 'Failed to generate summary report',
      };
    }
  }

  // Utility Functions

  // Calculate total pledge amount from pledge array
  calculateTotalPledgeAmount(pledges) {
    if (!Array.isArray(pledges)) return 0;
    
    return pledges.reduce((total, pledge) => {
      if (pledge?.status === 'active' || pledge?.status === 'completed') {
        return total + parseFloat(pledge?.total_pledged || pledge?.amount || 0);
      }
      return total;
    }, 0);
  }

  // Calculate total received amount from pledge array
  calculateTotalReceivedAmount(pledges) {
    if (!Array.isArray(pledges)) return 0;
    
    return pledges.reduce((total, pledge) => {
      return total + parseFloat(pledge?.total_received || 0);
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
    return frequencyMap[frequency?.toLowerCase()] || frequency || 'Unknown';
  }

  // Get pledge status display text
  getStatusDisplayText(status) {
    const statusMap = {
      'active': 'Active',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'overdue': 'Overdue',
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  }

  // Format pledge amount
  formatPledgeAmount(amount) {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Format date string
  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }

  // Calculate pledge completion percentage
  calculateCompletionPercentage(totalPledged, totalReceived) {
    const pledged = parseFloat(totalPledged || 0);
    const received = parseFloat(totalReceived || 0);
    
    if (pledged === 0) return 0;
    return Math.min((received / pledged) * 100, 100);
  }

  // Validate pledge data before submission
  validatePledgeData(pledgeData) {
    const errors = {};
    const warnings = [];

    // Required field validation
    if (!pledgeData.member_id) {
      errors.member_id = 'Member is required';
    }

    if (!pledgeData.amount || pledgeData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!pledgeData.frequency) {
      errors.frequency = 'Frequency is required';
    }

    if (!pledgeData.start_date) {
      errors.start_date = 'Start date is required';
    }

    // Logical validation
    if (pledgeData.start_date && pledgeData.end_date) {
      const startDate = new Date(pledgeData.start_date);
      const endDate = new Date(pledgeData.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }

      // Warn for very long pledge periods
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      if (monthsDiff > 60) { // 5 years
        warnings.push('This pledge period is longer than 5 years');
      }
    }

    // Warn for very large amounts
    if (pledgeData.amount > 10000) {
      warnings.push('This is a large pledge amount - please verify');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Generate pledge reminder message
  generateReminderMessage(pledge) {
    const memberName = pledge?.member?.name || pledge?.member_name || 'Member';
    const amount = this.formatPledgeAmount(pledge?.amount);
    const frequency = this.getFrequencyDisplayText(pledge?.frequency);
    
    return `Dear ${memberName}, this is a friendly reminder about your ${frequency.toLowerCase()} pledge of ${amount}. Thank you for your continued support!`;
  }

  // Calculate next payment date
  calculateNextPaymentDate(pledge) {
    if (!pledge?.start_date || pledge?.frequency === 'one-time') return null;
    
    const lastPayment = pledge?.last_payment_date || pledge?.start_date;
    const lastPaymentDate = new Date(lastPayment);
    
    switch (pledge?.frequency?.toLowerCase()) {
      case 'weekly':
        return new Date(lastPaymentDate.setDate(lastPaymentDate.getDate() + 7));
      case 'monthly':
        return new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));
      case 'quarterly':
        return new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 3));
      case 'annually':
        return new Date(lastPaymentDate.setFullYear(lastPaymentDate.getFullYear() + 1));
      default:
        return null;
    }
  }
}

export default new PledgesService();