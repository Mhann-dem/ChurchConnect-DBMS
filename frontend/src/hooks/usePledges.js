// hooks/usePledges.js - Production Ready with optimized state management and caching
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useRealTimeUpdates } from './useRealTimeUpdates';

/**
 * Production-ready pledges hook with advanced caching, real-time updates, and error handling
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options
 * @returns {Object} Pledges state and actions
 */
const usePledges = (initialFilters = {}, options = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  // Memoized options to prevent infinite re-renders
  const config = useMemo(() => ({
    enableCache: options.enableCache !== false,
    enableRealTime: options.enableRealTime !== false,
    cacheTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes
    staleTime: options.staleTime || 2 * 60 * 1000,  // 2 minutes
    debounceMs: options.debounceMs || 300,
    autoFetch: options.autoFetch !== false
  }), [options]);

  // Core state
  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 25
  });

  // Filter and search state
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, config.debounceMs);

  // Refs for managing state and cleanup
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef({});
  const lastFetchParamsRef = useRef(null);
  const requestIdRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Generate cache key from current parameters
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      search: debouncedSearchQuery,
      filters,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage
    });
  }, [debouncedSearchQuery, filters, pagination.currentPage, pagination.itemsPerPage]);

  // Cache utilities
  const getCachedData = useCallback((key) => {
    if (!config.enableCache) return null;
    
    const cached = cacheRef.current[key];
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > config.cacheTime;
    const isStale = (now - cached.timestamp) > config.staleTime;
    
    if (isExpired) {
      delete cacheRef.current[key];
      return null;
    }
    
    return { ...cached, isStale };
  }, [config.enableCache, config.cacheTime, config.staleTime]);

  const setCachedData = useCallback((key, data) => {
    if (!config.enableCache) return;
    
    cacheRef.current[key] = {
      pledges: data.pledges || [],
      statistics: data.statistics || {},
      pagination: data.pagination || pagination,
      timestamp: Date.now()
    };
  }, [config.enableCache, pagination]);

  const invalidateCache = useCallback((pattern) => {
    if (!config.enableCache) return;
    
    if (!pattern) {
      cacheRef.current = {};
      return;
    }
    
    Object.keys(cacheRef.current).forEach(key => {
      if (key.includes(pattern)) {
        delete cacheRef.current[key];
      }
    });
  }, [config.enableCache]);

  // Real-time updates handler
  const handleRealTimeUpdate = useCallback((type, data) => {
    if (!mountedRef.current) return;

    switch (type) {
      case 'pledge_created':
        setPledges(prev => [data, ...prev]);
        setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        invalidateCache();
        break;
        
      case 'pledge_updated':
        setPledges(prev => prev.map(pledge => 
          pledge.id === data.id ? { ...pledge, ...data } : pledge
        ));
        invalidateCache(data.id);
        break;
        
      case 'pledge_deleted':
        setPledges(prev => prev.filter(pledge => pledge.id !== data.id));
        setPagination(prev => ({ 
          ...prev, 
          count: Math.max(0, prev.count - 1) 
        }));
        invalidateCache();
        break;
        
      case 'payment_added':
        // Update the specific pledge with new payment
        setPledges(prev => prev.map(pledge => {
          if (pledge.id === data.pledge_id) {
            return {
              ...pledge,
              payments: [...(pledge.payments || []), data.payment],
              amount_received: (pledge.amount_received || 0) + data.payment.amount
            };
          }
          return pledge;
        }));
        break;

      default:
        console.log('[usePledges] Unknown real-time update type:', type);
    }
  }, [invalidateCache]);

  // Set up real-time updates
  const { isConnected } = useRealTimeUpdates('pledges', {
    onCreate: (data) => handleRealTimeUpdate('pledge_created', data),
    onUpdate: (data) => handleRealTimeUpdate('pledge_updated', data),
    onDelete: (data) => handleRealTimeUpdate('pledge_deleted', data),
    onPaymentAdded: (data) => handleRealTimeUpdate('payment_added', data)
  });

  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Fetch pledges with caching and deduplication
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      setError('Insufficient permissions');
      return { success: false, error: 'Insufficient permissions' };
    }

    const requestId = ++requestIdRef.current;
    const mergedParams = {
      search: debouncedSearchQuery,
      filters,
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      ...params
    };

    const currentParamsStr = JSON.stringify(mergedParams);
    
    // Skip if same request is already in progress or recently completed
    if (!params.forceRefresh && lastFetchParamsRef.current === currentParamsStr) {
      return { success: true, fromCache: false };
    }

    try {
      // Check cache first
      if (!params.forceRefresh) {
        const cached = getCachedData(currentParamsStr);
        if (cached && !cached.isStale) {
          if (mountedRef.current) {
            setPledges(cached.pledges);
            setStatistics(cached.statistics);
            setPagination(cached.pagination);
            setError(null);
            setLoading(false);
          }
          return { success: true, fromCache: true };
        }
      }

      const signal = cancelRequests();
      lastFetchParamsRef.current = currentParamsStr;

      if (mountedRef.current && !params.silent) {
        setLoading(true);
        setError(null);
      }

      const response = await pledgesService.getPledges({
        ...mergedParams,
        signal
      });

      // Check if this is still the latest request
      if (requestId !== requestIdRef.current) {
        return { success: false, error: 'Request superseded' };
      }

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      if (response.success) {
        const data = response.data;
        let pledgesArray = [];
        let paginationData = pagination;

        // Handle different response formats
        if (data.results) {
          // Paginated response
          pledgesArray = Array.isArray(data.results) ? data.results : [];
          paginationData = {
            count: data.count || 0,
            next: data.next,
            previous: data.previous,
            totalPages: Math.ceil((data.count || 0) / (mergedParams.limit || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.limit || 25
          };
        } else {
          // Non-paginated response
          pledgesArray = Array.isArray(data) ? data : [];
          paginationData = {
            ...pagination,
            count: pledgesArray.length,
            totalPages: 1
          };
        }

        setPledges(pledgesArray);
        setPagination(paginationData);

        // Cache successful response
        setCachedData(currentParamsStr, {
          pledges: pledgesArray,
          pagination: paginationData
        });

        return { success: true, data: pledgesArray };
      } else {
        setError(response.error || 'Failed to fetch pledges');
        setPledges([]);
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }

      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          'An unexpected error occurred while fetching pledges';

      if (mountedRef.current) {
        setError(errorMessage);
        setPledges([]);
      }

      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    isAuthenticated, 
    hasPermission, 
    debouncedSearchQuery, 
    filters, 
    pagination,
    getCachedData,
    setCachedData,
    cancelRequests
  ]);

  // Fetch statistics with caching
  const fetchStatistics = useCallback(async (params = {}) => {
    if (!hasPermission('view_reports')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const statsKey = JSON.stringify({ type: 'statistics', ...params });
      
      // Check cache
      if (!params.forceRefresh) {
        const cached = getCachedData(statsKey);
        if (cached && !cached.isStale) {
          if (mountedRef.current) {
            setStatistics(cached.statistics);
          }
          return { success: true, fromCache: true };
        }
      }

      const signal = cancelRequests();
      const response = await pledgesService.getStatistics({ ...params, signal });
      
      if (response.success && mountedRef.current) {
        setStatistics(response.data || {});
        
        // Cache statistics
        setCachedData(statsKey, { statistics: response.data });
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }
      
      console.error('Statistics fetch error:', err);
      return { success: false, error: err.message };
    }
  }, [hasPermission, getCachedData, setCachedData, cancelRequests]);

  // CRUD Operations with optimistic updates
  const createPledge = useCallback(async (pledgeData) => {
    if (!hasPermission('create')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.createPledge(pledgeData);
      
      if (response.success) {
        // Optimistic update
        if (mountedRef.current) {
          setPledges(prev => [response.data, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        // Invalidate cache and refresh stats
        invalidateCache();
        fetchStatistics({ forceRefresh: true, silent: true });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create pledge');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, invalidateCache, fetchStatistics]);

  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!hasPermission('update')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const originalPledge = pledges.find(p => p.id === pledgeId);
      if (mountedRef.current) {
        setPledges(prev => prev.map(pledge => 
          pledge.id === pledgeId ? { ...pledge, ...pledgeData } : pledge
        ));
      }

      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      if (response.success) {
        // Update with actual response
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? { ...pledge, ...response.data } : pledge
          ));
        }
        
        // Invalidate cache and refresh stats
        invalidateCache(pledgeId);
        fetchStatistics({ forceRefresh: true, silent: true });
        
        return response.data;
      } else {
        // Revert optimistic update
        if (mountedRef.current && originalPledge) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? originalPledge : pledge
          ));
        }
        
        throw new Error(response.error || 'Failed to update pledge');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, pledges, invalidateCache, fetchStatistics]);

  const deletePledge = useCallback(async (pledgeId) => {
    if (!hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const originalPledges = pledges;
      if (mountedRef.current) {
        setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
        setPagination(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
      }

      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success) {
        // Invalidate cache and refresh stats
        invalidateCache();
        fetchStatistics({ forceRefresh: true, silent: true });
      } else {
        // Revert optimistic update
        if (mountedRef.current) {
          setPledges(originalPledges);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        throw new Error(response.error || 'Failed to delete pledge');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, pledges, invalidateCache, fetchStatistics]);

  // Bulk operations
  const bulkUpdatePledges = useCallback(async (pledgeIds, updates) => {
    if (!hasPermission('update')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.bulkUpdatePledges(pledgeIds, updates);
      
      if (response.success) {
        // Refresh data after bulk update
        await Promise.all([
          fetchPledges({ forceRefresh: true, silent: true }),
          fetchStatistics({ forceRefresh: true, silent: true })
        ]);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to bulk update pledges');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to bulk update pledges';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchPledges, fetchStatistics]);

  const bulkDeletePledges = useCallback(async (pledgeIds) => {
    if (!hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.bulkDeletePledges(pledgeIds);
      
      if (response.success) {
        // Remove from current list
        if (mountedRef.current) {
          setPledges(prev => prev.filter(pledge => !pledgeIds.includes(pledge.id)));
          setPagination(prev => ({ ...prev, count: Math.max(0, prev.count - pledgeIds.length) }));
        }
        
        // Invalidate cache and refresh stats
        invalidateCache();
        fetchStatistics({ forceRefresh: true, silent: true });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to bulk delete pledges');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to bulk delete pledges';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, invalidateCache, fetchStatistics]);

  // Payment operations
  const addPayment = useCallback(async (pledgeId, paymentData) => {
    if (!hasPermission('create')) {
      throw new Error('Insufficient permissions');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.addPayment(pledgeId, paymentData);
      
      if (response.success) {
        // Update pledge with new payment
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => {
            if (pledge.id === pledgeId) {
              return {
                ...pledge,
                payments: [...(pledge.payments || []), response.data],
                amount_received: (pledge.amount_received || 0) + paymentData.amount
              };
            }
            return pledge;
          }));
        }
        
        // Refresh statistics
        fetchStatistics({ forceRefresh: true, silent: true });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to add payment');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to add payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchStatistics]);

  // Export function
  const exportPledges = useCallback(async (exportParams = {}, format = 'csv') => {
    if (!hasPermission('export_data')) {
      throw new Error('Insufficient permissions');
    }

    try {
      const response = await pledgesService.exportPledges({
        search: debouncedSearchQuery,
        filters,
        ...exportParams
      }, format);
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.error || 'Failed to export pledges');
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to export pledges');
    }
  }, [hasPermission, debouncedSearchQuery, filters]);

  // Filter management
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      return updatedFilters;
    });
    invalidateCache();
  }, [invalidateCache]);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    // Reset pagination when search changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    invalidateCache();
  }, [invalidateCache]);

  const updatePagination = useCallback((updates) => {
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-fetch effect
  useEffect(() => {
    if (!config.autoFetch || !isAuthenticated) return;

    // Fetch pledges and statistics on mount or when dependencies change
    Promise.all([
      fetchPledges({ silent: true }),
      fetchStatistics({ silent: true })
    ]).catch(err => {
      console.error('Auto-fetch failed:', err);
    });
  }, [config.autoFetch, isAuthenticated, cacheKey, fetchPledges, fetchStatistics]);

  // Utility functions
  const getTotalPledgeAmount = useCallback(() => {
    return pledges.reduce((total, pledge) => total + (pledge.amount || 0), 0);
  }, [pledges]);

  const getTotalReceivedAmount = useCallback(() => {
    return pledges.reduce((total, pledge) => total + (pledge.amount_received || 0), 0);
  }, [pledges]);

  const getPledgeCompletionRate = useCallback(() => {
    const totalAmount = getTotalPledgeAmount();
    const receivedAmount = getTotalReceivedAmount();
    return totalAmount > 0 ? ((receivedAmount / totalAmount) * 100).toFixed(2) : 0;
  }, [getTotalPledgeAmount, getTotalReceivedAmount]);

  const getOverduePledges = useCallback(() => {
    const now = new Date();
    return pledges.filter(pledge => {
      if (!pledge.due_date) return false;
      const dueDate = new Date(pledge.due_date);
      const amountDue = (pledge.amount || 0) - (pledge.amount_received || 0);
      return dueDate < now && amountDue > 0;
    });
  }, [pledges]);

  // Clear functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  const resetState = useCallback(() => {
    if (mountedRef.current) {
      setPledges([]);
      setStatistics({});
      setPagination({
        count: 0,
        next: null,
        previous: null,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 25
      });
      setError(null);
      setLoading(false);
    }
    clearCache();
  }, [clearCache]);

  // Computed values
  const computedValues = useMemo(() => ({
    totalPledgeAmount: getTotalPledgeAmount(),
    totalReceivedAmount: getTotalReceivedAmount(),
    completionRate: getPledgeCompletionRate(),
    overduePledges: getOverduePledges(),
    activePledges: pledges.filter(p => p.status === 'active').length,
    completedPledges: pledges.filter(p => p.status === 'completed').length,
    hasPledges: pledges.length > 0,
    hasNextPage: pagination.next !== null,
    hasPrevPage: pagination.previous !== null
  }), [pledges, pagination, getTotalPledgeAmount, getTotalReceivedAmount, getPledgeCompletionRate, getOverduePledges]);

  return {
    // Data
    pledges,
    statistics,
    pagination,
    
    // Computed values
    ...computedValues,
    
    // State
    loading,
    error,
    filters,
    searchQuery: debouncedSearchQuery,
    isConnected: config.enableRealTime && isConnected,
    
    // Core Actions
    fetchPledges,
    fetchStatistics,
    createPledge,
    updatePledge,
    deletePledge,
    
    // Bulk Actions
    bulkUpdatePledges,
    bulkDeletePledges,
    
    // Payment Actions
    addPayment,
    
    // Utility Actions
    exportPledges,
    updateFilters,
    updateSearchQuery,
    updatePagination,
    
    // Computed Utilities
    getTotalPledgeAmount,
    getTotalReceivedAmount,
    getPledgeCompletionRate,
    getOverduePledges,
    
    // Management
    clearError,
    clearCache,
    resetState,
    refresh: () => fetchPledges({ forceRefresh: true }),
    
    // Cache info
    getCacheInfo: () => Object.keys(cacheRef.current).map(key => ({
      key,
      timestamp: cacheRef.current[key].timestamp,
      age: Date.now() - cacheRef.current[key].timestamp
    }))
  };
};

export default usePledges;