import { useState, useEffect, useCallback, useRef } from 'react';
import groupsService from '../services/groups';

export const useGroups = (options = {}) => {
  const [state, setState] = useState({
    groups: [],
    loading: true,
    error: null,
    initialized: false
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: options.pageSize || 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  
  const [filters, setFilters] = useState({
    active: options.initialFilters?.active || null,
    search: options.initialFilters?.search || '',
    category: options.initialFilters?.category || null,
    hasLeader: options.initialFilters?.hasLeader || null,
    ...options.initialFilters
  });

  // Refs to prevent memory leaks and duplicate requests
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const lastRequestRef = useRef(null);

  // Helper to create request signature for deduplication
  const createRequestSignature = useCallback((requestFilters, requestPage) => {
    return JSON.stringify({ 
      filters: requestFilters, 
      page: requestPage, 
      limit: pagination.limit 
    });
  }, [pagination.limit]);

  // Transform filters for API
  const transformFiltersForAPI = useCallback((currentFilters) => {
    const apiFilters = {};
    
    if (currentFilters.search?.trim()) {
      apiFilters.search = currentFilters.search.trim();
    }
    
    if (currentFilters.active !== null && currentFilters.active !== 'all') {
      apiFilters.active = currentFilters.active === 'active' || currentFilters.active === true;
    }
    
    if (currentFilters.category && currentFilters.category !== 'all') {
      apiFilters.category = currentFilters.category;
    }
    
    if (currentFilters.hasLeader && currentFilters.hasLeader !== 'all') {
      apiFilters.has_leader = currentFilters.hasLeader === 'yes' || currentFilters.hasLeader === true;
    }
    
    return apiFilters;
  }, []);

  // Main fetch function with deduplication and error handling
  const fetchGroups = useCallback(async (requestFilters = null, requestPage = null, forceRefresh = false) => {
    const filtersToUse = requestFilters || filters;
    const pageToUse = requestPage || pagination.page;
    
    // Create request signature for deduplication
    const requestSignature = createRequestSignature(filtersToUse, pageToUse);
    
    // Skip if already fetching the same request
    if (!forceRefresh && fetchingRef.current && lastRequestRef.current === requestSignature) {
      console.log('[useGroups] Skipping duplicate request');
      return;
    }

    try {
      fetchingRef.current = true;
      lastRequestRef.current = requestSignature;
      
      // Only show loading on initial load or when forced
      if (!state.initialized || forceRefresh) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }
      
      const apiParams = {
        page: pageToUse,
        limit: pagination.limit,
        ...transformFiltersForAPI(filtersToUse)
      };
      
      console.log('[useGroups] Fetching groups:', apiParams);
      
      const result = await groupsService.getGroups(apiParams);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      
      if (result.success) {
        const responseData = result.data;
        const groups = responseData.results || responseData || [];
        
        setState(prev => ({
          ...prev,
          groups,
          loading: false,
          error: null,
          initialized: true
        }));
        
        setPagination(prev => ({
          ...prev,
          page: responseData.page || pageToUse,
          total: responseData.count || groups.length,
          totalPages: Math.ceil((responseData.count || groups.length) / pagination.limit),
          hasNext: !!responseData.next,
          hasPrevious: !!responseData.previous
        }));
        
        console.log('[useGroups] Groups fetched successfully:', groups.length);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
          initialized: true
        }));
        console.error('[useGroups] Error fetching groups:', result.error);
      }
    } catch (error) {
      console.error('[useGroups] Unexpected error:', error);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'An unexpected error occurred while fetching groups',
          initialized: true
        }));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [filters, pagination.page, pagination.limit, transformFiltersForAPI, createRequestSignature, state.initialized]);

  // Refresh groups - force a fresh fetch
  const refreshGroups = useCallback(() => {
    console.log('[useGroups] Refreshing groups...');
    return fetchGroups(null, null, true);
  }, [fetchGroups]);

  // Create new group
  const createGroup = useCallback(async (groupData) => {
    try {
      console.log('[useGroups] Creating group:', groupData);
      const result = await groupsService.createGroup(groupData);
      
      if (result.success) {
        // If on first page, add to current groups for immediate feedback
        if (pagination.page === 1) {
          setState(prev => ({
            ...prev,
            groups: [result.data, ...prev.groups]
          }));
          
          setPagination(prev => ({
            ...prev,
            total: prev.total + 1,
            totalPages: Math.ceil((prev.total + 1) / prev.limit)
          }));
        }
        
        // Refresh to ensure consistency with backend
        setTimeout(() => refreshGroups(), 100);
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error creating group:', error);
      throw error;
    }
  }, [pagination.page, pagination.limit, refreshGroups]);

  // Update group
  const updateGroup = useCallback(async (groupId, updateData) => {
    try {
      console.log('[useGroups] Updating group:', groupId, updateData);
      const result = await groupsService.updateGroup(groupId, updateData);
      
      if (result.success) {
        // Update in current state for immediate feedback
        setState(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.id === groupId ? { ...group, ...result.data } : group
          )
        }));
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error updating group:', error);
      throw error;
    }
  }, []);

  // Partial update group
  const patchGroup = useCallback(async (groupId, updateData) => {
    try {
      console.log('[useGroups] Patching group:', groupId, updateData);
      const result = await groupsService.patchGroup(groupId, updateData);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.id === groupId ? { ...group, ...result.data } : group
          )
        }));
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error patching group:', error);
      throw error;
    }
  }, []);

  // Delete group
  const deleteGroup = useCallback(async (groupId) => {
    try {
      console.log('[useGroups] Deleting group:', groupId);
      const result = await groupsService.deleteGroup(groupId);
      
      if (result.success) {
        // Remove from current state for immediate feedback
        setState(prev => ({
          ...prev,
          groups: prev.groups.filter(group => group.id !== groupId)
        }));
        
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
        }));
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error deleting group:', error);
      throw error;
    }
  }, []);

  // Search groups with debouncing
  const searchGroups = useCallback(async (searchTerm) => {
    console.log('[useGroups] Searching groups:', searchTerm);
    
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    
    // Reset to first page for new search
    await fetchGroups(newFilters, 1);
  }, [filters, fetchGroups]);

  // Apply filters
  const filterGroups = useCallback(async (filterUpdates) => {
    console.log('[useGroups] Applying filters:', filterUpdates);
    
    const newFilters = { ...filters, ...filterUpdates };
    setFilters(newFilters);
    
    // Reset to first page for new filters
    await fetchGroups(newFilters, 1);
  }, [filters, fetchGroups]);

  // Clear all filters
  const clearFilters = useCallback(async () => {
    console.log('[useGroups] Clearing filters');
    
    const clearedFilters = {
      active: null,
      search: '',
      category: null,
      hasLeader: null
    };
    
    setFilters(clearedFilters);
    await fetchGroups(clearedFilters, 1);
  }, [fetchGroups]);

  // Pagination functions
  const goToPage = useCallback(async (page) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.page) {
      console.log('[useGroups] Going to page:', page);
      await fetchGroups(null, page);
    }
  }, [pagination.totalPages, pagination.page, fetchGroups]);

  const nextPage = useCallback(async () => {
    if (pagination.hasNext) {
      await goToPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, goToPage]);

  const prevPage = useCallback(async () => {
    if (pagination.hasPrevious) {
      await goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrevious, pagination.page, goToPage]);

  // Group member management
  const getGroupMembers = useCallback(async (groupId) => {
    try {
      console.log('[useGroups] Fetching group members:', groupId);
      const result = await groupsService.getGroupMembers(groupId);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error fetching group members:', error);
      throw error;
    }
  }, []);

  const addMemberToGroup = useCallback(async (groupId, memberData) => {
    try {
      console.log('[useGroups] Adding member to group:', groupId, memberData);
      const result = await groupsService.addMemberToGroup(groupId, memberData);
      
      if (result.success) {
        // Update the group's member count in state
        setState(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.id === groupId 
              ? { ...group, member_count: (group.member_count || 0) + 1 }
              : group
          )
        }));
        
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error adding member to group:', error);
      throw error;
    }
  }, []);

  const removeMemberFromGroup = useCallback(async (groupId, memberId) => {
    try {
      console.log('[useGroups] Removing member from group:', groupId, memberId);
      const result = await groupsService.removeMemberFromGroup(groupId, memberId);
      
      if (result.success) {
        // Update the group's member count in state
        setState(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.id === groupId 
              ? { ...group, member_count: Math.max(0, (group.member_count || 1) - 1) }
              : group
          )
        }));
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error removing member from group:', error);
      throw error;
    }
  }, []);

  // Utility functions
  const getGroupById = useCallback((groupId) => {
    return state.groups.find(group => group.id === groupId);
  }, [state.groups]);

  const getGroupByName = useCallback((groupName) => {
    return state.groups.find(group => 
      group.name.toLowerCase().includes(groupName.toLowerCase())
    );
  }, [state.groups]);

  const getActiveGroups = useCallback(() => {
    return state.groups.filter(group => group.active);
  }, [state.groups]);

  const getGroupsWithLeader = useCallback(() => {
    return state.groups.filter(group => group.leader_name);
  }, [state.groups]);

  const getGroupStats = useCallback(() => {
    const groups = state.groups;
    return {
      total: groups.length,
      active: groups.filter(g => g.active).length,
      inactive: groups.filter(g => !g.active).length,
      withLeader: groups.filter(g => g.leader_name).length,
      withoutLeader: groups.filter(g => !g.leader_name).length,
      totalMembers: groups.reduce((sum, g) => sum + (g.member_count || 0), 0),
      averageMembers: groups.length > 0 
        ? Math.round((groups.reduce((sum, g) => sum + (g.member_count || 0), 0) / groups.length) * 10) / 10
        : 0,
      largestGroup: groups.length > 0 
        ? Math.max(...groups.map(g => g.member_count || 0))
        : 0
    };
  }, [state.groups]);

  // Get groups by category
  const getGroupsByCategory = useCallback((categoryId) => {
    return state.groups.filter(group => group.category === categoryId);
  }, [state.groups]);

  // Check if group exists
  const groupExists = useCallback((name) => {
    return state.groups.some(group => 
      group.name.toLowerCase() === name.toLowerCase()
    );
  }, [state.groups]);

  // Initial fetch effect - only runs once on mount
  useEffect(() => {
    console.log('[useGroups] Component mounted, initializing...');
    
    // Set up cleanup
    const cleanup = () => {
      mountedRef.current = false;
      if (fetchingRef.current) {
        console.log('[useGroups] Component unmounting, canceling fetch...');
      }
    };
    
    // Initial fetch with slight delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !state.initialized) {
        fetchGroups();
      }
    }, 50);
    
    return () => {
      cleanup();
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - only run on mount

  // Effect for handling options changes
  useEffect(() => {
    if (options.autoRefresh && state.initialized) {
      const intervalId = setInterval(() => {
        if (mountedRef.current && !fetchingRef.current) {
          console.log('[useGroups] Auto-refreshing...');
          refreshGroups();
        }
      }, options.refreshInterval || 30000); // Default 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [options.autoRefresh, options.refreshInterval, state.initialized, refreshGroups]);

  return {
    // Data
    groups: state.groups,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    pagination,
    filters,
    
    // CRUD operations
    createGroup,
    updateGroup,
    patchGroup,
    deleteGroup,
    fetchGroups,
    refreshGroups,
    
    // Member management
    getGroupMembers,
    addMemberToGroup,
    removeMemberFromGroup,
    
    // Search and filter
    searchGroups,
    filterGroups,
    clearFilters,
    
    // Pagination
    goToPage,
    nextPage,
    prevPage,
    
    // Utility functions
    getGroupById,
    getGroupByName,
    getActiveGroups,
    getGroupsWithLeader,
    getGroupStats,
    getGroupsByCategory,
    groupExists,
    
    // State setters for advanced usage
    setFilters,
    setPagination
  };
};