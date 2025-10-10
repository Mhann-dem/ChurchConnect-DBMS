// services/pledges.js - DIAGNOSTIC VERSION
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

  async getPledges(params = {}) {
    try {
      console.log('[PledgesService] 🔵 Fetching pledges with params:', params);
      
      // Clean params
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
          cleanParams[key] = params[key];
        }
      });

      console.log('[PledgesService] 🔵 Clean params:', cleanParams);

      // Call API
      const response = await apiMethods.get(ENDPOINTS.LIST, { params: cleanParams });
      
      // 🔍 DIAGNOSTIC LOGGING - Let's see EXACTLY what we're getting
      console.log('[PledgesService] 🔍 RAW RESPONSE:', {
        fullResponse: response,
        responseType: typeof response,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        dataIsArray: Array.isArray(response?.data),
        dataHasResults: !!response?.data?.results,
        resultsIsArray: Array.isArray(response?.data?.results),
        resultsLength: response?.data?.results?.length,
        dataHasCount: !!response?.data?.count,
        count: response?.data?.count,
        firstItem: response?.data?.results?.[0]
      });

      // Log the actual structure
      if (response?.data) {
        console.log('[PledgesService] 🔍 Response.data structure:', JSON.stringify({
          keys: Object.keys(response.data),
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          resultsType: typeof response.data.results,
          resultsIsArray: Array.isArray(response.data.results),
          resultsLength: response.data.results?.length
        }, null, 2));

        if (response.data.results && response.data.results.length > 0) {
          console.log('[PledgesService] 🔍 First pledge sample:', JSON.stringify({
            id: response.data.results[0].id,
            amount: response.data.results[0].amount,
            member_details: response.data.results[0].member_details,
            status: response.data.results[0].status,
            frequency: response.data.results[0].frequency
          }, null, 2));
        }
      }

      // Return the data exactly as Django provides it
      console.log('[PledgesService] ✅ Returning Django pagination object directly');
      return response.data;
      
    } catch (error) {
      console.error('[PledgesService] ❌ Error fetching pledges:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
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
      const formattedData = {
        member: pledgeData.member_id || pledgeData.member,
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
        success: true,
        data: {}
      };
    }
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
}

export default new PledgesService();