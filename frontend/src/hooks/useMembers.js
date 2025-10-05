// useMembers.js - COMPLETE FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import useAuth from './useAuth';

export const useMembers = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [inactiveMembers, setInactiveMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    total_pages: 1
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchMembers = useCallback(async (customFilters = {}) => {
    if (!isAuthenticated) {
      console.warn('[useMembers] Not authenticated');
      return;
    }

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      const params = new URLSearchParams();
      
      // Set pagination parameters
      params.set('page', String(customFilters.page || 1));
      params.set('page_size', String(customFilters.page_size || customFilters.limit || 25));
      params.set('ordering', customFilters.ordering || '-registration_date');
      
      // Add search if provided
      if (customFilters.search && customFilters.search.trim()) {
        params.set('search', customFilters.search.trim());
      }
      
      // Add other filters
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && 
            !['page', 'page_size', 'limit', 'ordering', 'search'].includes(key)) {
          params.set(key, String(value));
        }
      });

      const url = `${baseURL}/api/v1/members/?${params}`;
      console.log('[useMembers] Fetching:', url);
      console.log('[useMembers] Filters:', customFilters);

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

      console.log('[useMembers] Received:', {
        results: data.results?.length,
        total: data.count,
        page: customFilters.page,
        total_pages: data.total_pages
      });

      setMembers(data.results || []);
      setTotalMembers(data.total_members || data.count || 0);
      setActiveMembers(data.active_members || data.active_count || 0);
      setInactiveMembers(data.inactive_members || data.inactive_count || 0);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
        total_pages: data.total_pages || Math.ceil((data.count || 0) / (customFilters.page_size || customFilters.limit || 25))
      });

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[useMembers] Error:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch && isAuthenticated) {
      fetchMembers(options);
    }
  }, [isAuthenticated]); // Only run on mount

  return {
    members,
    totalMembers,
    activeMembers,
    inactiveMembers,
    pagination,
    isLoading,
    loading: isLoading,
    error,
    fetchMembers,
    refresh: fetchMembers,
    hasMembers: members.length > 0,
    totalPages: pagination.total_pages
  };
};

export default useMembers;