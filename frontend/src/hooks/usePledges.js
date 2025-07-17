import { useState, useEffect, useCallback } from 'react';
import pledgesService from '../services/pledges';
import { useToast } from './useToast';
import usePagination from './usePagination';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for managing pledges
 * Handles CRUD operations, filtering, searching, and statistics
 */
export const usePledges = (options = {}) => {
  const {
    initialFilters = {},
    autoFetch = true,
    pageSize = 25,
    enableRealTimeUpdates = false
  } = options;

  // State management
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statistics, setStatistics] = useState({
    totalPledges: 0,
    totalAmount: 0,
    activePledges: 0,
    completedPledges: 0,
    averageAmount: 0,
    monthlyTotal: 0,
    yearlyTotal: 0
  });

  // Hooks
  const { showToast } = useToast();
  const pagination = usePagination({ pageSize });
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch pledges with filters and pagination
  const fetchPledges = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        search: debouncedSearchQuery,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
        ...filters,
        ...customFilters
      };

      const response = await pledgesService.getPledges(params);
      
      setPledges(response.data.results);
      pagination.setTotalCount(response.data.count);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pledges';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearchQuery, sortBy, sortOrder, filters, pagination, showToast]);

  // Fetch pledge statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await pledgesService.getStatistics();
      setStatistics(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch pledge statistics:', err);
      // Don't show toast for statistics errors as they're not critical
    }
  }, []);

  // Get single pledge by ID
  const getPledge = useCallback(async (pledgeId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.getPledge(pledgeId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Create new pledge
  const createPledge = useCallback(async (pledgeData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.createPledge(pledgeData);
      
      // Add new pledge to the list
      setPledges(prev => [response.data, ...prev]);
      
      // Update statistics
      await fetchStatistics();
      
      showToast('Pledge created successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchStatistics]);

  // Update existing pledge
  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      // Update pledge in the list
      setPledges(prev => prev.map(pledge => 
        pledge.id === pledgeId ? response.data : pledge
      ));
      
      // Update statistics
      await fetchStatistics();
      
      showToast('Pledge updated successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchStatistics]);

  // Delete pledge
  const deletePledge = useCallback(async (pledgeId) => {
    setLoading(true);
    setError(null);

    try {
      await pledgesService.deletePledge(pledgeId);
      
      // Remove pledge from the list
      setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
      
      // Update statistics
      await fetchStatistics();
      
      showToast('Pledge deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchStatistics]);

  // Bulk operations
  const bulkUpdatePledges = useCallback(async (pledgeIds, updates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.bulkUpdatePledges(pledgeIds, updates);
      
      // Update pledges in the list
      setPledges(prev => prev.map(pledge => {
        if (pledgeIds.includes(pledge.id)) {
          return { ...pledge, ...updates };
        }
        return pledge;
      }));
      
      // Update statistics
      await fetchStatistics();
      
      showToast(`${pledgeIds.length} pledges updated successfully`, 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update pledges';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchStatistics]);

  const bulkDeletePledges = useCallback(async (pledgeIds) => {
    setLoading(true);
    setError(null);

    try {
      await pledgesService.bulkDeletePledges(pledgeIds);
      
      // Remove pledges from the list
      setPledges(prev => prev.filter(pledge => !pledgeIds.includes(pledge.id)));
      
      // Update statistics
      await fetchStatistics();
      
      showToast(`${pledgeIds.length} pledges deleted successfully`, 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete pledges';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchStatistics]);

  // Pledge-specific operations
  const markPledgeAsCompleted = useCallback(async (pledgeId) => {
    return await updatePledge(pledgeId, { status: 'completed' });
  }, [updatePledge]);

  const markPledgeAsCancelled = useCallback(async (pledgeId) => {
    return await updatePledge(pledgeId, { status: 'cancelled' });
  }, [updatePledge]);

  const reactivatePledge = useCallback(async (pledgeId) => {
    return await updatePledge(pledgeId, { status: 'active' });
  }, [updatePledge]);

  // Filter and search operations
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    pagination.goToPage(1); // Reset to first page when filters change
  }, [pagination]);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    pagination.goToPage(1);
  }, [initialFilters, pagination]);

  const updateSort = useCallback((field, order = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
    pagination.goToPage(1);
  }, [pagination]);

  // Export operations
  const exportPledges = useCallback(async (format = 'csv', customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        format,
        search: debouncedSearchQuery,
        ...filters,
        ...customFilters
      };

      const response = await pledgesService.exportPledges(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pledges_export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Pledges exported successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export pledges';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filters, showToast]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (enableRealTimeUpdates) {
      const interval = setInterval(() => {
        fetchPledges();
        fetchStatistics();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [enableRealTimeUpdates, fetchPledges, fetchStatistics]);

  // Initial data fetch
  useEffect(() => {
    if (autoFetch) {
      fetchPledges();
      fetchStatistics();
    }
  }, [autoFetch, fetchPledges, fetchStatistics]);

  // Refetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPledges();
    }
  }, [pagination.currentPage, debouncedSearchQuery, sortBy, sortOrder, filters]);

  // Utility functions
  const getFilteredPledges = useCallback((customFilters = {}) => {
    return pledges.filter(pledge => {
      const allFilters = { ...filters, ...customFilters };
      
      // Apply filters
      for (const [key, value] of Object.entries(allFilters)) {
        if (value && pledge[key] !== value) {
          return false;
        }
      }
      
      // Apply search
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        return (
          pledge.member_name?.toLowerCase().includes(searchLower) ||
          pledge.member_email?.toLowerCase().includes(searchLower) ||
          pledge.notes?.toLowerCase().includes(searchLower) ||
          pledge.amount?.toString().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [pledges, filters, debouncedSearchQuery]);

  const getTotalPledgeAmount = useCallback((pledgeList = pledges) => {
    return pledgeList.reduce((total, pledge) => total + parseFloat(pledge.amount || 0), 0);
  }, [pledges]);

  const getActivePledges = useCallback(() => {
    return pledges.filter(pledge => pledge.status === 'active');
  }, [pledges]);

  const getCompletedPledges = useCallback(() => {
    return pledges.filter(pledge => pledge.status === 'completed');
  }, [pledges]);

  const getPledgesByFrequency = useCallback((frequency) => {
    return pledges.filter(pledge => pledge.frequency === frequency);
  }, [pledges]);

  const refreshData = useCallback(() => {
    fetchPledges();
    fetchStatistics();
  }, [fetchPledges, fetchStatistics]);

  return {
    // Data
    pledges,
    statistics,
    loading,
    error,
    
    // Pagination
    ...pagination,
    
    // Filters and search
    filters,
    searchQuery,
    sortBy,
    sortOrder,
    setSearchQuery,
    updateFilters,
    clearFilters,
    updateSort,
    
    // CRUD operations
    fetchPledges,
    getPledge,
    createPledge,
    updatePledge,
    deletePledge,
    
    // Bulk operations
    bulkUpdatePledges,
    bulkDeletePledges,
    
    // Pledge-specific operations
    markPledgeAsCompleted,
    markPledgeAsCancelled,
    reactivatePledge,
    
    // Export
    exportPledges,
    
    // Utility functions
    getFilteredPledges,
    getTotalPledgeAmount,
    getActivePledges,
    getCompletedPledges,
    getPledgesByFrequency,
    refreshData,
    
    // Statistics
    fetchStatistics
  };
};

// Hook for managing a single pledge
export const usePledge = (pledgeId) => {
  const [pledge, setPledge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchPledge = useCallback(async () => {
    if (!pledgeId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.getPledge(pledgeId);
      setPledge(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pledgeId, showToast]);

  const updatePledge = useCallback(async (pledgeData) => {
    if (!pledgeId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      setPledge(response.data);
      showToast('Pledge updated successfully', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update pledge';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pledgeId, showToast]);

  useEffect(() => {
    fetchPledge();
  }, [fetchPledge]);

  return {
    pledge,
    loading,
    error,
    fetchPledge,
    updatePledge,
    setPledge
  };
};

export default usePledges;