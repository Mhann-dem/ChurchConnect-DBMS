// frontend/src/hooks/useMembers.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAuth from './useAuth';
import { useDebounce } from './useDebounce';

export const useMembers = (options = {}) => {
  const { isAuthenticated } = useAuth();
  
  const autoFetch = options.autoFetch !== false;
  
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [inactiveMembers, setInactiveMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

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
      params.set('page', customFilters.page || '1');
      params.set('page_size', customFilters.page_size || '200');
      params.set('ordering', customFilters.ordering || '-registration_date');
      
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && 
            !['page', 'page_size', 'ordering'].includes(key)) {
          params.set(key, String(value));
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

      console.log('[useMembers] Received:', data.results?.length, 'members');

      setMembers(data.results || []);
      setTotalMembers(data.total_members || data.count || 0);
      setActiveMembers(data.active_members || data.active_count || 0);
      setInactiveMembers(data.inactive_members || data.inactive_count || 0);
      setPagination({
        count: data.total_members || data.count || 0,
        next: data.next,
        previous: data.previous,
        total_pages: data.total_pages || Math.ceil((data.count || 0) / 200)
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

  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      fetchMembers();
    }
  }, [autoFetch, isAuthenticated, fetchMembers]);

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
    hasMembers: members.length > 0
  };
};

export default useMembers;