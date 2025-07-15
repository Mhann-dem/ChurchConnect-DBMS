// services/reports.js
import { api } from './api';

const REPORTS_ENDPOINTS = {
  STATS: '/reports/stats/',
  MEMBERS_CSV: '/reports/members/csv/',
  PLEDGES_CSV: '/reports/pledges/csv/',
  GROUPS_CSV: '/reports/groups/csv/',
  CUSTOM_REPORT: '/reports/custom/',
  DASHBOARD_STATS: '/reports/dashboard/',
};

class ReportsService {
  async getSystemStats() {
    try {
      const response = await api.get(REPORTS_ENDPOINTS.STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch system stats',
      };
    }
  }

  async getDashboardStats() {
    try {
      const response = await api.get(REPORTS_ENDPOINTS.DASHBOARD_STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch dashboard stats',
      };
    }
  }

  async exportMembersCSV(filters = {}) {
    try {
      const response = await api.get(REPORTS_ENDPOINTS.MEMBERS_CSV, {
        params: filters,
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export members CSV',
      };
    }
  }

  async exportPledgesCSV(filters = {}) {
    try {
      const response = await api.get(REPORTS_ENDPOINTS.PLEDGES_CSV, {
        params: filters,
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pledges-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export pledges CSV',
      };
    }
  }

  async exportGroupsCSV(filters = {}) {
    try {
      const response = await api.get(REPORTS_ENDPOINTS.GROUPS_CSV, {
        params: filters,
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `groups-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export groups CSV',
      };
    }
  }

  async generateCustomReport(reportConfig) {
    try {
      const response = await api.post(REPORTS_ENDPOINTS.CUSTOM_REPORT, reportConfig);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate custom report',
      };
    }
  }

  // Helper method to format stats for display
  formatStatsForDisplay(stats) {
    return {
      totalMembers: stats.total_members || 0,
      newMembersThisMonth: stats.new_members_this_month || 0,
      totalPledges: stats.total_pledges || 0,
      totalPledgeAmount: stats.total_pledge_amount || 0,
      totalGroups: stats.total_groups || 0,
      activeGroups: stats.active_groups || 0,
      memberGrowthRate: stats.member_growth_rate || 0,
      pledgeCompletionRate: stats.pledge_completion_rate || 0,
    };
  }
}

export default new ReportsService();