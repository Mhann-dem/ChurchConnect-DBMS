import { useState, useEffect, useCallback } from 'react';
import { groupsService } from '../services/groups';
import { useToast } from './useToast';

/**
 * Custom hook for managing groups/ministries
 * Provides CRUD operations, search, and state management for groups
 */
export const useGroups = (initialParams = {}) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  });
  const [filters, setFilters] = useState({
    search: '',
    active: true,
    ...initialParams
  });
  
  const { showToast } = useToast();

  // Fetch groups with filters and pagination
  const fetchGroups = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.itemsPerPage
      };
      
      const response = await groupsService.getGroups(queryParams);
      
      setGroups(response.data.results);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        itemsPerPage: response.data.itemsPerPage
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch groups');
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.itemsPerPage, showToast]);

  // Create new group
  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsService.createGroup(groupData);
      
      // Add new group to the beginning of the list
      setGroups(prev => [response.data, ...prev]);
      
      showToast('Group created successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create group';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update existing group
  const updateGroup = useCallback(async (groupId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsService.updateGroup(groupId, updateData);
      
      // Update group in the list
      setGroups(prev => prev.map(group => 
        group.id === groupId ? response.data : group
      ));
      
      showToast('Group updated successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update group';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Delete group
  const deleteGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      await groupsService.deleteGroup(groupId);
      
      // Remove group from the list
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      showToast('Group deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete group';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get single group details
  const getGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsService.getGroup(groupId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch group details';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get group members
  const getGroupMembers = useCallback(async (groupId, params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsService.getGroupMembers(groupId, params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch group members';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Add member to group
  const addMemberToGroup = useCallback(async (groupId, memberId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsService.addMemberToGroup(groupId, memberId);
      showToast('Member added to group successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add member to group';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Remove member from group
  const removeMemberFromGroup = useCallback(async (groupId, memberId) => {
    setLoading(true);
    setError(null);
    
    try {
      await groupsService.removeMemberFromGroup(groupId, memberId);
      showToast('Member removed from group successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove member from group';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      active: true
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Change page
  const changePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Refresh groups
  const refreshGroups = useCallback(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Load initial data
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Get active groups count
  const activeGroupsCount = groups.filter(group => group.active).length;

  // Get group statistics
  const getGroupStats = useCallback(async () => {
    try {
      const response = await groupsService.getGroupStats();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch group statistics');
      return null;
    }
  }, []);

  return {
    // Data
    groups,
    loading,
    error,
    pagination,
    filters,
    
    // Computed values
    activeGroupsCount,
    
    // Actions
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getGroupMembers,
    addMemberToGroup,
    removeMemberFromGroup,
    updateFilters,
    clearFilters,
    changePage,
    refreshGroups,
    getGroupStats,
    
    // Utilities
    clearError: () => setError(null)
  };
};