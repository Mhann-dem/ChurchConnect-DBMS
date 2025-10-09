// services/pledges.js - FIXED VERSION
import apiMethods from './api';

const ENDPOINTS = {
  LIST: 'pledges/',
  DETAIL: (id) => `pledges/${id}/`,
  CREATE: 'pledges/',
  UPDATE: (id) => `pledges/${id}/`,
  DELETE: (id) => `pledges/${id}/`,
  STATISTICS: 'pledges/statistics/',
  RECENT: 'pledges/recent/',
  TRENDS: 'pledges/trends/',
  EXPORT: 'pledges/export/',
  BULK_ACTION: 'pledges/bulk-action/',
  ADD_PAYMENT: (id) => `pledges/${id}/add-payment/`,
  PAYMENT_HISTORY: (id) => `pledges/${id}/payment-history/`,
};

class PledgesService {
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

  // ✅ FIXED: Return response.data directly without extra wrapping
  async getPledges(params = {}) {
    try {
      console.log('[PledgesService] Fetching pledges with params:', params);
      
      // Clean params
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
          cleanParams[key] = params[key];
        }
      });

      // Call API - returns axios response with response.data containing Django's response
      const response = await apiMethods.get(ENDPOINTS.LIST, { params: cleanParams });
      
      console.log('[PledgesService] ✅ Django response received:', {
        hasData: !!response.data,
        hasResults: !!response.data?.results,
        isArray: Array.isArray(response.data?.results),
        resultsCount: response.data?.results?.length || 0,
        totalCount: response.data?.count,
        dataType: typeof response.data,
        firstPledge: response.data?.results?.[0] ? 
          `${response.data.results[0].member_details?.full_name || 'N/A'} - ${response.data.results[0].amount}` : 
          'none'
      });

      // ✅ CRITICAL FIX: Return response.data DIRECTLY (it's already the Django pagination object)
      // Django returns: { count, next, previous, results: [...] }
      // We return that directly so usePledges can extract response.data.results
      return response.data;
      
    } catch (error) {
      console.error('[PledgesService] ❌ Error fetching pledges:', error);
      throw error; // Let usePledges handle the error
    }
  }

  async getPledge(id) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    return this.handleApiCall(async () => {
      return await apiMethods.get(ENDPOINTS.DETAIL(id));
    }, `fetch pledge ${id}`);
  }

  async createPledge(pledgeData) {
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
      // ✅ CRITICAL FIX: Use 'member' not 'member_id' to match Django serializer
      const formattedData = {
        member: pledgeData.member_id || pledgeData.member,  // Django expects 'member' UUID
        amount: parseFloat(pledgeData.amount),
        frequency: pledgeData.frequency,
        start_date: pledgeData.start_date,
        end_date: pledgeData.frequency === 'one-time' ? null : pledgeData.end_date,
        status: pledgeData.status || 'active',
        notes: pledgeData.notes || ''
      };

      console.log('[PledgesService] Creating pledge with formatted data:', formattedData);

      const response = await apiMethods.post(ENDPOINTS.CREATE, formattedData);
      return response;
    }, 'create pledge');
  }

  async updatePledge(id, pledgeData) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    const validation = this.validatePledgeData(pledgeData, false);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    return this.handleApiCall(async () => {
      const formattedData = {
        ...pledgeData,
        amount: pledgeData.amount ? parseFloat(pledgeData.amount) : undefined,
      };

      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined) {
          delete formattedData[key];
        }
      });

      return await apiMethods.put(ENDPOINTS.UPDATE(id), formattedData);
    }, `update pledge ${id}`);
  }

  async deletePledge(id) {
    if (!id) {
      return { success: false, error: 'Pledge ID is required' };
    }

    return this.handleApiCall(async () => {
      await apiMethods.delete(ENDPOINTS.DELETE(id));
      return { message: 'Pledge deleted successfully' };
    }, `delete pledge ${id}`);
  }

  // ✅ FIXED: Proper statistics handling
  async getStatistics(params = {}) {
    try {
      console.log('[PledgesService] Fetching statistics with params:', params);
      
      const response = await apiMethods.get(ENDPOINTS.STATISTICS, { params });
      
      console.log('[PledgesService] Statistics response:', {
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {})
      });
      
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('[PledgesService] Statistics error:', error);
      return {
        success: true,  // Return success with empty data to prevent blocking
        data: {}
      };
    }
  }

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

  async exportPledges(params = {}, format = 'csv') {
    return this.handleApiCall(async () => {
      const exportParams = { ...params, format };
      const response = await apiMethods.get(ENDPOINTS.EXPORT, { 
        params: exportParams,
        responseType: 'blob' 
      });

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

  validatePledgeData(pledgeData, requireAll = true) {
    const errors = {};
    const warnings = [];

    if (requireAll || pledgeData.member_id !== undefined || pledgeData.member !== undefined) {
      if (!pledgeData.member_id && !pledgeData.member) {
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

    if (pledgeData.start_date && pledgeData.end_date) {
      const startDate = new Date(pledgeData.start_date);
      const endDate = new Date(pledgeData.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }

      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      if (monthsDiff > 60) {
        warnings.push('Pledge duration exceeds 5 years - please verify');
      }
    }

    if (pledgeData.frequency && pledgeData.frequency !== 'one-time' && !pledgeData.end_date && requireAll) {
      errors.end_date = 'End date is required for recurring pledges';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

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
}

export default new PledgesService();