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
import { usePledges } from '../../hooks/usePledges';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import pledgesService from '../../services/pledges';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { validatePledgeFilters, validateSearchQuery } from '../../utils/validation';
import { PLEDGE_FILTERS_DEFAULTS, PAGINATION_OPTIONS } from '../../utils/constants';
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

  // Filters state with validation
  const [filters, setFilters] = useState(() => {
    try {
      return {
        status: searchParams.get('status') || PLEDGE_FILTERS_DEFAULTS.status,
        frequency: searchParams.get('frequency') || PLEDGE_FILTERS_DEFAULTS.frequency,
        amountRange: searchParams.get('amountRange') || PLEDGE_FILTERS_DEFAULTS.amountRange,
        dateRange: searchParams.get('dateRange') || PLEDGE_FILTERS_DEFAULTS.dateRange,
        memberId: searchParams.get('memberId') || PLEDGE_FILTERS_DEFAULTS.memberId,
      };
    } catch (error) {
      console.error('Error parsing filters from URL:', error);
      return PLEDGE_FILTERS_DEFAULTS;
    }
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(currentSearchQuery, 500);

  // Memoized hook options
  const hookOptions = useMemo(() => {
    const validatedFilters = validatePledgeFilters(filters);
    const validatedSearch = validateSearchQuery(debouncedSearchQuery);
    
    return {
      search: validatedSearch,
      filters: validatedFilters,
      page: currentPage,
      limit: itemsPerPage
    };
  }, [debouncedSearchQuery, filters, currentPage, itemsPerPage]);

  // Pledges hook with error handling
  const pledgesHook = usePledges(hookOptions);
  
  // Safely destructure with defaults
  const {
    pledges = [],
    totalPledges = 0,
    isLoading = false,
    error = null,
    statistics = {},
    pagination = { count: 0, totalPages: 1, currentPage: 1 },
    refetch = () => Promise.resolve(),
    createPledge,
    updatePledge,
    deletePledge,
    fetchStatistics = () => {},
    exportPledges
  } = pledgesHook || {};

  // Update URL params when state changes
  useEffect(() => {
    const updateURL = () => {
      const params = new URLSearchParams();
      
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (itemsPerPage !== 25) params.set('limit', itemsPerPage.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== PLEDGE_FILTERS_DEFAULTS[key]) {
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

  // Fetch initial statistics
  useEffect(() => {
    if (typeof fetchStatistics === 'function') {
      fetchStatistics().catch(error => {
        console.error('Error fetching statistics:', error);
      });
    }
  }, [fetchStatistics]);

  // Pledge management handlers
  const handleCreatePledge = useCallback(async (pledgeData) => {
    if (!createPledge) {
      showToast('Create function not available', 'error');
      return;
    }

    try {
      const newPledge = await createPledge(pledgeData);
      setShowForm(false);
      showToast(
        `Pledge for ${formatCurrency(pledgeData.amount)} created successfully`, 
        'success'
      );
      
      // Optionally navigate to member's pledges
      if (newPledge?.member_id) {
        const shouldNavigate = window.confirm(
          'Pledge created successfully! Would you like to view this member\'s profile?'
        );
        if (shouldNavigate) {
          navigate(`/admin/members/${newPledge.member_id}`);
        }
      }
    } catch (error) {
      console.error('Error creating pledge:', error);
      showToast(error.message || 'Failed to create pledge', 'error');
    }
  }, [createPledge, showToast, navigate]);

  const handleUpdatePledge = useCallback(async (pledgeId, pledgeData) => {
    if (!updatePledge || !pledgeId) {
      showToast('Update function not available', 'error');
      return;
    }

    try {
      await updatePledge(pledgeId, pledgeData);
      setSelectedPledge(null);
      setShowForm(false);
      showToast('Pledge updated successfully', 'success');
    } catch (error) {
      console.error('Error updating pledge:', error);
      showToast(error.message || 'Failed to update pledge', 'error');
    }
  }, [updatePledge, showToast]);

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
    } catch (error) {
      console.error('Error deleting pledge:', error);
      showToast(error.message || 'Failed to delete pledge', 'error');
    }
  }, [deletePledge, pledges, showToast]);

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
    setFilters(PLEDGE_FILTERS_DEFAULTS);
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

  // Export handler with enhanced functionality
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

      // Fallback manual export
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
          pledge?.member_name || pledge?.member_details?.full_name || 'N/A',
          pledge?.member_details?.email || 'N/A',
          pledge?.amount || '0',
          pledge?.frequency_display || pledge?.frequency || 'N/A',
          pledge?.status_display || pledge?.status || 'N/A',
          formatDate(pledge?.start_date) || 'N/A',
          formatDate(pledge?.end_date) || 'Ongoing',
          pledge?.total_pledged || '0',
          pledge?.total_received || '0',
          pledge?.outstanding_amount || '0',
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
      await Promise.all([refetch(), fetchStatistics()]);
      showToast('Pledges data refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh data', 'error');
    }
  }, [refetch, fetchStatistics, showToast]);

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
      value !== PLEDGE_FILTERS_DEFAULTS[key] && 
      value !== '' && 
      value !== null && 
      value !== undefined
    ), [filters]);

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
            onClick={() => window.location.reload()} 
            className={styles.reloadButton}
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  ), []);

  // Loading state for initial load
  if (isLoading && !pledges.length && !error) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading pledges data...</p>
      </div>
    );
  }

  // Main error state
  if (error && !pledges.length) {
    return <ErrorFallback error={error} resetError={refetch} />;
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
                {totalPledges > 0 && ` (${totalPledges.toLocaleString()} total)`}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                icon={<RefreshCw size={16} className={isLoading ? styles.spinning : ''} />}
                title="Refresh data"
              >
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPledges}
                disabled={isExporting || isLoading}
                icon={isExporting ? <LoadingSpinner size="sm" /> : <Download size={16} />}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={isLoading}
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
            loading={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
              icon={<Filter size={16} />}
            >
              Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== 'all').length})`}
            </Button>
          </div>

          <div className={styles.viewControls}>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePerPageChange(e.target.value)}
              className={styles.perPageSelect}
              disabled={isLoading}
              aria-label="Items per page"
            >
              {PAGINATION_OPTIONS.map(option => (
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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
                  disabled={isLoading}
                  icon={<X size={14} />}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPledges}
                  disabled={isExporting || isLoading}
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
              loading={isLoading}
              pagination={{
                ...pagination,
                currentPage,
                totalPages: Math.ceil(totalPledges / itemsPerPage),
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
          <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {selectedPledge ? 'Edit Pledge' : 'Add New Pledge'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseForm}
                  disabled={isLoading}
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
                  loading={isLoading}
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