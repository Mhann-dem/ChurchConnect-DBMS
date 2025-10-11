// hooks/usePledges.js - PRODUCTION-READY VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

const usePledges = (initialOptions = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  // ✅ PRODUCTION FIX: Memoize options to prevent recreation
  const options = useMemo(() => ({
    enableCache: initialOptions.enableCache !== false,
    cacheTime: initialOptions.cacheTime || 5 * 60 * 1000,
    staleTime: initialOptions.staleTime || 2 * 60 * 1000,
    debounceMs: initialOptions.debounceMs || 300,
    autoFetch: initialOptions.autoFetch !== false,
    optimisticUpdates: initialOptions.optimisticUpdates !== false
  }), [
    initialOptions.enableCache,
    initialOptions.cacheTime,
    initialOptions.staleTime,
    initialOptions.debounceMs,
    initialOptions.autoFetch,
    initialOptions.optimisticUpdates
  ]);

  // ✅ PRODUCTION FIX: Separate initial filters to prevent recreation
  const initialFilters = useMemo(() => ({
    search: initialOptions.filters?.search || '',
    status: initialOptions.filters?.status || 'all',
    frequency: initialOptions.filters?.frequency || 'all',
    member_id: initialOptions.filters?.member_id || null,
    date_range: initialOptions.filters?.date_range || null
  }), [
    initialOptions.filters?.search,
    initialOptions.filters?.status,
    initialOptions.filters?.frequency,
    initialOptions.filters?.member_id,
    initialOptions.filters?.date_range
  ]);

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

  const [filters, setFilters] = useState(initialFilters);

  const debouncedSearch = useDebounce(filters.search, options.debounceMs);
  
  // ✅ PRODUCTION FIX: Single mounted ref with proper cleanup
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const fetchCountRef = useRef(0);

  // ✅ PRODUCTION FIX: Cleanup only on unmount
  useEffect(() => {
    mountedRef.current = true;
    console.log('[usePledges] Component mounted');
    
    return () => {
      mountedRef.current = false;
      console.log('[usePledges] Component unmounting - cleanup');
    };
  }, []);

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

  // ✅ PRODUCTION FIX: Stable fetchPledges with proper guards
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      const error = 'Insufficient permissions to view pledges';
      setError(error);
      setLoading(false);
      return { success: false, error };
    }

    // ✅ Prevent duplicate fetches
    if (isFetchingRef.current && !params.forceRefresh) {
      console.log('[usePledges] ⚠️ Already fetching, skipping duplicate request');
      return { success: false, error: 'Already loading' };
    }

    isFetchingRef.current = true;
    const fetchId = ++fetchCountRef.current;
    
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

      // Clean undefined params
      Object.keys(mergedParams).forEach(key => {
        if (mergedParams[key] === undefined || mergedParams[key] === '') {
          delete mergedParams[key];
        }
      });

      console.log(`[usePledges] 📡 Fetch #${fetchId} with params:`, mergedParams);

      const djangoResponse = await pledgesService.getPledges(mergedParams);

      // ✅ PRODUCTION FIX: Only update if this is the latest fetch and component is mounted
      if (fetchId !== fetchCountRef.current) {
        console.log(`[usePledges] ⚠️ Fetch #${fetchId} outdated, skipping (latest: ${fetchCountRef.current})`);
        return { success: false, error: 'Outdated request' };
      }

      if (!mountedRef.current) {
        console.log(`[usePledges] ⚠️ Fetch #${fetchId} completed but component unmounted, skipping state update`);
        return { success: false, error: 'Component unmounted' };
      }

      let pledgesArray = [];
      let paginationData = { ...pagination };

      if (djangoResponse && typeof djangoResponse === 'object') {
        if (Array.isArray(djangoResponse.results)) {
          pledgesArray = djangoResponse.results;
          paginationData = {
            count: djangoResponse.count || 0,
            next: djangoResponse.next,
            previous: djangoResponse.previous,
            totalPages: Math.ceil((djangoResponse.count || 0) / (mergedParams.page_size || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.page_size || 25
          };
        } else if (Array.isArray(djangoResponse)) {
          pledgesArray = djangoResponse;
          paginationData = {
            count: djangoResponse.length,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: djangoResponse.length
          };
        }
      }

      console.log(`[usePledges] ✅ Fetch #${fetchId} successful: ${pledgesArray.length} pledges`);

      // ✅ PRODUCTION FIX: Batch state updates
      setPledges(pledgesArray);
      setPagination(paginationData);
      setLastFetch(new Date());
      setError(null);

      return { success: true, data: pledgesArray, pagination: paginationData };
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
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, hasPermission, debouncedSearch, filters.status, filters.frequency, filters.member_id, pagination.currentPage, pagination.itemsPerPage, handleError]);

  const fetchStatistics = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
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
        
        // Refresh pledges list after creation
        await fetchPledges({ forceRefresh: true });
        await fetchStatistics({ forceRefresh: true });
        
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
  }, [hasPermission, fetchPledges, fetchStatistics, handleError, showToast]);

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

  // ✅ PRODUCTION FIX: Stable auto-fetch with proper dependency array
  useEffect(() => {
    if (!options.autoFetch || !isAuthenticated) {
      return;
    }

    console.log('[usePledges] 🔄 Auto-fetch triggered');
    
    let cancelled = false;
    
    const fetchData = async () => {
      if (cancelled) return;
      
      try {
        await fetchPledges();
        
        if (!cancelled) {
          try {
            await fetchStatistics();
          } catch (statsError) {
            console.warn('[usePledges] Statistics fetch failed (non-critical)');
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[usePledges] Auto-fetch failed:', error);
        }
      }
    };

    const timeoutId = setTimeout(fetchData, 100);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    options.autoFetch,
    isAuthenticated,
    debouncedSearch,
    filters.status,
    filters.frequency,
    filters.member_id,
    pagination.currentPage,
    pagination.itemsPerPage,
    fetchPledges,
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
      isFetchingRef.current = false;
      
      await fetchPledges({ forceRefresh: true });
      
      try {
        await fetchStatistics({ forceRefresh: true });
      } catch (statsError) {
        console.warn('[usePledges] Statistics refresh failed (non-critical)');
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