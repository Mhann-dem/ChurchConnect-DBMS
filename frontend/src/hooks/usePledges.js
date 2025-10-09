// hooks/usePledges.js - FIXED VERSION with proper data extraction
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

const usePledges = (initialOptions = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  // Configuration options
  const options = useMemo(() => ({
    enableCache: initialOptions.enableCache !== false,
    cacheTime: initialOptions.cacheTime || 5 * 60 * 1000,
    staleTime: initialOptions.staleTime || 2 * 60 * 1000,
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

  // Refs
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
    
    if (error?.response?.status !== 401 && showToast) {
      showToast(errorMessage, 'error');
    }
    
    return errorMessage;
  }, [showToast]);

  // ✅ FIXED: Enhanced fetch with proper response handling
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

      // ✅ CRITICAL FIX: Properly extract data from response
      if (response.success) {
        let pledgesArray = [];
        let paginationData = { ...pagination };

        // The response.data structure from your API
        const responseData = response.data;

        console.log('[usePledges] Response data structure:', {
          hasData: !!responseData,
          hasResults: !!responseData?.results,
          isArray: Array.isArray(responseData?.results),
          count: responseData?.count,
          resultsLength: responseData?.results?.length
        });

        // Handle paginated response (most common case)
        if (responseData && responseData.results) {
          pledgesArray = Array.isArray(responseData.results) ? responseData.results : [];
          paginationData = {
            count: responseData.count || 0,
            next: responseData.next,
            previous: responseData.previous,
            totalPages: Math.ceil((responseData.count || 0) / (mergedParams.page_size || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.page_size || 25
          };
        } 
        // Handle array response (non-paginated)
        else if (Array.isArray(responseData)) {
          pledgesArray = responseData;
          paginationData = {
            count: pledgesArray.length,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: pledgesArray.length
          };
        }
        // Handle single object response
        else if (responseData && typeof responseData === 'object') {
          pledgesArray = [responseData];
          paginationData = {
            count: 1,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: 1
          };
        }

        if (mountedRef.current) {
          console.log('[usePledges] Setting pledges:', {
            arrayLength: pledgesArray.length,
            pagination: paginationData,
            firstPledge: pledgesArray[0]
          });

          setPledges(pledgesArray);
          setPagination(paginationData);
          setLastFetch(new Date());
        }

        console.log(`[usePledges] ✅ Successfully loaded ${pledgesArray.length} pledges`);
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

  // ✅ FIXED: Fetch statistics with proper data extraction
  const fetchStatistics = useCallback(async (params = {}) => {
    if (!hasPermission('view_reports')) {
      return { success: false, error: 'Insufficient permissions to view statistics' };
    }

    try {
      console.log('[usePledges] Fetching statistics...');
      const response = await pledgesService.getStatistics(params);
      
      if (response.success && mountedRef.current) {
        // Extract statistics data properly
        const statsData = response.data || {};
        
        console.log('[usePledges] Statistics received:', {
          hasData: !!statsData,
          keys: Object.keys(statsData),
          totalPledged: statsData.total_pledged,
          activePledges: statsData.active_pledges
        });

        setStatistics(statsData);
        return { success: true, data: statsData };
      } else {
        throw new Error(response.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      const errorMessage = handleError(error, 'fetch statistics');
      return { success: false, error: errorMessage };
    }
  }, [hasPermission, handleError]);

  // CRUD operations remain the same
  const createPledge = useCallback(async (pledgeData) => {
    if (!hasPermission('create')) {
      const error = 'Insufficient permissions to create pledges';
      setError(error);
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[usePledges] Creating pledge:', pledgeData);

      const response = await pledgesService.createPledge(pledgeData);
      
      if (response.success) {
        console.log('[usePledges] Pledge created successfully:', response.data);
        
        // Optimistic update
        if (mountedRef.current && options.optimisticUpdates) {
          setPledges(prev => [response.data, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        // Refresh statistics
        fetchStatistics();
        
        if (showToast) {
          showToast('Pledge created successfully', 'success');
        }
        
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
  }, [hasPermission, options.optimisticUpdates, fetchStatistics, handleError, showToast]);

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
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? { ...pledge, ...response.data } : pledge
          ));
        }
        
        fetchStatistics();
        
        if (showToast) {
          showToast('Pledge updated successfully', 'success');
        }
        
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
  }, [hasPermission, fetchStatistics, handleError, showToast]);

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
        
        if (showToast) {
          showToast('Pledge deleted successfully', 'success');
        }
        
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
  }, [hasPermission, fetchStatistics, handleError, showToast]);

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
        
        if (showToast) {
          showToast(`Successfully updated ${pledgeIds.length} pledges`, 'success');
        }
        
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
  }, [hasPermission, fetchPledges, fetchStatistics, handleError, showToast]);

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
        if (showToast) {
          showToast('Export completed successfully', 'success');
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to export pledges');
      }
    } catch (error) {
      handleError(error, 'export pledges');
      throw error;
    }
  }, [hasPermission, debouncedSearch, filters, handleError, showToast]);

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

  // ✅ FIXED: Auto-fetch effect
  useEffect(() => {
    if (!options.autoFetch || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        console.log('[usePledges] Auto-fetch triggered');
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
      } catch (error) {
        console.error('[usePledges] Auto-fetch failed:', error);
      }
    };

    const timeoutId = setTimeout(fetchData, 100);
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

  const refresh = useCallback(async () => {
    try {
      console.log('[usePledges] Manual refresh triggered');
      setError(null);
      await Promise.all([
        fetchPledges({ forceRefresh: true }),
        fetchStatistics({ forceRefresh: true })
      ]);
    } catch (error) {
      console.error('[usePledges] Refresh failed:', error);
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