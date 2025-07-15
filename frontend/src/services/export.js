// services/export.js
import { api } from './api';

const EXPORT_ENDPOINTS = {
  MEMBERS: '/export/members/',
  PLEDGES: '/export/pledges/',
  GROUPS: '/export/groups/',
  CUSTOM: '/export/custom/',
};

class ExportService {
  async exportData(type, format = 'csv', filters = {}) {
    try {
      const endpoint = EXPORT_ENDPOINTS[type.toUpperCase()];
      if (!endpoint) {
        throw new Error('Invalid export type');
      }

      const response = await api.post(endpoint, {
        format,
        filters,
      }, {
        responseType: 'blob',
      });

      // Create download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Export failed',
      };
    }
  }

  async exportMembers(format = 'csv', filters = {}) {
    return this.exportData('members', format, filters);
  }

  async exportPledges(format = 'csv', filters = {}) {
    return this.exportData('pledges', format, filters);
  }

  async exportGroups(format = 'csv', filters = {}) {
    return this.exportData('groups', format, filters);
  }

  async exportCustom(config) {
    try {
      const response = await api.post(EXPORT_ENDPOINTS.CUSTOM, config, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: config.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.name || 'custom-export'}-${new Date().toISOString().split('T')[0]}.${config.format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Custom export failed',
      };
    }
  }

  // Generate export preview
  async getExportPreview(type, filters = {}) {
    try {
      const endpoint = EXPORT_ENDPOINTS[type.toUpperCase()];
      const response = await api.post(`${endpoint}preview/`, { filters });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Preview generation failed',
      };
    }
  }
}

export default new ExportService();