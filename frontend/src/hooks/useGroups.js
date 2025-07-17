import { useState, useEffect } from 'react';

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

  // Fetch groups with pagination and filtering
  const fetchGroups = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...currentFilters
      });
      
      const response = await fetch(`/api/groups/?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setGroups(data.results || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 25,
        total: data.count || 0,
        totalPages: Math.ceil((data.count || 0) / (data.limit || 25))
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  // Create new group/ministry
  const createGroup = async (groupData) => {
    try {
      const response = await fetch('/api/groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupData.name,
          description: groupData.description,
          leader_name: groupData.leader_name,
          meeting_schedule: groupData.meeting_schedule,
          active: groupData.active !== undefined ? groupData.active : true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newGroup = await response.json();
      
      // Add to current groups if on first page
      if (pagination.page === 1) {
        setGroups(prev => [newGroup, ...prev]);
      }
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));
      
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  // Update group/ministry
  const updateGroup = async (groupId, updateData) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedGroup = await response.json();
      
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      return updatedGroup;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  // Delete group/ministry
  const deleteGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setGroups(prev => prev.filter(group => group.id !== groupId));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
      }));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  // Get group members
  const getGroupMembers = async (groupId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  };

  // Add member to group
  const addMemberToGroup = async (groupId, memberId, role = null) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          role: role
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update group member count in local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, member_count: (group.member_count || 0) + 1 }
          : group
      ));
      
      return result;
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  };

  // Remove member from group
  const removeMemberFromGroup = async (groupId, memberId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update group member count in local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, member_count: Math.max(0, (group.member_count || 1) - 1) }
          : group
      ));
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  };

  // Search and filter functions
  const searchGroups = async (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    await fetchGroups(1, newFilters);
  };

  const filterGroups = async (filterUpdates) => {
    const newFilters = { ...filters, ...filterUpdates };
    setFilters(newFilters);
    await fetchGroups(1, newFilters);
  };

  const clearFilters = async () => {
    const clearedFilters = {
      active: null,
      search: '',
      hasLeader: null,
      memberCount: null
    };
    setFilters(clearedFilters);
    await fetchGroups(1, clearedFilters);
  };

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchGroups(page);
    }
  };

  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchGroups(pagination.page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      fetchGroups(pagination.page - 1);
    }
  };

  // Utility functions
  const getGroupById = (groupId) => {
    return groups.find(group => group.id === groupId);
  };

  const getGroupByName = (groupName) => {
    return groups.find(group => 
      group.name.toLowerCase().includes(groupName.toLowerCase())
    );
  };

  const getActiveGroups = () => {
    return groups.filter(group => group.active);
  };

  const getGroupsWithLeader = () => {
    return groups.filter(group => group.leader_name);
  };

  const getGroupStats = () => {
    return {
      total: groups.length,
      active: groups.filter(g => g.active).length,
      withLeader: groups.filter(g => g.leader_name).length,
      totalMembers: groups.reduce((sum, g) => sum + (g.member_count || 0), 0),
      averageMembers: groups.length > 0 
        ? (groups.reduce((sum, g) => sum + (g.member_count || 0), 0) / groups.length).toFixed(1)
        : 0
    };
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Initialize with options if provided
  useEffect(() => {
    if (options.initialFilters) {
      setFilters(prev => ({ ...prev, ...options.initialFilters }));
    }
    if (options.initialPage) {
      setPagination(prev => ({ ...prev, page: options.initialPage }));
    }
  }, [options]);

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
    
    // Refresh data
    refreshGroups: fetchGroups
  };
};