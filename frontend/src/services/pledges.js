// services/pledges.js - ENHANCED VERSION with better error handling and success feedback
import apiMethods from './api';

const ENDPOINTS = {
  LIST: 'pledges/',
  DETAIL: (id) => `pledges/${id}/`,
  CREATE: 'pledges/',
  UPDATE: (id) => `pledges/${id}/`,
  DELETE: (id) => `pledges/${id}/`,
  
  // FIXED: Support both endpoint variations
  STATS: 'pledges/stats/',
  STATISTICS: 'pledges/statistics/',
  
  RECENT: 'pledges/recent/',
  TRENDS: 'pledges/trends/',
  EXPORT: 'pledges/export/',
  
  // Bulk operations
  BULK_UPDATE: 'pledges/bulk-update/',
  BULK_DELETE: 'pledges/bulk-delete/',
  BULK_ACTION: 'pledges/bulk-action/',
  
  // Payment endpoints
  ADD_PAYMENT: (id) => `pledges/${id}/add-payment/`,
  PAYMENT_HISTORY: (id) => `pledges/${id}/payment-history/`,
  PAYMENTS: 'pledges/payments/',
};

class PledgesService {
  // Enhanced error handling wrapper
  async handleApiCall(apiCall, operation = 'operation') {
    try {
      console.log(`[PledgesService] Starting ${operation}...`);
      const result = await apiCall();
      console.log(`[PledgesService] ${operation} completed successfully`);
      return {
        success: true,
        data: result.data || result,
        message: `${operation} completed successfully`
      };
    } catch (error) {
      console.error(`[PledgesService] ${operation} failed:`, error);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          error?.message ||
                          `${operation} failed`;
      
      return {
        success: false,
        error: errorMessage,
        details: error?.response?.data,
        status: error?.response?.status
      };
    }
  }

  // GET: Fetch pledges with enhanced params handling
  async getPledges(params = {}) {
    return this.handleApiCall(async () => {
      // Clean and validate params
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
          cleanParams[key] = params[key];
        }
      });

