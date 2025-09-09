// frontend/src/components/admin/Pledges/PledgesList.jsx
import React, { useState, useEffect } from 'react';
import usePledges from '../../../hooks/usePledges';
import { useToast } from '../../../hooks/useToast';
import { SearchBar, Pagination, LoadingSpinner, EmptyState } from '../../shared';
import { Button, Card, Badge, Dropdown } from '../../ui';
import PledgeCard from './PledgeCard';
import PledgeForm from './PledgeForm';
import PledgeStats from './PledgeStats';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import styles from './Pledges.module.css';

const PledgesList = ({ 
  pledges: externalPledges, 
  onEdit: externalOnEdit, 
  onDelete: externalOnDelete, 
  loading: externalLoading,
  pagination: externalPagination,
  onPageChange: externalOnPageChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Only use the hook if pledges aren't provided as props
  const pledgesHook = !externalPledges ? usePledges() : null;

  // Use either external props or hook data
  const pledges = externalPledges || pledgesHook?.pledges || [];
  const loading = externalLoading !== undefined ? externalLoading : pledgesHook?.loading || false;
  const error = pledgesHook?.error || null;
  const pagination = externalPagination || pledgesHook?.pagination || {};
  const pledgeStats = pledgesHook?.statistics || {};

  const { 
    fetchPledges,
    updatePledge,
    deletePledge,
    bulkUpdatePledges,
    bulkDeletePledges
  } = pledgesHook || {};

  const { showToast } = useToast();

  // Fetch pledges only if using internal hook
  useEffect(() => {
    if (!externalPledges && fetchPledges) {
      fetchPledges({
        search: searchTerm,
        status: selectedStatus === 'all' ? null : selectedStatus,
        frequency: selectedFrequency === 'all' ? null : selectedFrequency,
        sort_by: sortBy,
        sort_order: sortOrder,
        page
      });
    }
  }, [searchTerm, selectedStatus, selectedFrequency, sortBy, sortOrder, page, externalPledges, fetchPledges]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleFrequencyFilter = (frequency) => {
    setSelectedFrequency(frequency);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleEditPledge = (pledge) => {
    if (externalOnEdit) {
      externalOnEdit(pledge);
    } else {
      setSelectedPledge(pledge);
      setShowForm(true);
    }
  };

  const handleDeletePledge = async (pledgeId) => {
    if (externalOnDelete) {
      await externalOnDelete(pledgeId);
    } else if (deletePledge) {
      if (window.confirm('Are you sure you want to delete this pledge?')) {
        try {
          await deletePledge(pledgeId);
          showToast('Pledge deleted successfully', 'success');
        } catch (error) {
          showToast('Failed to delete pledge', 'error');
        }
      }
    }
  };

  const handleUpdateStatus = async (pledgeId, newStatus) => {
    try {
      if (updatePledge) {
        await updatePledge(pledgeId, { status: newStatus });
        showToast('Pledge status updated successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to update pledge status', 'error');
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedPledge(null);
    if (fetchPledges) {
      fetchPledges();
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedPledge(null);
  };

  const handlePageChange = (newPage) => {
    if (externalOnPageChange) {
      externalOnPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  // Bulk selection handlers
  const handleBulkSelect = (pledgeId, isSelected) => {
    setBulkSelectedIds(prev => 
      isSelected 
        ? [...prev, pledgeId]
        : prev.filter(id => id !== pledgeId)
    );
  };

  const handleSelectAll = () => {
    setBulkSelectedIds(
      bulkSelectedIds.length === pledges.length 
        ? [] 
        : pledges.map(p => p.id)
    );
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (bulkSelectedIds.length === 0) return;
    
    try {
      if (bulkUpdatePledges) {
        await bulkUpdatePledges(bulkSelectedIds, { status: newStatus });
        showToast(`${bulkSelectedIds.length} pledges updated successfully`, 'success');
        setBulkSelectedIds([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      showToast('Failed to bulk update pledges', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelectedIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${bulkSelectedIds.length} pledges?`)) {
      return;
    }
    
    try {
      if (bulkDeletePledges) {
        await bulkDeletePledges(bulkSelectedIds);
        showToast(`${bulkSelectedIds.length} pledges deleted successfully`, 'success');
        setBulkSelectedIds([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      showToast('Failed to bulk delete pledges', 'error');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getFrequencyBadgeColor = (frequency) => {
    switch (frequency) {
      case 'one-time':
        return 'secondary';
      case 'weekly':
        return 'primary';
      case 'monthly':
        return 'info';
      case 'quarterly':
        return 'warning';
      case 'annually':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && pledges.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error loading pledges: {error}</p>
        <Button onClick={() => fetchPledges && fetchPledges()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.pledgesContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Pledges Management</h1>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
            {!externalPledges && (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                Add New Pledge
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && Object.keys(pledgeStats).length > 0 && (
        <div className={styles.statsSection}>
          <PledgeStats stats={pledgeStats} />
        </div>
      )}

      {/* Filters and Search */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersContainer}>
          <div className={styles.searchContainer}>
            <SearchBar
              placeholder="Search pledges by member name, amount, or notes..."
              onSearch={handleSearch}
              value={searchTerm}
            />
          </div>
          
          <div className={styles.filters}>
            <Dropdown
              label="Status"
              value={selectedStatus}
              onChange={handleStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            
            <Dropdown
              label="Frequency"
              value={selectedFrequency}
              onChange={handleFrequencyFilter}
              options={[
                { value: 'all', label: 'All Frequencies' },
                { value: 'one-time', label: 'One-time' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'annually', label: 'Annually' }
              ]}
            />
            
            <Dropdown
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'created_at', label: 'Date Created' },
                { value: 'amount', label: 'Amount' },
                { value: 'start_date', label: 'Start Date' },
                { value: 'member_name', label: 'Member Name' }
              ]}
            />
            
            <Button
              variant="outline"
              onClick={() => handleSort(sortBy)}
              className={styles.sortButton}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {bulkSelectedIds.length > 0 && (
          <div className={styles.bulkActionsContainer}>
            <div className={styles.bulkInfo}>
              <span>{bulkSelectedIds.length} pledge{bulkSelectedIds.length !== 1 ? 's' : ''} selected</span>
              <Button variant="link" onClick={() => setBulkSelectedIds([])}>
                Clear selection
              </Button>
            </div>
            <div className={styles.bulkActions}>
              <Dropdown
                label="Update Status"
                placeholder="Choose status"
                onChange={handleBulkStatusUpdate}
                options={[
                  { value: 'active', label: 'Mark as Active' },
                  { value: 'completed', label: 'Mark as Completed' },
                  { value: 'cancelled', label: 'Mark as Cancelled' }
                ]}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Pledges List */}
      <div className={styles.pledgesGrid}>
        {pledges.length === 0 ? (
          <EmptyState
            title="No pledges found"
            description="No pledges match your current filters."
            actionText="Add New Pledge"
            onAction={() => !externalPledges && setShowForm(true)}
          />
        ) : (
          <>
            {/* Select All Header */}
            <div className={styles.selectAllHeader}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={bulkSelectedIds.length === pledges.length && pledges.length > 0}
                  onChange={handleSelectAll}
                  className={styles.selectAllCheckbox}
                />
                Select All ({pledges.length})
              </label>
            </div>

            {pledges.map((pledge) => (
              <div key={pledge.id} className={styles.pledgeCardWrapper}>
                <label className={styles.selectCheckbox}>
                  <input
                    type="checkbox"
                    checked={bulkSelectedIds.includes(pledge.id)}
                    onChange={(e) => handleBulkSelect(pledge.id, e.target.checked)}
                  />
                </label>
                <PledgeCard
                  pledge={pledge}
                  onEdit={handleEditPledge}
                  onDelete={handleDeletePledge}
                  onUpdateStatus={handleUpdateStatus}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={pagination.currentPage || page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            showInfo={true}
            totalItems={pagination.count}
            itemsPerPage={pagination.itemsPerPage || 25}
          />
        </div>
      )}

      {/* Pledge Form Modal */}
      {showForm && !externalPledges && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <PledgeForm
              pledge={selectedPledge}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PledgesList;