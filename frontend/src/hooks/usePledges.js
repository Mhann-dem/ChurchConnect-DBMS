// hooks/usePledges.js - FINAL FIX - Stable dependencies
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

const usePledges = (initialOptions = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  const options = useMemo(() => ({
    enableCache: initialOptions.enableCache !== false,
    cacheTime: initialOptions.cacheTime || 5 * 60 * 1000,
    staleTime: initialOptions.staleTime || 2 * 60 * 1000,
    debounceMs: initialOptions.debounceMs || 300,
    autoFetch: initialOptions.autoFetch !== false,
    optimisticUpdates: initialOptions.optimisticUpdates !== false,
    ...initialOptions
  }), []); // ✅ FIXED: Empty deps - options are stable

  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 25
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    frequency: 'all',
    member_id: null,
    date_range: null,
    ...initialOptions.filters
  });

  const debouncedSearch = useDebounce(filters.search, options.debounceMs);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ DEBUG: Watch pledges state changes
  useEffect(() => {
    console.log('[usePledges] 📊 Pledges state changed:', {
      length: pledges.length,
      loading,
      error,
      firstPledge: pledges[0]?.member_details?.full_name || 'none'
    });
  }, [pledges, loading, error]);

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

  // ✅ CRITICAL FIX: Use useRef for current filter values to avoid dependency issues
  const currentFiltersRef = useRef(filters);
  const currentPaginationRef = useRef(pagination);
  
  useEffect(() => {
    currentFiltersRef.current = filters;
    currentPaginationRef.current = pagination;
  }, [filters, pagination]);

  // ✅ FIXED: Stable fetchPledges with minimal dependencies
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      const error = 'Insufficient permissions to view pledges';
      setError(error);
      setLoading(false);
      return { success: false, error };
    }

    const requestId = ++requestIdRef.current;
    
    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // ✅ Use refs for current values instead of closure variables
      const currentFilters = currentFiltersRef.current;
      const currentPagination = currentPaginationRef.current;

      const mergedParams = {
        search: debouncedSearch || '',
        status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
        frequency: currentFilters.frequency !== 'all' ? currentFilters.frequency : undefined,
        member_id: currentFilters.member_id || undefined,
        page: currentPagination.currentPage || 1,
        page_size: currentPagination.itemsPerPage || 25,
        ordering: '-created_at',
        ...params
      };

      // Clean undefined values
      Object.keys(mergedParams).forEach(key => {
        if (mergedParams[key] === undefined || mergedParams[key] === '') {
          delete mergedParams[key];
        }
      });

      console.log('[usePledges] 📡 Fetching pledges with params:', mergedParams);

      const djangoResponse = await pledgesService.getPledges(mergedParams);

      // Check if request is still latest
      if (requestId !== requestIdRef.current) {
        console.warn('[usePledges] Request superseded');
        return { success: false, error: 'Request superseded' };
      }

      console.log('[usePledges] ✅ Raw Django response:', {
        hasResults: !!djangoResponse?.results,
        isArray: Array.isArray(djangoResponse?.results),
        count: djangoResponse?.count,
        resultsLength: djangoResponse?.results?.length
      });

      let pledgesArray = [];
      let paginationData = { ...currentPagination };

      if (djangoResponse && djangoResponse.results && Array.isArray(djangoResponse.results)) {
        pledgesArray = djangoResponse.results;
        paginationData = {
          count: djangoResponse.count || 0,
          next: djangoResponse.next,
          previous: djangoResponse.previous,
          totalPages: Math.ceil((djangoResponse.count || 0) / (mergedParams.page_size || 25)),
          currentPage: mergedParams.page || 1,
          itemsPerPage: mergedParams.page_size || 25
        };

        console.log('[usePledges] ✅ Extracted pledges:', {
          arrayLength: pledgesArray.length,
          totalCount: paginationData.count,
          firstPledgeMember: pledgesArray[0]?.member_details?.full_name || 'N/A',
          firstPledgeAmount: pledgesArray[0]?.amount || 0
        });
      } else {
        console.warn('[usePledges] ⚠️ Unexpected response structure:', djangoResponse);
        pledgesArray = [];
        paginationData = {
          count: 0,
          next: null,
          previous: null,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: mergedParams.page_size || 25
        };
      }

      // ✅ CRITICAL: Always update state and clear loading
      if (mountedRef.current) {
        console.log(`[usePledges] 💾 Setting ${pledgesArray.length} pledges in state`);
        setPledges(pledgesArray);
        setPagination(paginationData);
        setLastFetch(new Date());
        setError(null);
      }

      return { success: true, data: pledgesArray };
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
        console.log('[usePledges] ✅ Clearing loading state');
        setLoading(false);
      }
    }
  }, [isAuthenticated, hasPermission, debouncedSearch, handleError]); // ✅ Minimal, stable dependencies

  const fetchStatistics = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      console.warn('[usePledges] Skipping statistics - not authenticated');
      if (mountedRef.current) {
        setStatistics({});
      }
      return { success: true, data: {} };
    }

    try {
      console.log('[usePledges] 📊 Fetching statistics...');
      const response = await pledgesService.getStatistics(params);
      
      const statsData = response?.data || response || {};
      
      if (mountedRef.current) {
        console.log('[usePledges] ✅ Setting statistics in state');
        setStatistics(statsData);
      }
      
      return { success: true, data: statsData };
    } catch (error) {
      console.error('[usePledges] Statistics error:', error);
      
      if (mountedRef.current) {
        setStatistics({});
      }
      
      return { success: true, data: {} };
    }
  }, [isAuthenticated, hasPermission]);

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
      
      if (response.success || response.data) {
        const newPledge = response.data || response;
        console.log('[usePledges] Pledge created successfully:', newPledge);
        
        if (mountedRef.current && options.optimisticUpdates) {
          setPledges(prev => [newPledge, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        fetchStatistics();
        
        if (showToast) {
          showToast('Pledge created successfully', 'success');
        }
        
        return newPledge;
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
      
      if (response.success || response.data) {
        const updatedPledge = response.data || response;
        
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? { ...pledge, ...updatedPledge } : pledge
          ));
        }
        
        fetchStatistics();
        
        if (showToast) {
          showToast('Pledge updated successfully', 'success');
        }
        
        return updatedPledge;
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
      
      if (response.success !== false) {
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

  // ✅ FIXED: Simplified auto-fetch with stable dependencies
  useEffect(() => {
    if (!options.autoFetch || !isAuthenticated) {
      console.log('[usePledges] Auto-fetch skipped:', { 
        autoFetch: options.autoFetch, 
        isAuthenticated 
      });
      return;
    }

    console.log('[usePledges] 🔄 Auto-fetch effect triggered');
    
    // ✅ Use a flag to prevent multiple simultaneous fetches
    let isFetching = false;
    
    const fetchData = async () => {
      if (isFetching) {
        console.log('[usePledges] ⚠️ Already fetching, skipping...');
        return;
      }
      
      isFetching = true;
      
      try {
        console.log('[usePledges] 📡 Starting auto-fetch...');
        await fetchPledges();
        
        try {
          await fetchStatistics();
        } catch (statsError) {
          console.warn('[usePledges] Statistics fetch failed (non-critical):', statsError.message);
        }
      } catch (error) {
        console.error('[usePledges] Auto-fetch failed:', error);
      } finally {
        isFetching = false;
      }
    };

    const timeoutId = setTimeout(fetchData, 100);
    return () => {
      clearTimeout(timeoutId);
      isFetching = false;
    };
  }, [
    options.autoFetch, 
    isAuthenticated, 
    debouncedSearch, 
    filters.status, 
    filters.frequency, 
    pagination.currentPage,
    fetchPledges, // ✅ Now stable because of minimal dependencies
    fetchStatistics
  ]);

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
      console.log('[usePledges] 🔄 Manual refresh triggered');
      setError(null);
      
      await fetchPledges({ forceRefresh: true });
      
      try {
        await fetchStatistics({ forceRefresh: true });
      } catch (statsError) {
        console.warn('[usePledges] Statistics refresh failed (non-critical):', statsError.message);
      }
      
      console.log('[usePledges] ✅ Refresh completed successfully');
    } catch (error) {
      console.error('[usePledges] Refresh failed:', error);
      throw error;
    }
  }, [fetchPledges, fetchStatistics]);

  return {
    pledges,
    statistics,
    pagination,
    filters,
    loading,
    error,
    lastFetch,
    fetchPledges,
    fetchStatistics,
    createPledge,
    updatePledge,
    deletePledge,
    updateFilters,
    updatePagination,
    clearError,
    resetState,
    refresh
  };
};

export default usePledges;