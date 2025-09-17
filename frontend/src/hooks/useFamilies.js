// frontend/src/hooks/useFamilies.js
import { useState, useEffect, useCallback } from 'react';
import familiesService from '../services/families';
import { useToast } from './useToast';

export const useFamilies = () => {
  const [families, setFamilies] = useState([]);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1
  });
  const { showToast } = useToast();

  const fetchFamilies = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.getFamilies(params);
      setFamilies(response.data.results || response.data);
      if (response.data.results) {
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: params.page || 1,
          totalPages: Math.ceil(response.data.count / (params.page_size || 25))
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch families');
      showToast('Error fetching families', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchFamily = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.getFamily(id);
      setFamily(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch family');
      showToast('Error fetching family details', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const createFamily = useCallback(async (familyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.createFamily(familyData);
      showToast('Family created successfully', 'success');
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Failed to create family');
      showToast('Error creating family', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateFamily = useCallback(async (id, familyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.updateFamily(id, familyData);
      setFamily(response.data);
      showToast('Family updated successfully', 'success');
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Failed to update family');
      showToast('Error updating family', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const deleteFamily = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await familiesService.deleteFamily(id);
      showToast('Family deleted successfully', 'success');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete family');
      showToast('Error deleting family', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const addMemberToFamily = useCallback(async (familyId, memberData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.addMemberToFamily(familyId, memberData);
      showToast('Member added to family successfully', 'success');
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Failed to add member to family');
      showToast('Error adding member to family', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const removeMemberFromFamily = useCallback(async (familyId, memberId) => {
    setLoading(true);
    setError(null);
    try {
      await familiesService.removeMemberFromFamily(familyId, memberId);
      showToast('Member removed from family successfully', 'success');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member from family');
      showToast('Error removing member from family', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getFamilyMembers = useCallback(async (familyId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.getFamilyMembers(familyId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch family members');
      showToast('Error fetching family members', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const setPrimaryContact = useCallback(async (familyId, memberId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.setPrimaryContact(familyId, memberId);
      showToast('Primary contact set successfully', 'success');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set primary contact');
      showToast('Error setting primary contact', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getFamilyStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await familiesService.getFamilyStatistics();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      showToast('Error fetching family statistics', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    families,
    family,
    loading,
    error,
    pagination,
    fetchFamilies,
    fetchFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    addMemberToFamily,
    removeMemberFromFamily,
    getFamilyMembers,
    setPrimaryContact,
    getFamilyStatistics
  };
};

export default useFamilies;