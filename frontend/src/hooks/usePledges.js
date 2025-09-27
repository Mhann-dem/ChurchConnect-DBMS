// hooks/usePledges.js - FIXED VERSION with proper error handling and API integration
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

/**
 * Enhanced pledges hook with proper API integration and error handling
 */
const usePledges = (initialOptions = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  // Configuration options
  const options = useMemo(() => ({
    enableCache: initialOptions.enableCache !== false,
    enableRealTime: initialOptions.enableRealTime !== false,
    cacheTime: initialOptions.cacheTime || 5 * 60 * 1000, // 5 minutes
    staleTime: initialOptions.staleTime || 2 * 60 * 1000,  // 2 minutes
    debounceMs: initialOptions.debounceMs || 300,
    autoFetch: initialOptions.autoFetch !== false,
    optimisticUpdates: initialOptions.optimisticUpdates !== false,
    ...initialOptions
  }), [initialOptions]);

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

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    frequency: 'all',
    member_id: null,
    date_range: null,
    ...initialOptions.filters
  });

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, options.debounceMs);

  // Refs for managing state and cleanup
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
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

  // Enhanced error handling
  const handleError = useCallback((error, operation = 'operation') => {
    console.error(`[usePledges] ${operation} failed:`, error);
    
    const errorMessage = error?.response?.data?.error || 
                        error?.response?.data?.message ||
                        error?.message || 
                        `${operation} failed`;

    if (mountedRef.current) {
      setError(errorMessage);
    }
    
    // Show toast for user-facing errors (not auth errors)
    if (error?.response?.status !== 401 && showToast) {
      showToast(errorMessage, 'error');
    }
    
    return errorMessage;
  }, [showToast]);

  // Enhanced success handling
  const handleSuccess = useCallback((message, data = null) => {
    console.log(`[usePledges] Success: ${message}`);
    if (mountedRef.current) {
      setError(null);
    }
    
    if (message && !message.includes('fetch') && showToast) {
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

  // Enhanced fetch with proper response handling
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      const error = 'Insufficient permissions to view pledges';
      setError(error);
      return { success: false, error };
    }

    const requestId = ++requestIdRef.current;
    
    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const mergedParams = {
        search: debouncedSearch || '',
        status: filters.status !== 'all' ? filters.status : undefined,
        frequency: filters.frequency !== 'all' ? filters.frequency : undefined,
        member_id: filters.member_id || undefined,
        page: pagination.currentPage || 1,
        page_size: pagination.itemsPerPage || 25,
        ordering: '-created_at',
        ...params
      };

      // Clean undefined values
      Object.keys(mergedParams).forEach(key => {
        if (mergedParams[key] === undefined || mergedParams[key] === '') {
          delete mergedParams[key];
        }
      });

      console.log('[usePledges] Fetching with params:', mergedParams);

      const response = await pledgesService.getPledges(mergedParams);

      // Check if this is still the latest request
      if (requestId !== requestIdRef.current || !mountedRef.current) {
        return { success: false, error: 'Request superseded' };
      }

      if (response.success && response.data) {
        let pledgesArray = [];
        let paginationData = { ...pagination };

        // Handle paginated response
        if (response.data.results) {
          pledgesArray = Array.isArray(response.data.results) ? response.data.results : [];
          paginationData = {
            count: response.data.count || 0,
            next: response.data.next,
            previous: response.data.previous,
            totalPages: Math.ceil((response.data.count || 0) / (mergedParams.page_size || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.page_size || 25
          };
        } else if (Array.isArray(response.data)) {
          // Non-paginated response
          pledgesArray = response.data;
          paginationData = {
            ...pagination,
            count: pledgesArray.length,
            totalPages: 1,
            currentPage: 1
          };
        } else {
          // Single object response
          pledgesArray = [response.data];
        }

        if (mountedRef.current) {
          setPledges(pledgesArray);
          setPagination(paginationData);
          setLastFetch(new Date());
        }

        console.log(`[usePledges] Loaded ${pledgesArray.length} pledges`);
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

      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    isAuthenticated, 
    hasPermission, 
    debouncedSearch, 
    filters, 
    pagination.currentPage,
    pagination.itemsPerPage,
    handleError
  ]);

  // Fetch statistics
  const fetchStatistics = useCallback(async (params = {}) => {
    if (!hasPermission('view_reports')) {
      return { success: false, error: 'Insufficient permissions to view statistics' };
    }

    try {
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

  // CRUD operations
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
        if (mountedRef.current && options.optimisticUpdates) {
          setPledges(prev => [response.data, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        // Refresh statistics
        fetchStatistics();
        
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
  }, [hasPermission, options.optimisticUpdates, fetchStatistics, handleError, handleSuccess]);

  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!hasPermission('update')) {
      const error = 'Insufficient permissions to update pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      if (response.success) {
        // Update with actual response
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? { ...pledge, ...response.data } : pledge
          ));
        }
        
        fetchStatistics();
        handleSuccess('Pledge updated successfully');
        return response.data;
      } else {
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
  }, [hasPermission, fetchStatistics, handleError, handleSuccess]);

  const deletePledge = useCallback(async (pledgeId) => {
    if (!hasPermission('delete')) {
      const error = 'Insufficient permissions to delete pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success) {
        if (mountedRef.current) {
          setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
          setPagination(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
        }
        
        fetchStatistics();
        handleSuccess('Pledge deleted successfully');
        return true;
      } else {
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
  }, [hasPermission, fetchStatistics, handleError, handleSuccess]);

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
        await fetchPledges({ forceRefresh: true });
        await fetchStatistics();
        
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

  // Export function
  const exportPledges = useCallback(async (exportParams = {}, format = 'csv') => {
    if (!hasPermission('export_data')) {
      const error = 'Insufficient permissions to export data';
      setError(error);
      throw new Error(error);
    }

    try {
      const response = await pledgesService.exportPledges({
        search: debouncedSearch,
        ...filters,
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
  }, [hasPermission, debouncedSearch, filters, handleError, handleSuccess]);

  // Filter management
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const updatePagination = useCallback((updates) => {
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-fetch effect
  useEffect(() => {
    if (!options.autoFetch || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
      } catch (error) {
        console.error('Auto-fetch failed:', error);
      }
    };

    const timeoutId = setTimeout(fetchData, 100); // Small delay to ensure component is mounted
    return () => clearTimeout(timeoutId);
  }, [options.autoFetch, isAuthenticated, debouncedSearch, filters.status, filters.frequency, pagination.currentPage]);

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
    activePledges: pledges.filter(p => p.status === 'active').length,
    completedPledges: pledges.filter(p => p.status === 'completed').length,
    hasPledges: pledges.length > 0,
    hasNextPage: pagination.next !== null,
    hasPrevPage: pagination.previous !== null,
    isStale: lastFetch && (Date.now() - lastFetch.getTime()) > options.staleTime
  }), [pledges, pagination, getTotalPledgeAmount, getTotalReceivedAmount, getPledgeCompletionRate, lastFetch, options.staleTime]);

  return {
    // Data
    pledges,
    statistics,
    pagination,
    filters,
    
    // Computed values
    ...computedValues,
    
    // State
    loading,
    error,
    lastFetch,
    
    // Core Actions
    fetchPledges,
    fetchStatistics,
    createPledge,
    updatePledge,
    deletePledge,
    
    // Bulk Actions
    bulkUpdatePledges,
    
    // Utility Actions
    exportPledges,
    updateFilters,
    updatePagination,
    
    // Computed Utilities
    getTotalPledgeAmount,
    getTotalReceivedAmount,
    getPledgeCompletionRate,
    
    // Management
    clearError,
    resetState,
    refresh
  };
};

export default usePledges;