// Enhanced useGroups.js Hook - Fixed
import { useState, useEffect, useCallback, useRef } from 'react';
import groupsService from '../services/groups';
import useAuth from './useAuth';
import { useToast } from './useToast';

export const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 20,
    totalPages: 1
  });
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const wsRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (user?.token) {
      initializeWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user]);

  const initializeWebSocket = () => {
    const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/groups/?token=${user.token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[useGroups] WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('[useGroups] WebSocket message error:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('[useGroups] WebSocket closed:', event.code);
        // Reconnect after delay if not intentionally closed
        if (event.code !== 1000 && user?.token) {
          setTimeout(() => initializeWebSocket(), 5000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[useGroups] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[useGroups] WebSocket initialization error:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'group_created':
        setGroups(prev => [data.group, ...prev]);
        setPagination(prev => ({ ...prev, count: prev.count + 1 }));
        break;
        
      case 'group_updated':
        setGroups(prev => 
          prev.map(group => 
            group.id === data.group.id ? { ...group, ...data.group } : group
          )
        );
        if (group && group.id === data.group.id) {
          setGroup(prev => ({ ...prev, ...data.group }));
        }
        break;
        
      case 'group_deleted':
        setGroups(prev => prev.filter(group => group.id !== data.group_id));
        setPagination(prev => ({ ...prev, count: prev.count - 1 }));
        if (group && group.id === data.group_id) {
          setGroup(null);
        }
        break;
        
      case 'member_added':
        updateGroupMemberCount(data.group_id, 1);
        if (data.group_id === group?.id) {
          refreshGroupMembers(data.group_id);
        }
        break;
        
      case 'member_removed':
        updateGroupMemberCount(data.group_id, -1);
        if (data.group_id === group?.id) {
          setGroupMembers(prev => 
            prev.filter(member => member.member_id !== data.member_id)
          );
        }
        break;
        
      case 'member_role_updated':
        if (data.group_id === group?.id) {
          setGroupMembers(prev =>
            prev.map(member =>
              member.member_id === data.member_id
                ? { ...member, role: data.role }
                : member
            )
          );
        }
        break;
        
      default:
        console.log('[useGroups] Unknown WebSocket message type:', data.type);
    }
  };

  const updateGroupMemberCount = (groupId, change) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, member_count: (g.member_count || 0) + change }
          : g
      )
    );
  };

  // Cancel any ongoing requests
  const cancelRequests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  // Get groups with enhanced filtering and sorting
  const getGroups = useCallback(async (filters = {}, page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);
    const signal = cancelRequests();

    try {
      const response = await groupsService.getGroups({
        ...filters,
        page,
        page_size: pageSize
      }, { signal });

      if (response.success) {
        setGroups(response.data.results || []);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous,
          page,
          pageSize,
          totalPages: Math.ceil((response.data.count || 0) / pageSize)
        });
      } else {
        throw new Error(response.error || 'Failed to fetch groups');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching groups:', error);
        setError(error.message);
        showToast?.(error.message || 'Failed to load groups', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]); // Removed the circular dependency

  // Search groups
  const searchGroups = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    setError(null);
    const signal = cancelRequests();

    try {
      const response = await groupsService.searchGroups({
        search: searchTerm,
        ...filters
      }, { signal });

      if (response.success) {
        setGroups(response.data.results || []);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous,
          page: 1,
          pageSize: 20,
          totalPages: Math.ceil((response.data.count || 0) / 20)
        });
        return response.data.results || [];
      } else {
        throw new Error(response.error || 'Failed to search groups');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error searching groups:', error);
        setError(error.message);
        showToast?.(error.message || 'Failed to search groups', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get group by ID
  const getGroupById = useCallback(async (groupId) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);
    const signal = cancelRequests();

    try {
      const response = await groupsService.getGroup(groupId, { signal });

      if (response.success) {
        setGroup(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch group');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching group:', error);
        setError(error.message);
        showToast?.(error.message || 'Failed to load group', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Create new group
  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.createGroup(groupData);

      if (response.success) {
        // WebSocket will handle adding to list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('[useGroups] Error creating group:', error);
      setError(error.message);
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  }, []);

  // Update group
  const updateGroup = useCallback(async (groupId, groupData) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.updateGroup(groupId, groupData);

      if (response.success) {
        // WebSocket will handle updating in list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('[useGroups] Error updating group:', error);
      setError(error.message);
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete group
  const deleteGroup = useCallback(async (groupId) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.deleteGroup(groupId);

      if (response.success) {
        // WebSocket will handle removing from list
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('[useGroups] Error deleting group:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get group members
  const fetchGroupMembers = useCallback(async (groupId) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);
    const signal = cancelRequests();

    try {
      const response = await groupsService.getGroupMembers(groupId, { signal });

      if (response.success) {
        setGroupMembers(response.data.results || []);
        return response.data.results || [];
      } else {
        throw new Error(response.error || 'Failed to fetch group members');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching group members:', error);
        setError(error.message);
        showToast?.(error.message || 'Failed to load group members', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get available members (not in the group)
  const fetchAvailableMembers = useCallback(async (groupId) => {
    if (!groupId) return;

    const signal = cancelRequests();

    try {
      const response = await groupsService.getAvailableMembers(groupId, { signal });

      if (response.success) {
        setAvailableMembers(response.data.results || []);
        return response.data.results || [];
      } else {
        throw new Error(response.error || 'Failed to fetch available members');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching available members:', error);
        showToast?.(error.message || 'Failed to load available members', 'error');
      }
    }
  }, [showToast]);

  // Add members to group
  const addMembersToGroup = useCallback(async (groupId, memberIds) => {
    if (!groupId || !memberIds?.length) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.addMembersToGroup(groupId, memberIds);

      if (response.success) {
        // WebSocket will handle updating member count
        await fetchGroupMembers(groupId); // Refresh members list
        await fetchAvailableMembers(groupId); // Refresh available members
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to add members to group');
      }
    } catch (error) {
      console.error('[useGroups] Error adding members:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchGroupMembers, fetchAvailableMembers]);

  // Remove member from group
  const removeMemberFromGroup = useCallback(async (groupId, memberId) => {
    if (!groupId || !memberId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.removeMemberFromGroup(groupId, memberId);

      if (response.success) {
        // WebSocket will handle updating member count and list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to remove member from group');
      }
    } catch (error) {
      console.error('[useGroups] Error removing member:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update member role in group
  const updateMemberRole = useCallback(async (groupId, memberId, role) => {
    if (!groupId || !memberId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.updateMemberRole(groupId, memberId, { role });

      if (response.success) {
        // WebSocket will handle updating member role
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update member role');
      }
    } catch (error) {
      console.error('[useGroups] Error updating member role:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get group statistics
  const getGroupStats = useCallback(async () => {
    const signal = cancelRequests();

    try {
      const response = await groupsService.getGroupStatistics({ signal });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch group statistics');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching group stats:', error);
        showToast?.(error.message || 'Failed to load group statistics', 'error');
      }
    }
  }, [showToast]);

  // Export group data
  const exportGroupData = useCallback(async (groupIds = [], format = 'csv') => {
    try {
      const response = await groupsService.exportGroups(groupIds, format);

      if (response.success) {
        // Trigger download
        const blob = new Blob([response.data], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `groups_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      } else {
        throw new Error(response.error || 'Failed to export group data');
      }
    } catch (error) {
      console.error('[useGroups] Error exporting groups:', error);
      throw error;
    }
  }, []);

  // Refresh groups (alias for getGroups)
  const refreshGroups = useCallback((filters = {}, page = 1) => {
    return getGroups(filters, page);
  }, [getGroups]);

  // Refresh group members
  const refreshGroupMembers = useCallback((groupId) => {
    return fetchGroupMembers(groupId);
  }, [fetchGroupMembers]);

  // Join group (for members)
  const joinGroup = useCallback(async (groupId, memberData = {}) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.joinGroup(groupId, memberData);

      if (response.success) {
        showToast?.('Successfully joined group', 'success');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('[useGroups] Error joining group:', error);
      setError(error.message);
      showToast?.(error.message || 'Failed to join group', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Leave group (for members)
  const leaveGroup = useCallback(async (groupId) => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await groupsService.leaveGroup(groupId);

      if (response.success) {
        showToast?.('Successfully left group', 'success');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('[useGroups] Error leaving group:', error);
      setError(error.message);
      showToast?.(error.message || 'Failed to leave group', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get public groups (for registration)
  const getPublicGroups = useCallback(async (filters = {}) => {
    const signal = cancelRequests();

    try {
      const response = await groupsService.getPublicGroups(filters, { signal });

      if (response.success) {
        return response.data.results || [];
      } else {
        throw new Error(response.error || 'Failed to fetch public groups');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[useGroups] Error fetching public groups:', error);
        showToast?.(error.message || 'Failed to load public groups', 'error');
      }
    }
  }, [showToast]);

  // Clear all state
  const clearState = useCallback(() => {
    setGroups([]);
    setGroupMembers([]);
    setAvailableMembers([]);
    setGroup(null);
    setError(null);
    setPagination({
      count: 0,
      next: null,
      previous: null,
      page: 1,
      pageSize: 20,
      totalPages: 1
    });
  }, []);

  return {
    // State
    groups,
    groupMembers,
    availableMembers,
    group,
    loading,
    error,
    pagination,
    
    // Group management
    getGroups,
    searchGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups,
    
    // Member management
    fetchGroupMembers,
    fetchAvailableMembers,
    addMembersToGroup,
    removeMemberFromGroup,
    updateMemberRole,
    refreshGroupMembers,
    
    // Public API
    joinGroup,
    leaveGroup,
    getPublicGroups,
    
    // Utility
    getGroupStats,
    exportGroupData,
    clearState,
    
    // WebSocket connection status
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};