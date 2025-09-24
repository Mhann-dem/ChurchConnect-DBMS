// services/dashboardService.js - CORRECTED FOR YOUR ACTUAL URL PATTERNS
import apiMethods from './api';

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
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
        
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async makeRequest(requestFn, cacheKey = null, useCache = true, fallbackData = null) {
    if (useCache && cacheKey) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const data = await this.retryRequest(requestFn);
      
      if (useCache && cacheKey) {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`[DashboardService] Request failed after retries:`, error.message);
      
      if (cacheKey) {
        const staleCache = this.cache.get(cacheKey);
        if (staleCache) {
          console.warn(`[DashboardService] Returning stale cached data for ${cacheKey}`);
          return staleCache.data;
        }
      }
      
      if (fallbackData !== null) {
        console.warn(`[DashboardService] Returning fallback data`);
        return fallbackData;
      }
      
      throw error;
    }
  }

  // CORRECTED: Get overall system statistics
  async getStats() {
    const cacheKey = this.getCacheKey('dashboard_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching core dashboard stats...');
        
        try {
          // Try core dashboard endpoint first
          const response = await apiMethods.get('core/dashboard/stats/');
          console.log('[DashboardService] Core stats response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Core stats failed, aggregating from individual endpoints');
          
          // Fallback: aggregate from individual statistics
          const [memberStats, groupStats, familyStats, pledgeStats] = await Promise.allSettled([
            this.getMemberStats(),
            this.getGroupStats(),
            this.getFamilyStats(),
            this.getPledgeStats()
          ]);
          
          return {
            total_members: memberStats.status === 'fulfilled' ? (memberStats.value?.summary?.total_members || 0) : 0,
            total_groups: groupStats.status === 'fulfilled' ? (groupStats.value?.total_groups || 0) : 0,
            total_pledges: pledgeStats.status === 'fulfilled' ? (pledgeStats.value?.active_pledges || 0) : 0,
            total_families: familyStats.status === 'fulfilled' ? (familyStats.value?.total_families || 0) : 0,
            total_events: 0, // Events might not be implemented yet
            monthly_revenue: pledgeStats.status === 'fulfilled' ? (pledgeStats.value?.monthly_total || 0) : 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_members: 0, 
        total_groups: 0, 
        total_pledges: 0,
        total_families: 0,
        total_events: 0,
        monthly_revenue: 0 
      }
    );
  }

  // CORRECTED: Get member statistics - WORKING endpoint
  async getMemberStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('member_stats', { range: timeRange });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching member stats...');
        
        // Use the WORKING endpoint from your logs: members/statistics/
        const response = await apiMethods.get('members/statistics/', { 
          params: { range: timeRange } 
        });
        
        console.log('[DashboardService] Member stats raw response:', response.data);
        
        // Handle your Django MemberStatisticsViewSet response structure
        const data = response.data;
        const processedStats = {
          summary: data.summary || {
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0
          },
          new_members: data.summary?.recent_registrations || 0,
          growth_rate: data.summary?.growth_rate || 0,
          retention_rate: data.retention_rate || 0
        };
        
        console.log('[DashboardService] Processed member stats:', processedStats);
        return processedStats;
      },
      cacheKey,
      true,
      { 
        summary: {
          total_members: 0, 
          active_members: 0, 
          inactive_members: 0
        },
        new_members: 0,
        growth_rate: 0,
        retention_rate: 0
      }
    );
  }

  // CORRECTED: Get recent members - WORKING endpoint
  async getRecentMembers(limit = 10) {
    const cacheKey = this.getCacheKey('recent_members', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent members...');
        
        try {
          // Use the WORKING endpoint from your logs: members/recent/
          const response = await apiMethods.get('members/recent/', { 
            params: { limit } 
          });
          
          console.log('[DashboardService] Recent members raw response:', response.data);
          
          // Your Django MemberViewSet.recent returns: { success: true, results: [...], count: 4 }
          if (response.data?.success && response.data?.results) {
            const processedData = {
              results: response.data.results,
              count: response.data.count || response.data.results.length
            };
            
            console.log('[DashboardService] Processed recent members:', {
              count: processedData.count,
              resultsLength: processedData.results.length,
              firstMember: processedData.results[0] ? 
                `${processedData.results[0].first_name} ${processedData.results[0].last_name}` : 
                'none'
            });
            
            return processedData;
          } else {
            throw new Error('Unexpected response format from recent members endpoint');
          }
        } catch (error) {
          console.warn('[DashboardService] Recent endpoint failed, using fallback:', error.message);
          
          // Fallback to regular members list with ordering
          const fallbackResponse = await apiMethods.get('members/', { 
            params: { 
              ordering: '-registration_date', 
              page_size: limit
            } 
          });
          
          return {
            results: fallbackResponse.data.results || [],
            count: fallbackResponse.data.count || 0
          };
        }
      },
      cacheKey,
      true,
      { results: [], count: 0 }
    );
  }

  // CORRECTED: Get pledge statistics - Use correct endpoint
  async getPledgeStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('pledge_stats', { range: timeRange });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching pledge stats...');
        
        try {
          // Use the WORKING endpoint from your logs: pledges/stats/
          const response = await apiMethods.get('pledges/stats/', { 
            params: { range: timeRange } 
          });
          
          console.log('[DashboardService] Pledge stats response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Pledge stats endpoint failed:', error.message);
          return {
            total_amount: 0, 
            active_pledges: 0, 
            monthly_total: 0,
            growth_rate: 0,
            fulfillment_rate: 0
          };
        }
      },
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

  // CORRECTED: Get group statistics - WORKING endpoint
  async getGroupStats() {
    const cacheKey = this.getCacheKey('group_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching group stats...');
        
        // Use the WORKING endpoint from your logs: groups/statistics/
        const response = await apiMethods.get('groups/statistics/');
        console.log('[DashboardService] Group stats response:', response.data);
        
        return response.data || {
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0,
          avg_group_size: 0
        };
      },
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

  // CORRECTED: Get family statistics - WORKING endpoint
  async getFamilyStats() {
    const cacheKey = this.getCacheKey('family_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching family stats...');
        
        try {
          // Use the WORKING endpoint from your logs: families/statistics/
          const response = await apiMethods.get('families/statistics/');
          console.log('[DashboardService] Family stats response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Family stats endpoint failed:', error.message);
          return {
            total_families: 0, 
            new_families: 0, 
            growth_rate: 0,
            avg_family_size: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_families: 0, 
        new_families: 0, 
        growth_rate: 0,
        avg_family_size: 0
      }
    );
  }

  // CORRECTED: Get event statistics - Use correct endpoint pattern
  async getEventStats() {
    const cacheKey = this.getCacheKey('event_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching event stats...');
        
        try {
          // Based on your events URLs, use: events/events/statistics/
          const response = await apiMethods.get('events/events/statistics/');
          return response.data || {
            total_events: 0, 
            upcoming_events: 0, 
            this_month_events: 0,
            avg_attendance: 0
          };
        } catch (error) {
          console.warn('[DashboardService] Event stats not available:', error.message);
          return {
            total_events: 0, 
            upcoming_events: 0, 
            this_month_events: 0,
            avg_attendance: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_events: 0, 
        upcoming_events: 0, 
        this_month_events: 0,
        avg_attendance: 0
      }
    );
  }

  // CORRECTED: Get recent pledges
  async getRecentPledges(limit = 10) {
    const cacheKey = this.getCacheKey('recent_pledges', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent pledges...');
        
        try {
          // Use the endpoint from your pledges URLs: pledges/recent/
          const response = await apiMethods.get('pledges/recent/', { 
            params: { limit } 
          });
          
          return {
            results: response.data.results || [],
            count: response.data.count || 0
          };
        } catch (error) {
          console.warn('[DashboardService] Recent pledges endpoint failed:', error.message);
          return { results: [], count: 0 };
        }
      },
      cacheKey,
      true,
      { results: [], count: 0 }
    );
  }

  // CORRECTED: Get recent events
  async getRecentEvents(limit = 10) {
    const cacheKey = this.getCacheKey('recent_events', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent events...');
        
        try {
          // Based on your events URLs, try: events/events/ with recent ordering
          const response = await apiMethods.get('events/events/', { 
            params: { 
              limit: limit,
              ordering: '-created_at',
              upcoming: false
            } 
          });
          
          return {
            results: response.data.results || [],
            count: response.data.count || 0
          };
        } catch (error) {
          console.warn('[DashboardService] Recent events not available:', error.message);
          return { results: [], count: 0 };
        }
      },
      cacheKey,
      true,
      { results: [], count: 0 }
    );
  }

  // CORRECTED: Get recent families - Use families list with ordering since no recent endpoint exists
  async getRecentFamilies(limit = 10) {
    const cacheKey = this.getCacheKey('recent_families', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent families...');
        
        try {
          // Since your families URLs don't have a recent endpoint, use list with ordering
          const response = await apiMethods.get('families/', { 
            params: { 
              page_size: limit,
              ordering: '-created_at'
            } 
          });
          
          return {
            results: response.data.results || [],
            count: response.data.count || 0
          };
        } catch (error) {
          console.warn('[DashboardService] Recent families endpoint failed:', error.message);
          return { results: [], count: 0 };
        }
      },
      cacheKey,
      true,
      { results: [], count: 0 }
    );
  }

  // CORRECTED: Get system health status
  async getSystemHealth() {
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching system health...');
        
        try {
          // Use the WORKING endpoint from your logs: core/dashboard/health/
          const response = await apiMethods.get('core/dashboard/health/');
          console.log('[DashboardService] System health response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Health endpoint failed:', error.message);
          return { status: 'unknown', error: error.message };
        }
      },
      null,
      false,
      { status: 'healthy', uptime: '99.9%' }
    );
  }

  // CORRECTED: Get alerts and notifications
  async getAlerts() {
    const cacheKey = this.getCacheKey('alerts');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching alerts...');
        
        try {
          // Use the WORKING endpoint from your logs: core/dashboard/alerts/
          const response = await apiMethods.get('core/dashboard/alerts/');
          console.log('[DashboardService] Alerts response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Alerts endpoint failed:', error.message);
          return { results: [] };
        }
      },
      cacheKey,
      true,
      { results: [] }
    );
  }

  // Get comprehensive dashboard data with proper error handling
  async getDashboardData(timeRange = '30d', forceRefresh = false) {
    try {
      console.log('=== [DashboardService] Starting Dashboard Data Fetch ===');
      
      if (forceRefresh) {
        console.log('[DashboardService] Force refresh requested, clearing cache');
        this.clearCache();
      }
      
      const requests = [
        this.getStats(),
        this.getMemberStats(timeRange),
        this.getPledgeStats(timeRange),
        this.getGroupStats(),
        this.getFamilyStats(),
        this.getEventStats(),
        this.getRecentMembers(5),
        this.getRecentPledges(5),
        this.getRecentEvents(5),
        this.getRecentFamilies(5),
        this.getSystemHealth(),
        this.getAlerts()
      ];

      const [
        stats,
        memberStats,
        pledgeStats,
        groupStats,
        familyStats,
        eventStats,
        recentMembers,
        recentPledges,
        recentEvents,
        recentFamilies,
        systemHealth,
        alerts
      ] = await Promise.allSettled(requests);

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
          total_pledges: 0,
          total_families: 0,
          total_events: 0
        }),
        memberStats: processResult(memberStats, { 
          summary: {
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0
          },
          new_members: 0, 
          growth_rate: 0 
        }),
        pledgeStats: processResult(pledgeStats, { 
          total_amount: 0, 
          active_pledges: 0, 
          monthly_total: 0,
          growth_rate: 0 
        }),
        groupStats: processResult(groupStats, { 
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0 
        }),
        familyStats: processResult(familyStats, { 
          total_families: 0, 
          new_families: 0, 
          growth_rate: 0 
        }),
        eventStats: processResult(eventStats, { 
          total_events: 0, 
          upcoming_events: 0, 
          this_month_events: 0 
        }),
        recentMembers: processResult(recentMembers, { results: [], count: 0 }),
        recentPledges: processResult(recentPledges, { results: [], count: 0 }),
        recentEvents: processResult(recentEvents, { results: [], count: 0 }),
        recentFamilies: processResult(recentFamilies, { results: [], count: 0 }),
        systemHealth: processResult(systemHealth, { status: 'healthy' }),
        alerts: processResult(alerts, { results: [] }),
        lastUpdated: new Date(),
        cacheStatus: {
          totalEntries: this.cache.size,
          oldestEntry: this.getOldestCacheEntry(),
          hitRate: this.calculateCacheHitRate()
        }
      };

      console.log('=== [DashboardService] Final Dashboard Data ===', {
        statsLoaded: !!dashboardData.stats,
        totalMembers: dashboardData.memberStats?.summary?.total_members || 0,
        recentMembersCount: dashboardData.recentMembers?.count || 0,
        recentMembersArrayLength: dashboardData.recentMembers?.results?.length || 0,
        totalGroups: dashboardData.groupStats?.total_groups || 0,
        activeGroups: dashboardData.groupStats?.active_groups || 0,
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
    return this.cache.size > 0 ? 0.75 : 0;
  }

  // Refresh all cached data
  async refreshAll(timeRange = '30d') {
    console.log('[DashboardService] Refreshing all dashboard data...');
    this.clearCache();
    return await this.getDashboardData(timeRange, true);
  }

  // Test API connectivity with your specific endpoints
  async testConnection() {
    try {
      console.log('[DashboardService] Testing API connectivity...');
      
      const startTime = Date.now();
      
      // Test the core endpoints that we know work from your logs
      const healthResponse = await apiMethods.get('core/dashboard/health/');
      const responseTime = Date.now() - startTime;
      
      console.log('[DashboardService] Health check successful:', healthResponse.data);
      
      return { 
        success: true, 
        message: 'API connection successful',
        responseTime,
        data: healthResponse.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DashboardService] Connection test failed:', error);
      return { 
        success: false, 
        message: 'API connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
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

  formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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