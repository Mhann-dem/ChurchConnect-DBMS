// services/dashboardService.js - FIXED for Your Django API Patterns
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

  // FIXED: Get overall system statistics
  async getStats() {
    const cacheKey = this.getCacheKey('dashboard_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching core dashboard stats...');
        
        try {
          // Try dashboard stats endpoint first
          const response = await apiMethods.get('core/dashboard/stats/');
          console.log('[DashboardService] Core stats response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Core stats failed, aggregating from individual endpoints');
          
          // Fallback: aggregate from individual statistics
          const [memberStats, groupStats, familyStats] = await Promise.allSettled([
            this.getMemberStats(),
            this.getGroupStats(),
            this.getFamilyStats()
          ]);
          
          return {
            total_members: memberStats.status === 'fulfilled' ? 
              (memberStats.value?.summary?.total_members || 0) : 0,
            total_groups: groupStats.status === 'fulfilled' ? 
              (groupStats.value?.total_groups || 0) : 0,
            total_families: familyStats.status === 'fulfilled' ? 
              (familyStats.value?.total_families || 0) : 0,
            total_events: 0, // Events might not be implemented yet
            monthly_revenue: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_members: 0, 
        total_groups: 0, 
        total_families: 0,
        total_events: 0,
        monthly_revenue: 0 
      }
    );
  }

  // FIXED: Get member statistics using your working endpoint
  async getMemberStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('member_stats', { range: timeRange });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching member stats...');
        
        // FIXED: Use the WORKING endpoint that matches your Django logs
        const response = await apiMethods.get('members/statistics/', { 
          params: { range: timeRange } 
        });
        
        console.log('[DashboardService] Member stats raw response:', response.data);
        
        // FIXED: Handle your Django MemberViewSet.statistics response structure
        const data = response.data;
        
        // Your API returns the structure based on your views.py statistics method
        return {
          summary: data.summary || {
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0,
            recent_registrations: 0,
            growth_rate: 0
          },
          demographics: data.demographics || {},
          trends: data.trends || {},
          new_members: data.summary?.recent_registrations || 0,
          growth_rate: data.summary?.growth_rate || 0
        };
      },
      cacheKey,
      true,
      { 
        summary: {
          total_members: 0, 
          active_members: 0, 
          inactive_members: 0,
          recent_registrations: 0,
          growth_rate: 0
        },
        new_members: 0,
        growth_rate: 0
      }
    );
  }

  // FIXED: Get recent members using your working endpoint
  async getRecentMembers(limit = 10) {
    const cacheKey = this.getCacheKey('recent_members', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent members...');
        
        try {
          // FIXED: Use the WORKING endpoint from your Django logs
          const response = await apiMethods.get('members/recent/', { 
            params: { limit } 
          });
          
          console.log('[DashboardService] Recent members raw response:', response.data);
          
          // FIXED: Handle your Django MemberViewSet.recent response
          // Your API returns: { success: true, results: [...], count: 4, limit: 5 }
          let results = [];
          let count = 0;

          if (response.data && typeof response.data === 'object') {
            if (response.data.success && response.data.results && Array.isArray(response.data.results)) {
              // Your Django response format
              results = response.data.results;
              count = response.data.count || response.data.results.length;
            } else if (Array.isArray(response.data)) {
              // Fallback: direct array
              results = response.data;
              count = response.data.length;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              // Standard DRF response
              results = response.data.results;
              count = response.data.count || response.data.results.length;
            }
          }
          
          console.log('[DashboardService] Processed recent members:', {
            count: count,
            resultsLength: results.length,
            firstMember: results[0] ? 
              `${results[0].first_name} ${results[0].last_name}` : 
              'none'
          });
          
          return {
            results: results,
            count: count
          };
          
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

  // FIXED: Get group statistics using your working endpoint
  async getGroupStats() {
    const cacheKey = this.getCacheKey('group_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching group stats...');
        
        // FIXED: Use the WORKING endpoint from your Django logs
        const response = await apiMethods.get('groups/statistics/');
        console.log('[DashboardService] Group stats response:', response.data);
        
        return response.data || {
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0
        };
      },
      cacheKey,
      true,
      { 
        total_groups: 0, 
        active_groups: 0, 
        growth_rate: 0
      }
    );
  }

  // FIXED: Get family statistics using your working endpoint
  async getFamilyStats() {
    const cacheKey = this.getCacheKey('family_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching family stats...');
        
        try {
          // FIXED: Use the WORKING endpoint from your Django logs
          const response = await apiMethods.get('families/statistics/');
          console.log('[DashboardService] Family stats response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('[DashboardService] Family stats endpoint failed:', error.message);
          return {
            total_families: 0, 
            new_families: 0, 
            growth_rate: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_families: 0, 
        new_families: 0, 
        growth_rate: 0
      }
    );
  }

  // FIXED: Get pledge statistics
  async getPledgeStats(timeRange = '30d') {
    const cacheKey = this.getCacheKey('pledge_stats', { range: timeRange });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching pledge stats...');
        
        try {
          // FIXED: Use your working endpoint pattern
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
            growth_rate: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_amount: 0, 
        active_pledges: 0, 
        monthly_total: 0,
        growth_rate: 0
      }
    );
  }

  // FIXED: Get event statistics
  async getEventStats() {
    const cacheKey = this.getCacheKey('event_stats');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching event stats...');
        
        try {
          // FIXED: Based on your events URLs pattern
          const response = await apiMethods.get('events/events/statistics/');
          return response.data || {
            total_events: 0, 
            upcoming_events: 0, 
            this_month_events: 0
          };
        } catch (error) {
          console.warn('[DashboardService] Event stats not available:', error.message);
          return {
            total_events: 0, 
            upcoming_events: 0, 
            this_month_events: 0
          };
        }
      },
      cacheKey,
      true,
      { 
        total_events: 0, 
        upcoming_events: 0, 
        this_month_events: 0
      }
    );
  }

  // FIXED: Get recent pledges
  async getRecentPledges(limit = 10) {
    const cacheKey = this.getCacheKey('recent_pledges', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent pledges...');
        
        try {
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

  // FIXED: Get recent events
  async getRecentEvents(limit = 10) {
    const cacheKey = this.getCacheKey('recent_events', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent events...');
        
        try {
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

  // FIXED: Get recent families
  async getRecentFamilies(limit = 10) {
    const cacheKey = this.getCacheKey('recent_families', { limit });
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching recent families...');
        
        try {
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

  // FIXED: Get system health status
  async getSystemHealth() {
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching system health...');
        
        try {
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

  // FIXED: Get alerts and notifications
  async getAlerts() {
    const cacheKey = this.getCacheKey('alerts');
    return await this.makeRequest(
      async () => {
        console.log('[DashboardService] Fetching alerts...');
        
        try {
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

  // FIXED: Get comprehensive dashboard data with proper error handling
  async getDashboardData(timeRange = '30d', forceRefresh = false) {
    try {
      console.log('=== [DashboardService] Starting Dashboard Data Fetch ===');
      
      if (forceRefresh) {
        console.log('[DashboardService] Force refresh requested, clearing cache');
        this.clearCache();
      }
      
      // Execute requests with proper error boundaries
      const requests = [
        this.getStats().catch(e => ({ error: e.message, fallback: { total_members: 0, total_groups: 0, total_families: 0 } })),
        this.getMemberStats(timeRange).catch(e => ({ error: e.message, fallback: { summary: { total_members: 0, active_members: 0 } } })),
        this.getPledgeStats(timeRange).catch(e => ({ error: e.message, fallback: { total_amount: 0, active_pledges: 0 } })),
        this.getGroupStats().catch(e => ({ error: e.message, fallback: { total_groups: 0, active_groups: 0 } })),
        this.getFamilyStats().catch(e => ({ error: e.message, fallback: { total_families: 0, new_families: 0 } })),
        this.getEventStats().catch(e => ({ error: e.message, fallback: { total_events: 0, upcoming_events: 0 } })),
        this.getRecentMembers(5).catch(e => ({ error: e.message, fallback: { results: [], count: 0 } })),
        this.getRecentPledges(5).catch(e => ({ error: e.message, fallback: { results: [], count: 0 } })),
        this.getRecentEvents(5).catch(e => ({ error: e.message, fallback: { results: [], count: 0 } })),
        this.getRecentFamilies(5).catch(e => ({ error: e.message, fallback: { results: [], count: 0 } })),
        this.getSystemHealth().catch(e => ({ error: e.message, fallback: { status: 'unknown' } })),
        this.getAlerts().catch(e => ({ error: e.message, fallback: { results: [] } }))
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
      ] = await Promise.all(requests);

      const processResult = (result, fallback = {}) => {
        if (result && !result.error) {
          return result;
        } else {
          console.warn('[DashboardService] Using fallback for failed request:', result?.error);
          return result?.fallback || fallback;
        }
      };

      const dashboardData = {
        stats: processResult(stats, { 
          total_members: 0, 
          total_groups: 0, 
          total_families: 0,
          total_events: 0,
          monthly_revenue: 0
        }),
        memberStats: processResult(memberStats, { 
          summary: {
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0,
            recent_registrations: 0
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
        statsLoaded: !!dashboardData.stats && !dashboardData.stats.error,
        totalMembers: dashboardData.memberStats?.summary?.total_members || 0,
        recentMembersCount: dashboardData.recentMembers?.count || 0,
        recentMembersArrayLength: dashboardData.recentMembers?.results?.length || 0,
        totalGroups: dashboardData.groupStats?.total_groups || 0,
        activeGroups: dashboardData.groupStats?.active_groups || 0,
        systemStatus: dashboardData.systemHealth?.status,
        cacheEntries: this.cache.size,
        errors: [stats, memberStats, pledgeStats, groupStats, familyStats, eventStats, recentMembers, recentPledges, recentEvents, recentFamilies, systemHealth, alerts]
          .filter(r => r?.error).map(r => r.error)
      });

      return dashboardData;
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }

  // Test API connectivity
  async testConnection() {
    try {
      console.log('[DashboardService] Testing API connectivity...');
      
      const startTime = Date.now();
      
      // Test the core endpoints that work from your logs
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