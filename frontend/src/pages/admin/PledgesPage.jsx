// pages/admin/PledgesPage.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  X, 
  DollarSign, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Users,
  Clock
} from 'lucide-react';
import { PledgesList, PledgeForm, PledgeStats } from '../../components/admin/Pledges';
import { SearchBar, LoadingSpinner, ErrorBoundary } from '../../components/shared';
import { Button, Card, Badge } from '../../components/ui';
import usePledges from '../../hooks/usePledges';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './AdminPages.module.css';

const PledgesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPledges, setSelectedPledges] = useState(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page')) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('limit')) || 25
  );

  // Filters state
  const [filters, setFilters] = useState(() => {
    return {
      status: searchParams.get('status') || 'all',
      frequency: searchParams.get('frequency') || 'all',
      member_id: searchParams.get('member_id') || null,
    };
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(currentSearchQuery, 500);

  // ✅ FIXED: Enable autoFetch and disable cache for fresh data
  const pledgesHookOptions = useMemo(() => ({
    autoFetch: true,  // ✅ CRITICAL FIX: Was false, now true
    enableCache: false,  // ✅ CRITICAL FIX: Disable cache for real-time updates
    optimisticUpdates: true, // Enable optimistic UI updates
    filters: {
      ...filters,
      search: debouncedSearchQuery
    }
  }), [filters, debouncedSearchQuery]);

  // Use pledges hook
  const {
    pledges = [],
    loading = false,
    error = null,
    statistics = {},
    pagination = { count: 0, totalPages: 1, currentPage: 1 },
    fetchPledges,
    createPledge,
    updatePledge,
    deletePledge,
    fetchStatistics,
    exportPledges,
    updateFilters,
    updatePagination,
    clearError,
    refresh
  } = usePledges(pledgesHookOptions) || {};

  // ✅ FIXED: Force refresh when component mounts
  useEffect(() => {
    console.log('[PledgesPage] Component mounted, forcing initial data load...');
    
    const loadInitialData = async () => {
      try {
        if (refresh) {
          await refresh();
        } else if (fetchPledges && fetchStatistics) {
          await Promise.all([
            fetchPledges({ forceRefresh: true }),
            fetchStatistics({ forceRefresh: true })
          ]);
        }
        console.log('[PledgesPage] Initial data loaded successfully');
      } catch (error) {
        console.error('[PledgesPage] Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []); // Only run on mount

  // ✅ FIXED: Add visibility change listener to refresh when returning to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[PledgesPage] Page became visible, refreshing data...');
        if (refresh) {
          refresh();
        } else if (fetchPledges) {
          fetchPledges({ forceRefresh: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh, fetchPledges]);

  // ✅ FIXED: Add focus listener to refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('[PledgesPage] Window focused, refreshing data...');
      if (refresh) {
        refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  // Update URL params when state changes
  useEffect(() => {
    const updateURL = () => {
      const params = new URLSearchParams();
      
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (itemsPerPage !== 25) params.set('limit', itemsPerPage.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== null) {
          params.set(key, value.toString());
        }
      });

      const newURL = params.toString();
      const currentURL = searchParams.toString();
      
      if (newURL !== currentURL) {
        setSearchParams(params, { replace: true });
      }
    };

    const timeoutId = setTimeout(updateURL, 300);
    return () => clearTimeout(timeoutId);
  }, [debouncedSearchQuery, currentPage, itemsPerPage, filters, searchParams, setSearchParams]);

  // Update hook filters when local filters change
  useEffect(() => {
    if (updateFilters) {
      updateFilters({
        ...filters,
        search: debouncedSearchQuery
      });
    }
  }, [filters, debouncedSearchQuery, updateFilters]);

  // Update hook pagination when local pagination changes
  useEffect(() => {
    if (updatePagination) {
      updatePagination({
        currentPage,
        itemsPerPage
      });
    }
  }, [currentPage, itemsPerPage, updatePagination]);

  // Pledge management handlers
  const handleCreatePledge = useCallback(async (pledgeData) => {
    if (!createPledge) {
      showToast('Create function not available', 'error');
      return;
    }

    try {
      console.log('[PledgesPage] Creating pledge with data:', pledgeData);
      
      const newPledge = await createPledge(pledgeData);
      
      if (newPledge) {
        setShowForm(false);
        showToast(
          `Pledge for ${formatCurrency(pledgeData.amount)} created successfully`, 
          'success'
        );
        
        // ✅ CRITICAL FIX: Force immediate refresh after creation
        console.log('[PledgesPage] Pledge created, forcing refresh...');
        setTimeout(() => {
          if (refresh) {
            refresh();
          } else if (fetchPledges && fetchStatistics) {
            Promise.all([
              fetchPledges({ forceRefresh: true }),
              fetchStatistics({ forceRefresh: true })
            ]);
          }
        }, 500); // Small delay to ensure backend has processed
        
        // Optionally navigate to member's profile
        if (newPledge?.member_id && window.confirm(
          'Pledge created successfully! Would you like to view this member\'s profile?'
        )) {
          navigate(`/admin/members/${newPledge.member_id}`);
        }
      }
    } catch (error) {
      console.error('Error creating pledge:', error);
      showToast(error.message || 'Failed to create pledge', 'error');
    }
  }, [createPledge, showToast, navigate, refresh, fetchPledges, fetchStatistics]);

  const handleUpdatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!updatePledge || !pledgeId) {
      showToast('Update function not available', 'error');
      return;
    }

    try {
      console.log('[PledgesPage] Updating pledge:', pledgeId, pledgeData);
      
      await updatePledge(pledgeId, pledgeData);
      setSelectedPledge(null);
      setShowForm(false);
      showToast('Pledge updated successfully', 'success');
      
      // ✅ FIXED: Force refresh after update
      console.log('[PledgesPage] Pledge updated, forcing refresh...');
      setTimeout(() => {
        if (refresh) {
          refresh();
        } else if (fetchPledges) {
          fetchPledges({ forceRefresh: true });
        }
      }, 500);
    } catch (error) {
      console.error('Error updating pledge:', error);
      showToast(error.message || 'Failed to update pledge', 'error');
    }
  }, [updatePledge, showToast, refresh, fetchPledges]);

  const handleDeletePledge = useCallback(async (pledgeId) => {
    if (!deletePledge || !pledgeId) {
      showToast('Delete function not available', 'error');
      return;
    }

    const pledge = pledges.find(p => p.id === pledgeId);
    const confirmMessage = pledge 
      ? `Are you sure you want to delete the ${formatCurrency(pledge.amount)} pledge from ${pledge.member_name}?`
      : 'Are you sure you want to delete this pledge?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deletePledge(pledgeId);
      showToast('Pledge deleted successfully', 'success');
      setSelectedPledges(prev => {
        const newSet = new Set(prev);
        newSet.delete(pledgeId);
        return newSet;
      });
      
      // ✅ FIXED: Force refresh after delete
      console.log('[PledgesPage] Pledge deleted, forcing refresh...');
      setTimeout(() => {
        if (refresh) {
          refresh();
        } else if (fetchPledges) {
          fetchPledges({ forceRefresh: true });
        }
      }, 500);
    } catch (error) {
      console.error('Error deleting pledge:', error);
      showToast(error.message || 'Failed to delete pledge', 'error');
    }
  }, [deletePledge, pledges, showToast, refresh, fetchPledges]);

  const handleEditPledge = useCallback((pledge) => {
    if (!pledge?.id) {
      showToast('Invalid pledge data', 'error');
      return;
    }
    setSelectedPledge(pledge);
    setShowForm(true);
  }, [showToast]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedPledge(null);
  }, []);

  // Search and filter handlers
  const handleSearch = useCallback((query) => {
    setCurrentSearchQuery(query || '');
    setCurrentPage(1);
    setSelectedPledges(new Set());
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setSelectedPledges(new Set());
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      frequency: 'all',
      member_id: null
    });
    setCurrentSearchQuery('');
    setCurrentPage(1);
    setSelectedPledges(new Set());
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setSelectedPledges(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePerPageChange = useCallback((perPage) => {
    setItemsPerPage(Number(perPage));
    setCurrentPage(1);
    setSelectedPledges(new Set());
  }, []);

  // Export handler
  const handleExportPledges = useCallback(async () => {
    try {
      setIsExporting(true);
      
      if (exportPledges && typeof exportPledges === 'function') {
        const exportOptions = {
          format: 'csv',
          includeFilters: true,
          search: debouncedSearchQuery,
          filters: filters,
          selectedOnly: selectedPledges.size > 0 ? Array.from(selectedPledges) : null
        };
        
        await exportPledges(exportOptions);
        showToast('Export completed successfully. File will download shortly.', 'success');
        return;
      }

      // Fallback manual export if service method not available
      if (!pledges?.length) {
        showToast('No pledge data available for export', 'warning');
        return;
      }

      const exportData = pledges.filter(pledge => {
        if (selectedPledges.size > 0) {
          return selectedPledges.has(pledge.id);
        }
        return true;
      });

      const csvContent = [
        [
          'Member Name', 
          'Email', 
          'Amount', 
          'Frequency', 
          'Status', 
          'Start Date', 
          'End Date', 
          'Total Pledged', 
          'Total Received', 
          'Outstanding',
          'Notes',
          'Created Date'
        ],
        ...exportData.map(pledge => [
          pledge?.member_name || pledge?.member?.name || 'N/A',
          pledge?.member?.email || 'N/A',
          pledge?.amount || '0',
          pledge?.frequency || 'N/A',
          pledge?.status || 'N/A',
          formatDate(pledge?.start_date) || 'N/A',
          formatDate(pledge?.end_date) || 'Ongoing',
          pledge?.total_pledged || '0',
          pledge?.total_received || '0',
          (pledge?.total_pledged || 0) - (pledge?.total_received || 0),
          pledge?.notes || '',
          formatDate(pledge?.created_at) || 'N/A'
        ])
      ];

      const csvString = csvContent
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pledges_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(
        `Exported ${exportData.length} pledge${exportData.length === 1 ? '' : 's'} successfully`, 
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      showToast(error.message || 'Failed to export pledges', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [exportPledges, pledges, selectedPledges, debouncedSearchQuery, filters, showToast]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      if (clearError) clearError();
      
      console.log('[PledgesPage] Manual refresh triggered by user');
      
      if (refresh) {
        await refresh();
      } else if (fetchPledges && fetchStatistics) {
        await Promise.all([
          fetchPledges({ forceRefresh: true }), 
          fetchStatistics({ forceRefresh: true })
        ]);
      }
      
      showToast('Pledges data refreshed successfully', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    }
  }, [refresh, fetchPledges, fetchStatistics, clearError, showToast]);

  // Selection handlers
  const handlePledgeSelection = useCallback((pledgeId, isSelected) => {
    setSelectedPledges(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(pledgeId);
      } else {
        newSelection.delete(pledgeId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      const pledgeIds = pledges.map(pledge => pledge?.id).filter(Boolean);
      setSelectedPledges(new Set(pledgeIds));
    } else {
      setSelectedPledges(new Set());
    }
  }, [pledges]);

  // Check if we have any active filters
  const hasActiveFilters = useMemo(() => 
    Object.entries(filters).some(([key, value]) => 
      value !== 'all' && value !== null && value !== undefined && value !== ''
    ) || currentSearchQuery.trim() !== '', 
  [filters, currentSearchQuery]);

  // Filter options for the UI
  const filterOptions = useMemo(() => ({
    status: [
      { value: 'all', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'suspended', label: 'Suspended' }
    ],
    frequency: [
      { value: 'all', label: 'All Frequencies' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
      { value: 'one-time', label: 'One-time' }
    ]
  }), []);

  const paginationOptions = [10, 25, 50, 100];

  // Empty state content
  const EmptyStateContent = useMemo(() => {
    const hasSearchOrFilters = debouncedSearchQuery || hasActiveFilters;
    
    return (
      <Card className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>
            {hasSearchOrFilters ? (
              <Search size={64} className={styles.searchIcon} />
            ) : (
              <DollarSign size={64} className={styles.addIcon} />
            )}
          </div>
          
          <h3 className={styles.emptyTitle}>
            {hasSearchOrFilters ? 'No Pledges Found' : 'No Pledges Recorded Yet'}
          </h3>
          
          <p className={styles.emptyDescription}>
            {hasSearchOrFilters
              ? 'No pledges match your current search criteria. Try adjusting your filters or search terms.'
              : 'Start by recording your first pledge to track financial commitments.'
            }
          </p>
          
          <div className={styles.emptyActions}>
            {hasSearchOrFilters ? (
              <Button onClick={handleClearFilters} variant="outline">
                <X size={16} />
                Clear Search & Filters
              </Button>
            ) : (
              <Button 
                onClick={() => setShowForm(true)}
                size="lg"
                className={styles.primaryAction}
              >
                <Plus size={20} />
                Add First Pledge
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }, [debouncedSearchQuery, hasActiveFilters, handleClearFilters]);

  // Error fallback component
  const ErrorFallback = useCallback(({ error, resetError }) => (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>Failed to Load Pledges</h2>
        <p className={styles.errorMessage}>{error?.message || 'An unexpected error occurred'}</p>
        <div className={styles.errorActions}>
          <Button onClick={resetError} className={styles.retryButton}>
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className={styles.reloadButton}
          >
            Reload Data
          </Button>
        </div>
      </div>
    </div>
  ), [handleRefresh]);

  // Loading state for initial load
  if (loading && !pledges.length && !error) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading pledges data...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>Pledges Management</h1>
              <p className={styles.pageSubtitle}>
                Track and manage member financial commitments
                {pagination?.count > 0 && ` (${pagination.count.toLocaleString()} total)`}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={loading}
                icon={<RefreshCw size={16} className={loading ? styles.spinning : ''} />}
                title="Refresh data"
              >
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPledges}
                disabled={isExporting || loading}
                icon={isExporting ? <LoadingSpinner size="sm" /> : <Download size={16} />}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={loading}
                icon={<Plus size={16} />}
              >
                Add Pledge
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && Object.keys(statistics).length > 0 && (
          <PledgeStats 
            stats={statistics} 
            loading={loading}
            selectedCount={selectedPledges.size}
          />
        )}

        {/* Search and Filter Bar */}
        <div className={styles.actionBar}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search pledges by member name, amount, or notes..."
                value={currentSearchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.searchField}
                disabled={loading}
                aria-label="Search pledges"
              />
              {currentSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className={styles.clearSearch}
                  icon={<X size={14} />}
                  title="Clear search"
                />
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
              disabled={loading}
              icon={<Filter size={16} />}
            >
              Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== 'all').length + (currentSearchQuery ? 1 : 0)})`}
            </Button>
          </div>

          <div className={styles.viewControls}>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePerPageChange(e.target.value)}
              className={styles.perPageSelect}
              disabled={loading}
              aria-label="Items per page"
            >
              {paginationOptions.map(option => (
                <option key={option} value={option}>{option} per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className={styles.filtersPanel}>
            <div className={styles.filtersContent}>
              <div className={styles.filtersGrid}>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                  disabled={loading}
                  className={styles.filterSelect}
                  aria-label="Filter by status"
                >
                  {filterOptions.status.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filters.frequency}
                  onChange={(e) => handleFilterChange({ frequency: e.target.value })}
                  disabled={loading}
                  className={styles.filterSelect}
                  aria-label="Filter by frequency"
                >
                  {filterOptions.frequency.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filtersActions}>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={loading}
                    icon={<X size={14} />}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Selection Summary */}
        {selectedPledges.size > 0 && (
          <Card className={styles.selectionSummary}>
            <div className={styles.selectionContent}>
              <span className={styles.selectionText}>
                {selectedPledges.size} pledge{selectedPledges.size === 1 ? '' : 's'} selected
              </span>
              <div className={styles.selectionActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPledges(new Set())}
                  disabled={loading}
                  icon={<X size={14} />}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPledges}
                  disabled={isExporting || loading}
                  icon={<Download size={14} />}
                >
                  Export Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {pledges.length === 0 ? (
            EmptyStateContent
          ) : (
            <PledgesList
              pledges={pledges}
              selectedPledges={selectedPledges}
              onPledgeSelection={handlePledgeSelection}
              onSelectAll={handleSelectAll}
              onEdit={handleEditPledge}
              onDelete={handleDeletePledge}
              loading={loading}
              pagination={{
                ...pagination,
                currentPage,
                totalPages: Math.ceil((pagination?.count || 0) / itemsPerPage),
                itemsPerPage
              }}
              onPageChange={handlePageChange}
              searchQuery={debouncedSearchQuery}
              onNavigateToMember={(memberId) => navigate(`/admin/members/${memberId}`)}
            />
          )}
          
          {/* Error overlay for non-critical errors */}
          {error && pledges.length > 0 && (
            <div className={styles.errorOverlay}>
              <AlertCircle size={16} className={styles.errorIcon} />
              <p className={styles.errorText}>{error}</p>
              <Button size="sm" onClick={handleRefresh} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Pledge Form Modal */}
        {showForm && (
          <div className={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseForm();
            }
          }}>
            <div className={styles.modalContainer}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {selectedPledge ? 'Edit Pledge' : 'Add New Pledge'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseForm}
                  disabled={loading}
                  icon={<X size={16} />}
                  className={styles.modalCloseButton}
                  title="Close form"
                />
              </div>
              <div className={styles.modalBody}>
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
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default PledgesPage;