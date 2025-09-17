import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Users, UserPlus, Download, RefreshCw, X } from 'lucide-react';
import MemberRegistrationForm from '../../components/form/MemberRegistrationForm';
import BulkActions from '../../components/admin/Members/BulkActions';
import MembersList from '../../components/admin/Members/MembersList';
import MemberFilters from '../../components/admin/Members/MemberFilters';
import { Modal, LoadingSpinner, ErrorBoundary } from '../../components/shared';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import { useDebounce } from '../../hooks/useDebounce';
import membersService from '../../services/members';
import { validateSearchQuery, validateFilters } from '../../utils/validation';
import { MEMBER_FILTERS_DEFAULTS, PAGINATION_OPTIONS } from '../../utils/constants';
import styles from './AdminPages.module.css';

const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // Refs for cleanup
  const abortControllerRef = useRef();
  const timeoutRef = useRef();

  // UI State
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page')) || 1
  );
  const [membersPerPage, setMembersPerPage] = useState(
    parseInt(searchParams.get('limit')) || 25
  );

  // Filters state with validation
  const [filters, setFilters] = useState(() => {
    try {
      return {
        gender: searchParams.get('gender') || MEMBER_FILTERS_DEFAULTS.gender,
        ageRange: searchParams.get('ageRange') || MEMBER_FILTERS_DEFAULTS.ageRange,
        pledgeStatus: searchParams.get('pledgeStatus') || MEMBER_FILTERS_DEFAULTS.pledgeStatus,
        registrationDateRange: searchParams.get('registrationDateRange') || MEMBER_FILTERS_DEFAULTS.registrationDateRange,
        isActive: searchParams.get('isActive') !== 'false', // default to true
        ministryId: searchParams.get('ministryId') || MEMBER_FILTERS_DEFAULTS.ministryId,
        joinDateRange: searchParams.get('joinDateRange') || MEMBER_FILTERS_DEFAULTS.joinDateRange,
      };
    } catch (error) {
      console.error('Error parsing filters from URL:', error);
      return MEMBER_FILTERS_DEFAULTS;
    }
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(currentSearchQuery, 500);

  // Memoized hook options to prevent unnecessary re-renders
  const hookOptions = useMemo(() => {
    const validatedFilters = validateFilters(filters);
    const validatedSearch = validateSearchQuery(debouncedSearchQuery);
    
    return {
      search: validatedSearch,
      filters: validatedFilters,
      page: currentPage,
      limit: membersPerPage
    };
  }, [debouncedSearchQuery, filters, currentPage, membersPerPage]);

  // Members hook with error boundary
  const membersHook = useMembers(hookOptions);
  
  // Safely destructure with defaults
  const {
    members = [],
    totalMembers = 0,
    isLoading = false,
    error = null,
    refetch = () => Promise.resolve(),
    invalidateCache,
    clearError,
    createMember,
    deleteMember,
    updateMemberStatus,
    totalPages = 1,
    activeMembers = 0,
    statistics = {}
  } = membersHook || {};

  // Check if we have any active filters
  const hasActiveFilters = useMemo(() => 
    Object.entries(filters).some(([key, value]) => 
      value !== MEMBER_FILTERS_DEFAULTS[key] && 
      value !== '' && 
      value !== null && 
      value !== undefined
    ), [filters]);

  // Update URL params when state changes
  useEffect(() => {
    const updateURL = () => {
      const params = new URLSearchParams();
      
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (membersPerPage !== 25) params.set('limit', membersPerPage.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== MEMBER_FILTERS_DEFAULTS[key]) {
          params.set(key, value.toString());
        }
      });

      const newURL = params.toString();
      const currentURL = searchParams.toString();
      
      if (newURL !== currentURL) {
        setSearchParams(params, { replace: true });
      }
    };

    // Debounce URL updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(updateURL, 300);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSearchQuery, currentPage, membersPerPage, filters, searchParams, setSearchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debugging effect to monitor state changes
  useEffect(() => {
    console.log('[MembersPage] useMembers state changed:', {
      membersCount: members?.length,
      isLoading,
      error,
      totalMembers,
      currentPage,
      searchQuery: debouncedSearchQuery,
      hasActiveFilters: Object.entries(filters).some(([key, value]) => 
        value !== MEMBER_FILTERS_DEFAULTS[key] && 
        value !== '' && 
        value !== null && 
        value !== undefined
      )
    });
  }, [members, isLoading, error, totalMembers, currentPage, debouncedSearchQuery, filters]);

  // Enhanced registration success handler
  const handleRegistrationSuccess = useCallback(async (newMember) => {
    console.log('[MembersPage] Registration success called with:', newMember);
    
    try {
      setShowRegistrationForm(false);
      
      const memberName = `${newMember.first_name || newMember.firstName || 'Unknown'} ${newMember.last_name || newMember.lastName || ''}`.trim();
      showToast(`${memberName} registered successfully!`, 'success');
      
      // Enhanced refresh strategy
      try {
        console.log('[MembersPage] Forcing data refresh...');
        
        // Clear filters and reset to first page to see the new member
        setCurrentPage(1);
        setCurrentSearchQuery('');
        setSelectedMembers(new Set());
        
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force refresh the members list
        if (typeof refetch === 'function') {
          console.log('[MembersPage] Calling refetch...');
          const refreshResult = await refetch();
          console.log('[MembersPage] Refetch result:', refreshResult);
        }
        
        // Invalidate cache if available
        if (typeof invalidateCache === 'function') {
          console.log('[MembersPage] Invalidating cache...');
          invalidateCache();
        }
        
      } catch (refreshError) {
        console.error('[MembersPage] Error during refresh:', refreshError);
        showToast('Member registered but list may need manual refresh. Try clicking the refresh button.', 'warning');
      }
      
      // Ask user if they want to view the new member
      if (newMember?.id) {
        setTimeout(() => {
          const shouldNavigate = window.confirm('Member registered successfully! Would you like to view their profile?');
          if (shouldNavigate) {
            navigate(`/admin/members/${newMember.id}`);
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('[MembersPage] Error in registration success handler:', error);
      showToast('Member registered but failed to refresh list. Please refresh manually.', 'error');
    }
  }, [
    showToast, 
    refetch, 
    navigate, 
    invalidateCache,
    setCurrentPage,
    setCurrentSearchQuery,
    setSelectedMembers
  ]);

  const handleRegistrationCancel = useCallback(() => {
    setShowRegistrationForm(false);
  }, []);

  // Bulk actions handler
  const handleBulkAction = useCallback(async (action, memberIds, actionData = {}) => {
    try {
      if (!memberIds?.length) {
        showToast('No members selected', 'warning');
        return;
      }

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      const result = await membersService.performBulkAction(
        action, 
        Array.from(memberIds), 
        actionData,
        { signal: abortControllerRef.current.signal }
      );
      
      if (result?.success) {
        // Clear selection after successful action
        setSelectedMembers(new Set());
        
        // Refresh data
        await refetch();
        
        showToast(result.message || `Bulk ${action} completed successfully`, 'success');
        return result;
      } else {
        throw new Error(result?.error || 'Bulk action failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showToast('Action cancelled', 'info');
        return;
      }
      console.error('Bulk action error:', error);
      showToast(error?.message || 'Bulk action failed', 'error');
      throw error;
    }
  }, [refetch, showToast]);

  // Member selection handlers
  const handleMemberSelection = useCallback((memberId, isSelected) => {
    setSelectedMembers(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(memberId);
      } else {
        newSelection.delete(memberId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      const memberIds = members.map(member => member?.id).filter(Boolean);
      setSelectedMembers(new Set(memberIds));
    } else {
      setSelectedMembers(new Set());
    }
  }, [members]);

  const handleClearSelection = useCallback(() => {
    setSelectedMembers(new Set());
  }, []);

  // Search handler
  const handleSearch = useCallback((query) => {
    setCurrentSearchQuery(query || '');
    setCurrentPage(1); // Reset to first page when searching
    setSelectedMembers(new Set()); // Clear selection when searching
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
    setSelectedMembers(new Set()); // Clear selection when filtering
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(MEMBER_FILTERS_DEFAULTS);
    setCurrentSearchQuery('');
    setCurrentPage(1);
    setSelectedMembers(new Set());
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setSelectedMembers(new Set()); // Clear selection when changing pages
    
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePerPageChange = useCallback((perPage) => {
    setMembersPerPage(Number(perPage));
    setCurrentPage(1); // Reset to first page
    setSelectedMembers(new Set()); // Clear selection
  }, []);

  // Export handler
  const handleQuickExport = useCallback(async () => {
    try {
      setIsExporting(true);
      
      const exportOptions = {
        format: 'csv',
        includeFilters: true,
        search: debouncedSearchQuery,
        filters: filters
      };
      
      await membersService.exportMembers(exportOptions);
      showToast('Export completed successfully. File will download shortly.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast(error?.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [showToast, debouncedSearchQuery, filters]);

  // Enhanced refresh handler with better error handling
  const handleRefresh = useCallback(async () => {
    console.log('[MembersPage] Manual refresh triggered');
    
    try {
      // Clear any errors first
      if (typeof clearError === 'function') {
        clearError();
      }
      
      // Force a complete refresh
      const result = await refetch();
      console.log('[MembersPage] Refresh result:', result);
      
      if (result?.success !== false) {
        showToast('Data refreshed successfully', 'success');
      } else {
        throw new Error(result?.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('[MembersPage] Refresh error:', error);
      showToast('Failed to refresh data. Please check your connection.', 'error');
    }
  }, [refetch, showToast, clearError]);

  // Memoized empty state content
  const EmptyStateContent = useMemo(() => {
    const hasSearchOrFilters = debouncedSearchQuery || hasActiveFilters;
    
    return (
      <Card className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>
            {hasSearchOrFilters ? (
              <Search size={64} className={styles.searchIcon} />
            ) : (
              <UserPlus size={64} className={styles.addIcon} />
            )}
          </div>
          
          <h3 className={styles.emptyTitle}>
            {hasSearchOrFilters ? 'No Members Found' : 'No Members Registered Yet'}
          </h3>
          
          <p className={styles.emptyDescription}>
            {hasSearchOrFilters
              ? 'No members match your current search criteria. Try adjusting your filters or search terms.'
              : 'Get started by adding your first church member to the database.'
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
                onClick={() => setShowRegistrationForm(true)}
                size="lg"
                className={styles.primaryAction}
              >
                <Plus size={20} />
                Add First Member
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }, [debouncedSearchQuery, hasActiveFilters, handleClearFilters]);

  // Error boundary fallback
  const ErrorFallback = useCallback(({ error, resetError }) => (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <Users size={48} className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>Something went wrong</h2>
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

  // Main error state
  if (error && !members.length) {
    return <ErrorFallback error={error} resetError={refetch} />;
  }

  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>Members</h1>
              <p className={styles.pageSubtitle}>
                Manage church members and their information
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                className={styles.refreshButton}
                icon={<RefreshCw size={16} className={isLoading ? styles.spinning : ''} />}
                title="Refresh data"
              >
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={handleQuickExport}
                disabled={isLoading || isExporting}
                className={styles.exportButton}
                icon={<Download size={16} />}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              
              <Button
                variant="primary"
                onClick={() => setShowRegistrationForm(true)}
                disabled={isLoading}
                className={styles.addButton}
                icon={<Plus size={16} />}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalMembers.toLocaleString()}</span>
              <span className={styles.statLabel}>Total Members</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{activeMembers.toLocaleString()}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{selectedMembers.size}</span>
              <span className={styles.statLabel}>Selected</span>
            </div>
            {hasActiveFilters && (
              <div className={styles.statItem}>
                <span className={styles.statValue}>Filtered</span>
                <span className={styles.statLabel}>View</span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className={styles.actionBar}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search members by name, email, phone..."
                value={currentSearchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.searchField}
                disabled={isLoading}
                aria-label="Search members"
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
              Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== MEMBER_FILTERS_DEFAULTS[Object.keys(filters).find(k => filters[k] === v)]).length})`}
            </Button>
          </div>

          <div className={styles.viewControls}>
            <select
              value={membersPerPage}
              onChange={(e) => handlePerPageChange(e.target.value)}
              className={styles.perPageSelect}
              disabled={isLoading}
              aria-label="Members per page"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option} value={option}>{option} per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={styles.filtersPanel}>
            <MemberFilters
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              disabled={isLoading}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        )}

        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <BulkActions
            selectedMembers={selectedMembers}
            onClearSelection={handleClearSelection}
            onBulkAction={handleBulkAction}
            totalMembers={totalMembers}
            allMembers={members}
            disabled={isLoading}
          />
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {isLoading && !members.length ? (
            <div className={styles.loadingState}>
              <LoadingSpinner size="lg" />
              <p>Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            EmptyStateContent
          ) : (
            <MembersList
              members={members}
              selectedMembers={selectedMembers}
              onMemberSelection={handleMemberSelection}
              onSelectAll={handleSelectAll}
              currentPage={currentPage}
              totalPages={totalPages}
              totalMembers={totalMembers}
              membersPerPage={membersPerPage}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              onDelete={deleteMember}
              onUpdateStatus={updateMemberStatus}
              searchQuery={debouncedSearchQuery}
              onNavigateToMember={(id) => navigate(`/admin/members/${id}`)}
            />
          )}
          
          {/* Error overlay for non-critical errors */}
          {error && members.length > 0 && (
            <div className={styles.errorOverlay}>
              <p className={styles.errorText}>{error}</p>
              <Button size="sm" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Registration Form Modal */}
        {showRegistrationForm && (
          <Modal
            isOpen={showRegistrationForm}
            onClose={handleRegistrationCancel}
            title="Register New Member"
            size="large"
            className={styles.registrationModal}
            preventClose={isLoading}
          >
            <MemberRegistrationForm
              isAdminMode={true}
              onSuccess={handleRegistrationSuccess}
              onCancel={handleRegistrationCancel}
              disabled={isLoading}
            />
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MembersPage;