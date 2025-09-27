// frontend/src/hooks/useFamilies.js - PRODUCTION FIX
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const abortControllerRef = useRef();
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // PRODUCTION FIX: Robust fetchFamilies with better error handling
  const fetchFamilies = useCallback(async (params = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (!mountedRef.current) return;
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching families with params:', params);
      
      // PRODUCTION FIX: Add timeout and better error handling
      const response = await Promise.race([
        familiesService.getFamilies(params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      console.log('Families API response:', response);
      
      if (!mountedRef.current) return;
      
      const data = response.data || response;
      let familiesData = [];
      let paginationData = {
        count: 0,
        next: null,
        previous: null,
        currentPage: params.page || 1,
        totalPages: 1
      };
      
      // PRODUCTION FIX: Handle different response formats robustly
      if (data) {
        if (data.results && Array.isArray(data.results)) {
          // Standard DRF paginated response
          familiesData = data.results;
          paginationData = {
            count: data.count || 0,
            next: data.next,
            previous: data.previous,
            currentPage: params.page || 1,
            totalPages: Math.ceil((data.count || 0) / (params.page_size || 25))
          };
        } else if (Array.isArray(data)) {
          // Direct array response
          familiesData = data;
          paginationData.count = data.length;
        } else {
          console.warn('Unexpected families response format:', data);
        }
      }
      
      console.log('Processed families data:', {
        familiesCount: familiesData.length,
        totalCount: paginationData.count,
        currentPage: paginationData.currentPage
      });
      
      setFamilies(familiesData);
      setPagination(paginationData);
      
    } catch (err) {
      if (err.name !== 'AbortError' && mountedRef.current) {
        console.error('Error fetching families:', err);
        
        // PRODUCTION FIX: Better error classification
        let errorMessage = 'Failed to fetch families';
        
        if (err.message === 'Request timeout') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to view families.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const fetchFamily = useCallback(async (id) => {
    if (!id || !mountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.getFamily(id);
      
      if (mountedRef.current) {
        setFamily(response.data);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && mountedRef.current) {
        console.error('Error fetching family:', err);
        const errorMessage = err.response?.data?.message || 'Failed to fetch family';
        setError(errorMessage);
        showToast('Error fetching family details', 'error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const createFamily = useCallback(async (familyData) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.createFamily(familyData);
      showToast('Family created successfully', 'success');
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorData = err.response?.data || {};
        setError(errorData);
        showToast('Error creating family', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const updateFamily = useCallback(async (id, familyData) => {
    if (!id || !mountedRef.current) throw new Error('Family ID is required');

    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.updateFamily(id, familyData);
      if (mountedRef.current) {
        setFamily(response.data);
      }
      showToast('Family updated successfully', 'success');
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorData = err.response?.data || {};
        setError(errorData);
        showToast('Error updating family', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const deleteFamily = useCallback(async (id) => {
    if (!id || !mountedRef.current) throw new Error('Family ID is required');

    setLoading(true);
    setError(null);
    
    try {
      await familiesService.deleteFamily(id);
      showToast('Family deleted successfully', 'success');
      return true;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to delete family';
        setError(errorMessage);
        showToast('Error deleting family', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const addMemberToFamily = useCallback(async (familyId, memberData) => {
    if (!familyId || !memberData || !mountedRef.current) {
      throw new Error('Family ID and member data are required');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.addMemberToFamily(familyId, memberData);
      showToast('Member added to family successfully', 'success');
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorData = err.response?.data || {};
        setError(errorData);
        showToast('Error adding member to family', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const removeMemberFromFamily = useCallback(async (familyId, memberId) => {
    if (!familyId || !memberId || !mountedRef.current) {
      throw new Error('Family ID and member ID are required');
    }

    setLoading(true);
    setError(null);
    
    try {
      await familiesService.removeMemberFromFamily(familyId, memberId);
      showToast('Member removed from family successfully', 'success');
      return true;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to remove member from family';
        setError(errorMessage);
        showToast('Error removing member from family', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const getFamilyMembers = useCallback(async (familyId) => {
    if (!familyId || !mountedRef.current) throw new Error('Family ID is required');

    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.getFamilyMembers(familyId);
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch family members';
        setError(errorMessage);
        showToast('Error fetching family members', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const setPrimaryContact = useCallback(async (familyId, memberId) => {
    if (!familyId || !memberId || !mountedRef.current) {
      throw new Error('Family ID and member ID are required');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.setPrimaryContact(familyId, memberId);
      showToast('Primary contact set successfully', 'success');
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to set primary contact';
        setError(errorMessage);
        showToast('Error setting primary contact', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const getFamilyStatistics = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await familiesService.getFamilyStatistics();
      return response.data;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch statistics';
        setError(errorMessage);
        showToast('Error fetching family statistics', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const bulkDeleteFamilies = useCallback(async (familyIds) => {
    if (!Array.isArray(familyIds) || familyIds.length === 0 || !mountedRef.current) {
      throw new Error('Family IDs array is required');
    }

    setLoading(true);
    setError(null);
    
    try {
      await familiesService.bulkOperations('delete', familyIds);
      
      // Remove deleted families from local state
      setFamilies(prev => prev.filter(family => !familyIds.includes(family.id)));

      showToast(`${familyIds.length} families deleted successfully`, 'success');
      return true;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || 'Failed to delete families';
        setError(errorMessage);
        showToast('Error deleting families', 'error');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  const clearFamily = useCallback(() => {
    if (mountedRef.current) {
      setFamily(null);
    }
  }, []);

  return {
    // State
    families,
    family,
    loading,
    error,
    pagination,
    
    // Actions
    fetchFamilies,
    fetchFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    addMemberToFamily,
    removeMemberFromFamily,
    getFamilyMembers,
    setPrimaryContact,
    getFamilyStatistics,
    bulkDeleteFamilies,
    
    // Utilities
    clearError,
    clearFamily
  };
};

export default useFamilies;