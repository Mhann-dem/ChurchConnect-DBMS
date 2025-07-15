import { useState, useEffect, useCallback } from 'react';
import { reports } from '../services';
import { useToast } from './useToast';

/**
 * Custom hook for managing reports functionality
 * Handles report generation, export, and statistics
 */
export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const { showToast } = useToast();

  // Fetch available reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reports.getReports();
      setReports(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch report statistics
  const fetchReportStats = useCallback(async () => {
    try {
      const response = await reports.getReportStats();
      setReportStats(response.data);
    } catch (err) {
      console.error('Failed to fetch report stats:', err);
    }
  }, []);

  // Generate a new report
  const generateReport = useCallback(async (reportType, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reports.generateReport(reportType, filters);
      
      if (response.data) {
        showToast('Report generated successfully', 'success');
        // Refresh reports list
        await fetchReports();
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to generate report';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchReports]);

  // Export members to CSV
  const exportMembersCSV = useCallback(async (filters = {}) => {
    try {
      setExportLoading(true);
      const response = await reports.exportMembersCSV(filters);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Members exported successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export members';
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setExportLoading(false);
    }
  }, [showToast]);

  // Export pledges to CSV
  const exportPledgesCSV = useCallback(async (filters = {}) => {
    try {
      setExportLoading(true);
      const response = await reports.exportPledgesCSV(filters);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pledges_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Pledges exported successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export pledges';
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setExportLoading(false);
    }
  }, [showToast]);

  // Export groups to CSV
  const exportGroupsCSV = useCallback(async (filters = {}) => {
    try {
      setExportLoading(true);
      const response = await reports.exportGroupsCSV(filters);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `groups_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Groups exported successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export groups';
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setExportLoading(false);
    }
  }, [showToast]);

  // Generate member growth chart data
  const getMemberGrowthData = useCallback(async (period = '12months') => {
    try {
      const response = await reports.getMemberGrowthData(period);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch member growth data:', err);
      return [];
    }
  }, []);

  // Generate pledge statistics chart data
  const getPledgeStatsData = useCallback(async (period = '12months') => {
    try {
      const response = await reports.getPledgeStatsData(period);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch pledge stats data:', err);
      return [];
    }
  }, []);

  // Generate age distribution chart data
  const getAgeDistributionData = useCallback(async () => {
    try {
      const response = await reports.getAgeDistributionData();
      return response.data;
    } catch (err) {
      console.error('Failed to fetch age distribution data:', err);
      return [];
    }
  }, []);

  // Generate ministry distribution chart data
  const getMinistryDistributionData = useCallback(async () => {
    try {
      const response = await reports.getMinistryDistributionData();
      return response.data;
    } catch (err) {
      console.error('Failed to fetch ministry distribution data:', err);
      return [];
    }
  }, []);

  // Delete a report
  const deleteReport = useCallback(async (reportId) => {
    try {
      setLoading(true);
      await reports.deleteReport(reportId);
      
      // Remove from local state
      setReports(prev => prev.filter(report => report.id !== reportId));
      showToast('Report deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete report';
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Schedule a report
  const scheduleReport = useCallback(async (reportData) => {
    try {
      setLoading(true);
      const response = await reports.scheduleReport(reportData);
      
      if (response.data) {
        showToast('Report scheduled successfully', 'success');
        await fetchReports();
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to schedule report';
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchReports]);

  // Get report by ID
  const getReportById = useCallback(async (reportId) => {
    try {
      const response = await reports.getReportById(reportId);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch report:', err);
      throw err;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    fetchReports();
    fetchReportStats();
  }, [fetchReports, fetchReportStats]);

  return {
    // State
    reports,
    reportStats,
    loading,
    error,
    exportLoading,
    
    // Actions
    fetchReports,
    fetchReportStats,
    generateReport,
    exportMembersCSV,
    exportPledgesCSV,
    exportGroupsCSV,
    getMemberGrowthData,
    getPledgeStatsData,
    getAgeDistributionData,
    getMinistryDistributionData,
    deleteReport,
    scheduleReport,
    getReportById,
    clearError,
    
    // Computed values
    totalReports: reports.length,
    scheduledReports: reports.filter(report => report.scheduled),
    recentReports: reports.filter(report => {
      const reportDate = new Date(report.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    })
  };
};