// hooks/usePledges.js - FIXED VERSION with proper state management
import { useState, useEffect, useCallback, useRef } from 'react';
import pledgesService from '../services/pledges';

const usePledges = (initialFilters = {}) => {
  // Core state
  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 25
  });

  // Filter and search state
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs to prevent infinite loops
  const isInitialized = useRef(false);
  const lastFetchParams = useRef(null);

  // Helper to serialize params for comparison
  const serializeParams = (params) => JSON.stringify(params);

  // Stable fetch function that doesn't change unless absolutely necessary
  const fetchPledges = useCallback(async (params = {}) => {
    // Merge current state with provided params
    const mergedParams = {
      ...filters,
      search: searchQuery,
      page: 1,
      ...params
    };

    // Skip if params haven't changed
    const currentParamsStr = serializeParams(mergedParams);
    if (lastFetchParams.current === currentParamsStr && isInitialized.current) {
      return;
    }
    lastFetchParams.current = currentParamsStr;

    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Fetching with params:', mergedParams);
      const response = await pledgesService.getPledges(mergedParams);
      
      if (response.success) {
        const data = response.data;
        
        // Handle both paginated and non-paginated responses
        if (data.results) {
          // Paginated response
          setPledges(Array.isArray(data.results) ? data.results : []);
          setPagination({
            count: data.count || 0,
            next: data.next,
            previous: data.previous,
            totalPages: Math.ceil((data.count || 0) / (mergedParams.page_size || 25)),
            currentPage: mergedParams.page || 1,
            itemsPerPage: mergedParams.page_size || 25
          });
        } else {
          // Non-paginated response
          const pledgesArray = Array.isArray(data) ? data : [];
          setPledges(pledgesArray);
          setPagination({
            count: pledgesArray.length,
            next: null,
            previous: null,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: pledgesArray.length
          });
        }

        console.log('usePledges: Successfully fetched', Array.isArray(data.results) ? data.results.length : (Array.isArray(data) ? data.length : 0), 'pledges');
      } else {
        console.error('usePledges: Failed to fetch pledges:', response.error);
        setError(response.error || 'Failed to fetch pledges');
        setPledges([]);
      }
    } catch (err) {
      console.error('usePledges: Exception in fetchPledges:', err);
      setError('An unexpected error occurred while fetching pledges');
      setPledges([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function is stable

  // Stable statistics fetch function
  const fetchStatistics = useCallback(async (params = {}) => {
    try {
      console.log('usePledges: Fetching statistics');
      const response = await pledgesService.getStatistics(params);
      
      if (response.success) {
        setStatistics(response.data || {});
        console.log('usePledges: Successfully fetched statistics');
      } else {
        console.error('usePledges: Failed to fetch statistics:', response.error);
        // Don't set error state for statistics failure
        setStatistics({});
      }
    } catch (err) {
      console.error('usePledges: Exception in fetchStatistics:', err);
      setStatistics({});
    }
  }, []);

  // CRUD Operations
  const createPledge = useCallback(async (pledgeData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Creating pledge');
      const response = await pledgesService.createPledge(pledgeData);
      
      if (response.success) {
        console.log('usePledges: Pledge created successfully');
        // Refresh both pledges and statistics
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to create pledge';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred while creating pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Updating pledge:', pledgeId);
      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      
      if (response.success) {
        console.log('usePledges: Pledge updated successfully');
        // Refresh both pledges and statistics
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to update pledge';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred while updating pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  const deletePledge = useCallback(async (pledgeId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Deleting pledge:', pledgeId);
      const response = await pledgesService.deletePledge(pledgeId);
      
      if (response.success) {
        console.log('usePledges: Pledge deleted successfully');
        // Refresh both pledges and statistics
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
      } else {
        const errorMessage = response.error || 'Failed to delete pledge';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred while deleting pledge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  // Bulk operations
  const bulkUpdatePledges = useCallback(async (pledgeIds, updates) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Bulk updating pledges:', pledgeIds.length);
      const response = await pledgesService.bulkUpdatePledges(pledgeIds, updates);
      
      if (response.success) {
        console.log('usePledges: Bulk update successful');
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to bulk update pledges';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during bulk update';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  const bulkDeletePledges = useCallback(async (pledgeIds) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Bulk deleting pledges:', pledgeIds.length);
      const response = await pledgesService.bulkDeletePledges(pledgeIds);
      
      if (response.success) {
        console.log('usePledges: Bulk delete successful');
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to bulk delete pledges';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during bulk delete';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  // Payment operations
  const addPayment = useCallback(async (pledgeId, paymentData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('usePledges: Adding payment to pledge:', pledgeId);
      const response = await pledgesService.addPayment(pledgeId, paymentData);
      
      if (response.success) {
        console.log('usePledges: Payment added successfully');
        await Promise.all([
          fetchPledges(),
          fetchStatistics()
        ]);
        return response.data;
      } else {
        const errorMessage = response.error || 'Failed to add payment';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred while adding payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  // Export function
  const exportPledges = useCallback(async (format = 'csv', params = {}) => {
    try {
      console.log('usePledges: Exporting pledges as', format);
      const exportParams = { ...filters, search: searchQuery, ...params };
      const response = await pledgesService.exportPledges(exportParams, format);
      
      if (response.success) {
        console.log('usePledges: Export completed successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to export pledges');
      }
    } catch (err) {
      console.error('usePledges: Export failed:', err);
      throw new Error(err.message || 'An unexpected error occurred while exporting pledges');
    }
  }, [filters, searchQuery]);

  // Filter and search management
  const updateFilters = useCallback((newFilters) => {
    console.log('usePledges: Updating filters:', newFilters);
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      console.log('usePledges: New filters:', updatedFilters);
      return updatedFilters;
    });
    // Reset last fetch params to force refresh
    lastFetchParams.current = null;
  }, []);

  const updateSearchQuery = useCallback((query) => {
    console.log('usePledges: Updating search query:', query);
    setSearchQuery(query);
    // Reset last fetch params to force refresh
    lastFetchParams.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('usePledges: Initializing - fetching pledges and statistics');
      isInitialized.current = true;
      
      // Initial fetch
      Promise.all([
        fetchPledges(),
        fetchStatistics()
      ]).catch(err => {
        console.error('usePledges: Initialization failed:', err);
      });
    }
  }, [fetchPledges, fetchStatistics]);

  // Effect for filter/search changes
  useEffect(() => {
    if (isInitialized.current) {
      console.log('usePledges: Filters or search changed, refetching pledges');
      fetchPledges().catch(err => {
        console.error('usePledges: Filter/search refetch failed:', err);
      });
    }
  }, [filters, searchQuery, fetchPledges]);

  // Utility functions using service methods
  const getTotalPledgeAmount = useCallback(() => {
    return pledgesService.calculateTotalPledgeAmount(pledges);
  }, [pledges]);

  const getTotalReceivedAmount = useCallback(() => {
    return pledgesService.calculateTotalReceivedAmount(pledges);
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

  // Return the hook interface
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
    
    // Core Actions
    fetchPledges,
    fetchStatistics,
    fetchPledgeStats: fetchStatistics, // Alias for compatibility
    createPledge,
    updatePledge,
    deletePledge,
    
    // Bulk Actions
    bulkUpdatePledges,
    bulkDeletePledges,
    
    // Payment Actions
    addPayment,
    
    // Utility Actions
    exportPledges,
    updateFilters,
    setSearchQuery: updateSearchQuery,
    clearError,
    
    // Computed Values
    getTotalPledgeAmount,
    getTotalReceivedAmount,
    getFrequencyDisplayText,
    getStatusDisplayText,
    formatAmount,
    formatDate,
  };
};

export default usePledges;