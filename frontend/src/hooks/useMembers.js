// hooks/useMembers.js - Production Ready with advanced caching and state management
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import membersService from '../services/members';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';
import { useRealTimeUpdates } from './useRealTimeUpdates';

/**
 * Production-ready members hook with caching, real-time updates, and optimized performance
 * @param {Object} options - Configuration options
 * @returns {Object} Members state and actions
 */
export const useMembers = (options = {}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  // Memoize options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => ({
    search: options.search || '',
    filters: options.filters || {},
    page: options.page || 1,
    limit: options.limit || 25,
    autoFetch: options.autoFetch !== false,
    enableCache: options.enableCache !== false,
    enableRealTime: options.enableRealTime !== false,
    debounceMs: options.debounceMs || 300,
    cacheTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes
    staleTime: options.staleTime || 2 * 60 * 1000   // 2 minutes
  }), [
    options.search,
    JSON.stringify(options.filters || {}),
    options.page,
    options.limit,
    options.autoFetch,
    options.enableCache,
    options.enableRealTime,
    options.debounceMs,
    options.cacheTime,
    options.staleTime
  ]);

  const { 
    search, 
    filters, 
    page, 
    limit, 
    autoFetch, 
    enableCache, 
    enableRealTime,
    debounceMs,
    cacheTime,
    staleTime
  } = memoizedOptions;

  // Core state
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refs for managing state
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef({});
  const lastFetchKeyRef = useRef(null);

  // Debounce search term
  const debouncedSearch = useDebounce(search, debounceMs);

  // Generate cache key
  const cacheKey = useMemo(() => 
    JSON.stringify({ 
      search: debouncedSearch, 
      filters, 
      page, 
      limit 
    }), 
    [debouncedSearch, filters, page, limit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cache utilities
  const getCachedData = useCallback((key) => {
    if (!enableCache) return null;
    
    const cached = cacheRef.current[key];
    if (!cached) return null;
    
    const now = Date.now();
    const isStale = (now - cached.timestamp) > staleTime;
    const isExpired = (now - cached.timestamp) > cacheTime;
    
    if (isExpired) {
      delete cacheRef.current[key];
      return null;
    }
    
    return { ...cached, isStale };
  }, [enableCache, staleTime, cacheTime]);

  const setCachedData = useCallback((key, data) => {
    if (!enableCache) return;
    
    cacheRef.current[key] = {
      ...data,
      timestamp: Date.now()
    };
  }, [enableCache]);

  const invalidateCache = useCallback((pattern) => {
    if (!enableCache) return;
    
    if (!pattern) {
      cacheRef.current = {};
      return;
    }
    
    Object.keys(cacheRef.current).forEach(key => {
      if (key.includes(pattern)) {
        delete cacheRef.current[key];
      }
    });
  }, [enableCache]);

  // Real-time updates handler
  const handleRealTimeUpdate = useCallback((type, data) => {
    if (!mountedRef.current) return;

    switch (type) {
      case 'member_created':
        setMembers(prev => [data, ...prev]);
        setTotalMembers(prev => prev + 1);
        invalidateCache('search=');
        break;
        
      case 'member_updated':
        setMembers(prev => prev.map(member => 
          member.id === data.id ? { ...member, ...data } : member
        ));
        invalidateCache(data.id);
        break;
        
      case 'member_deleted':
        setMembers(prev => prev.filter(member => member.id !== data.id));
        setTotalMembers(prev => Math.max(0, prev - 1));
        invalidateCache();
        break;
        
      default:
        console.log('[useMembers] Unknown real-time update type:', type);
    }
  }, [invalidateCache]);

  // Set up real-time updates
  const { isConnected } = useRealTimeUpdates('members', {
    onCreate: (data) => handleRealTimeUpdate('member_created', data),
    onUpdate: (data) => handleRealTimeUpdate('member_updated', data),
    onDelete: (data) => handleRealTimeUpdate('member_deleted', data)
  });

  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Fetch members with caching and error handling
  const fetchMembers = useCallback(async (options = {}) => {
    const { 
      forceRefresh = false, 
      silent = false,
      customFilters = {},
      customPage = page,
      customLimit = limit
    } = options;

    if (!isAuthenticated) {
      if (mountedRef.current) {
        setError('Authentication required');
        setIsLoading(false);
      }
      return { success: false, error: 'Authentication required' };
    }

    const fetchKey = JSON.stringify({ 
      search: debouncedSearch, 
      filters: { ...filters, ...customFilters }, 
      page: customPage, 
      limit: customLimit 
    });

    // Prevent duplicate requests
    if (!forceRefresh && lastFetchKeyRef.current === fetchKey) {
      return { success: true, fromCache: false };
    }

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = getCachedData(fetchKey);
        if (cached && !cached.isStale) {
          if (mountedRef.current) {
            setMembers(cached.data || []);
            setTotalMembers(cached.totalMembers || 0);
            setPagination(cached.pagination);
            setError(null);
            setIsLoading(false);
          }
          return { success: true, fromCache: true };
        }
      }

      const signal = cancelRequests();
      lastFetchKeyRef.current = fetchKey;

      if (mountedRef.current && !silent) {
        setIsLoading(true);
        setError(null);
      }

      const result = await membersService.getMembers({
        search: debouncedSearch,
        filters: { ...filters, ...customFilters },
        page: customPage,
        limit: customLimit,
        signal,
        forceRefresh
      });

      if (!mountedRef.current) return { success: false, error: 'Component unmounted' };

      if (result.success) {
        const safeMembers = Array.isArray(result.data) ? result.data : [];
        const safeTotalMembers = typeof result.totalMembers === 'number' ? result.totalMembers : 0;
        
        // Update state
        setMembers(safeMembers);
        setTotalMembers(safeTotalMembers);
        setPagination(result.pagination);
        setError(null);

        // Cache the result
        setCachedData(fetchKey, {
          data: safeMembers,
          totalMembers: safeTotalMembers,
          pagination: result.pagination
        });

        return { success: true, data: safeMembers, totalMembers: safeTotalMembers };
      } else {
        setError(result.error || 'Failed to fetch members');
        return { success: false, error: result.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }

      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to fetch members';

      if (mountedRef.current) {
        setError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isAuthenticated, 
    debouncedSearch, 
    filters, 
    page, 
    limit, 
    getCachedData, 
    setCachedData, 
    cancelRequests
  ]);

  // CRUD Operations with optimistic updates
  const createMember = useCallback(async (memberData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await membersService.createMember(memberData);
      
      if (result.success) {
        // Optimistic update
        if (mountedRef.current) {
          setMembers(prev => [result.data, ...prev]);
          setTotalMembers(prev => prev + 1);
        }
        
        // Invalidate cache
        invalidateCache();
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to create member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          'Failed to create member';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [invalidateCache]);

  const updateMember = useCallback(async (memberId, memberData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      const originalMember = members.find(m => m.id === memberId);
      if (mountedRef.current) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, ...memberData } : member
        ));
      }

      const result = await membersService.updateMember(memberId, memberData);
      
      if (result.success) {
        // Update with actual result
        if (mountedRef.current) {
          setMembers(prev => prev.map(member => 
            member.id === memberId ? { ...member, ...result.data } : member
          ));
        }
        
        // Invalidate related cache
        invalidateCache(memberId);
        
        return result;
      } else {
        // Revert optimistic update
        if (mountedRef.current && originalMember) {
          setMembers(prev => prev.map(member => 
            member.id === memberId ? originalMember : member
          ));
        }
        
        throw new Error(result.error || 'Failed to update member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to update member';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [members, invalidateCache]);

  const deleteMember = useCallback(async (memberId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      const originalMembers = members;
      const memberToDelete = members.find(m => m.id === memberId);
      
      if (mountedRef.current) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        setTotalMembers(prev => Math.max(0, prev - 1));
      }

      const result = await membersService.deleteMember(memberId);
      
      if (result.success) {
        // Invalidate cache
        invalidateCache();
        
        return result;
      } else {
        // Revert optimistic update
        if (mountedRef.current) {
          setMembers(originalMembers);
          setTotalMembers(prev => prev + 1);
        }
        
        throw new Error(result.error || 'Failed to delete member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to delete member';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [members, invalidateCache]);

  // Batch operations
  const bulkUpdateMembers = useCallback(async (memberIds, updates) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await membersService.bulkUpdateMembers(memberIds, updates);
      
      if (result.success) {
        // Refresh data after bulk update
        await fetchMembers({ forceRefresh: true, silent: true });
        return result;
      } else {
        throw new Error(result.error || 'Failed to update members');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to update members';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchMembers]);

  const bulkDeleteMembers = useCallback(async (memberIds) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await membersService.bulkDeleteMembers(memberIds);
      
      if (result.success) {
        // Remove from current list
        if (mountedRef.current) {
          setMembers(prev => prev.filter(member => !memberIds.includes(member.id)));
          setTotalMembers(prev => Math.max(0, prev - memberIds.length));
        }
        
        // Invalidate cache
        invalidateCache();
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete members');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to delete members';
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [invalidateCache]);

  // Search members
  const searchMembers = useCallback(async (searchQuery, searchFilters = {}) => {
    return fetchMembers({
      customFilters: { ...filters, ...searchFilters },
      forceRefresh: true
    });
  }, [fetchMembers, filters]);

  // Export members
  const exportMembers = useCallback(async (exportFilters = {}, format = 'csv') => {
    try {
      const result = await membersService.exportMembers({
        search: debouncedSearch,
        filters: { ...filters, ...exportFilters },
        format
      });
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to export members');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to export members';
      throw new Error(errorMessage);
    }
  }, [debouncedSearch, filters]);

  // Auto-fetch effect
  useEffect(() => {
    if (!autoFetch || !isAuthenticated) return;

    fetchMembers({ silent: true });
  }, [autoFetch, isAuthenticated, cacheKey, fetchMembers]);

  // Computed values
  const computedValues = useMemo(() => {
    const totalPages = pagination?.total_pages || Math.ceil(totalMembers / limit) || 1;
    const activeMembers = members.filter(member => member?.is_active === true).length;
    const inactiveMembers = members.length - activeMembers;

    return {
      totalPages,
      activeMembers,
      inactiveMembers,
      hasMembers: members.length > 0,
      hasNextPage: pagination?.next !== null,
      hasPrevPage: pagination?.previous !== null,
      isFirstPage: page === 1,
      isLastPage: page >= totalPages
    };
  }, [members, pagination, totalMembers, limit, page]);

  // Utility functions
  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  const refresh = useCallback(async (silent = false) => {
    return fetchMembers({ forceRefresh: true, silent });
  }, [fetchMembers]);

  const resetState = useCallback(() => {
    if (mountedRef.current) {
      setMembers([]);
      setTotalMembers(0);
      setPagination(null);
      setError(null);
      setIsLoading(false);
    }
    invalidateCache();
  }, [invalidateCache]);

  return {
    // Data
    members,
    totalMembers,
    pagination,
    
    // Computed values
    ...computedValues,
    
    // State
    isLoading,
    error,
    isConnected: enableRealTime && isConnected,
    
    // Actions
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    bulkUpdateMembers,
    bulkDeleteMembers,
    searchMembers,
    exportMembers,
    
    // Utilities
    refresh,
    clearError,
    resetState,
    invalidateCache,
    
    // Cache info
    getCacheInfo: () => Object.keys(cacheRef.current).map(key => ({
      key,
      timestamp: cacheRef.current[key].timestamp,
      age: Date.now() - cacheRef.current[key].timestamp
    }))
  };
};