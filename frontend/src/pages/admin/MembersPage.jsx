// frontend/src/pages/admin/MembersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: '',
    pledgeStatus: '',
    registrationDateRange: '',
    active: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(25);

  // Use custom hook for member data management with error handling
  const hookResult = useMembers({
    search: searchQuery,
    filters,
    page: currentPage,
    limit: membersPerPage
  });

  // Safely destructure with defaults to prevent undefined errors
  const {
    members = [],
    totalMembers = 0,
    isLoading = false,
    error = null,
    refetch = () => Promise.resolve()
  } = hookResult || {};

  // Ensure members is always an array to prevent runtime errors
  const safeMembers = Array.isArray(members) ? members : [];
  const safeTotalMembers = typeof totalMembers === 'number' ? totalMembers : 0;

  // Handle member registration success
  const handleRegistrationSuccess = useCallback((newMember) => {
    setShowRegistrationForm(false);
    showToast('Member registered successfully!', 'success');
    if (refetch) {
      refetch(); // Refresh the members list
    }
  }, [showToast, refetch]);

  // Handle member registration cancel
  const handleRegistrationCancel = useCallback(() => {
    setShowRegistrationForm(false);
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action, memberIds, actionData = {}) => {
    try {
      const result = await membersService.performBulkAction(action, memberIds, actionData);
      
      if (result?.success) {
        // Clear selection after successful action
        setSelectedMembers([]);
        // Refresh data
        if (refetch) {
          await refetch();
        }
        return result;
      } else {
        throw new Error(result?.error || 'Bulk action failed');
      }
    } catch (error) {
      showToast(error?.message || 'Bulk action failed', 'error');
      throw error;
    }
  }, [refetch, showToast]);

  // Handle member import
  const handleImportMembers = useCallback(async (membersData, options = {}) => {
    try {
      const result = await membersService.bulkImportMembers(membersData, options);
      
      if (result?.success) {
        if (refetch) {
          await refetch(); // Refresh data
        }
        showToast(
          `Successfully imported ${result.successful || 0} members. ${result.skipped || 0} duplicates skipped.`,
          'success'
        );
        return result;
      } else {
        throw new Error(result?.error || 'Import failed');
      }
    } catch (error) {
      showToast(error?.message || 'Import failed', 'error');
      throw error;
    }
  }, [refetch, showToast]);

  // Handle member selection
  const handleMemberSelection = useCallback((memberId, isSelected) => {
    setSelectedMembers(prev => 
      isSelected 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  }, []);

  // Handle select all members - Fixed potential issue
  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      setSelectedMembers(safeMembers.map(member => member?.id).filter(Boolean));
    } else {
      setSelectedMembers([]);
    }
  }, [safeMembers]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedMembers([]);
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query || '');
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Quick export all members
  const handleQuickExport = useCallback(async () => {
    try {
      const result = await membersService.exportMembers();
      if (result?.success) {
        showToast('Export started. File will download shortly.', 'success');
      } else {
        throw new Error(result?.error || 'Export failed');
      }
    } catch (error) {
      showToast(error?.message || 'Export failed', 'error');
    }
  }, [showToast]);

  // Error boundary fallback
  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorContent}>
            <Users size={48} className={styles.errorIcon} />
            <h2 className={styles.errorTitle}>Failed to Load Members</h2>
            <p className={styles.errorMessage}>{error}</p>
            <Button onClick={refetch} className={styles.retryButton}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Stats Summary - Fixed potential null reference errors */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{safeTotalMembers}</span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {safeMembers.filter(m => m?.is_active).length}
            </span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{selectedMembers.length}</span>
            <span className={styles.statLabel}>Selected</span>
          </div>
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
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? styles.activeFilter : ''}
          >
            <Filter size={16} />
            Filters
          </Button>
        </div>

        <div className={styles.viewControls}>
          <select
            value={membersPerPage}
            onChange={(e) => setMembersPerPage(Number(e.target.value))}
            className={styles.perPageSelect}
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
            onClear={() => setFilters({
              gender: '',
              ageRange: '',
              pledgeStatus: '',
              registrationDateRange: '',
              active: true
            })}
          />
        </div>
      )}

      {/* Bulk Actions */}
      <BulkActions
        selectedMembers={selectedMembers}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        onImportMembers={handleImportMembers}
        totalMembers={safeTotalMembers}
        allMembers={safeMembers}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {isLoading ? (
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
                {searchQuery || Object.values(filters).some(f => f && f !== true) 
                  ? 'No Members Found' 
                  : 'No Members Registered Yet'
                }
              </h3>
              <p className={styles.emptyDescription}>
                {searchQuery || Object.values(filters).some(f => f && f !== true) 
                  ? 'No members match your search criteria. Try adjusting your filters or search terms.'
                  : 'Get started by adding your first church member to the database.'
                }
              </p>
              {!searchQuery && !Object.values(filters).some(f => f && f !== true) && (
                <div className={styles.emptyActions}>
                  <Button 
                    onClick={() => setShowRegistrationForm(true)}
                    size="lg"
                    className={styles.primaryAction}
                  >
                    <Plus size={20} />
                    Add First Member
                  </Button>
                  <p className={styles.emptyHint}>
                    You can also bulk import members using a CSV file once you have some data.
                  </p>
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
            totalMembers={safeTotalMembers}
            membersPerPage={membersPerPage}
            onPageChange={handlePageChange}
            isLoading={isLoading}
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