// hooks/useDashboard.js - Production Ready with error boundaries and caching
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAuth from './useAuth';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Default dashboard data structure
const DEFAULT_DASHBOARD_DATA = {
  // Member statistics
  totalMembers: 0,
  activeMembers: 0,
  newMembersThisMonth: 0,
  newMembersThisWeek: 0,
  
  // Group/Ministry statistics
  totalGroups: 0,
  activeGroups: 0,
  
  // Pledge statistics
  totalPledges: 0,
  totalPledgeAmount: 0,
  monthlyPledgeGoal: 0,
  pledgesByFrequency: {},
  
  // Demographics
  ageDistribution: [],
  genderDistribution: [],
  preferredContactMethods: [],
  
  // Recent activities
  recentMembers: [],
  recentPledges: [],
  upcomingBirthdays: [],
  
  // Growth metrics
  membershipGrowth: [],
  pledgeGrowth: [],
  
  // Family statistics
  totalFamilies: 0,
  averageFamilySize: 0,
  
  // Meta
  loading: false,
  error: null,
  lastUpdated: null
};

/**
 * Custom hook for dashboard data management
 * Features: caching, error recovery, selective refresh, real-time updates
 */
export const useDashboard = () => {
  const { isAuthenticated, hasPermission } = useAuth();
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs for cleanup and caching
  const mountedRef = useRef(true);
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheKey) => {
    const cached = cacheRef.current[cacheKey];
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < CACHE_DURATION;
  }, []);

  // Get cached data if valid
  const getCachedData = useCallback((cacheKey) => {
    if (isCacheValid(cacheKey)) {
      return cacheRef.current[cacheKey].data;
    }
    return null;
  }, [isCacheValid]);

  // Cache data with timestamp
  const setCachedData = useCallback((cacheKey, data) => {
    cacheRef.current[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }, []);

  // Fetch data from API with error handling
  const fetchApiData = useCallback(async (endpoint, cacheKey) => {
    try {
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData, fromCache: true };
      }

      const signal = abortControllerRef.current?.signal;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the successful response
      setCachedData(cacheKey, data);
      
      return { success: true, data, fromCache: false };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request cancelled', aborted: true };
      }
      
      console.error(`API Error for ${endpoint}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch data',
        fromCache: false
      };
    }
  }, [getCachedData, setCachedData]);

  // Fetch all dashboard data with parallel requests and error recovery
  const fetchDashboardData = useCallback(async (options = {}) => {
    const { force = false, silent = false } = options;

    if (!isAuthenticated) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Authentication required'
      }));
      return;
    }

    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!silent) {
        setDashboardData(prev => ({ 
          ...prev, 
          loading: true, 
          error: null 
        }));
      } else {
        setRefreshing(true);
      }

      // Force cache invalidation if requested
      if (force) {
        cacheRef.current = {};
      }

      // Define API endpoints with cache keys
      const apiCalls = [
        { endpoint: '/api/v1/members/statistics/', key: 'memberStats' },
        { endpoint: '/api/v1/groups/statistics/', key: 'groupStats' },
        { endpoint: '/api/v1/pledges/statistics/', key: 'pledgeStats' },
        { endpoint: '/api/v1/families/statistics/', key: 'familyStats' },
        { endpoint: '/api/v1/reports/demographics/', key: 'demographics' },
        { endpoint: '/api/v1/reports/recent-activities/', key: 'recentActivities' },
        { endpoint: '/api/v1/reports/growth-stats/', key: 'growthStats' }
      ];

      // Only fetch data user has permission for
      const allowedCalls = apiCalls.filter(call => {
        switch (call.key) {
          case 'memberStats':
            return hasPermission('read');
          case 'groupStats':
            return hasPermission('read');
          case 'pledgeStats':
            return hasPermission('view_reports');
          case 'familyStats':
            return hasPermission('read');
          case 'demographics':
            return hasPermission('view_reports');
          case 'recentActivities':
            return hasPermission('view_reports');
          case 'growthStats':
            return hasPermission('view_reports');
          default:
            return true;
        }
      });

      // Execute API calls in parallel
      const results = await Promise.allSettled(
        allowedCalls.map(call => fetchApiData(call.endpoint, call.key))
      );

      if (!mountedRef.current) return;

      // Process results and handle partial failures
      const processedData = { ...DEFAULT_DASHBOARD_DATA };
      const errors = [];
      let hasAnyData = false;

      results.forEach((result, index) => {
        const call = allowedCalls[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          hasAnyData = true;
          const data = result.value.data;

          switch (call.key) {
            case 'memberStats':
              processedData.totalMembers = data.total || 0;
              processedData.activeMembers = data.active || 0;
              processedData.newMembersThisMonth = data.new_this_month || 0;
              processedData.newMembersThisWeek = data.new_this_week || 0;
              break;

            case 'groupStats':
              processedData.totalGroups = data.total || 0;
              processedData.activeGroups = data.active || 0;
              break;

            case 'pledgeStats':
              processedData.totalPledges = data.total_count || 0;
              processedData.totalPledgeAmount = data.total_amount || 0;
              processedData.monthlyPledgeGoal = data.monthly_goal || 0;
              processedData.pledgesByFrequency = data.by_frequency || {};
              break;

            case 'familyStats':
              processedData.totalFamilies = data.total || 0;
              processedData.averageFamilySize = data.average_size || 0;
              break;

            case 'demographics':
              processedData.ageDistribution = data.age_distribution || [];
              processedData.genderDistribution = data.gender_distribution || [];
              processedData.preferredContactMethods = data.contact_methods || [];
              break;

            case 'recentActivities':
              processedData.recentMembers = data.new_members || [];
              processedData.recentPledges = data.new_pledges || [];
              processedData.upcomingBirthdays = data.upcoming_birthdays || [];
              break;

            case 'growthStats':
              processedData.membershipGrowth = data.membership_growth || [];
              processedData.pledgeGrowth = data.pledge_growth || [];
              break;
          }
        } else if (result.status === 'fulfilled' && !result.value.aborted) {
          errors.push(`${call.key}: ${result.value.error}`);
        }
      });

      // Update state with results
      setDashboardData(prev => ({
        ...processedData,
        loading: false,
        error: errors.length > 0 && !hasAnyData ? errors.join('; ') : null,
        lastUpdated: new Date().toISOString(),
        // Keep previous data if no new data was fetched
        ...(hasAnyData ? {} : {
          totalMembers: prev.totalMembers,
          activeMembers: prev.activeMembers,
          totalGroups: prev.totalGroups,
          activeGroups: prev.activeGroups,
          totalPledges: prev.totalPledges,
          totalPledgeAmount: prev.totalPledgeAmount,
          totalFamilies: prev.totalFamilies
        })
      }));

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      if (mountedRef.current) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, hasPermission, fetchApiData]);

  // Refresh specific section of dashboard
  const refreshSection = useCallback(async (sectionKey) => {
    const sectionMap = {
      members: 'memberStats',
      groups: 'groupStats',  
      pledges: 'pledgeStats',
      families: 'familyStats',
      demographics: 'demographics',
      activities: 'recentActivities',
      growth: 'growthStats'
    };

    const cacheKey = sectionMap[sectionKey];
    if (cacheKey) {
      // Clear specific cache
      delete cacheRef.current[cacheKey];
      await fetchDashboardData({ silent: true });
    }
  }, [fetchDashboardData]);

  // Utility functions for computed values
  const getMemberGrowthRate = useCallback(() => {
    const growth = dashboardData.membershipGrowth;
    if (!Array.isArray(growth) || growth.length < 2) return 0;
    
    const current = growth[growth.length - 1];
    const previous = growth[growth.length - 2];
    
    if (!current || !previous || !previous.count) return 0;
    
    return ((current.count - previous.count) / previous.count * 100).toFixed(1);
  }, [dashboardData.membershipGrowth]);

  const getPledgeCompletionRate = useCallback(() => {
    if (!dashboardData.totalPledgeAmount || !dashboardData.monthlyPledgeGoal) {
      return 0;
    }
    
    return ((dashboardData.totalPledgeAmount / dashboardData.monthlyPledgeGoal) * 100).toFixed(1);
  }, [dashboardData.totalPledgeAmount, dashboardData.monthlyPledgeGoal]);

  const getTopAgeGroup = useCallback(() => {
    if (!Array.isArray(dashboardData.ageDistribution) || dashboardData.ageDistribution.length === 0) {
      return 'N/A';
    }
    
    return dashboardData.ageDistribution.reduce((prev, current) => 
      (prev.count || 0) > (current.count || 0) ? prev : current
    ).age_range || 'N/A';
  }, [dashboardData.ageDistribution]);

  const getActiveGroupsPercentage = useCallback(() => {
    if (!dashboardData.totalGroups) return 0;
    return ((dashboardData.activeGroups / dashboardData.totalGroups) * 100).toFixed(1);
  }, [dashboardData.activeGroups, dashboardData.totalGroups]);

  // Computed dashboard metrics
  const metrics = useMemo(() => ({
    memberGrowthRate: getMemberGrowthRate(),
    pledgeCompletionRate: getPledgeCompletionRate(),
    topAgeGroup: getTopAgeGroup(),
    activeGroupsPercentage: getActiveGroupsPercentage(),
    memberRetentionRate: dashboardData.activeMembers && dashboardData.totalMembers ? 
      ((dashboardData.activeMembers / dashboardData.totalMembers) * 100).toFixed(1) : 0,
    averagePledgeAmount: dashboardData.totalPledges ? 
      (dashboardData.totalPledgeAmount / dashboardData.totalPledges).toFixed(2) : 0
  }), [
    getMemberGrowthRate, getPledgeCompletionRate, getTopAgeGroup, 
    getActiveGroupsPercentage, dashboardData
  ]);

  // Auto-refresh functionality
  const startAutoRefresh = useCallback((intervalMinutes = 5) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && isAuthenticated) {
        fetchDashboardData({ silent: true });
      }
    }, intervalMinutes * 60 * 1000);
  }, [isAuthenticated, fetchDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Initial data fetch and auto-refresh setup
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      startAutoRefresh(5); // 5-minute auto-refresh
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [isAuthenticated, fetchDashboardData, startAutoRefresh, stopAutoRefresh]);

  // Manual refresh function
  const refreshData = useCallback(async (force = false) => {
    return fetchDashboardData({ force, silent: false });
  }, [fetchDashboardData]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    // Dashboard data
    ...dashboardData,
    
    // Additional state
    refreshing,
    
    // Computed metrics
    metrics,
    
    // Actions
    refreshData,
    refreshSection,
    clearCache,
    
    // Auto-refresh controls
    startAutoRefresh,
    stopAutoRefresh,
    
    // Utility functions
    getMemberGrowthRate,
    getPledgeCompletionRate,
    getTopAgeGroup,
    getActiveGroupsPercentage,
    
    // Cache status
    getCacheInfo: () => Object.keys(cacheRef.current).reduce((info, key) => {
      info[key] = {
        cached: true,
        timestamp: cacheRef.current[key].timestamp,
        age: Date.now() - cacheRef.current[key].timestamp,
        valid: isCacheValid(key)
      };
      return info;
    }, {})
  };
};