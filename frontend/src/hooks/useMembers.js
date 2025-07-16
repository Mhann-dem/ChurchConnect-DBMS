import { useState, useEffect, useCallback } from 'react';
import membersService from '../services/members';
import { useToast } from './useToast';

/**
 * Custom hook for managing church members
 * Provides CRUD operations, search, filtering, and state management for members
 */
export const useMembers = (initialParams = {}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  });
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    ageRange: '',
    groups: [],
    pledgeStatus: '',
    registrationDateRange: '',
    active: true,
    ...initialParams
  });
  
  const { showToast } = useToast();

  // Fetch members with filters and pagination
  const fetchMembers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.itemsPerPage
      };
      
      const response = await membersService.getMembers(queryParams);
      
      setMembers(response.data.results);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        itemsPerPage: response.data.itemsPerPage
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch members');
      showToast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.itemsPerPage, showToast]);

  // Create new member
  const createMember = useCallback(async (memberData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.createMember(memberData);
      
      // Add new member to the beginning of the list
      setMembers(prev => [response.data, ...prev]);
      
      showToast('Member created successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create member';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update existing member
  const updateMember = useCallback(async (memberId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.updateMember(memberId, updateData);
      
      // Update member in the list
      setMembers(prev => prev.map(member => 
        member.id === memberId ? response.data : member
      ));
      
      showToast('Member updated successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update member';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Delete member
  const deleteMember = useCallback(async (memberId) => {
    setLoading(true);
    setError(null);
    
    try {
      await membersService.deleteMember(memberId);
      
      // Remove member from the list
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      showToast('Member deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete member';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get single member details
  const getMember = useCallback(async (memberId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.getMember(memberId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch member details';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Bulk operations
  const bulkUpdateMembers = useCallback(async (memberIds, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.bulkUpdateMembers(memberIds, updateData);
      
      // Update members in the list
      setMembers(prev => prev.map(member => 
        memberIds.includes(member.id) 
          ? { ...member, ...updateData }
          : member
      ));
      
      showToast(`${memberIds.length} members updated successfully`, 'success');
      setSelectedMembers([]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update members';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const bulkDeleteMembers = useCallback(async (memberIds) => {
    setLoading(true);
    setError(null);
    
    try {
      await membersService.bulkDeleteMembers(memberIds);
      
      // Remove members from the list
      setMembers(prev => prev.filter(member => !memberIds.includes(member.id)));
      
      showToast(`${memberIds.length} members deleted successfully`, 'success');
      setSelectedMembers([]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete members';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Member selection management
  const selectMember = useCallback((memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  }, []);

  const selectAllMembers = useCallback(() => {
    setSelectedMembers(members.map(member => member.id));
  }, [members]);

  const clearSelection = useCallback(() => {
    setSelectedMembers([]);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      gender: '',
      ageRange: '',
      groups: [],
      pledgeStatus: '',
      registrationDateRange: '',
      active: true
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Change page
  const changePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Refresh members
  const refreshMembers = useCallback(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Search members
  const searchMembers = useCallback(async (query) => {
    if (!query.trim()) {
      fetchMembers();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.searchMembers(query);
      setMembers(response.data.results);
      setPagination({
        page: 1,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        itemsPerPage: response.data.itemsPerPage
      });
    } catch (err) {
      setError(err.message || 'Failed to search members');
      showToast('Failed to search members', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchMembers, showToast]);

  // Upload member photo
  const uploadMemberPhoto = useCallback(async (memberId, photoFile) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await membersService.uploadMemberPhoto(memberId, photoFile);
      
      // Update member photo in the list
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, photo_url: response.data.photo_url }
          : member
      ));
      
      showToast('Photo uploaded successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to upload photo';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get member statistics
  const getMemberStats = useCallback(async () => {
    try {
      const response = await membersService.getMemberStats();
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch member statistics');
      return null;
    }
  }, []);

  // Get birthday members
  const getBirthdayMembers = useCallback(async (month = null) => {
    try {
      const response = await membersService.getBirthdayMembers(month);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch birthday members');
      return [];
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Computed values
  const activeMembers = members.filter(member => member.is_active);
  const activeMembersCount = activeMembers.length;
  const selectedMembersCount = selectedMembers.length;
  const isAllSelected = selectedMembers.length === members.length && members.length > 0;

  return {
    // Data
    members,
    loading,
    error,
    pagination,
    filters,
    selectedMembers,
    
    // Computed values
    activeMembers,
    activeMembersCount,
    selectedMembersCount,
    isAllSelected,
    
    // Actions
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    getMember,
    bulkUpdateMembers,
    bulkDeleteMembers,
    searchMembers,
    uploadMemberPhoto,
    getMemberStats,
    getBirthdayMembers,
    
    // Selection management
    selectMember,
    selectAllMembers,
    clearSelection,
    
    // Filter management
    updateFilters,
    clearFilters,
    changePage,
    refreshMembers,
    
    // Utilities
    clearError: () => setError(null)
  };
};