// services/dashboardService.js - Enhanced version with proper error handling and caching
import apiMethods from './api';

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Cache helper methods
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Enhanced API request with caching and error handling
  async makeRequest(endpoint, params = {}, useCache = true) {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log(`[DashboardService] Using cached data for ${endpoint}`);
        return cached;
      }
    }

    try {
      const response = await apiMethods.get(endpoint, { params });
      const data = response.data;
      
      if (useCache) {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`[DashboardService] Error fetching ${endpoint}:`, error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn(`[DashboardService] Returning stale cached data for ${endpoint}`);
        return cached.data;
      }
      
      // Return empty data structure to prevent UI crashes
      return this.getEmptyResponse(endpoint);
    }
  }

  // Get empty response structure based on endpoint
  getEmptyResponse(endpoint) {
    const emptyResponses = {
      '/reports/stats/': { total_members: 0, total_groups: 0, total_pledges: 0 },
      '/members/stats/': { total_members: 0, new_members: 0, growth_rate: 0 },
      '/pledges/stats/': { total_amount: 0, active_pledges: 0, growth_rate: 0 },
      '/groups/statistics/': { total_groups: 0, active_groups: 0, growth_rate: 0 },
      '/members/': { results: [], count: 0 },
      '/pledges/': { results: [], count: 0 }
    };

    return emptyResponses[endpoint] || { results: [], count: 0 };
  }

  // Get overall system statistics
  async getStats() {
    return await this.makeRequest('/reports/stats/');
  }

  // Get member statistics with time range
  async getMemberStats(timeRange = '30d') {
    return await this.makeRequest('/members/stats/', { range: timeRange });
  }

  // Get pledge statistics with time range
  async getPledgeStats(timeRange = '30d') {
    return await this.makeRequest('/pledges/stats/', { range: timeRange });
  }

  // Get group/ministry statistics
  async getGroupStats() {
    return await this.makeRequest('/groups/statistics/');
  }

  // Get recent member registrations
  async getRecentMembers(limit = 10) {
    return await this.makeRequest('/members/', { 
      ordering: '-registration_date', 
      limit 
    });
  }

  // Get recent pledges
  async getRecentPledges(limit = 10) {
    return await this.makeRequest('/pledges/', { 
      ordering: '-created_at', 
      limit 
    });
  }

  // Get member growth data for charts
  async getMemberGrowthData(timeRange = '12m') {
    return await this.makeRequest('/members/growth/', { range: timeRange });
  }

  // Get pledge trends data for charts
  async getPledgeTrends(timeRange = '12m') {
    return await this.makeRequest('/pledges/trends/', { range: timeRange });
  }

  // Get age demographics data
  async getAgeDemo() {
    return await this.makeRequest('/members/demographics/age/');
  }

  // Get gender demographics data
  async getGenderDemo() {
    return await this.makeRequest('/members/demographics/gender/');
  }

  // Get ministry distribution data
  async getMinistryDistribution() {
    return await this.makeRequest('/groups/distribution/');
  }

  // Get members requiring follow-up
  async getFollowUpMembers() {
    return await this.makeRequest('/members/follow-up/');
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(days = 30) {
    return await this.makeRequest('/members/birthdays/', { days });
  }

  // Get system activity summary
  async getActivitySummary(timeRange = '7d') {
    return await this.makeRequest('/reports/activity/', { range: timeRange });
  }

  // Get geographic distribution of members
  async getGeographicData() {
    return await this.makeRequest('/members/geographic/');
  }

  // Get member retention data
  async getRetentionData() {
    return await this.makeRequest('/members/retention/');
  }

  // Get communication preferences summary
  async getCommunicationPrefs() {
    return await this.makeRequest('/members/communication-preferences/');
  }

  // Get pledge fulfillment rates
  async getPledgeFulfillment() {
    return await this.makeRequest('/pledges/fulfillment/');
  }

  // Get family statistics
  async getFamilyStats() {
    return await this.makeRequest('/families/stats/');
  }

  // Get comprehensive dashboard data (all key metrics)
  async getDashboardData(timeRange = '30d') {
    try {
      console.log('[DashboardService] Fetching comprehensive dashboard data...');
      
      const [
        stats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        upcomingBirthdays
      ] = await Promise.allSettled([
        this.getStats(),
        this.getMemberStats(timeRange),
        this.getPledgeStats(timeRange),
        this.getGroupStats(),
        this.getRecentMembers(5),
        this.getRecentPledges(5),
        this.getUpcomingBirthdays(7)
      ]);

      // Process results, handling failures gracefully
      const processResult = (result, fallback = {}) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn('[DashboardService] Promise rejected:', result.reason);
          return fallback;
        }
      };

      return {
        stats: processResult(stats),
        memberStats: processResult(memberStats),
        pledgeStats: processResult(pledgeStats),
        groupStats: processResult(groupStats),
        recentMembers: processResult(recentMembers, { results: [] }),
        recentPledges: processResult(recentPledges, { results: [] }),
        upcomingBirthdays: processResult(upcomingBirthdays, { results: [] }),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Export dashboard data
  async exportDashboardData(format = 'csv') {
    try {
      const response = await apiMethods.get('/reports/dashboard/export/', {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('[DashboardService] Error exporting dashboard data:', error);
      throw error;
    }
  }

  // Get user-specific dashboard configuration
  async getDashboardConfig(userId) {
    return await this.makeRequest(`/dashboard/config/${userId}/`);
  }

  // Save user dashboard configuration
  async saveDashboardConfig(userId, config) {
    try {
      const response = await apiMethods.post(`/dashboard/config/${userId}/`, config);
      return response.data;
    } catch (error) {
      console.error('[DashboardService] Error saving dashboard config:', error);
      throw error;
    }
  }

  // Get alerts and notifications
  async getAlerts() {
    return await this.makeRequest('/dashboard/alerts/');
  }

  // Mark alert as read
  async markAlertRead(alertId) {
    try {
      const response = await apiMethods.patch(`/dashboard/alerts/${alertId}/`, {
        read: true
      });
      return response.data;
    } catch (error) {
      console.error('[DashboardService] Error marking alert as read:', error);
      throw error;
    }
  }

  // Get system health status
  async getSystemHealth() {
    return await this.makeRequest('/dashboard/health/', {}, false); // Don't cache health data
  }

  // Refresh all cached data
  async refreshAll(timeRange = '30d') {
    console.log('[DashboardService] Refreshing all dashboard data...');
    this.clearCache();
    return await this.getDashboardData(timeRange);
  }

  // Get real-time statistics (no caching)
  async getRealTimeStats() {
    return await this.makeRequest('/reports/stats/', {}, false);
  }

  // Validate API connectivity
  async testConnection() {
    try {
      const response = await apiMethods.get('/core/health/');
      return { 
        success: true, 
        message: 'API connection successful',
        data: response.data 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'API connection failed',
        error: error.message 
      };
    }
  }

  // Get member activity trends
  async getMemberActivity(timeRange = '30d') {
    return await this.makeRequest('/members/activity/', { range: timeRange });
  }

  // Get financial summary
  async getFinancialSummary(timeRange = '30d') {
    return await this.makeRequest('/pledges/financial-summary/', { range: timeRange });
  }

  // Get group membership trends
  async getGroupMembershipTrends(timeRange = '30d') {
    return await this.makeRequest('/groups/membership-trends/', { range: timeRange });
  }

  // Get event attendance data
  async getEventAttendance(timeRange = '30d') {
    return await this.makeRequest('/events/attendance/', { range: timeRange });
  }
}

// Create and export singleton instance
const dashboardService = new DashboardService();

export { dashboardService };
export default dashboardService;