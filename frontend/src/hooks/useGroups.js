import { useState, useEffect, useCallback } from 'react';
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

  // Helper function to transform filters for API
  const transformFiltersForAPI = (currentFilters) => {
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
  };

  // Main fetch function - now using the service layer
  const fetchGroups = useCallback(async (currentFilters = filters, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const apiParams = {
        page: page,
        limit: pagination.limit,
        ...transformFiltersForAPI(currentFilters)
      };
      
      console.log('[useGroups] Fetching groups with params:', apiParams);
      
      const result = await groupsService.getGroups(apiParams);
      
      if (result.success) {
        setGroups(result.data.results || result.data || []);
        setPagination({
          page: result.data.page || page,
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
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Alias for fetchGroups to match what GroupsPage expects
  const refreshGroups = useCallback((currentFilters = filters, page = 1) => {
    return fetchGroups(currentFilters, page);
  }, [fetchGroups, filters]);

  // Create new group/ministry
  const createGroup = useCallback(async (groupData) => {
    try {
      const result = await groupsService.createGroup(groupData);
      
      if (result.success) {
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
      
      if (result.success) {
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
      
      if (result.success) {
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

  // Get group members
  const getGroupMembers = useCallback(async (groupId) => {
    try {
      const result = await groupsService.getGroupMembers(groupId);
      
      if (result.success) {
        return result.data.members || result.data || [];
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error fetching group members:', error);
      throw error;
    }
  }, []);

  // Add member to group
  const addMemberToGroup = useCallback(async (groupId, memberId, role = '') => {
    try {
      const result = await groupsService.addMemberToGroup(groupId, memberId, role);
      
      if (result.success) {
        // Update group member count in local state
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, member_count: (group.member_count || 0) + 1 }
            : group
        ));
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error adding member to group:', error);
      throw error;
    }
  }, []);

  // Remove member from group
  const removeMemberFromGroup = useCallback(async (groupId, memberId) => {
    try {
      const result = await groupsService.removeMemberFromGroup(groupId, memberId);
      
      if (result.success) {
        // Update group member count in local state
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, member_count: Math.max(0, (group.member_count || 1) - 1) }
            : group
        ));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[useGroups] Error removing member from group:', error);
      throw error;
    }
  }, []);

  // Search groups
  const searchGroups = useCallback(async (searchTerm, currentFilters = filters) => {
    const newFilters = { ...currentFilters, search: searchTerm };
    setFilters(newFilters);
    await fetchGroups(newFilters, 1);
  }, [fetchGroups, filters]);

  // Filter groups
  const filterGroups = useCallback(async (filterUpdates) => {
    const newFilters = { ...filters, ...filterUpdates };
    setFilters(newFilters);
    await fetchGroups(newFilters, 1);
  }, [fetchGroups, filters]);

  // Clear filters
  const clearFilters = useCallback(async () => {
    const clearedFilters = {
      active: null,
      search: '',
      hasLeader: null,
      memberCount: null
    };
    setFilters(clearedFilters);
    await fetchGroups(clearedFilters, 1);
  }, [fetchGroups]);

  // Pagination functions
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchGroups(filters, page);
    }
  }, [fetchGroups, filters, pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchGroups(filters, pagination.page + 1);
    }
  }, [fetchGroups, filters, pagination.page, pagination.totalPages]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchGroups(filters, pagination.page - 1);
    }
  }, [fetchGroups, filters, pagination.page]);

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

  // Initialize with options if provided
  useEffect(() => {
    if (options.initialFilters) {
      setFilters(prev => ({ ...prev, ...options.initialFilters }));
    }
    if (options.initialPage) {
      setPagination(prev => ({ ...prev, page: options.initialPage }));
    }
  }, [options]);

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, []); // Only run on mount

  return {
    // Data
    groups,
    loading,
    error,
    pagination,
    filters,
    
    // CRUD operations
    createGroup,
    updateGroup,
    deleteGroup,
    fetchGroups, // Keep this for compatibility
    refreshGroups, // Alternative name that GroupsPage expects
    
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
    getGroupStats
  };
};