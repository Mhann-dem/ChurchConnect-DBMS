// frontend/src/hooks/useFamilies.js - Enhanced with request cancellation and optimistic updates
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

  // Safe state update helper
  const safeSetState = useCallback((setter) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  const fetchFamilies = useCallback(async (params = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.getFamilies(params, {
        signal: abortControllerRef.current.signal
      });
      
      safeSetState(() => {
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
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = err.response?.data?.message || 'Failed to fetch families';
        safeSetState(() => setError(errorMessage));
        showToast('Error fetching families', 'error');
      }
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const fetchFamily = useCallback(async (id) => {
    if (!id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.getFamily(id, {
        signal: abortControllerRef.current.signal
      });
      safeSetState(() => setFamily(response.data));
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = err.response?.data?.message || 'Failed to fetch family';
        safeSetState(() => setError(errorMessage));
        showToast('Error fetching family details', 'error');
      }
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const createFamily = useCallback(async (familyData) => {
    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.createFamily(familyData);
      showToast('Family created successfully', 'success');
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || {};
      safeSetState(() => setError(errorData));
      showToast('Error creating family', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const updateFamily = useCallback(async (id, familyData) => {
    if (!id) throw new Error('Family ID is required');

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.updateFamily(id, familyData);
      safeSetState(() => setFamily(response.data));
      showToast('Family updated successfully', 'success');
      return response.data;
    } catch (err) {
      const errorData = err.response?.data || {};
      safeSetState(() => setError(errorData));
      showToast('Error updating family', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const deleteFamily = useCallback(async (id) => {
    if (!id) throw new Error('Family ID is required');

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      await familiesService.deleteFamily(id);
      showToast('Family deleted successfully', 'success');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete family';
      safeSetState(() => setError(errorMessage));
      showToast('Error deleting family', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const addMemberToFamily = useCallback(async (familyId, memberData) => {
    if (!familyId || !memberData) {
      throw new Error('Family ID and member data are required');
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMember = {
      id: tempId,
      member_id: memberData.member_id,
      relationship_type: memberData.relationship_type,
      notes: memberData.notes,
      isOptimistic: true,
      created_at: new Date().toISOString()
    };

    // Update family state optimistically if we have it
    if (family && family.id === familyId) {
      safeSetState(() => {
        setFamily(prev => ({
          ...prev,
          family_relationships: [
            ...(prev.family_relationships || []),
            optimisticMember
          ],
          member_count: (prev.member_count || 0) + 1
        }));
      });
    }

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.addMemberToFamily(familyId, memberData);
      
      // Replace optimistic update with real data
      if (family && family.id === familyId) {
        safeSetState(() => {
          setFamily(prev => ({
            ...prev,
            family_relationships: prev.family_relationships.map(rel =>
              rel.id === tempId ? response.data : rel
            )
          }));
        });
      }

      showToast('Member added to family successfully', 'success');
      return response.data;
    } catch (err) {
      // Revert optimistic update
      if (family && family.id === familyId) {
        safeSetState(() => {
          setFamily(prev => ({
            ...prev,
            family_relationships: prev.family_relationships.filter(rel => rel.id !== tempId),
            member_count: Math.max((prev.member_count || 1) - 1, 0)
          }));
        });
      }

      const errorData = err.response?.data || {};
      safeSetState(() => setError(errorData));
      showToast('Error adding member to family', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [family, showToast, safeSetState]);

  const removeMemberFromFamily = useCallback(async (familyId, memberId) => {
    if (!familyId || !memberId) {
      throw new Error('Family ID and member ID are required');
    }

    // Store original state for rollback
    let originalRelationship = null;
    if (family && family.id === familyId) {
      originalRelationship = family.family_relationships?.find(rel => rel.member?.id === memberId);
      
      // Optimistic update - remove member immediately
      safeSetState(() => {
        setFamily(prev => ({
          ...prev,
          family_relationships: prev.family_relationships?.filter(rel => rel.member?.id !== memberId) || [],
          member_count: Math.max((prev.member_count || 1) - 1, 0)
        }));
      });
    }

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      await familiesService.removeMemberFromFamily(familyId, memberId);
      showToast('Member removed from family successfully', 'success');
      return true;
    } catch (err) {
      // Revert optimistic update
      if (family && family.id === familyId && originalRelationship) {
        safeSetState(() => {
          setFamily(prev => ({
            ...prev,
            family_relationships: [...(prev.family_relationships || []), originalRelationship],
            member_count: (prev.member_count || 0) + 1
          }));
        });
      }

      const errorMessage = err.response?.data?.message || 'Failed to remove member from family';
      safeSetState(() => setError(errorMessage));
      showToast('Error removing member from family', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [family, showToast, safeSetState]);

  const getFamilyMembers = useCallback(async (familyId) => {
    if (!familyId) throw new Error('Family ID is required');

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.getFamilyMembers(familyId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch family members';
      safeSetState(() => setError(errorMessage));
      showToast('Error fetching family members', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  const setPrimaryContact = useCallback(async (familyId, memberId) => {
    if (!familyId || !memberId) {
      throw new Error('Family ID and member ID are required');
    }

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.setPrimaryContact(familyId, memberId);
      
      // Update local family state if available
      if (family && family.id === familyId) {
        const member = family.family_relationships?.find(rel => rel.member?.id === memberId)?.member;
        if (member) {
          safeSetState(() => {
            setFamily(prev => ({
              ...prev,
              primary_contact: member,
              primary_contact_name: member.get_full_name || `${member.first_name} ${member.last_name}`,
              primary_contact_email: member.email,
              primary_contact_phone: member.phone
            }));
          });
        }
      }

      showToast('Primary contact set successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to set primary contact';
      safeSetState(() => setError(errorMessage));
      showToast('Error setting primary contact', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [family, showToast, safeSetState]);

  const getFamilyStatistics = useCallback(async () => {
    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      const response = await familiesService.getFamilyStatistics();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch statistics';
      safeSetState(() => setError(errorMessage));
      showToast('Error fetching family statistics', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

  // Bulk operations
  const bulkDeleteFamilies = useCallback(async (familyIds) => {
    if (!Array.isArray(familyIds) || familyIds.length === 0) {
      throw new Error('Family IDs array is required');
    }

    safeSetState(() => setLoading(true));
    safeSetState(() => setError(null));
    
    try {
      await familiesService.bulkOperations('delete', familyIds);
      
      // Remove deleted families from local state
      safeSetState(() => {
        setFamilies(prev => prev.filter(family => !familyIds.includes(family.id)));
      });

      showToast(`${familyIds.length} families deleted successfully`, 'success');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete families';
      safeSetState(() => setError(errorMessage));
      showToast('Error deleting families', 'error');
      throw err;
    } finally {
      safeSetState(() => setLoading(false));
    }
  }, [showToast, safeSetState]);

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
    clearError: () => safeSetState(() => setError(null)),
    clearFamily: () => safeSetState(() => setFamily(null))
  };
};

export default useFamilies;