      const response = await apiMethods.get(ENDPOINTS.LIST, { params: cleanParams });
      return response;
    }, 'fetch pledges');
  }

  // GET: Single pledge
  async getPledge(id) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    return this.handleApiCall(async () => {
      return await apiMethods.get(ENDPOINTS.DETAIL(id));
    }, `fetch pledge ${id}`);
  }

  // POST: Create pledge with validation
  async createPledge(pledgeData) {
    // Client-side validation
    const validation = this.validatePledgeData(pledgeData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings
      };
    }

    return this.handleApiCall(async () => {
      // Ensure required fields are properly formatted
      const formattedData = {
        ...pledgeData,
        amount: parseFloat(pledgeData.amount),
        member_id: parseInt(pledgeData.member_id),
        start_date: pledgeData.start_date,
        end_date: pledgeData.frequency === 'one-time' ? null : pledgeData.end_date,
      };

      const response = await apiMethods.post(ENDPOINTS.CREATE, formattedData);
      return response;
    }, 'create pledge');
  }

  // PUT: Update pledge
  async updatePledge(id, pledgeData) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    const validation = this.validatePledgeData(pledgeData, false); // Allow partial updates
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings
      };
    }

    return this.handleApiCall(async () => {
      const formattedData = {
        ...pledgeData,
        amount: pledgeData.amount ? parseFloat(pledgeData.amount) : undefined,
        member_id: pledgeData.member_id ? parseInt(pledgeData.member_id) : undefined,
      };

      // Remove undefined values for PATCH-like behavior
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined) {
          delete formattedData[key];
        }
      });

      return await apiMethods.put(ENDPOINTS.UPDATE(id), formattedData);
    }, `update pledge ${id}`);
  }

  // DELETE: Delete pledge
  async deletePledge(id) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    return this.handleApiCall(async () => {
      await apiMethods.delete(ENDPOINTS.DELETE(id));
      return { message: 'Pledge deleted successfully' };
    }, `delete pledge ${id}`);
  }

  // GET: Statistics with fallback
  async getStatistics(params = {}) {
    return this.handleApiCall(async () => {
      // Use the CORRECT endpoint that matches Django
      return await apiMethods.get(ENDPOINTS.STATISTICS, { params });
    }, 'fetch pledge statistics');
  }

  // GET: Recent pledges
  async getRecentPledges(limit = 10) {
    return this.handleApiCall(async () => {
      return await apiMethods.get(ENDPOINTS.RECENT, { params: { limit } });
    }, 'fetch recent pledges');
  }

  // GET: Pledge trends
  async getPledgeTrends(range = '12m') {
    return this.handleApiCall(async () => {
      return await apiMethods.get(ENDPOINTS.TRENDS, { params: { range } });
    }, 'fetch pledge trends');
  }

  // POST: Bulk update pledges
  async bulkUpdatePledges(pledgeIds, updates) {
    if (!Array.isArray(pledgeIds) || pledgeIds.length === 0) {
      return { success: false, error: 'No pledges selected for bulk update' };
    }

    return this.handleApiCall(async () => {
      return await apiMethods.post(ENDPOINTS.BULK_ACTION, {
        action: 'bulk_update',
        pledge_ids: pledgeIds,
        updates: updates
      });
    }, `bulk update ${pledgeIds.length} pledges`);
  }

  // POST: Bulk delete pledges
  async bulkDeletePledges(pledgeIds) {
    if (!Array.isArray(pledgeIds) || pledgeIds.length === 0) {
      return { success: false, error: 'No pledges selected for bulk delete' };
    }

    return this.handleApiCall(async () => {
      return await apiMethods.post(ENDPOINTS.BULK_ACTION, {
        action: 'delete',
        pledge_ids: pledgeIds
      });
    }, `bulk delete ${pledgeIds.length} pledges`);
  }

  // POST: Add payment to pledge
  async addPayment(pledgeId, paymentData) {
    if (!pledgeId) {
      return { success: false, error: 'Pledge ID is required' };
    }

    // Validate payment data
    if (!paymentData.amount || paymentData.amount <= 0) {
      return { success: false, error: 'Valid payment amount is required' };
    }

    return this.handleApiCall(async () => {
      const formattedData = {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        payment_method: paymentData.payment_method || 'cash'
      };

      return await apiMethods.post(ENDPOINTS.ADD_PAYMENT(pledgeId), formattedData);
    }, `add payment to pledge ${pledgeId}`);
  }

  // GET: Payment history
  async getPaymentHistory(pledgeId) {
    if (!pledgeId) {
      return { success: false, error: 'Pledge ID is required' };
    }

    return this.handleApiCall(async () => {
      return await apiMethods.get(ENDPOINTS.PAYMENT_HISTORY(pledgeId));
    }, `fetch payment history for pledge ${pledgeId}`);
  }

  // GET: Export pledges
  async exportPledges(params = {}, format = 'csv') {
    return this.handleApiCall(async () => {
      const exportParams = { ...params, format };
      const response = await apiMethods.get(ENDPOINTS.EXPORT, { 
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

      return { message: 'Export completed successfully' };
    }, 'export pledges');
  }

  // Enhanced validation
  validatePledgeData(pledgeData, requireAll = true) {
    const errors = {};
    const warnings = [];

    if (requireAll || pledgeData.member_id !== undefined) {
      if (!pledgeData.member_id) {
        errors.member_id = 'Member is required';
      }
    }

    if (requireAll || pledgeData.amount !== undefined) {
      if (!pledgeData.amount || pledgeData.amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
      } else if (pledgeData.amount > 100000) {
        warnings.push('This is a very large pledge amount - please verify');
      }
    }

    if (requireAll || pledgeData.frequency !== undefined) {
      if (!pledgeData.frequency) {
        errors.frequency = 'Frequency is required';
      }
    }

    if (requireAll || pledgeData.start_date !== undefined) {
      if (!pledgeData.start_date) {
        errors.start_date = 'Start date is required';
      }
    }

    // Date validation
    if (pledgeData.start_date && pledgeData.end_date) {
      const startDate = new Date(pledgeData.start_date);
      const endDate = new Date(pledgeData.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }

      // Check for unreasonably long periods
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      if (monthsDiff > 60) { // 5 years
        warnings.push('Pledge duration exceeds 5 years - please verify');
      }
    }

    // End date requirement for non-one-time pledges
    if (pledgeData.frequency && pledgeData.frequency !== 'one-time' && !pledgeData.end_date && requireAll) {
      errors.end_date = 'End date is required for recurring pledges';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Utility: Calculate total pledge amount
  calculateTotalPledged(pledge) {
    if (!pledge) return 0;

    if (pledge.frequency === 'one-time' || !pledge.start_date || !pledge.end_date) {
      return parseFloat(pledge.amount || 0);
    }

    const startDate = new Date(pledge.start_date);
    const endDate = new Date(pledge.end_date);
    const monthsDiff = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + 
                       (endDate.getMonth() - startDate.getMonth());
    const amount = parseFloat(pledge.amount || 0);

    switch (pledge.frequency?.toLowerCase()) {
      case 'weekly':
        return amount * Math.ceil(monthsDiff * 4.33);
      case 'monthly':
        return amount * Math.max(1, monthsDiff);
      case 'quarterly':
        return amount * Math.max(1, Math.ceil(monthsDiff / 3));
      case 'annually':
        return amount * Math.max(1, Math.ceil(monthsDiff / 12));
      default:
        return amount;
    }
  }

  // Utility: Format currency
  formatCurrency(amount) {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Utility: Calculate completion percentage
  calculateCompletionPercentage(totalPledged, totalReceived) {
    const pledged = parseFloat(totalPledged || 0);
    const received = parseFloat(totalReceived || 0);
    
    if (pledged === 0) return 0;
    return Math.min((received / pledged) * 100, 100);
  }
}

export default new PledgesService();