// frontend/src/hooks/useMembers.js - ENHANCED VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';

export const useMembers = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  // Extract options
  const search = options.search || '';
  const page = options.page || 1;
  const limit = options.limit || 25;
  const autoFetch = options.autoFetch !== false;
  const initialFilters = options.filters || {};
  
  // State
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [inactiveMembers, setInactiveMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refs
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Extract filter values for dependencies
  const filterStatus = initialFilters.status || 'all';
  const filterGender = initialFilters.gender || '';
  const filterAgeRange = initialFilters.ageRange || '';
  const filterJoinedAfter = initialFilters.joinedAfter || '';
  const filterJoinedBefore = initialFilters.joinedBefore || '';

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // FIXED: Main fetch function that accepts optional filter parameters
  const fetchMembers = useCallback(async (customFilters = {}) => {
    if (!isAuthenticated) {
      console.warn('[useMembers] Not authenticated');
      return;
    }

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page);
      params.set('page_size', limit);
      params.set('ordering', '-registration_date');
      
      // Apply default filters
      if (filterStatus && filterStatus !== 'all') {
        params.set('is_active', filterStatus === 'active' ? 'true' : 'false');
      }

      // Apply custom filters passed as parameter
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value);
        }
      });

      const url = `${baseURL}/api/v1/members/?${params}`;
      console.log('[useMembers] Fetching:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      if (!mountedRef.current) return;

      console.log('[useMembers] Data received:', {
        total: data.total_members || data.count,
        active: data.active_count,
        results: data.results?.length
      });

      // Update state
      setMembers(data.results || []);
      setTotalMembers(data.total_members || data.count || 0);
      setActiveMembers(data.active_members || data.active_count || 0);
      setInactiveMembers(data.inactive_members || data.inactive_count || 0);
      setPagination({
        count: data.total_members || data.count || 0,
        next: data.next,
        previous: data.previous,
        total_pages: Math.ceil((data.total_members || data.count || 0) / limit) || 1
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useMembers] Request cancelled');
        return;
      }
      console.error('[useMembers] Error:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, debouncedSearch, filterStatus, page, limit]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      console.log('[useMembers] Triggering auto-fetch');
      fetchMembers();
    }
  }, [autoFetch, isAuthenticated, fetchMembers]);

  const totalPages = useMemo(() => 
    Math.ceil(totalMembers / limit) || 1,
    [totalMembers, limit]
  );

  return {
    members,
    totalMembers,
    activeMembers,
    inactiveMembers,
    pagination,
    totalPages,
    isLoading,
    loading: isLoading, // Alias for backwards compatibility
    error,
    fetchMembers,      // Now accepts optional filter parameters
    refresh: fetchMembers, // Alias for convenience
    hasMembers: members.length > 0
  };
};

export default useMembers;