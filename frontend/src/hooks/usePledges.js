// hooks/usePledges.js
import { useState, useEffect, useCallback } from 'react';
import pledgesService from '../services/pledges';

export const usePledges = () => {
  const [pledges, setPledges] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch pledges with parameters
  const fetchPledges = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pledgesService.getPledges({
        ...filters,
        search: searchQuery,
        ...params
      });
      
      if (response.success) {
        // Handle both paginated and non-paginated responses
        if (response.data.results) {
          setPledges(response.data.results);
          setPagination({
            totalPages: Math.ceil(response.data.count / (response.data.limit || 25)),
            totalItems: response.data.count,
            itemsPerPage: response.data.limit || 25,
            currentPage: response.data.page || 1
          });
        } else {
          setPledges(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setError(response.error);
        setPledges([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch pledges');
      setPledges([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await pledgesService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      } else {
        console.error('Failed to fetch statistics:', response.error);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Create pledge
  const createPledge = useCallback(async (pledgeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pledgesService.createPledge(pledgeData);
      if (response.success) {
        // Refresh the pledges list
        await fetchPledges();
        // Refresh statistics
        await fetchStatistics();
        return response.data;
      } else {
        setError(response.error);
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to create pledge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPledges, fetchStatistics]);

  // Update pledge
  const updatePledge = useCallback(async (pledgeId, pledgeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pledgesService.updatePledge(pledgeId, pledgeData);
      if (response.success) {
        // Update the pledge in the current list
        setPledges(prev => prev.map(pledge => 
          pledge.id === pledgeId ? response.data : pledge
        ));
        // Refresh statistics
        await fetchStatistics();
        return response.data;
      } else {
        setError(response.error);
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to update pledge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Delete pledge
  const deletePledge = useCallback(async (pledgeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await pledgesService.deletePledge(pledgeId);
      if (response.success) {
        // Remove the pledge from the current list
        setPledges(prev => prev.filter(pledge => pledge.id !== pledgeId));
        // Refresh statistics
        await fetchStatistics();
      } else {
        setError(response.error);
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete pledge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Export pledges
  const exportPledges = useCallback(async (format = 'csv') => {
    try {
      const response = await pledgesService.exportPledges({
        format,
        ...filters,
        search: searchQuery
      });
      
      if (response.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `pledges_export_${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  }, [filters, searchQuery]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Update search query
  const setHookSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Initial load
  useEffect(() => {
    fetchPledges();
  }, [fetchPledges]);

  return {
    pledges,
    statistics,
    loading,
    error,
    pagination,
    fetchPledges,
    fetchStatistics,
    createPledge,
    updatePledge,
    deletePledge,
    exportPledges,
    updateFilters,
    setSearchQuery: setHookSearchQuery,
    // Legacy support - keep the old name too for backward compatibility
    pledgeStats: statistics,
    fetchPledgeStats: fetchStatistics // ADD THIS LINE for backward compatibility
  };
};