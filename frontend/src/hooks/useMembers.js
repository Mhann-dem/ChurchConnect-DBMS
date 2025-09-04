// hooks/useMembers.js - FIXED VERSION - Prevents infinite re-renders
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import membersService from '../services/members';

export const useMembers = (options = {}) => {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refs for preventing duplicate requests and managing state
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const debounceTimeoutRef = useRef(null);
  const lastFetchKeyRef = useRef(null);

  // FIXED: Memoize options to prevent infinite loops
  const memoizedOptions = useMemo(() => ({
    search: options.search || '',
    filters: options.filters || {},
    page: options.page || 1,
    limit: options.limit || 25,
    autoFetch: options.autoFetch !== false, // Default true
    debounceMs: options.debounceMs || 300
  }), [
    options.search,
    JSON.stringify(options.filters || {}), // Stringify filters for comparison
    options.page,
    options.limit,
    options.autoFetch,
    options.debounceMs
  ]);

  const { search, filters, page, limit, autoFetch, debounceMs } = memoizedOptions;

  // Debug logging
  console.log('[useMembers] Hook initialized with memoized options:', memoizedOptions);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useMembers] Hook unmounting, cleaning up...');
      mountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // FIXED: Create stable fetch key for comparison
  const fetchKey = useMemo(() => 
    JSON.stringify({ search, filters, page, limit }), 
    [search, filters, page, limit]
  );

  const fetchMembers = useCallback(async (forceRefresh = false) => {
    // FIXED: Prevent duplicate requests with same parameters
    if (!forceRefresh && isFetchingRef.current && lastFetchKeyRef.current === fetchKey) {
      console.log('[useMembers] Identical fetch already in progress, skipping...');
      return;
    }

    // FIXED: Check if this is the same request as last time
    if (!forceRefresh && lastFetchKeyRef.current === fetchKey && members.length > 0) {
      console.log('[useMembers] Same parameters and data exists, skipping fetch');
      return;
    }

    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        console.log('[useMembers] Aborting previous request');
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      isFetchingRef.current = true;
      lastFetchKeyRef.current = fetchKey; // Mark this request
      
      console.log('[useMembers] Fetching members with key:', fetchKey);
      
      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Add abort signal to the request
      const result = await membersService.getMembers({
        search,
        filters,
        page,
        limit,
        signal: abortControllerRef.current.signal,
        forceRefresh
      });

      console.log('[useMembers] Service result:', {
        success: result.success,
        dataLength: result.data?.length,
        totalMembers: result.totalMembers,
        error: result.error
      });

      if (!mountedRef.current) {
        console.log('[useMembers] Component unmounted, ignoring result');
        return;
      }

      if (result.success) {
        const safeMembers = Array.isArray(result.data) ? result.data : [];
        const safeTotalMembers = typeof result.totalMembers === 'number' ? result.totalMembers : 0;
        
        setMembers(safeMembers);
        setTotalMembers(safeTotalMembers);
        setPagination(result.pagination);
        setError(null);
        
        console.log('[useMembers] State updated successfully:', {
          membersCount: safeMembers.length,
          totalMembers: safeTotalMembers
        });
      } else {
        console.error('[useMembers] Service returned error:', result.error);
        setError(result.error || 'Failed to fetch members');
        setMembers([]);
        setTotalMembers(0);
        setPagination(null);
        
        // Handle authentication errors
        if (result.requiresAuth) {
          console.log('[useMembers] Authentication required');
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useMembers] Request was aborted');
        return;
      }

      console.error('[useMembers] Fetch error:', err);
      
      if (mountedRef.current) {
        const errorMessage = err?.response?.data?.error || 
                            err?.response?.data?.detail || 
                            err?.message || 
                            'Failed to fetch members';
        setError(errorMessage);
        setMembers([]);
        setTotalMembers(0);
        setPagination(null);
      }
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchKey, search, filters, page, limit, members.length]); // FIXED: Stable dependencies

  // FIXED: Debounced fetch that doesn't cause re-renders
  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchMembers(false);
      }
    }, debounceMs);
  }, [fetchMembers, debounceMs]);

  const createMember = useCallback(async (memberData) => {
    try {
      console.log('[useMembers] Creating member:', memberData);
      setIsLoading(true);
      setError(null);

      const result = await membersService.createMember(memberData);
      
      if (result.success) {
        console.log('[useMembers] Member created successfully');
        // Force refresh after creation
        await fetchMembers(true);
        return result;
      } else {
        throw new Error(result.error || 'Failed to create member');
      }
    } catch (err) {
      console.error('[useMembers] Create error:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          'Failed to create member';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchMembers]);

  const updateMember = useCallback(async (memberId, memberData) => {
    try {
      console.log('[useMembers] Updating member:', memberId, memberData);
      setIsLoading(true);
      setError(null);

      const result = await membersService.updateMember(memberId, memberData);
      
      if (result.success) {
        console.log('[useMembers] Member updated successfully');
        // Update the member in the current list optimistically
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
      console.error('[useMembers] Update error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to update member';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const deleteMember = useCallback(async (memberId) => {
    try {
      console.log('[useMembers] Deleting member:', memberId);
      setIsLoading(true);
      setError(null);

      const result = await membersService.deleteMember(memberId);
      
      if (result.success) {
        console.log('[useMembers] Member deleted successfully');
        // Remove the member from the current list optimistically
        if (mountedRef.current) {
          setMembers(prev => prev.filter(member => member.id !== memberId));
          setTotalMembers(prev => Math.max(0, prev - 1));
        }
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete member');
      }
    } catch (err) {
      console.error('[useMembers] Delete error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to delete member';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateMemberStatus = useCallback(async (memberId, isActive) => {
    try {
      console.log('[useMembers] Updating member status:', memberId, isActive);
      return await updateMember(memberId, { is_active: isActive });
    } catch (err) {
      console.error('[useMembers] Status update error:', err);
      throw err;
    }
  }, [updateMember]);

  const searchMembers = useCallback(async (searchQuery, searchFilters = {}) => {
    try {
      console.log('[useMembers] Searching members:', searchQuery, searchFilters);
      setIsLoading(true);
      setError(null);

      const result = await membersService.searchMembers(searchQuery, searchFilters);
      
      if (result.success && mountedRef.current) {
        setMembers(Array.isArray(result.data) ? result.data : []);
        setTotalMembers(typeof result.totalMembers === 'number' ? result.totalMembers : 0);
        setPagination(result.pagination);
        setError(null);
        return result;
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (err) {
      console.error('[useMembers] Search error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Search failed';
      if (mountedRef.current) {
        setError(errorMessage);
        setMembers([]);
        setTotalMembers(0);
        setPagination(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    console.log('[useMembers] Refetching data...');
    return await fetchMembers(true); // Force refresh
  }, [fetchMembers]);

  // FIXED: Single effect with proper dependencies
  useEffect(() => {
    if (!autoFetch || !mountedRef.current) {
      console.log('[useMembers] AutoFetch disabled or component unmounted');
      return;
    }

    console.log('[useMembers] Parameters changed, scheduling fetch...');

    // For search and filter changes, use debounce
    if (search || Object.keys(filters).length > 0) {
      debouncedFetch();
    } else {
      // For page changes and initial load, fetch immediately
      fetchMembers(false);
    }

    // Cleanup debounce timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchKey, autoFetch, search, filters, debouncedFetch, fetchMembers]); // FIXED: Stable dependencies

  // Computed values
  const totalPages = pagination?.total_pages || Math.ceil(totalMembers / limit) || 1;
  const activeMembers = members.filter(member => member?.is_active === true).length;
  const inactiveMembers = members.length - activeMembers;

  // FIXED: Removed debug effect that was causing re-renders

  return {
    // Data
    members,
    totalMembers,
    totalPages,
    activeMembers,
    inactiveMembers,
    pagination,
    
    // State
    isLoading,
    error,
    
    // Actions
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    updateMemberStatus,
    searchMembers,
    refetch,
    
    // Utilities
    clearError: useCallback(() => {
      if (mountedRef.current) {
        setError(null);
      }
    }, []),
    reload: refetch
  };
};