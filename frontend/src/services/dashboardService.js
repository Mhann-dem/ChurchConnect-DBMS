import { api } from './api';

export const dashboardService = {
  // Get overall system statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/reports/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get member statistics
  getMemberStats: async (timeRange = '30d') => {
    try {
      const response = await api.get(`/api/members/stats/?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }
  },

  // Get pledge statistics
  getPledgeStats: async (timeRange = '30d') => {
    try {
      const response = await api.get(`/api/pledges/stats/?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pledge stats:', error);
      throw error;
    }
  },

  // Get group/ministry statistics
  getGroupStats: async () => {
    try {
      const response = await api.get('/api/groups/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching group stats:', error);
      throw error;
    }
  },

  // Get recent member registrations
  getRecentMembers: async (limit = 10) => {
    try {
      const response = await api.get(`/api/members/?ordering=-registration_date&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent members:', error);
      throw error;
    }
  },

  // Get recent pledges
  getRecentPledges: async (limit = 10) => {
    try {
      const response = await api.get(`/api/pledges/?ordering=-created_at&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent pledges:', error);
      throw error;
    }
  },

  // Get member growth data for charts
  getMemberGrowthData: async (timeRange = '12m') => {
    try {
      const response = await api.get(`/api/members/growth/?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member growth data:', error);
      throw error;
    }
  },

  // Get pledge trends data for charts
  getPledgeTrends: async (timeRange = '12m') => {
    try {
      const response = await api.get(`/api/pledges/trends/?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pledge trends:', error);
      throw error;
    }
  },

  // Get age demographics data
  getAgeDemo: async () => {
    try {
      const response = await api.get('/api/members/demographics/age/');
      return response.data;
    } catch (error) {
      console.error('Error fetching age demographics:', error);
      throw error;
    }
  },

  // Get gender demographics data
  getGenderDemo: async () => {
    try {
      const response = await api.get('/api/members/demographics/gender/');
      return response.data;
    } catch (error) {
      console.error('Error fetching gender demographics:', error);
      throw error;
    }
  },

  // Get ministry distribution data
  getMinistryDistribution: async () => {
    try {
      const response = await api.get('/api/groups/distribution/');
      return response.data;
    } catch (error) {
      console.error('Error fetching ministry distribution:', error);
      throw error;
    }
  },

  // Get members requiring follow-up
  getFollowUpMembers: async () => {
    try {
      const response = await api.get('/api/members/follow-up/');
      return response.data;
    } catch (error) {
      console.error('Error fetching follow-up members:', error);
      throw error;
    }
  },

  // Get upcoming birthdays
  getUpcomingBirthdays: async (days = 30) => {
    try {
      const response = await api.get(`/api/members/birthdays/?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error);
      throw error;
    }
  },

  // Get system activity summary
  getActivitySummary: async (timeRange = '7d') => {
    try {
      const response = await api.get(`/api/reports/activity/?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw error;
    }
  },

  // Get geographic distribution of members
  getGeographicData: async () => {
    try {
      const response = await api.get('/api/members/geographic/');
      return response.data;
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  },

  // Get member retention data
  getRetentionData: async () => {
    try {
      const response = await api.get('/api/members/retention/');
      return response.data;
    } catch (error) {
      console.error('Error fetching retention data:', error);
      throw error;
    }
  },

  // Get communication preferences summary
  getCommunicationPrefs: async () => {
    try {
      const response = await api.get('/api/members/communication-preferences/');
      return response.data;
    } catch (error) {
      console.error('Error fetching communication preferences:', error);
      throw error;
    }
  },

  // Get pledge fulfillment rates
  getPledgeFulfillment: async () => {
    try {
      const response = await api.get('/api/pledges/fulfillment/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pledge fulfillment:', error);
      throw error;
    }
  },

  // Get family statistics
  getFamilyStats: async () => {
    try {
      const response = await api.get('/api/families/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching family stats:', error);
      throw error;
    }
  },

  // Get comprehensive dashboard data (all key metrics)
  getDashboardData: async () => {
    try {
      const [
        stats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        upcomingBirthdays,
        followUpMembers
      ] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMemberStats(),
        dashboardService.getPledgeStats(),
        dashboardService.getGroupStats(),
        dashboardService.getRecentMembers(5),
        dashboardService.getRecentPledges(5),
        dashboardService.getUpcomingBirthdays(7),
        dashboardService.getFollowUpMembers()
      ]);

      return {
        stats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        upcomingBirthdays,
        followUpMembers
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Export dashboard data
  exportDashboardData: async (format = 'csv') => {
    try {
      const response = await api.get(`/api/reports/dashboard/export/?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  },

  // Get user-specific dashboard configuration
  getDashboardConfig: async (userId) => {
    try {
      const response = await api.get(`/api/dashboard/config/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard config:', error);
      throw error;
    }
  },

  // Save user dashboard configuration
  saveDashboardConfig: async (userId, config) => {
    try {
      const response = await api.post(`/api/dashboard/config/${userId}/`, config);
      return response.data;
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      throw error;
    }
  },

  // Get alerts and notifications
  getAlerts: async () => {
    try {
      const response = await api.get('/api/dashboard/alerts/');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Mark alert as read
  markAlertRead: async (alertId) => {
    try {
      const response = await api.patch(`/api/dashboard/alerts/${alertId}/`, {
        read: true
      });
      return response.data;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  },

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await api.get('/api/dashboard/health/');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }
};
