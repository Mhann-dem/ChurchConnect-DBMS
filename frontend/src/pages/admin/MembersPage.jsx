// pages/admin/MembersPage.jsx - Complete fixed version with enhanced debugging
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Users, UserPlus, Download } from 'lucide-react';
import MemberRegistrationForm from '../../components/form/MemberRegistrationForm';
import BulkActions from '../../components/admin/Members/BulkActions';
import MembersList from '../../components/admin/Members/MembersList';
import MemberFilters from '../../components/admin/Members/MemberFilters';
import { Modal, LoadingSpinner } from '../../components/shared';
import { Button } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import membersService from '../../services/members';
import styles from './AdminPages.module.css';

const MembersPage = () => {
  const { showToast } = useToast();
  
  // UI State
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(25);
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: '',
    pledgeStatus: '',
    registrationDateRange: '',
    active: true
  });

  // Debug logging for component state
  console.log('[MembersPage] Component rendered with state:', {
    searchQuery,
    currentPage,
    membersPerPage,
    filters,
    selectedMembers: selectedMembers.length
  });

  // Memoize the hook options to prevent unnecessary re-renders
  const hookOptions = useMemo(() => ({
    search: searchQuery,
    filters,
    page: currentPage,
    limit: membersPerPage
  }), [searchQuery, filters, currentPage, membersPerPage]);

  console.log('[MembersPage] Hook options:', hookOptions);

  // Use the members hook with proper error handling
  const membersHook = useMembers(hookOptions);
  
  // Debug the hook result
  console.log('[MembersPage] Hook result:', {
    isLoading: membersHook?.isLoading,
    error: membersHook?.error,
    membersLength: membersHook?.members?.length,
    totalMembers: membersHook?.totalMembers
  });
  
  // Safely extract values with defaults
  const {
    members = [],
    totalMembers = 0,
    isLoading = false,
    error = null,
    refetch = () => Promise.resolve(),
    createMember,
    deleteMember,
    updateMemberStatus,
    totalPages = 1,
    activeMembers = 0
  } = membersHook || {};

  // Ensure members is always an array
  const safeMembers = Array.isArray(members) ? members : [];
  const safeTotalMembers = typeof totalMembers === 'number' ? totalMembers : 0;

  console.log('[MembersPage] Safe values:', {
    safeMembersLength: safeMembers.length,
    safeTotalMembers,
    isLoading,
    error
  });

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('[MembersPage] State change detected:', {
      membersLength: safeMembers.length,
      totalMembers: safeTotalMembers,
      isLoading,
      error,
      hookOptionsChanged: JSON.stringify(hookOptions)
    });
  }, [safeMembers.length, safeTotalMembers, isLoading, error, hookOptions]);

  // Handle member registration success
  const handleRegistrationSuccess = useCallback(async (newMember) => {
    try {
      console.log('[MembersPage] Registration success:', newMember);
      setShowRegistrationForm(false);
      showToast('Member registered successfully!', 'success');
      
      // Refresh the members list
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('[MembersPage] Error after registration:', error);
      showToast('Member registered but failed to refresh list', 'warning');
    }
  }, [showToast, refetch]);

  // Handle member registration cancel
  const handleRegistrationCancel = useCallback(() => {
    console.log('[MembersPage] Registration cancelled');
    setShowRegistrationForm(false);
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action, memberIds, actionData = {}) => {
    try {
      console.log('[MembersPage] Performing bulk action:', { action, memberIds, actionData });
      
      // Check if membersService.performBulkAction exists
      if (typeof membersService.performBulkAction !== 'function') {
        console.error('[MembersPage] performBulkAction method not found on membersService');
        throw new Error('Bulk action method not available');
      }
      
      const result = await membersService.performBulkAction(action, memberIds, actionData);
      
      console.log('[MembersPage] Bulk action result:', result);
      
      if (result?.success) {
        // Clear selection after successful action
        setSelectedMembers([]);
        
        // Refresh data
        if (refetch) {
          await refetch();
        }
        
        showToast(result.message || 'Bulk action completed successfully', 'success');
        return result;
      } else {
        throw new Error(result?.error || 'Bulk action failed');
      }
    } catch (error) {
      console.error('[MembersPage] Bulk action error:', error);
      showToast(error?.message || 'Bulk action failed', 'error');
      throw error;
    }
  }, [refetch, showToast]);

  // Handle member selection
  const handleMemberSelection = useCallback((memberId, isSelected) => {
    console.log('[MembersPage] Member selection changed:', { memberId, isSelected });
    setSelectedMembers(prev => 
      isSelected 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  }, []);

  // Handle select all members
  const handleSelectAll = useCallback((selectAll) => {
    console.log('[MembersPage] Select all changed:', selectAll);
    if (selectAll) {
      const memberIds = safeMembers.map(member => member?.id).filter(Boolean);
      setSelectedMembers(memberIds);
    } else {
      setSelectedMembers([]);
    }
  }, [safeMembers]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    console.log('[MembersPage] Clearing selection');
    setSelectedMembers([]);
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    console.log('[MembersPage] Search changed:', query);
    setSearchQuery(query || '');
    setCurrentPage(1); // Reset to first page when searching
    setSelectedMembers([]); // Clear selection when searching
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    console.log('[MembersPage] Filter change:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
    setSelectedMembers([]); // Clear selection when filtering
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    console.log('[MembersPage] Page change:', page);
    setCurrentPage(page);
    setSelectedMembers([]); // Clear selection when changing pages
  }, []);

  // Handle per-page change
  const handlePerPageChange = useCallback((perPage) => {
    console.log('[MembersPage] Per-page change:', perPage);
    setMembersPerPage(Number(perPage));
    setCurrentPage(1); // Reset to first page
    setSelectedMembers([]); // Clear selection
  }, []);

  // Quick export all members
  const handleQuickExport = useCallback(async () => {
    try {
      console.log('[MembersPage] Starting export');
      const result = await membersService.exportMembers();
      if (result?.success) {
        showToast('Export started. File will download shortly.', 'success');
      } else {
        throw new Error(result?.error || 'Export failed');
      }
    } catch (error) {
      console.error('[MembersPage] Export error:', error);
      showToast(error?.message || 'Export failed', 'error');
    }
  }, [showToast]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    console.log('[MembersPage] Clearing filters');
    setFilters({
      gender: '',
      ageRange: '',
      pledgeStatus: '',
      registrationDateRange: '',
      active: true
    });
  }, []);

  // Error boundary fallback
  if (error) {
    console.error('[MembersPage] Rendering error state:', error);
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorContent}>
            <Users size={48} className={styles.errorIcon} />
            <h2 className={styles.errorTitle}>Failed to Load Members</h2>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.errorActions}>
              <Button onClick={refetch} className={styles.retryButton}>
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
      </div>
    );
  }

  // Check if we have any active filters
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== true && value !== null && value !== undefined
  );

  console.log('[MembersPage] Rendering main UI:', {
    safeMembersLength: safeMembers.length,
    isLoading,
    hasActiveFilters,
    selectedCount: selectedMembers.length
  });

  return (
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
              variant="outline"
              onClick={handleQuickExport}
              disabled={isLoading}
              className={styles.exportButton}
            >
              <Download size={16} />
              Quick Export
            </Button>
            
            <Button
              variant="primary"
              onClick={() => setShowRegistrationForm(true)}
              disabled={isLoading}
              className={styles.addButton}
            >
              <Plus size={16} />
              Add Member
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{safeTotalMembers}</span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{activeMembers}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{selectedMembers.length}</span>
            <span className={styles.statLabel}>Selected</span>
          </div>
          {hasActiveFilters && (
            <div className={styles.statItem}>
              <span className={styles.statValue}>Filtered</span>
              <span className={styles.statLabel}>Results</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={styles.actionBar}>
        <div className={styles.searchSection}>
          <div className={styles.searchInput}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search members by name, email, phone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchField}
              disabled={isLoading}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? styles.activeFilter : ''}
            disabled={isLoading}
          >
            <Filter size={16} />
            Filters {hasActiveFilters && '(Active)'}
          </Button>
        </div>

        <div className={styles.viewControls}>
          <select
            value={membersPerPage}
            onChange={(e) => handlePerPageChange(e.target.value)}
            className={styles.perPageSelect}
            disabled={isLoading}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
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
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <BulkActions
          selectedMembers={selectedMembers}
          onClearSelection={handleClearSelection}
          onBulkAction={handleBulkAction}
          totalMembers={safeTotalMembers}
          allMembers={safeMembers}
          disabled={isLoading}
        />
      )}

      {/* Main Content */}
      <div className={styles.mainContent}>
        {isLoading && safeMembers.length === 0 ? (
          <div className={styles.loadingState}>
            <LoadingSpinner size="lg" />
            <p>Loading members...</p>
          </div>
        ) : safeMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <div className={styles.emptyIcon}>
                <UserPlus size={64} />
              </div>
              <h3 className={styles.emptyTitle}>
                {searchQuery || hasActiveFilters
                  ? 'No Members Found' 
                  : 'No Members Registered Yet'
                }
              </h3>
              <p className={styles.emptyDescription}>
                {searchQuery || hasActiveFilters
                  ? 'No members match your search criteria. Try adjusting your filters or search terms.'
                  : 'Get started by adding your first church member to the database.'
                }
              </p>
              {!searchQuery && !hasActiveFilters ? (
                <div className={styles.emptyActions}>
                  <Button 
                    onClick={() => setShowRegistrationForm(true)}
                    size="lg"
                    className={styles.primaryAction}
                    disabled={isLoading}
                  >
                    <Plus size={20} />
                    Add First Member
                  </Button>
                  <p className={styles.emptyHint}>
                    You can also bulk import members using a CSV file once you have some data.
                  </p>
                </div>
              ) : (
                <div className={styles.emptyActions}>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      handleClearFilters();
                    }}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Clear Search & Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <MembersList
            members={safeMembers}
            selectedMembers={selectedMembers}
            onMemberSelection={handleMemberSelection}
            onSelectAll={handleSelectAll}
            currentPage={currentPage}
            totalPages={totalPages}
            totalMembers={safeTotalMembers}
            membersPerPage={membersPerPage}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            onDelete={deleteMember}
            onUpdateStatus={updateMemberStatus}
          />
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
        >
          <MemberRegistrationForm
            isAdminMode={true}
            onSuccess={handleRegistrationSuccess}
            onCancel={handleRegistrationCancel}
          />
        </Modal>
      )}
    </div>
  );
};

export default MembersPage;