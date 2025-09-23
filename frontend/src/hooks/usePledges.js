// hooks/usePledges.js - ENHANCED VERSION with better error handling and real-time updates
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

/**
 * Enhanced pledges hook with real-time updates, better error handling, and optimistic updates
 */
const usePledges = (initialFilters = {}, options = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  // Configuration options
  const config = useMemo(() => ({
    enableCache: options.enableCache !== false,
    enableRealTime: options.enableRealTime !== false,
    cacheTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes
    staleTime: options.staleTime || 2 * 60 * 1000,  // 2 minutes
    debounceMs: options.debounceMs || 300,
    autoFetch: options.autoFetch !== false,
    optimisticUpdates: options.optimisticUpdates !== false
  }), [options]);

  // Core state
  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // Pagination state
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
  const retryCountRef = useRef(0);

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

  // Enhanced error handling
  const handleError = useCallback((error, operation = 'operation') => {
    console.error(`[usePledges] ${operation} failed:`, error);
    
    const errorMessage = error?.response?.data?.error || 
                        error?.response?.data?.message ||
                        error?.message || 
                        `${operation} failed`;

    setError(errorMessage);
    
    // Show toast for user-facing errors
    if (error?.response?.status !== 401) { // Don't show toast for auth errors
      showToast(errorMessage, 'error');
    }
    
    return errorMessage;
  }, [showToast]);

  // Enhanced success handling
  const handleSuccess = useCallback((message, data = null) => {
    console.log(`[usePledges] Success: ${message}`);
    setError(null);
    retryCountRef.current = 0;
    
    if (message && !message.includes('fetch')) { // Don't show toast for routine fetches
      showToast(message, 'success');
    }
    
    return data;
  }, [showToast]);

  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Enhanced fetch with retry logic
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      const error = 'Insufficient permissions to view pledges';
      setError(error);
      return { success: false, error };
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
    
    // Skip if same request is already in progress
    if (!params.forceRefresh && lastFetchParamsRef.current === currentParamsStr) {
      return { success: true, fromCache: false };
    }

    try {
      lastFetchParamsRef.current = currentParamsStr;

      if (mountedRef.current && !params.silent) {
        setLoading(true);
        setError(null);
      }

      const response = await pledgesService.getPledges(mergedParams);

      // Check if this is still the latest request
      if (requestId !== requestIdRef.current) {
        return { success: false, error: 'Request superseded' };
      }

      if (!mountedRef.current) {
        return { success: false, error: 'Component unmounted' };
      }

      if (response.success && response.data) {
        let pledgesArray = [];
        let paginationData = pagination;

        // Handle different response formats
        if (response.data.results) {
          // Paginated response
          pledgesArray = Array.isArray(response.data.results) ? response.data.results : [];
          paginationData = {
            count: response.data.count || 0,
            next: response.data.next,
            previous: response.data.previous,
            totalPages: Math.ceil((response.data.count || 0) / (mergedParams.limit || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.limit || 25
          };
        } else if (Array.isArray(response.data)) {
          // Non-paginated response
          pledgesArray = response.data;
          paginationData = {
            ...pagination,
            count: pledgesArray.length,
            totalPages: 1
          };
        }

        setPledges(pledgesArray);
        setPagination(paginationData);
        setLastFetch(new Date());

        if (!params.silent) {
          handleSuccess(`Loaded ${pledgesArray.length} pledges`);
        }

        return { success: true, data: pledgesArray };
      } else {
        throw new Error(response.error || 'Failed to fetch pledges');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }

      const errorMessage = handleError(error, 'fetch pledges');

      if (mountedRef.current) {
        setPledges([]);
      }

      // Retry logic for network errors
      if (error?.code === 'NETWORK_ERROR' && retryCountRef.current < 3) {
        retryCountRef.current++;
        console.log(`[usePledges] Retrying fetch (attempt ${retryCountRef.current})...`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetchPledges({ ...params, silent: true });
          }
        }, 1000 * retryCountRef.current); // Exponential backoff
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
    handleError,
    handleSuccess
  ]);

  // Enhanced fetch statistics
  const fetchStatistics = useCallback(async (params = {}) => {
    if (!hasPermission('view_reports')) {
      return { success: false, error: 'Insufficient permissions to view statistics' };
    }

    try {
      setError(null);
      const response = await pledgesService.getStatistics(params);
      
      if (response.success && mountedRef.current) {
        setStatistics(response.data || {});
        return { success: true, data: response.data };
      } else {
        throw new Error(response.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      const errorMessage = handleError(error, 'fetch statistics');
      return { success: false, error: errorMessage };
    }
  }, [hasPermission, handleError]);

  // Enhanced CRUD operations with optimistic updates
  const createPledge = useCallback(async (pledgeData) => {
    if (!hasPermission('create')) {
      const error = 'Insufficient permissions to create pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.createPledge(pledgeData);
      
      if (response.success) {
        // Optimistic update
        if (mountedRef.current && config.optimisticUpdates) {
          setPledges(prev => [response.data, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        // Refresh statistics
        fetchStatistics({ silent: true });
        
        handleSuccess('Pledge created successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create pledge');
      }
    } catch (error) {
      handleError(error, 'create pledge');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, config.optimisticUpdates, fetchStatistics, handleError, handleSuccess]);

  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!hasPermission('update')) {
      const error = 'Insufficient permissions to update pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const originalPledge = pledges.find(p => p.id === pledgeId);
      if (mountedRef.current && config.optimisticUpdates) {
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
        
        // Refresh statistics
        fetchStatistics({ silent: true });
        
        handleSuccess('Pledge updated successfully');
        return response.data;
      } else {
        // Revert optimistic update on failure
        if (mountedRef.current && originalPledge && config.optimisticUpdates) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? originalPledge : pledge
          ));
        }
        
        throw new Error(response.error || 'Failed to update pledge');
      }
    } catch (error) {
      handleError(error, 'update pledge');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, pledges, config.optimisticUpdates, fetchStatistics, handleError, handleSuccess]);

  const deletePledge = useCallback(async (pledgeId) => {
    if (!hasPermission('delete')) {
      const error = 'Insufficient permissions to delete pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const originalPledges = pledges;
      if (mountedRef.current && config.optimisticUpdates) {
        setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
        setPagination(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
      }

      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success) {
        // Refresh statistics
        fetchStatistics({ silent: true });
        
        handleSuccess('Pledge deleted successfully');
        return true;
      } else {
        // Revert optimistic update on failure
        if (mountedRef.current && config.optimisticUpdates) {
          setPledges(originalPledges);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        throw new Error(response.error || 'Failed to delete pledge');
      }
    } catch (error) {
      handleError(error, 'delete pledge');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, pledges, config.optimisticUpdates, fetchStatistics, handleError, handleSuccess]);

  // Bulk operations
  const bulkUpdatePledges = useCallback(async (pledgeIds, updates) => {
    if (!hasPermission('update')) {
      const error = 'Insufficient permissions to bulk update pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.bulkUpdatePledges(pledgeIds, updates);
      
      if (response.success) {
        // Refresh data after bulk update
        await Promise.all([
          fetchPledges({ forceRefresh: true, silent: true }),
          fetchStatistics({ silent: true })
        ]);
        
        handleSuccess(`Successfully updated ${pledgeIds.length} pledges`);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to bulk update pledges');
      }
    } catch (error) {
      handleError(error, 'bulk update pledges');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchPledges, fetchStatistics, handleError, handleSuccess]);

  const bulkDeletePledges = useCallback(async (pledgeIds) => {
    if (!hasPermission('delete')) {
      const error = 'Insufficient permissions to bulk delete pledges';
      setError(error);
      throw new Error(error);
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
        
        // Refresh statistics
        fetchStatistics({ silent: true });
        
        handleSuccess(`Successfully deleted ${pledgeIds.length} pledges`);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to bulk delete pledges');
      }
    } catch (error) {
      handleError(error, 'bulk delete pledges');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchStatistics, handleError, handleSuccess]);

  // Payment operations
  const addPayment = useCallback(async (pledgeId, paymentData) => {
    if (!hasPermission('create')) {
      const error = 'Insufficient permissions to add payments';
      setError(error);
      throw new Error(error);
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
                total_received: (pledge.total_received || 0) + parseFloat(paymentData.amount)
              };
            }
            return pledge;
          }));
        }
        
        // Refresh statistics
        fetchStatistics({ silent: true });
        
        handleSuccess('Payment added successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to add payment');
      }
    } catch (error) {
      handleError(error, 'add payment');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchStatistics, handleError, handleSuccess]);

  // Export function
  const exportPledges = useCallback(async (exportParams = {}, format = 'csv') => {
    if (!hasPermission('export_data')) {
      const error = 'Insufficient permissions to export data';
      setError(error);
      throw new Error(error);
    }

    try {
      const response = await pledgesService.exportPledges({
        search: debouncedSearchQuery,
        filters,
        ...exportParams
      }, format);
      
      if (response.success) {
        handleSuccess('Export completed successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to export pledges');
      }
    } catch (error) {
      handleError(error, 'export pledges');
      throw error;
    }
  }, [hasPermission, debouncedSearchQuery, filters, handleError, handleSuccess]);

  // Filter management
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      return updatedFilters;
    });
  }, []);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    // Reset pagination when search changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const updatePagination = useCallback((updates) => {
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

  // Real-time update handler (placeholder for WebSocket integration)
  const handleRealTimeUpdate = useCallback((type, data) => {
    if (!mountedRef.current || !config.enableRealTime) return;

    switch (type) {
      case 'pledge_created':
        setPledges(prev => [data, ...prev]);
        setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        handleSuccess('New pledge added');
        break;
        
      case 'pledge_updated':
        setPledges(prev => prev.map(pledge => 
          pledge.id === data.id ? { ...pledge, ...data } : pledge
        ));
        break;
        
      case 'pledge_deleted':
        setPledges(prev => prev.filter(pledge => pledge.id !== data.id));
        setPagination(prev => ({ 
          ...prev, 
          count: Math.max(0, prev.count - 1) 
        }));
        break;
        
      case 'payment_added':
        setPledges(prev => prev.map(pledge => {
          if (pledge.id === data.pledge_id) {
            return {
              ...pledge,
              payments: [...(pledge.payments || []), data.payment],
              total_received: (pledge.total_received || 0) + parseFloat(data.payment.amount)
            };
          }
          return pledge;
        }));
        handleSuccess('Payment added');
        break;

      default:
        console.log('[usePledges] Unknown real-time update type:', type);
    }
  }, [config.enableRealTime, handleSuccess]);

  // Auto-fetch effect
  useEffect(() => {
    if (!config.autoFetch || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchPledges({ silent: true }),
          fetchStatistics({ silent: true })
        ]);
      } catch (error) {
        console.error('Auto-fetch failed:', error);
      }
    };

    fetchData();
  }, [config.autoFetch, isAuthenticated, cacheKey, fetchPledges, fetchStatistics]);

  // Utility functions
  const getTotalPledgeAmount = useCallback(() => {
    return pledges.reduce((total, pledge) => total + (parseFloat(pledge.amount) || 0), 0);
  }, [pledges]);

  const getTotalReceivedAmount = useCallback(() => {
    return pledges.reduce((total, pledge) => total + (parseFloat(pledge.total_received) || 0), 0);
  }, [pledges]);

  const getPledgeCompletionRate = useCallback(() => {
    const totalAmount = getTotalPledgeAmount();
    const receivedAmount = getTotalReceivedAmount();
    return totalAmount > 0 ? ((receivedAmount / totalAmount) * 100).toFixed(2) : 0;
  }, [getTotalPledgeAmount, getTotalReceivedAmount]);

  const getOverduePledges = useCallback(() => {
    const now = new Date();
    return pledges.filter(pledge => {
      if (!pledge.end_date || pledge.status !== 'active') return false;
      const endDate = new Date(pledge.end_date);
      const amountDue = (parseFloat(pledge.total_pledged) || 0) - (parseFloat(pledge.total_received) || 0);
      return endDate < now && amountDue > 0;
    });
  }, [pledges]);

  // Clear functions
  const clearError = useCallback(() => {
    setError(null);
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
      setLastFetch(null);
    }
    cacheRef.current = {};
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        fetchPledges({ forceRefresh: true }),
        fetchStatistics({ forceRefresh: true })
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [fetchPledges, fetchStatistics]);

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
    hasPrevPage: pagination.previous !== null,
    isStale: lastFetch && (Date.now() - lastFetch.getTime()) > config.staleTime
  }), [pledges, pagination, getTotalPledgeAmount, getTotalReceivedAmount, getPledgeCompletionRate, getOverduePledges, lastFetch, config.staleTime]);

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
    lastFetch,
    
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
    resetState,
    refresh,
    
    // Real-time updates
    handleRealTimeUpdate
  };
};

export default usePledges;