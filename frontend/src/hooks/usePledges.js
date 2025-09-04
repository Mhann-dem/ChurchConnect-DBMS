// hooks/usePledges.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import pledgesService from '../services/pledges';

const usePledges = (initialFilters = {}) => {
  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    totalPages: 1,
    currentPage: 1
  });
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Use ref to track if initial fetch has been done
  const initialFetchDone = useRef(false);

  // Fetch pledges with error handling
  const fetchPledges = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        ...filters,
        ...params,
        search: searchQuery,
        page: params.page || 1
      };

      console.log('Fetching pledges with params:', queryParams);
      
      const response = await pledgesService.getPledges(queryParams);
      
      if (response.success) {
        // Handle both paginated and non-paginated responses
        if (response.data.results) {
          // Paginated response
          setPledges(response.data.results || []);
          setPagination({
            count: response.data.count || 0,
            next: response.data.next,
            previous: response.data.previous,
            totalPages: Math.ceil((response.data.count || 0) / 25),
            currentPage: params.page || 1
          });
        } else {
          // Non-paginated response
          setPledges(Array.isArray(response.data) ? response.data : []);
          setPagination({
            count: Array.isArray(response.data) ? response.data.length : 0,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1
          });
        }
      } else {
        console.error('Failed to fetch pledges:', response.error);
        setError(response.error || 'Failed to fetch pledges');
        setPledges([]);
      }
    } catch (err) {
      console.error('Error in fetchPledges:', err);
      setError('An unexpected error occurred while fetching pledges');
      setPledges([]);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Fetch statistics with error handling
  const fetchStatistics = useCallback(async () => {
    try {
      console.log('Fetching pledge statistics...');
      const response = await pledgesService.getStatistics();
      
      if (response.success) {
        console.log('Statistics fetched successfully:', response.data);
        setStatistics(response.data || {});
      } else {
        console.error('Failed to fetch statistics:', response.error);
        // Don't set error for statistics failure, just log it
        setStatistics({});
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setStatistics({});
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Create a stable fetch function that uses current values
  const stableFetchPledges = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Get current values directly from state
      const currentFilters = filters;
      const currentSearchQuery = searchQuery;

      const queryParams = {
        ...currentFilters,
        ...params,
        search: currentSearchQuery,
        page: params.page || 1
      };

      console.log('Fetching pledges with params:', queryParams);
      
      const response = await pledgesService.getPledges(queryParams);
      
      if (response.success) {
        // Handle both paginated and non-paginated responses
        if (response.data.results) {
          // Paginated response
          setPledges(response.data.results || []);
          setPagination({
            count: response.data.count || 0,
            next: response.data.next,
            previous: response.data.previous,
            totalPages: Math.ceil((response.data.count || 0) / 25),
            currentPage: params.page || 1
          });
        } else {
          // Non-paginated response
          setPledges(Array.isArray(response.data) ? response.data : []);
          setPagination({
            count: Array.isArray(response.data) ? response.data.length : 0,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1
          });
        }
      } else {
        console.error('Failed to fetch pledges:', response.error);
        setError(response.error || 'Failed to fetch pledges');
        setPledges([]);
      }
    } catch (err) {
      console.error('Error in fetchPledges:', err);
      setError('An unexpected error occurred while fetching pledges');
      setPledges([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]); // These dependencies are needed for filtering

  // Create pledge
  const createPledge = useCallback(async (pledgeData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating pledge with data:', pledgeData);
      const response = await pledgesService.createPledge(pledgeData);
      
      if (response.success) {
        console.log('Pledge created successfully');
        // Refresh pledges list and statistics
        await Promise.all([
          stableFetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        console.error('Failed to create pledge:', response.error);
        setError(response.error || 'Failed to create pledge');
        throw new Error(response.error || 'Failed to create pledge');
      }
    } catch (err) {
      console.error('Error creating pledge:', err);
      const errorMessage = err.message || 'An unexpected error occurred while creating pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stableFetchPledges, fetchStatistics]);

  // Update pledge
  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating pledge:', pledgeId, pledgeData);
      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      if (response.success) {
        console.log('Pledge updated successfully');
        // Refresh pledges list and statistics
        await Promise.all([
          stableFetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        console.error('Failed to update pledge:', response.error);
        setError(response.error || 'Failed to update pledge');
        throw new Error(response.error || 'Failed to update pledge');
      }
    } catch (err) {
      console.error('Error updating pledge:', err);
      const errorMessage = err.message || 'An unexpected error occurred while updating pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stableFetchPledges, fetchStatistics]);

  // Delete pledge
  const deletePledge = useCallback(async (pledgeId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Deleting pledge:', pledgeId);
      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success) {
        console.log('Pledge deleted successfully');
        // Refresh pledges list and statistics
        await Promise.all([
          stableFetchPledges(),
          fetchStatistics()
        ]);
      } else {
        console.error('Failed to delete pledge:', response.error);
        setError(response.error || 'Failed to delete pledge');
        throw new Error(response.error || 'Failed to delete pledge');
      }
    } catch (err) {
      console.error('Error deleting pledge:', err);
      const errorMessage = err.message || 'An unexpected error occurred while deleting pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [stableFetchPledges, fetchStatistics]);

  // Export pledges
  const exportPledges = useCallback(async (format = 'csv', params = {}) => {
    try {
      console.log('Exporting pledges as:', format);
      const response = await pledgesService.exportPledges({
        ...filters,
        search: searchQuery,
        ...params
      }, format);
      
      if (response.success) {
        console.log('Export completed successfully');
        return true;
      } else {
        console.error('Failed to export pledges:', response.error);
        throw new Error(response.error || 'Failed to export pledges');
      }
    } catch (err) {
      console.error('Error exporting pledges:', err);
      throw new Error(err.message || 'An unexpected error occurred while exporting pledges');
    }
  }, [filters, searchQuery]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    console.log('Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch on mount only - PROPERLY FIXED
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log('usePledges initial effect triggered - fetching pledges and statistics');
      initialFetchDone.current = true;
      
      // Use the stable versions for initial fetch
      fetchPledges();
      fetchStatistics();
    }
  }, []); // Empty dependency array is now safe

  // Effect to refetch when filters or search change - FIXED
  useEffect(() => {
    if (initialFetchDone.current) {
      console.log('Filters or search changed, refetching pledges');
      stableFetchPledges();
    }
  }, [filters, searchQuery]); // Use direct dependencies instead of function reference

  // Utility functions
  const getTotalPledgeAmount = useCallback(() => {
    return pledgesService.calculateTotalPledgeAmount(pledges);
  }, [pledges]);

  const getFrequencyDisplayText = useCallback((frequency) => {
    return pledgesService.getFrequencyDisplayText(frequency);
  }, []);

  const getStatusDisplayText = useCallback((status) => {
    return pledgesService.getStatusDisplayText(status);
  }, []);

  const formatAmount = useCallback((amount) => {
    return pledgesService.formatPledgeAmount(amount);
  }, []);

  const formatDate = useCallback((dateString) => {
    return pledgesService.formatDate(dateString);
  }, []);

  // Add this alias function
  const fetchPledgeStats = useCallback(async () => {
    console.log('fetchPledgeStats called - aliasing to fetchStatistics');
    return fetchStatistics();
  }, [fetchStatistics]);

  return {
    // Data
    pledges,
    statistics,
    pagination,
    
    // State
    loading,
    error,
    filters,
    searchQuery,
    
    // Actions
    fetchPledges: stableFetchPledges, // Return the stable version
    fetchStatistics,
    fetchPledgeStats,
    createPledge,
    updatePledge,
    deletePledge,
    exportPledges,
    updateFilters,
    setSearchQuery,
    clearError,
    
    // Utilities
    getTotalPledgeAmount,
    getFrequencyDisplayText,
    getStatusDisplayText,
    formatAmount,
    formatDate,
  };
};

export default usePledges;