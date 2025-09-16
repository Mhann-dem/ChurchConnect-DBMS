// hooks/useMembers.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import membersService from '../services/members';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';

/**
 * FIXED: Simplified but reliable members hook
 * @param {Object} options - Configuration options
 * @returns {Object} Members state and actions
 */
export const useMembers = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  // Memoize options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => ({
    search: options.search || '',
    filters: options.filters || {},
    page: options.page || 1,
    limit: options.limit || 25,
    autoFetch: options.autoFetch !== false,
    debounceMs: options.debounceMs || 300,
  }), [
    options.search,
    JSON.stringify(options.filters || {}),
    options.page,
    options.limit,
    options.autoFetch,
    options.debounceMs
  ]);

  const { search, filters, page, limit, autoFetch, debounceMs } = memoizedOptions;

  // Core state
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refs for managing state
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const lastFetchRef = useRef(null);

  // Debounce search term
  const debouncedSearch = useDebounce(search, debounceMs);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // FIXED: Simplified fetch function with better error handling
  const fetchMembers = useCallback(async (fetchOptions = {}) => {
    const { forceRefresh = false, silent = false } = fetchOptions;

    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      console.warn('[useMembers] Not authenticated, skipping fetch');
      if (mountedRef.current) {
        setError('Authentication required');
        setIsLoading(false);
      }
      return { success: false, error: 'Authentication required' };
    }

    // Generate fetch key to prevent duplicate requests
    const fetchKey = JSON.stringify({ 
      search: debouncedSearch, 
      filters, 
      page, 
      limit,
      timestamp: forceRefresh ? Date.now() : 0
    });

    // Prevent duplicate requests
    if (!forceRefresh && lastFetchRef.current === fetchKey) {
      console.log('[useMembers] Preventing duplicate fetch');
      return { success: true, fromCache: false };
    }

    try {
      const signal = cancelRequests();
      lastFetchRef.current = fetchKey;

      if (mountedRef.current && !silent) {
        setIsLoading(true);
        setError(null);
      }

      console.log('[useMembers] Fetching members with params:', {
        search: debouncedSearch,
        filters,
        page,
        limit,
        forceRefresh
      });

      const result = await membersService.getMembers({
        search: debouncedSearch,
        filters,
        page,
        limit,
        signal,
        forceRefresh
      });

      if (!mountedRef.current) {
        console.log('[useMembers] Component unmounted, ignoring result');
        return { success: false, error: 'Component unmounted' };
      }

      if (result.success) {
        const safeMembers = Array.isArray(result.data) ? result.data : [];
        const safeTotalMembers = typeof result.totalMembers === 'number' ? result.totalMembers : 0;
        
        console.log('[useMembers] Successfully fetched:', {
          membersCount: safeMembers.length,
          totalMembers: safeTotalMembers,
          page,
          pagination: result.pagination
        });

        // FIXED: Update state reliably
        setMembers(safeMembers);
        setTotalMembers(safeTotalMembers);
        setPagination(result.pagination);
        setError(null);

        return { 
          success: true, 
          data: safeMembers, 
          totalMembers: safeTotalMembers,
          pagination: result.pagination
        };
      } else {
        console.error('[useMembers] Fetch failed:', result.error);
        
        if (mountedRef.current) {
          setError(result.error || 'Failed to fetch members');
        }
        
        return { success: false, error: result.error };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useMembers] Request was cancelled');
        return { success: false, error: 'Request cancelled' };
      }

      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to fetch members';

      console.error('[useMembers] Fetch error:', errorMessage, err);

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
    cancelRequests
  ]);

  // FIXED: CRUD Operations with immediate UI updates
  const createMember = useCallback(async (memberData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Creating member:', memberData);
      const result = await membersService.createMember(memberData);
      
      if (result.success) {
        console.log('[useMembers] Member created successfully:', result.data);
        
        // FIXED: Force immediate refresh to get the latest data
        // Don't do optimistic updates - just refresh to ensure data consistency
        const refreshResult = await fetchMembers({ forceRefresh: true, silent: true });
        
        if (refreshResult.success) {
          console.log('[useMembers] Data refreshed after create');
        } else {
          console.warn('[useMembers] Failed to refresh after create, but member was created');
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to create member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          'Failed to create member';
      
      console.error('[useMembers] Create member error:', errorMessage, err);
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, fetchMembers]);

  const updateMember = useCallback(async (memberId, memberData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Updating member:', memberId, memberData);
      const result = await membersService.updateMember(memberId, memberData);
      
      if (result.success) {
        console.log('[useMembers] Member updated successfully');
        
        // Update the specific member in the list
        if (mountedRef.current) {
          setMembers(prev => prev.map(member => 
            member.id === memberId ? { ...member, ...result.data } : member
          ));
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to update member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to update member';
      
      console.error('[useMembers] Update member error:', errorMessage);
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  const deleteMember = useCallback(async (memberId) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Deleting member:', memberId);
      const result = await membersService.deleteMember(memberId);
      
      if (result.success) {
        console.log('[useMembers] Member deleted successfully');
        
        // Remove from current list immediately
        if (mountedRef.current) {
          setMembers(prev => prev.filter(member => member.id !== memberId));
          setTotalMembers(prev => Math.max(0, prev - 1));
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete member');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to delete member';
      
      console.error('[useMembers] Delete member error:', errorMessage);
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Batch operations
  const bulkUpdateMembers = useCallback(async (memberIds, updates) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Bulk updating members:', memberIds.length);
      const result = await membersService.performBulkAction('update', memberIds, updates);
      
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
  }, [isAuthenticated, fetchMembers]);

  const bulkDeleteMembers = useCallback(async (memberIds) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Bulk deleting members:', memberIds.length);
      const result = await membersService.performBulkAction('delete', memberIds);
      
      if (result.success) {
        // Remove from current list
        if (mountedRef.current) {
          setMembers(prev => prev.filter(member => !memberIds.includes(member.id)));
          setTotalMembers(prev => Math.max(0, prev - memberIds.length));
        }
        
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
  }, [isAuthenticated]);

  // Auto-fetch effect - FIXED: Proper dependency management
  useEffect(() => {
    if (!autoFetch || !isAuthenticated) {
      console.log('[useMembers] Auto-fetch disabled or not authenticated');
      return;
    }

    console.log('[useMembers] Auto-fetch triggered', {
      search: debouncedSearch,
      filters,
      page,
      limit
    });

    fetchMembers({ silent: true });
  }, [autoFetch, isAuthenticated, debouncedSearch, JSON.stringify(filters), page, limit, fetchMembers]);

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
    console.log('[useMembers] Manual refresh requested');
    return fetchMembers({ forceRefresh: true, silent });
  }, [fetchMembers]);

  const resetState = useCallback(() => {
    console.log('[useMembers] Resetting state');
    if (mountedRef.current) {
      setMembers([]);
      setTotalMembers(0);
      setPagination(null);
      setError(null);
      setIsLoading(false);
    }
    lastFetchRef.current = null;
  }, []);

  // Invalidate cache function for compatibility
  const invalidateCache = useCallback(() => {
    console.log('[useMembers] Cache invalidated (forcing next fetch)');
    lastFetchRef.current = null;
  }, []);

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
    
    // Actions
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    bulkUpdateMembers,
    bulkDeleteMembers,
    
    // Utilities
    refresh,
    clearError,
    resetState,
    invalidateCache,
    
    // Additional methods for compatibility
    refetch: refresh,
    getMember: (id) => members.find(m => m.id === id),
    searchMembers: (query, searchFilters = {}) => fetchMembers({
      forceRefresh: true,
      customFilters: { ...filters, ...searchFilters }
    }),
    exportMembers: async (exportFilters = {}) => {
      return membersService.exportMembers({
        search: debouncedSearch,
        filters: { ...filters, ...exportFilters }
      });
    }
  };
};