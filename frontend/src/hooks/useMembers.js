// hooks/useMembers.js - Fixed version with rate limiting and proper error handling
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const lastFetchParamsRef = useRef(null);
  const mountedRef = useRef(true);

  // Extract options with defaults
  const {
    search = '',
    filters = {},
    page = 1,
    limit = 25,
    autoFetch = true,
    debounceMs = 300 // Add debounce for search/filters
  } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper to check if params have actually changed
  const paramsChanged = useCallback((newParams) => {
    const oldParams = lastFetchParamsRef.current;
    if (!oldParams) return true;
    
    return JSON.stringify(oldParams) !== JSON.stringify(newParams);
  }, []);

  const fetchMembers = useCallback(async (forceRefresh = false) => {
    const currentParams = { search, filters, page, limit };
    
    // Prevent duplicate requests with same parameters
    if (!forceRefresh && isFetchingRef.current) {
      console.log('[useMembers] Fetch already in progress, skipping...');
      return;
    }

    if (!forceRefresh && !paramsChanged(currentParams)) {
      console.log('[useMembers] Parameters unchanged, skipping fetch');
      return;
    }

    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      isFetchingRef.current = true;
      console.log('[useMembers] Fetching members with:', currentParams);
      
      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Add abort signal to the request
      const result = await membersService.getMembers({
        ...currentParams,
        signal: abortControllerRef.current.signal
      });

      console.log('[useMembers] Service result:', result);

      if (!mountedRef.current) {
        return; // Component unmounted
      }

      if (result.success) {
        setMembers(Array.isArray(result.data) ? result.data : []);
        setTotalMembers(typeof result.totalMembers === 'number' ? result.totalMembers : 0);
        setPagination(result.pagination);
        setError(null);
        lastFetchParamsRef.current = currentParams;
      } else {
        console.error('[useMembers] Service returned error:', result.error);
        setError(result.error || 'Failed to fetch members');
        setMembers([]);
        setTotalMembers(0);
        setPagination(null);
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
  }, [search, filters, page, limit, paramsChanged]);

  // Debounced fetch for search and filters
  const debouncedFetch = useCallback(
    debounce(fetchMembers, debounceMs),
    [fetchMembers, debounceMs]
  );

  const createMember = useCallback(async (memberData) => {
    try {
      console.log('[useMembers] Creating member:', memberData);
      setIsLoading(true);
      setError(null);

      const result = await membersService.createMember(memberData);
      
      if (result.success) {
        // Refresh the members list
        await fetchMembers(true); // Force refresh
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

  // Debounced effect for search and filters to prevent excessive API calls
  useEffect(() => {
    if (!autoFetch || !mountedRef.current) return;

    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        debouncedFetch();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [search, filters, debouncedFetch, autoFetch, debounceMs]);

  // Effect for page changes (no debounce needed)
  useEffect(() => {
    if (autoFetch && mountedRef.current) {
      fetchMembers();
    }
  }, [page]); // Only page changes

  // Computed values
  const totalPages = pagination?.total_pages || Math.ceil(totalMembers / limit) || 1;
  const activeMembers = members.filter(member => member?.is_active).length;
  const inactiveMembers = members.length - activeMembers;

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
    clearError: () => {
      if (mountedRef.current) {
        setError(null);
      }
    },
    reload: refetch
  };
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}