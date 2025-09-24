// hooks/useMembers.js - FIXED VERSION for Correct Data Extraction
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';

/**
 * Fixed useMembers hook with correct data extraction from Django API
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

  // FIXED: Main fetch function with direct API calls
  const fetchMembers = useCallback(async (fetchOptions = {}) => {
    const { forceRefresh = false, silent = false } = fetchOptions;

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
      return { success: true, fromCache: true };
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

      // FIXED: Direct API call with proper authentication
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseURL = 'http://localhost:8000';
      const params = new URLSearchParams({
        search: debouncedSearch || '',
        page: page.toString(),
        page_size: limit.toString(),
        ordering: '-registration_date',
        isValid: 'true'
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== null && value !== undefined) {
          params.set(key, value.toString());
        }
      });

      const url = `${baseURL}/api/v1/members/?${params.toString()}`;
      console.log('[useMembers] Fetching URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useMembers] API Response:', data);

      if (!mountedRef.current) {
        console.log('[useMembers] Component unmounted, ignoring result');
        return { success: false, error: 'Component unmounted' };
      }

      // FIXED: Extract data with proper paths from Django DRF response
      // Your Django API returns: { count: 4, next: null, previous: null, results: [...] }
      const membersArray = Array.isArray(data.results) ? data.results : [];
      const totalCount = typeof data.count === 'number' ? data.count : membersArray.length;
      
      console.log('[useMembers] Processed data:', {
        membersCount: membersArray.length,
        totalMembers: totalCount,
        pagination: {
          count: data.count,
          next: data.next,
          previous: data.previous
        }
      });

      // Update state with correct data
      setMembers(membersArray);
      setTotalMembers(totalCount);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
        total_pages: Math.ceil(totalCount / limit),
        current_page: page
      });
      setError(null);

      return { 
        success: true, 
        data: membersArray, 
        totalMembers: totalCount,
        pagination: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          total_pages: Math.ceil(totalCount / limit),
          current_page: page
        }
      };

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

  // FIXED: Get recent members with direct API call
  const getRecentMembers = useCallback(async (limit = 5) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useMembers] Fetching recent members...');
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseURL = 'http://localhost:8000';
      const url = `${baseURL}/api/v1/members/recent/?limit=${limit}`;
      
      console.log('[useMembers] Recent members URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useMembers] Recent members API response:', data);

      // Handle the Django response format: { success: true, results: [...], count: 4 }
      const results = data.success ? (data.results || []) : [];
      const count = data.count || results.length;

      console.log('[useMembers] Recent members processed:', { results: results.length, count });

      return {
        success: true,
        data: results,
        total: count
      };

    } catch (error) {
      const errorMessage = error?.message || 'Failed to fetch recent members';
      console.error('[useMembers] Recent members error:', errorMessage);
      
      if (mountedRef.current) {
        setError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  // CRUD Operations (keeping existing implementations but with better error handling)
  const createMember = useCallback(async (memberData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseURL = 'http://localhost:8000';
      const url = `${baseURL}/api/v1/members/`;

      console.log('[useMembers] Creating member:', memberData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...memberData,
          registration_source: 'admin_portal'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[useMembers] Member created successfully:', result);

      // Force refresh to get updated list
      setTimeout(() => {
        if (mountedRef.current) {
          fetchMembers({ forceRefresh: true, silent: true });
        }
      }, 1000);

      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Member created successfully'
      };

    } catch (err) {
      const errorMessage = err?.message || 'Failed to create member';
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

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseURL = 'http://localhost:8000';
      const url = `${baseURL}/api/v1/members/${memberId}/`;

      console.log('[useMembers] Updating member:', memberId, memberData);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[useMembers] Member updated successfully');

      // Update the specific member in the list
      if (mountedRef.current) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, ...result } : member
        ));
      }

      return {
        success: true,
        data: result,
        message: 'Member updated successfully'
      };

    } catch (err) {
      const errorMessage = err?.message || 'Failed to update member';
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

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseURL = 'http://localhost:8000';
      const url = `${baseURL}/api/v1/members/${memberId}/`;

      console.log('[useMembers] Deleting member:', memberId);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      console.log('[useMembers] Member deleted successfully');

      // Remove from current list immediately
      if (mountedRef.current) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        setTotalMembers(prev => Math.max(0, prev - 1));
      }

      return {
        success: true,
        message: 'Member deleted successfully'
      };

    } catch (err) {
      const errorMessage = err?.message || 'Failed to delete member';
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

  // Auto-fetch effect with proper dependency management
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
    getRecentMembers,
    
    // Utilities
    refresh,
    clearError,
    resetState,
    invalidateCache,
    
    // Additional methods for compatibility
    refetch: refresh,
    getMember: (id) => members.find(m => m.id === id)
  };
};