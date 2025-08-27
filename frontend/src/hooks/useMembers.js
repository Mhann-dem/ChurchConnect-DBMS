// hooks/useMembers.js - Fixed version with proper error handling
import { useState, useEffect, useCallback } from 'react';
import membersService from '../services/members';

export const useMembers = (options = {}) => {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Extract options with defaults
  const {
    search = '',
    filters = {},
    page = 1,
    limit = 25,
    autoFetch = true
  } = options;

  const fetchMembers = useCallback(async () => {
    try {
      console.log('[useMembers] Fetching members with:', { search, filters, page, limit });
      
      setIsLoading(true);
      setError(null);

      const params = {
        search,
        filters,
        page,
        limit
      };

      const result = await membersService.getMembers(params);
      console.log('[useMembers] Service result:', result);

      if (result.success) {
        setMembers(Array.isArray(result.data) ? result.data : []);
        setTotalMembers(typeof result.totalMembers === 'number' ? result.totalMembers : 0);
        setPagination(result.pagination);
        setError(null);
      } else {
        console.error('[useMembers] Service returned error:', result.error);
        setError(result.error || 'Failed to fetch members');
        setMembers([]);
        setTotalMembers(0);
        setPagination(null);
      }
    } catch (err) {
      console.error('[useMembers] Fetch error:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          'Failed to fetch members';
      setError(errorMessage);
      setMembers([]);
      setTotalMembers(0);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [search, filters, page, limit]);

  const createMember = useCallback(async (memberData) => {
    try {
      console.log('[useMembers] Creating member:', memberData);
      setIsLoading(true);
      setError(null);

      const result = await membersService.createMember(memberData);
      
      if (result.success) {
        // Refresh the members list
        await fetchMembers();
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
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMembers]);

  const updateMember = useCallback(async (memberId, memberData) => {
    try {
      console.log('[useMembers] Updating member:', memberId, memberData);
      setIsLoading(true);
      setError(null);

      const result = await membersService.updateMember(memberId, memberData);
      
      if (result.success) {
        // Update the member in the current list
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, ...result.data } : member
        ));
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
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMember = useCallback(async (memberId) => {
    try {
      console.log('[useMembers] Deleting member:', memberId);
      setIsLoading(true);
      setError(null);

      const result = await membersService.deleteMember(memberId);
      
      if (result.success) {
        // Remove the member from the current list
        setMembers(prev => prev.filter(member => member.id !== memberId));
        setTotalMembers(prev => Math.max(0, prev - 1));
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
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
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
      
      if (result.success) {
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
      setError(errorMessage);
      setMembers([]);
      setTotalMembers(0);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    console.log('[useMembers] Refetching data...');
    return await fetchMembers();
  }, [fetchMembers]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      console.log('[useMembers] Auto-fetching due to dependency change');
      fetchMembers();
    }
  }, [fetchMembers, autoFetch]);

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
    clearError: () => setError(null),
    reload: refetch
  };
};