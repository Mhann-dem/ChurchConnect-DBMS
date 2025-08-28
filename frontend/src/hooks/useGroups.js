import { useState, useEffect, useCallback, useRef } from 'react';
import groupsService from '../services/groups';

export const useGroups = (options = {}) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    active: null,
    search: '',
    hasLeader: null,
    memberCount: null
  });

  // Use refs to track if we're already fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Helper function to transform filters for API
  const transformFiltersForAPI = useCallback((currentFilters) => {
    const apiFilters = {};
    
    if (currentFilters.search) {
      apiFilters.search = currentFilters.search;
    }
    
    if (currentFilters.active !== null && currentFilters.active !== 'all') {
      apiFilters.active = currentFilters.active === 'active';
    }
    
    if (currentFilters.hasLeader && currentFilters.hasLeader !== 'all') {
      if (currentFilters.hasLeader === 'yes') {
        apiFilters.has_leader = true;
      } else if (currentFilters.hasLeader === 'no') {
        apiFilters.has_leader = false;
      }
    }
    
    return apiFilters;
  }, []);

  // FIXED: Stable fetchGroups function with proper dependency management
  const fetchGroups = useCallback(async (currentFilters = null, page = null) => {
    // Prevent duplicate requests
    if (isFetchingRef.current) {
      console.log('[useGroups] Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Use current state if no parameters provided
      const filtersToUse = currentFilters || filters;
      const pageToUse = page || pagination.page;
      
      const apiParams = {
        page: pageToUse,
        limit: pagination.limit,
        ...transformFiltersForAPI(filtersToUse)
      };
      
      console.log('[useGroups] Fetching groups with params:', apiParams);
      
      const result = await groupsService.getGroups(apiParams);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) {
        return;
      }
      
      if (result.success) {
        setGroups(result.data.results || result.data || []);
        setPagination({
          page: result.data.page || pageToUse,
          limit: result.data.limit || 25,
          total: result.data.count || result.data.total || 0,
          totalPages: Math.ceil((result.data.count || result.data.total || 0) / (result.data.limit || 25))
        });
        console.log('[useGroups] Groups fetched successfully:', result.data);
      } else {
        setError(result.error);
        console.error('[useGroups] Failed to fetch groups:', result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error fetching groups:', error);
      if (mountedRef.current) {
        setError('Failed to load groups. Please try again.');
      }
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // FIXED: Empty dependency array since we use refs and current state

  // FIXED: Separate stable function for refreshing
  const refreshGroups = useCallback(() => {
    return fetchGroups();
  }, [fetchGroups]);

  // Create new group/ministry
  const createGroup = useCallback(async (groupData) => {
    try {
      const result = await groupsService.createGroup(groupData);
      
      if (result.success && mountedRef.current) {
        // Add to current groups if on first page
        if (pagination.page === 1) {
          setGroups(prev => [result.data, ...prev]);
        }
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1,
          totalPages: Math.ceil((prev.total + 1) / prev.limit)
        }));
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error creating group:', error);
      throw error;
    }
  }, [pagination.page]);

  // Update group/ministry
  const updateGroup = useCallback(async (groupId, updateData) => {
    try {
      const result = await groupsService.updateGroup(groupId, updateData);
      
      if (result.success && mountedRef.current) {
        setGroups(prev => prev.map(group => 
          group.id === groupId ? result.data : group
        ));
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error updating group:', error);
      throw error;
    }
  }, []);

  // Delete group/ministry
  const deleteGroup = useCallback(async (groupId) => {
    try {
      const result = await groupsService.deleteGroup(groupId);
      
      if (result.success && mountedRef.current) {
        setGroups(prev => prev.filter(group => group.id !== groupId));
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error deleting group:', error);
      throw error;
    }
  }, []);

  // FIXED: Search function with stable dependencies
  const searchGroups = useCallback(async (searchTerm, currentFilters = null) => {
    const newFilters = { 
      ...(currentFilters || filters), 
      search: searchTerm 
    };
    
    setFilters(newFilters);
    
    // Use setTimeout to batch the state update and fetch
    setTimeout(() => {
      fetchGroups(newFilters, 1);
    }, 0);
  }, []); // FIXED: Empty dependencies, use current state via closure

  // FIXED: Filter function with stable dependencies
  const filterGroups = useCallback(async (filterUpdates) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, ...filterUpdates };
      
      // Use setTimeout to batch the state update and fetch
      setTimeout(() => {
        fetchGroups(newFilters, 1);
      }, 0);
      
      return newFilters;
    });
  }, []); // FIXED: Empty dependencies

  // Clear filters
  const clearFilters = useCallback(async () => {
    const clearedFilters = {
      active: null,
      search: '',
      hasLeader: null,
      memberCount: null
    };
    setFilters(clearedFilters);
    
    setTimeout(() => {
      fetchGroups(clearedFilters, 1);
    }, 0);
  }, []);

  // Pagination functions with stable dependencies
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchGroups(filters, page);
    }
  }, []); // FIXED: Use current state via closure

  const nextPage = useCallback(() => {
    setPagination(currentPagination => {
      if (currentPagination.page < currentPagination.totalPages) {
        setTimeout(() => {
          fetchGroups(filters, currentPagination.page + 1);
        }, 0);
      }
      return currentPagination;
    });
  }, []);

  const prevPage = useCallback(() => {
    setPagination(currentPagination => {
      if (currentPagination.page > 1) {
        setTimeout(() => {
          fetchGroups(filters, currentPagination.page - 1);
        }, 0);
      }
      return currentPagination;
    });
  }, []);

  // Utility functions
  const getGroupById = useCallback((groupId) => {
    return groups.find(group => group.id === groupId);
  }, [groups]);

  const getGroupByName = useCallback((groupName) => {
    return groups.find(group => 
      group.name.toLowerCase().includes(groupName.toLowerCase())
    );
  }, [groups]);

  const getActiveGroups = useCallback(() => {
    return groups.filter(group => group.active);
  }, [groups]);

  const getGroupsWithLeader = useCallback(() => {
    return groups.filter(group => group.leader_name);
  }, [groups]);

  const getGroupStats = useCallback(() => {
    return {
      total: groups.length,
      active: groups.filter(g => g.active).length,
      withLeader: groups.filter(g => g.leader_name).length,
      totalMembers: groups.reduce((sum, g) => sum + (g.member_count || 0), 0),
      averageMembers: groups.length > 0 
        ? (groups.reduce((sum, g) => sum + (g.member_count || 0), 0) / groups.length).toFixed(1)
        : 0
    };
  }, [groups]);

  // FIXED: Single effect for initial fetch only
  useEffect(() => {
    let timeoutId;
    
    console.log('[useGroups] Initial mount effect');
    
    // Delay initial fetch slightly to prevent race conditions
    timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        fetchGroups();
      }
    }, 100);
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Only run on mount

  // FIXED: Separate effect for options changes
  useEffect(() => {
    if (options.initialFilters) {
      setFilters(prev => ({ ...prev, ...options.initialFilters }));
    }
    if (options.initialPage) {
      setPagination(prev => ({ ...prev, page: options.initialPage }));
    }
  }, [options.initialFilters, options.initialPage]);

  return {
    // Data
    groups,
    loading,
    error,
    pagination,
    filters,
    
    // CRUD operations - all stable references
    createGroup,
    updateGroup,
    deleteGroup,
    fetchGroups,
    refreshGroups,
    
    // Member management
    // getGroupMembers, - implement if needed
    // addMemberToGroup, - implement if needed
    // removeMemberFromGroup, - implement if needed
    
    // Search and filter - all stable references
    searchGroups,
    filterGroups,
    clearFilters,
    
    // Pagination - all stable references
    goToPage,
    nextPage,
    prevPage,
    
    // Utility functions
    getGroupById,
    getGroupByName,
    getActiveGroups,
    getGroupsWithLeader,
    getGroupStats
  };
};