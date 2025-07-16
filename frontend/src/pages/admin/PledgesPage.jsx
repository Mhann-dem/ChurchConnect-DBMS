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

  const {
    pledges,
    stats,
    loading,
    error,
    createPledge,
    updatePledge,
    deletePledge,
    searchPledges,
    fetchPledgeStats
  } = usePledges();

  const { showToast } = useToast();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (frequencyFilter !== 'all') params.set('frequency', frequencyFilter);
    setSearchParams(params);
  }, [searchQuery, statusFilter, frequencyFilter, setSearchParams]);

  // Fetch pledges when filters change
  useEffect(() => {
    const filters = {
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : null,
      frequency: frequencyFilter !== 'all' ? frequencyFilter : null
    };
    searchPledges(filters);
  }, [searchQuery, statusFilter, frequencyFilter, searchPledges]);

  // Fetch stats on component mount
  useEffect(() => {
    fetchPledgeStats();
  }, [fetchPledgeStats]);

  const handleCreatePledge = async (pledgeData) => {
    try {
      await createPledge(pledgeData);
      setShowForm(false);
      showToast('Pledge created successfully', 'success');
    } catch (error) {
      showToast('Failed to create pledge', 'error');
    }
  };

  const handleUpdatePledge = async (pledgeId, pledgeData) => {
    try {
      await updatePledge(pledgeId, pledgeData);
      setSelectedPledge(null);
      setShowForm(false);
      showToast('Pledge updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update pledge', 'error');
    }
  };

  const handleDeletePledge = async (pledgeId) => {
    if (window.confirm('Are you sure you want to delete this pledge?')) {
      try {
        await deletePledge(pledgeId);
        showToast('Pledge deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete pledge', 'error');
      }
    }
  };

  const handleEditPledge = (pledge) => {
    setSelectedPledge(pledge);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPledge(null);
  };

  const handleExportPledges = () => {
    const filteredPledges = pledges.filter(pledge => {
      const matchesSearch = !searchQuery || 
        pledge.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pledge.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pledge.status === statusFilter;
      const matchesFrequency = frequencyFilter === 'all' || pledge.frequency === frequencyFilter;
      
      return matchesSearch && matchesStatus && matchesFrequency;
    });

    const csvContent = [
      ['Member Name', 'Amount', 'Frequency', 'Status', 'Start Date', 'End Date', 'Notes'],
      ...filteredPledges.map(pledge => [
        pledge.member_name,
        pledge.amount,
        pledge.frequency,
        pledge.status,
        pledge.start_date,
        pledge.end_date || '',
        pledge.notes || ''
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
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !pledges.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
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
            disabled={!pledges.length}
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
              onChange={setSearchQuery}
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
        pledges={pledges}
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