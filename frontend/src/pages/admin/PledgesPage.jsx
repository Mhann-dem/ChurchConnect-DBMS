import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PledgesList, PledgeForm, PledgeStats } from '../../components/admin/Pledges';
import { SearchBar, LoadingSpinner, Toast } from '../../components/shared';
import { Button, Card } from '../../components/ui';
import { usePledges } from '../../hooks/usePledges';
import { useToast } from '../../hooks/useToast';
import './AdminPages.module.css';

const PledgesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [frequencyFilter, setFrequencyFilter] = useState(searchParams.get('frequency') || 'all');

  // Initialize the pledges hook
  const pledgesHookData = usePledges();
  const toastHook = useToast();

  // Safely extract data from hooks with fallbacks
  const pledges = pledgesHookData?.pledges || [];
  const statistics = pledgesHookData?.statistics || {};
  const loading = pledgesHookData?.loading || false;
  const error = pledgesHookData?.error || null;
  const createPledge = pledgesHookData?.createPledge || (() => Promise.reject('Function not available'));
  const updatePledge = pledgesHookData?.updatePledge || (() => Promise.reject('Function not available'));
  const deletePledge = pledgesHookData?.deletePledge || (() => Promise.reject('Function not available'));
  const fetchStatistics = pledgesHookData?.fetchStatistics || (() => {});
  const updateFilters = pledgesHookData?.updateFilters || (() => {});
  const setHookSearchQuery = pledgesHookData?.setSearchQuery || (() => {});
  const exportPledges = pledgesHookData?.exportPledges;
  
  const { showToast } = toastHook || {};

  // Map statistics to stats for component compatibility
  const stats = statistics;

  // Handle search input changes
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (typeof setHookSearchQuery === 'function') {
      setHookSearchQuery(query);
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (frequencyFilter !== 'all') params.set('frequency', frequencyFilter);
      setSearchParams(params);
    } catch (error) {
      console.error('Error updating search params:', error);
    }
  }, [searchQuery, statusFilter, frequencyFilter, setSearchParams]);

  // Update filters when they change
  useEffect(() => {
    if (typeof updateFilters === 'function') {
      try {
        const filters = {};
        if (statusFilter !== 'all') filters.status = statusFilter;
        if (frequencyFilter !== 'all') filters.frequency = frequencyFilter;
        updateFilters(filters);
      } catch (error) {
        console.error('Error updating filters:', error);
      }
    }
  }, [statusFilter, frequencyFilter, updateFilters]);

  // Fetch statistics on component mount
  useEffect(() => {
    if (typeof fetchStatistics === 'function') {
      try {
        fetchStatistics();
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    }
  }, [fetchStatistics]);

  const handleCreatePledge = async (pledgeData) => {
    if (typeof createPledge !== 'function') {
      if (showToast) showToast('Create pledge function not available', 'error');
      return;
    }

    try {
      await createPledge(pledgeData);
      setShowForm(false);
      if (showToast) showToast('Pledge created successfully', 'success');
    } catch (error) {
      console.error('Error creating pledge:', error);
      if (showToast) showToast('Failed to create pledge', 'error');
    }
  };

  const handleUpdatePledge = async (pledgeId, pledgeData) => {
    if (typeof updatePledge !== 'function') {
      if (showToast) showToast('Update pledge function not available', 'error');
      return;
    }

    try {
      await updatePledge(pledgeId, pledgeData);
      setSelectedPledge(null);
      setShowForm(false);
      if (showToast) showToast('Pledge updated successfully', 'success');
    } catch (error) {
      console.error('Error updating pledge:', error);
      if (showToast) showToast('Failed to update pledge', 'error');
    }
  };

  const handleDeletePledge = async (pledgeId) => {
    if (typeof deletePledge !== 'function') {
      if (showToast) showToast('Delete pledge function not available', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this pledge?')) {
      try {
        await deletePledge(pledgeId);
        if (showToast) showToast('Pledge deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting pledge:', error);
        if (showToast) showToast('Failed to delete pledge', 'error');
      }
    }
  };

  const handleEditPledge = (pledge) => {
    if (!pledge) {
      console.error('No pledge provided for editing');
      return;
    }
    setSelectedPledge(pledge);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPledge(null);
  };

  const handleExportPledges = async () => {
    try {
      // Use the hook's built-in export function if available
      if (typeof exportPledges === 'function') {
        await exportPledges('csv');
        return;
      }

      // Fallback to manual export
      if (!Array.isArray(pledges)) {
        if (showToast) showToast('No pledge data available for export', 'error');
        return;
      }

      const filteredPledges = pledges.filter(pledge => {
        if (!pledge) return false;
        
        const memberName = pledge.member_name || '';
        const notes = pledge.notes || '';
        const pledgeStatus = pledge.status || '';
        const pledgeFrequency = pledge.frequency || '';

        const matchesSearch = !searchQuery || 
          memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notes.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || pledgeStatus === statusFilter;
        const matchesFrequency = frequencyFilter === 'all' || pledgeFrequency === frequencyFilter;
        
        return matchesSearch && matchesStatus && matchesFrequency;
      });

      const csvContent = [
        ['Member Name', 'Amount', 'Frequency', 'Status', 'Start Date', 'End Date', 'Notes'],
        ...filteredPledges.map(pledge => [
          pledge?.member_name || '',
          pledge?.amount || '',
          pledge?.frequency || '',
          pledge?.status || '',
          pledge?.start_date || '',
          pledge?.end_date || '',
          pledge?.notes || ''
        ])
      ];

      const csvString = csvContent.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pledges_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      if (showToast) showToast('Export completed successfully', 'success');
    } catch (error) {
      console.error('Error exporting pledges:', error);
      if (showToast) showToast('Failed to export pledges', 'error');
    }
  };

  // Show loading state
  if (loading && (!pledges || pledges.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle hook not available
  if (!pledgesHookData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Unable to load pledges data</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pledges Management</h1>
          <p className="text-gray-600 mt-1">Manage member pledges and financial commitments</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExportPledges}
            disabled={!pledges || pledges.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            Add New Pledge
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <PledgeStats stats={stats} />

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onSearch={handleSearchChange}
              onChange={handleSearchChange}
              placeholder="Search pledges by member name or notes..."
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Frequencies</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pledges List */}
      <PledgesList
        pledges={pledges || []}
        onEdit={handleEditPledge}
        onDelete={handleDeletePledge}
        loading={loading}
      />

      {/* Pledge Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPledge ? 'Edit Pledge' : 'Add New Pledge'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PledgeForm
              pledge={selectedPledge}
              onSubmit={selectedPledge ? 
                (data) => handleUpdatePledge(selectedPledge.id, data) : 
                handleCreatePledge
              }
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
};

export default PledgesPage;