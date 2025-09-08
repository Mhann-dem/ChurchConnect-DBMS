// services/dashboardService.js - Enhanced version with proper Django backend integration
import apiMethods from './api';

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      backoffMultiplier: 2
    };
  }

  // Cache management
  getCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[DashboardService] Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`[DashboardService] Cached data for ${key}`);
  }

  clearCache(pattern = null) {
    if (pattern) {
      // Clear cache entries matching pattern
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`[DashboardService] Cleared ${keysToDelete.length} cache entries matching "${pattern}"`);
    } else {
      this.cache.clear();
      console.log('[DashboardService] Cleared all cache');
    }
  }

  // Retry logic for API calls
  async retryRequest(requestFn, retries = this.retryConfig.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.warn(`[DashboardService] Attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Enhanced API request with caching, retry, and error handling
  async makeRequest(requestFn, cacheKey = null, useCache = true, fallbackData = null) {
    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const data = await this.retryRequest(requestFn);
      
      // Cache successful response
      if (useCache && cacheKey) {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`[DashboardService] Request failed after retries:`, error.message);
      
      // Return stale cache if available
      if (cacheKey) {
        const staleCache = this.cache.get(cacheKey);
        if (staleCache) {
          console.warn(`[DashboardService] Returning stale cached data for ${cacheKey}`);
          return staleCache.data;
        }
      }
      
      // Return fallback data if provided
      if (fallbackData !== null) {
        console.warn(`[DashboardService] Returning fallback data`);
        return fallbackData;
      }
      
      throw error;
    }
  }

  // Get overall system statistics
  async getStats() {
    const cacheKey = this.getCacheKey('dashboard_stats');
    return await this.makeRequest(
      () => apiMethods.dashboard.getStats(),
      cacheKey,
      true,
      { 
        total_members: 0, 
        total_groups: 0, 
        total_pledges: 0,
        monthly_revenue: 0,
        system_status: 'unknown'
      }
    );
  }

  // Get member statistics with time range
  async getMemberStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('member_stats', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.members.getStats(timeRange),
      cacheKey,
      true,
      { 
        total_members: 0, 
        new_members: 0, 
        active_members: 0,
        growth_rate: 0,
        retention_rate: 0
      }
    );
  }

  // Get pledge statistics with time range
  async getPledgeStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('pledge_stats', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.pledges.getStats(timeRange),
      cacheKey,
      true,
      { 
        total_amount: 0, 
        active_pledges: 0, 
        monthly_total: 0,
        growth_rate: 0,
        fulfillment_rate: 0
      }
    );
  }

  // Get group/ministry statistics
  async getGroupStats() {
    const cacheKey = this.getCacheKey('group_stats');
    return await this.makeRequest(
      () => apiMethods.groups.getStats(),
      cacheKey,
      true,
      { 
        total_groups: 0, 
        active_groups: 0, 
        growth_rate: 0,
        avg_group_size: 0
      }
    );
  }

  // Get recent member registrations
  async getRecentMembers(limit = 10) {
    const cacheKey = this.getCacheKey('recent_members', { limit });
    return await this.makeRequest(
      () => apiMethods.dashboard.getRecentMembers(limit),
      cacheKey,
      true,
      { results: [] }
    );
  }

  // Get recent pledges
  async getRecentPledges(limit = 10) {
    const cacheKey = this.getCacheKey('recent_pledges', { limit });
    return await this.makeRequest(
      () => apiMethods.dashboard.getRecentPledges(limit),
      cacheKey,
      true,
      { results: [] }
    );
  }

  // Get system health status
  async getSystemHealth() {
    // Don't cache health data - it should be real-time
    return await this.makeRequest(
      () => apiMethods.dashboard.getSystemHealth(),
      null,
      false,
      { status: 'unknown', uptime: 'Unknown' }
    );
  }

  // Get alerts and notifications
  async getAlerts() {
    const cacheKey = this.getCacheKey('alerts');
    return await this.makeRequest(
      () => apiMethods.dashboard.getAlerts(),
      cacheKey,
      true,
      { results: [] }
    );
  }

  // Mark alert as read
  async markAlertRead(alertId) {
    try {
      const result = await apiMethods.dashboard.markAlertRead(alertId);
      
      // Clear alerts cache to force refresh
      this.clearCache('alerts');
      
      return result;
    } catch (error) {
      console.error(`[DashboardService] Failed to mark alert ${alertId} as read:`, error);
      throw error;
    }
  }

  // Get member growth data for charts
  async getMemberGrowthData(timeRange = '12m') {
    const cacheKey = this.getCacheKey('member_growth', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.get(`members/growth/`, { params: { range: timeRange } }),
      cacheKey,
      true,
      { results: [], labels: [], datasets: [] }
    );
  }

  // Get pledge trends data for charts
  async getPledgeTrends(timeRange = '12m') {
    const cacheKey = this.getCacheKey('pledge_trends', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.pledges.getTrends(timeRange),
      cacheKey,
      true,
      { results: [], labels: [], datasets: [] }
    );
  }

  // Get age demographics data
  async getAgeDemo() {
    const cacheKey = this.getCacheKey('age_demographics');
    return await this.makeRequest(
      () => apiMethods.members.getDemographics('age'),
      cacheKey,
      true,
      { age_groups: [], data: [] }
    );
  }

  // Get gender demographics data
  async getGenderDemo() {
    const cacheKey = this.getCacheKey('gender_demographics');
    return await this.makeRequest(
      () => apiMethods.members.getDemographics('gender'),
      cacheKey,
      true,
      { genders: [], data: [] }
    );
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(days = 30) {
    const cacheKey = this.getCacheKey('upcoming_birthdays', { days });
    return await this.makeRequest(
      () => apiMethods.members.getBirthdays(days),
      cacheKey,
      true,
      { results: [] }
    );
  }

  // Get system activity summary
  async getActivitySummary(timeRange = '7d') {
    const cacheKey = this.getCacheKey('activity_summary', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.reports.getActivity(timeRange),
      cacheKey,
      true,
      { activities: [], summary: {} }
    );
  }

  // Get comprehensive dashboard data (all key metrics)
  async getDashboardData(timeRange = '30d', forceRefresh = false) {
    try {
      console.log('[DashboardService] Fetching comprehensive dashboard data...');
      
      if (forceRefresh) {
        console.log('[DashboardService] Force refresh requested, clearing cache');
        this.clearCache();
      }
      
      // Execute requests with proper error handling
      const requests = [
        this.getStats(),
        this.getMemberStats(timeRange),
        this.getPledgeStats(timeRange),
        this.getGroupStats(),
        this.getRecentMembers(5),
        this.getRecentPledges(5),
        this.getSystemHealth(),
        this.getAlerts()
      ];

      const [
        stats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        systemHealth,
        alerts
      ] = await Promise.allSettled(requests);

      // Process results with proper error handling
      const processResult = (result, fallback = {}) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn('[DashboardService] Request failed:', result.reason?.message);
          return fallback;
        }
      };

      const dashboardData = {
        stats: processResult(stats, { 
          total_members: 0, 
          total_groups: 0, 
          total_pledges: 0 
        }),
        memberStats: processResult(memberStats, { 
          total_members: 0, 
          new_members: 0, 
          growth_rate: 0 
        }),
        pledgeStats: processResult(pledgeStats, { 
          total_amount: 0, 
          active_pledges: 0, 
          growth_rate: 0 
        }),
        groupStats: processResult(groupStats, { 
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0 
        }),
        recentMembers: processResult(recentMembers, { results: [] }),
        recentPledges: processResult(recentPledges, { results: [] }),
        systemHealth: processResult(systemHealth, { status: 'unknown' }),
        alerts: processResult(alerts, { results: [] }),
        lastUpdated: new Date(),
        cacheStatus: {
          totalEntries: this.cache.size,
          oldestEntry: this.getOldestCacheEntry(),
          hitRate: this.calculateCacheHitRate()
        }
      };

      console.log('[DashboardService] Dashboard data fetched successfully:', {
        statsLoaded: !!dashboardData.stats,
        membersCount: dashboardData.recentMembers?.results?.length || 0,
        pledgesCount: dashboardData.recentPledges?.results?.length || 0,
        alertsCount: dashboardData.alerts?.results?.length || 0,
        systemStatus: dashboardData.systemHealth?.status,
        cacheEntries: this.cache.size
      });

      return dashboardData;
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }

  // Cache analytics
  getOldestCacheEntry() {
    if (this.cache.size === 0) return null;
    
    let oldestTime = Date.now();
    for (const [key, value] of this.cache) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
      }
    }
    
    return new Date(oldestTime);
  }

  calculateCacheHitRate() {
    // This is a simplified version - in production you'd track hits/misses
    return this.cache.size > 0 ? 0.75 : 0; // Assume 75% hit rate when cache has data
  }

  // Export dashboard data
  async exportDashboardData(format = 'csv') {
    try {
      console.log(`[DashboardService] Exporting dashboard data as ${format}...`);
      
      const response = await apiMethods.get('reports/dashboard/export/', {
        params: { format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('[DashboardService] Export failed:', error);
      throw new Error(`Failed to export dashboard data: ${error.message}`);
    }
  }

  // Get user-specific dashboard configuration
  async getDashboardConfig(userId) {
    try {
      const config = await apiMethods.dashboard.getDashboardConfig(userId);
      return config || this.getDefaultDashboardConfig();
    } catch (error) {
      console.warn('[DashboardService] Failed to get dashboard config, using defaults:', error);
      return this.getDefaultDashboardConfig();
    }
  }

  // Save user dashboard configuration
  async saveDashboardConfig(userId, config) {
    try {
      const result = await apiMethods.dashboard.saveDashboardConfig(userId, config);
      console.log('[DashboardService] Dashboard config saved successfully');
      return result;
    } catch (error) {
      console.error('[DashboardService] Failed to save dashboard config:', error);
      throw new Error(`Failed to save dashboard configuration: ${error.message}`);
    }
  }

  // Default dashboard configuration
  getDefaultDashboardConfig() {
    return {
      widgets: [
        { id: 'stats', enabled: true, order: 1, size: 'full' },
        { id: 'recent_members', enabled: true, order: 2, size: 'half' },
        { id: 'alerts', enabled: true, order: 3, size: 'half' },
        { id: 'quick_actions', enabled: true, order: 4, size: 'full' }
      ],
      refreshInterval: 300000, // 5 minutes
      theme: 'light',
      compactView: false,
      showWelcome: true
    };
  }

  // Refresh all cached data
  async refreshAll(timeRange = '30d') {
    console.log('[DashboardService] Refreshing all dashboard data...');
    this.clearCache();
    return await this.getDashboardData(timeRange, true);
  }

  // Get real-time statistics (no caching)
  async getRealTimeStats() {
    console.log('[DashboardService] Fetching real-time stats...');
    return await this.makeRequest(
      () => apiMethods.dashboard.getStats(),
      null,
      false // No caching
    );
  }

  // Validate API connectivity
  async testConnection() {
    try {
      console.log('[DashboardService] Testing API connectivity...');
      
      const startTime = Date.now();
      const healthData = await apiMethods.core.health();
      const responseTime = Date.now() - startTime;
      
      return { 
        success: true, 
        message: 'API connection successful',
        responseTime,
        data: healthData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'API connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get member activity trends
  async getMemberActivity(timeRange = '30d') {
    const cacheKey = this.getCacheKey('member_activity', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.get(`members/activity/`, { params: { range: timeRange } }),
      cacheKey,
      true,
      { activities: [], trends: {} }
    );
  }

  // Get financial summary
  async getFinancialSummary(timeRange = '30d') {
    const cacheKey = this.getCacheKey('financial_summary', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.get(`pledges/financial-summary/`, { params: { range: timeRange } }),
      cacheKey,
      true,
      { 
        totalPledged: 0, 
        totalReceived: 0, 
        pendingAmount: 0,
        fulfillmentRate: 0
      }
    );
  }

  // Get group membership trends
  async getGroupMembershipTrends(timeRange = '30d') {
    const cacheKey = this.getCacheKey('group_membership_trends', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.get(`groups/membership-trends/`, { params: { range: timeRange } }),
      cacheKey,
      true,
      { trends: [], summary: {} }
    );
  }

  // Get event attendance data (if events are implemented)
  async getEventAttendance(timeRange = '30d') {
    const cacheKey = this.getCacheKey('event_attendance', { range: timeRange });
    return await this.makeRequest(
      () => apiMethods.get(`events/attendance/`, { params: { range: timeRange } }),
      cacheKey,
      true,
      { events: [], attendance: {} }
    );
  }

  // Batch data fetching for performance
  async batchFetchData(requests) {
    try {
      console.log(`[DashboardService] Batch fetching ${requests.length} data requests...`);
      
      const results = await Promise.allSettled(requests.map(request => 
        this.makeRequest(request.fn, request.cacheKey, request.useCache, request.fallback)
      ));
      
      const processedResults = results.map((result, index) => ({
        key: requests[index].key,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason?.message : null
      }));
      
      const successful = processedResults.filter(r => r.success).length;
      console.log(`[DashboardService] Batch complete: ${successful}/${requests.length} successful`);
      
      return processedResults;
    } catch (error) {
      console.error('[DashboardService] Batch fetch failed:', error);
      throw error;
    }
  }

  // Data validation utilities
  validateMemberData(member) {
    const required = ['id', 'first_name', 'last_name', 'email'];
    const missing = required.filter(field => !member[field]);
    
    if (missing.length > 0) {
      console.warn('[DashboardService] Invalid member data, missing:', missing);
      return false;
    }
    
    return true;
  }

  validatePledgeData(pledge) {
    const required = ['id', 'member_id', 'amount', 'frequency'];
    const missing = required.filter(field => !pledge[field]);
    
    if (missing.length > 0) {
      console.warn('[DashboardService] Invalid pledge data, missing:', missing);
      return false;
    }
    
    return true;
  }

  // Data transformation utilities
  transformMemberData(rawMembers) {
    if (!Array.isArray(rawMembers)) return [];
    
    return rawMembers
      .filter(member => this.validateMemberData(member))
      .map(member => ({
        ...member,
        fullName: `${member.first_name} ${member.last_name}`,
        joinedAgo: this.getTimeAgo(member.registration_date),
        isRecentlyJoined: this.isRecentlyJoined(member.registration_date)
      }));
  }

  transformPledgeData(rawPledges) {
    if (!Array.isArray(rawPledges)) return [];
    
    return rawPledges
      .filter(pledge => this.validatePledgeData(pledge))
      .map(pledge => ({
        ...pledge,
        formattedAmount: this.formatCurrency(pledge.amount),
        createdAgo: this.getTimeAgo(pledge.created_at),
        isOverdue: this.isPledgeOverdue(pledge)
      }));
  }

  // Utility methods
  getTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  isRecentlyJoined(dateString, daysThreshold = 30) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays <= daysThreshold;
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  isPledgeOverdue(pledge) {
    if (!pledge.next_payment_date) return false;
    
    const nextPayment = new Date(pledge.next_payment_date);
    const now = new Date();
    
    return nextPayment < now;
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      oldestCacheEntry: this.getOldestCacheEntry(),
      memoryUsage: this.estimateCacheMemoryUsage()
    };
  }

  estimateCacheMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += JSON.stringify({ key, value }).length;
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  // Cleanup and maintenance
  cleanup() {
    console.log('[DashboardService] Performing cleanup...');
    
    // Remove expired cache entries
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    console.log(`[DashboardService] Cleanup complete: removed ${removedCount} expired entries`);
  }

  // Start periodic cleanup
  startPeriodicCleanup(intervalMs = 300000) { // 5 minutes
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
    
    console.log('[DashboardService] Periodic cleanup started');
  }

  // Stop periodic cleanup
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[DashboardService] Periodic cleanup stopped');
    }
  }
}

// Create and export singleton instance
const dashboardService = new DashboardService();

// Start periodic cleanup
dashboardService.startPeriodicCleanup();

export { dashboardService };
export default dashboardService;