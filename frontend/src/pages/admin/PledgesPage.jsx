import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PledgesList, PledgeForm, PledgeStats } from '../../components/admin/Pledges';
import { SearchBar, LoadingSpinner, Toast } from '../../components/shared';
import { Button, Card } from '../../components/ui';
import usePledges from '../../hooks/usePledges';
import { useToast } from '../../hooks/useToast';
import './AdminPages.module.css';

const PledgesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [frequencyFilter, setFrequencyFilter] = useState(searchParams.get('frequency') || 'all');

  // Initialize hooks
  const pledgesHook = usePledges({
    status: statusFilter !== 'all' ? statusFilter : null,
    frequency: frequencyFilter !== 'all' ? frequencyFilter : null,
  });

  const toastHook = useToast();

  // Safely extract data from hooks with fallbacks and validation
  const pledges = Array.isArray(pledgesHook?.pledges) ? pledgesHook.pledges : [];
  const statistics = pledgesHook?.statistics || {};
  const loading = Boolean(pledgesHook?.loading);
  const error = pledgesHook?.error || null;
  const pagination = pledgesHook?.pagination || { count: 0, totalPages: 1, currentPage: 1 };
  
  // Hook functions with fallbacks
  const createPledge = pledgesHook?.createPledge || (() => Promise.reject(new Error('Create function not available')));
  const updatePledge = pledgesHook?.updatePledge || (() => Promise.reject(new Error('Update function not available')));
  const deletePledge = pledgesHook?.deletePledge || (() => Promise.reject(new Error('Delete function not available')));
  const fetchStatistics = pledgesHook?.fetchStatistics || (() => {});
  const updateFilters = pledgesHook?.updateFilters || (() => {});
  const setHookSearchQuery = pledgesHook?.setSearchQuery || (() => {});
  const exportPledges = pledgesHook?.exportPledges;
  const fetchPledges = pledgesHook?.fetchPledges || (() => {});
  
  const { showToast } = toastHook || {};

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof setHookSearchQuery === 'function') {
        setHookSearchQuery(localSearchQuery);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, setHookSearchQuery]);

  // Update URL params when filters change
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (localSearchQuery) params.set('search', localSearchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (frequencyFilter !== 'all') params.set('frequency', frequencyFilter);
      setSearchParams(params, { replace: true });
    } catch (error) {
      console.error('Error updating search params:', error);
    }
  }, [localSearchQuery, statusFilter, frequencyFilter, setSearchParams]);

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

  // Fetch initial data
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
    try {
      await createPledge(pledgeData);
      setShowForm(false);
      if (showToast) showToast('Pledge created successfully', 'success');
    } catch (error) {
      console.error('Error creating pledge:', error);
      if (showToast) showToast(error.message || 'Failed to create pledge', 'error');
    }
  };

  const handleUpdatePledge = async (pledgeId, pledgeData) => {
    try {
      await updatePledge(pledgeId, pledgeData);
      setSelectedPledge(null);
      setShowForm(false);
      if (showToast) showToast('Pledge updated successfully', 'success');
    } catch (error) {
      console.error('Error updating pledge:', error);
      if (showToast) showToast(error.message || 'Failed to update pledge', 'error');
    }
  };

  const handleDeletePledge = async (pledgeId) => {
    if (!window.confirm('Are you sure you want to delete this pledge?')) {
      return;
    }

    try {
      await deletePledge(pledgeId);
      if (showToast) showToast('Pledge deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting pledge:', error);
      if (showToast) showToast(error.message || 'Failed to delete pledge', 'error');
    }
  };

  const handleEditPledge = (pledge) => {
    if (!pledge || !pledge.id) {
      console.error('Invalid pledge data for editing:', pledge);
      if (showToast) showToast('Invalid pledge data', 'error');
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
      if (typeof exportPledges === 'function') {
        await exportPledges('csv');
        if (showToast) showToast('Export completed successfully', 'success');
        return;
      }

      // Fallback manual export
      if (!Array.isArray(pledges) || pledges.length === 0) {
        if (showToast) showToast('No pledge data available for export', 'warning');
        return;
      }

      const filteredPledges = pledges.filter(pledge => {
        if (!pledge) return false;
        
        const memberName = pledge.member_name || pledge.member_details?.full_name || '';
        const notes = pledge.notes || '';
        const pledgeStatus = pledge.status || '';
        const pledgeFrequency = pledge.frequency || '';

        const matchesSearch = !localSearchQuery || 
          memberName.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
          notes.toLowerCase().includes(localSearchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || pledgeStatus === statusFilter;
        const matchesFrequency = frequencyFilter === 'all' || pledgeFrequency === frequencyFilter;
        
        return matchesSearch && matchesStatus && matchesFrequency;
      });

      const csvContent = [
        ['Member Name', 'Email', 'Amount', 'Frequency', 'Status', 'Start Date', 'End Date', 'Total Pledged', 'Total Received', 'Notes'],
        ...filteredPledges.map(pledge => [
          pledge?.member_name || pledge?.member_details?.full_name || '',
          pledge?.member_details?.email || '',
          pledge?.amount || '',
          pledge?.frequency_display || pledge?.frequency || '',
          pledge?.status_display || pledge?.status || '',
          pledge?.start_date || '',
          pledge?.end_date || '',
          pledge?.total_pledged || '',
          pledge?.total_received || '',
          pledge?.notes || ''
        ])
      ];

      const csvString = csvContent.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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
      if (showToast) showToast(error.message || 'Failed to export pledges', 'error');
    }
  };

  const handleRefresh = () => {
    if (typeof fetchPledges === 'function') {
      fetchPledges();
    }
    if (typeof fetchStatistics === 'function') {
      fetchStatistics();
    }
  };

  // Show loading state for initial load
  if (loading && (!pledges || pledges.length === 0) && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle hook not available
  if (!pledgesHook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load pledges data</p>
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
          <p className="text-gray-600 mt-1">
            Manage member pledges and financial commitments
            {pagination.count > 0 && ` (${pagination.count} total)`}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPledges}
            disabled={!pledges || pledges.length === 0 || loading}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            Add New Pledge
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {Object.keys(statistics).length > 0 && (
        <PledgeStats stats={statistics} />
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={localSearchQuery}
              onSearch={setLocalSearchQuery}
              onChange={setLocalSearchQuery}
              placeholder="Search pledges by member name or notes..."
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && pledges.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pledges found</h3>
          <p className="text-gray-500 mb-4">
            {localSearchQuery || statusFilter !== 'all' || frequencyFilter !== 'all'
              ? 'No pledges match your current filters.'
              : 'Get started by creating your first pledge.'
            }
          </p>
          {(localSearchQuery || statusFilter !== 'all' || frequencyFilter !== 'all') ? (
            <Button
              variant="outline"
              onClick={() => {
                setLocalSearchQuery('');
                setStatusFilter('all');
                setFrequencyFilter('all');
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Add New Pledge
            </Button>
          )}
        </Card>
      )}

      {/* Pledges List */}
      {pledges.length > 0 && (
        <PledgesList
          pledges={pledges}
          onEdit={handleEditPledge}
          onDelete={handleDeletePledge}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => {
            if (typeof fetchPledges === 'function') {
              fetchPledges({ page });
            }
          }}
        />
      )}

      {/* Loading overlay for actions */}
      {loading && pledges.length > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}

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
                disabled={loading}
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
              loading={loading}
            />
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
};

export default PledgesPage;