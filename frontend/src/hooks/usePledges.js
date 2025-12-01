// hooks/usePledges.js - COMPLETE FIX with Real-time Polling
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pledgesService from '../services/pledges';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useToast } from './useToast';

const usePledges = (initialOptions = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const { showToast } = useToast();
  
  // ✅ Stable options
  const options = useMemo(() => ({
    enableCache: initialOptions.enableCache !== false,
    cacheTime: initialOptions.cacheTime || 5 * 60 * 1000,
    staleTime: initialOptions.staleTime || 2 * 60 * 1000,
    debounceMs: initialOptions.debounceMs || 300,
    autoFetch: initialOptions.autoFetch !== false,
    optimisticUpdates: initialOptions.optimisticUpdates !== false,
    enablePolling: initialOptions.enablePolling !== false, // ✅ NEW
    pollingInterval: initialOptions.pollingInterval || 30000 // ✅ NEW: 30 seconds
  }), [
    initialOptions.enableCache,
    initialOptions.cacheTime,
    initialOptions.staleTime,
    initialOptions.debounceMs,
    initialOptions.autoFetch,
    initialOptions.optimisticUpdates,
    initialOptions.enablePolling,
    initialOptions.pollingInterval
  ]);

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
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0);

  // ✅ Refs
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const fetchCountRef = useRef(0);
  const lastFetchParamsRef = useRef(null);
  const lastRefreshTimeRef = useRef(0);
  const pollingIntervalRef = useRef(null); // ✅ NEW: Polling timer
  const MIN_REFRESH_INTERVAL = 1000;

  useEffect(() => {
    mountedRef.current = true;
    console.log('[usePledges] Hook mounted');
    
    return () => {
      mountedRef.current = false;
      // ✅ Clean up polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      console.log('[usePledges] Hook unmounting');
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

  // ✅ Fetch pledges
  const fetchPledges = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      const error = 'Insufficient permissions to view pledges';
      setError(error);
      setLoading(false);
      return { success: false, error };
    }

    if (isFetchingRef.current && !params._forceRefresh) {
      console.log('[usePledges] Already fetching, skipping duplicate');
      return { success: false, error: 'Already loading' };
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

    delete mergedParams.forceRefresh;
    delete mergedParams._forceRefresh;

    Object.keys(mergedParams).forEach(key => {
      if (mergedParams[key] === undefined || mergedParams[key] === '') {
        delete mergedParams[key];
      }
    });

    const paramsString = JSON.stringify(mergedParams);
    if (!params._forceRefresh && lastFetchParamsRef.current === paramsString) {
      console.log('[usePledges] Same params, using cached data');
      return { success: true, data: pledges, pagination };
    }

    isFetchingRef.current = true;
    const fetchId = ++fetchCountRef.current;
    
    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      console.log(`[usePledges] Fetch #${fetchId}:`, mergedParams);

      const djangoResponse = await pledgesService.getPledges(mergedParams);

      if (fetchId !== fetchCountRef.current) {
        console.log(`[usePledges] Fetch #${fetchId} outdated`);
        return { success: false, error: 'Outdated request' };
      }

      if (!mountedRef.current) {
        console.log(`[usePledges] Fetch #${fetchId} completed but unmounted`);
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

      console.log(`[usePledges] ✅ Fetch #${fetchId}: ${pledgesArray.length} pledges`);

      setPledges(pledgesArray);
      setPagination(paginationData);
      setLastFetch(new Date());
      setError(null);
      lastFetchParamsRef.current = paramsString;

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
  }, [isAuthenticated, hasPermission, debouncedSearch, filters.status, filters.frequency, filters.member_id, pagination.currentPage, pagination.itemsPerPage, handleError, pledges, pagination]);

  // ✅ Fetch statistics
  const fetchStatistics = useCallback(async (params = {}) => {
    if (!isAuthenticated || !hasPermission('read')) {
      if (mountedRef.current) {
        setStatistics({});
      }
      return { success: true, data: {} };
    }

    try {
      console.log('[usePledges] 📊 Fetching statistics...');
      
      const cleanParams = { ...params };
      delete cleanParams.forceRefresh;
      delete cleanParams._forceRefresh;
      
      const response = await pledgesService.getStatistics(cleanParams);
      
      const statsData = response?.data || response || {};
      
      if (mountedRef.current) {
        setStatistics(statsData);
        setStatsUpdateTrigger(prev => prev + 1);
        
        // ✅ Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('pledgeStatsUpdated', { 
          detail: statsData 
        }));
      }
      
      console.log('[usePledges] ✅ Statistics updated');
      
      return { success: true, data: statsData };
    } catch (error) {
      console.error('[usePledges] Statistics error:', error);
      
      if (mountedRef.current) {
        setStatistics({});
      }
      
      return { success: true, data: {} };
    }
  }, [isAuthenticated, hasPermission]);

  // ✅ Update pledge with optimistic updates
  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!hasPermission('update')) {
      const error = 'Insufficient permissions to update pledges';
      setError(error);
      throw new Error(error);
    }

    // ✅ Save original for rollback
    const originalPledge = pledges.find(p => p.id === pledgeId);
    
    try {
      setError(null);

      console.log('[usePledges] 🔵 Updating pledge:', pledgeId, pledgeData);

      // ✅ OPTIMISTIC UPDATE: Update immediately
      if (options.optimisticUpdates && mountedRef.current && originalPledge) {
        setPledges(prev => prev.map(pledge => 
          pledge.id === pledgeId ? { ...pledge, ...pledgeData } : pledge
        ));
      }

      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      if (response.success || response.data) {
        const updatedPledge = response.data || response;
        console.log('[usePledges] ✅ Pledge updated:', pledgeId);
        
        // ✅ Update with server response
        if (mountedRef.current) {
          setPledges(prev => prev.map(pledge => 
            pledge.id === pledgeId ? { ...pledge, ...updatedPledge } : pledge
          ));
        }
        
        // ✅ Refresh statistics immediately
        await fetchStatistics();
        
        // ✅ Dispatch update event
        window.dispatchEvent(new CustomEvent('pledgeUpdated', { 
          detail: { pledgeId, data: updatedPledge } 
        }));
        
        if (showToast) {
          showToast('Pledge updated successfully', 'success');
        }
        
        return updatedPledge;
      } else {
        throw new Error(response.error || 'Failed to update pledge');
      }
    } catch (error) {
      // ✅ ROLLBACK on error
      if (options.optimisticUpdates && mountedRef.current && originalPledge) {
        console.warn('[usePledges] ⚠️ Rolling back optimistic update');
        setPledges(prev => prev.map(pledge => 
          pledge.id === pledgeId ? originalPledge : pledge
        ));
      }
      
      handleError(error, 'update pledge');
      throw error;
    }
  }, [hasPermission, fetchStatistics, handleError, showToast, options.optimisticUpdates, pledges]);

  // ✅ Create pledge
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
        console.log('[usePledges] ✅ Pledge created:', newPledge.id);
        
        // ✅ Optimistically add to list
        if (options.optimisticUpdates && mountedRef.current) {
          setPledges(prev => [newPledge, ...prev]);
          setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        }
        
        // ✅ Refresh data
        setTimeout(async () => {
          if (mountedRef.current) {
            await fetchPledges({ _forceRefresh: true });
            await fetchStatistics();
          }
        }, 500);
        
        // ✅ Dispatch event
        window.dispatchEvent(new CustomEvent('pledgeCreated', { 
          detail: newPledge 
        }));
        
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
  }, [hasPermission, fetchPledges, fetchStatistics, handleError, showToast, options.optimisticUpdates]);

  // ✅ Delete pledge
  const deletePledge = useCallback(async (pledgeId) => {
    if (!hasPermission('delete')) {
      const error = 'Insufficient permissions to delete pledges';
      setError(error);
      throw new Error(error);
    }

    // ✅ Save for rollback
    const originalPledge = pledges.find(p => p.id === pledgeId);
    const originalIndex = pledges.findIndex(p => p.id === pledgeId);

    try {
      setLoading(true);
      setError(null);

      console.log('[usePledges] Deleting pledge:', pledgeId);

      // ✅ Optimistically remove
      if (mountedRef.current) {
        setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
        setPagination(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
      }

      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success !== false) {
        console.log('[usePledges] ✅ Pledge deleted:', pledgeId);
        
        // ✅ Refresh statistics
        await fetchStatistics();
        
        // ✅ Dispatch event
        window.dispatchEvent(new CustomEvent('pledgeDeleted', { 
          detail: { pledgeId } 
        }));
        
        if (showToast) {
          showToast('Pledge deleted successfully', 'success');
        }
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete pledge');
      }
    } catch (error) {
      // ✅ ROLLBACK on error
      if (mountedRef.current && originalPledge) {
        console.warn('[usePledges] ⚠️ Rolling back delete');
        setPledges(prev => {
          const newPledges = [...prev];
          newPledges.splice(originalIndex, 0, originalPledge);
          return newPledges;
        });
        setPagination(prev => ({ ...prev, count: prev.count + 1 }));
      }
      
      handleError(error, 'delete pledge');
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [hasPermission, fetchStatistics, handleError, showToast, pledges]);

  // ✅ Force refresh statistics with throttling
  const forceRefreshStatistics = useCallback(async () => {
    if (!isAuthenticated || !hasPermission('read')) {
      console.warn('[usePledges] Cannot refresh statistics - insufficient permissions');
      return { success: false, error: 'Insufficient permissions' };
    }

    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      console.log('[usePledges] ⏸️ Refresh throttled, too soon');
      return { success: false, error: 'Throttled' };
    }
    lastRefreshTimeRef.current = now;

    try {
      console.log('[usePledges] 🔄 Force refreshing statistics');
      
      if (mountedRef.current) {
        setError(null);
      }
      
      const result = await fetchStatistics();
      
      console.log('[usePledges] ✅ Statistics force refresh completed');
      
      return result;
    } catch (error) {
      console.error('[usePledges] ❌ Statistics refresh failed:', error);
      
      if (mountedRef.current) {
        const errorMessage = handleError(error, 'force refresh statistics');
        setError(errorMessage);
      }
      
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, hasPermission, fetchStatistics, handleError]);

  // ✅ NEW: Start polling for updates
  const startPolling = useCallback(() => {
    if (!options.enablePolling || pollingIntervalRef.current) {
      return;
    }

    console.log(`[usePledges] 🔄 Starting polling (every ${options.pollingInterval}ms)`);

    pollingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current || !isAuthenticated) {
        return;
      }

      try {
        console.log('[usePledges] 🔄 Polling update...');
        
        // Silently refresh statistics
        await fetchStatistics();
        
      } catch (error) {
        console.warn('[usePledges] Polling error (non-critical):', error.message);
      }
    }, options.pollingInterval);
  }, [options.enablePolling, options.pollingInterval, isAuthenticated, fetchStatistics]);

  // ✅ NEW: Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[usePledges] ⏹️ Stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ✅ Auto-fetch with polling
  useEffect(() => {
    if (!options.autoFetch || !isAuthenticated) {
      return;
    }

    console.log('[usePledges] Auto-fetch triggered');
    
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

        // ✅ Start polling after initial fetch
        if (!cancelled && options.enablePolling) {
          startPolling();
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
      stopPolling();
    };
  }, [
    options.autoFetch,
    options.enablePolling,
    isAuthenticated,
    debouncedSearch,
    filters.status,
    filters.frequency,
    filters.member_id,
    pagination.currentPage,
    pagination.itemsPerPage,
    startPolling,
    stopPolling
  ]);

  const updateFilters = useCallback((newFilters) => {
    console.log('[usePledges] Updating filters:', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const updatePagination = useCallback((updates) => {
    console.log('[usePledges] Updating pagination:', updates);
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

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
      lastFetchParamsRef.current = null;
    }
  }, []);

  // ✅ Throttled manual refresh
  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      console.log('[usePledges] ⏸️ Refresh throttled');
      return;
    }
    lastRefreshTimeRef.current = now;

    try {
      console.log('[usePledges] 🔄 Manual refresh triggered');
      setError(null);
      isFetchingRef.current = false;
      lastFetchParamsRef.current = null;
      
      await fetchPledges({ _forceRefresh: true });
      
      try {
        await fetchStatistics();
      } catch (statsError) {
        console.warn('[usePledges] Statistics refresh failed (non-critical)');
      }
      
      console.log('[usePledges] ✅ Refresh completed');
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
    refresh,
    forceRefreshStatistics,
    statsUpdateTrigger,
    startPolling,  // ✅ NEW
    stopPolling    // ✅ NEW
  };
};

export default usePledges;