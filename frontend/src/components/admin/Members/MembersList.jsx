// src/components/admin/Members/MembersList.jsx - Fixed version with proper loading states
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import MemberCard from './MemberCard';
import MemberFilters from './MemberFilters';
import BulkActions from './BulkActions';
import { SearchBar, Pagination, LoadingSpinner, EmptyState } from '../../shared';
import { Button } from '../../ui';
import { Plus, Filter, Download, Users, RefreshCw } from 'lucide-react';
import styles from './Members.module.css';

const MembersList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading, authChecked } = useContext(AuthContext);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    group: '',
    ageRange: '',
    pledgeStatus: '',
    registrationDate: '',
    status: 'active'
  });

  // Refs to prevent infinite loops
  const searchTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const {
    members,
    loading: membersLoading,
    error,
    totalPages,
    totalMembers,
    fetchMembers,
    deleteMember,
    updateMemberStatus,
    refetch
  } = useMembers({
    page: currentPage,
    search: searchQuery,
    filters,
    autoFetch: false // Disable auto-fetch, we'll control it manually
  });

  // Wait for auth to be checked before fetching members
  useEffect(() => {
    if (!authChecked || authLoading) {
      console.log('[MembersList] Waiting for auth check...', { authChecked, authLoading });
      return;
    }

    if (!isAuthenticated) {
      console.log('[MembersList] Not authenticated, redirecting...');
      navigate('/admin/login');
      return;
    }

    console.log('[MembersList] Auth verified, fetching members...');
    
    // Only fetch if this is a new request
    const currentFetchKey = JSON.stringify({ currentPage, searchQuery, filters });
    if (lastFetchRef.current !== currentFetchKey) {
      lastFetchRef.current = currentFetchKey;
      fetchMembers();
    }
  }, [authChecked, authLoading, isAuthenticated, currentPage, searchQuery, filters, navigate, fetchMembers]);

  const handleSearch = useCallback((query) => {
    console.log('[MembersList] Search query changed:', query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search to prevent excessive API calls
    searchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setSearchQuery(query);
        setCurrentPage(1);
      }
    }, 300); // 300ms debounce
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    console.log('[MembersList] Filters changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    console.log('[MembersList] Page changed:', page);
    setCurrentPage(page);
  }, []);

  const handleMemberSelect = useCallback((memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.id));
    }
  }, [selectedMembers.length, members]);

  const handleMemberDelete = useCallback(async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await deleteMember(memberId);
      showToast('Member deleted successfully', 'success');
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    } catch (error) {
      console.error('[MembersList] Delete error:', error);
      showToast('Failed to delete member', 'error');
    }
  }, [deleteMember, showToast]);

  const handleStatusChange = useCallback(async (memberId, newStatus) => {
    try {
      await updateMemberStatus(memberId, newStatus);
      showToast(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      console.error('[MembersList] Status change error:', error);
      showToast('Failed to update member status', 'error');
    }
  }, [updateMemberStatus, showToast]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      showToast('Members list refreshed', 'success');
    } catch (error) {
      console.error('[MembersList] Refresh error:', error);
      showToast('Failed to refresh members list', 'error');
    }
  }, [refetch, showToast]);

  const handleExport = useCallback(() => {
    // Export functionality will be implemented
    showToast('Export functionality coming soon', 'info');
  }, [showToast]);

  // Show loading while auth is being checked
  if (!authChecked || authLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Authentication required. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading for initial members fetch
  if (membersLoading && !members.length) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Loading members..." />
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Members</h3>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <Button onClick={handleRefresh} variant="primary">
              <RefreshCw size={16} />
              Retry
            </Button>
            <Button 
              onClick={() => navigate('/admin/dashboard')} 
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Users className={styles.titleIcon} />
            Members
          </h1>
          <p className={styles.subtitle}>
            {totalMembers} total members
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={membersLoading}
            className={styles.refreshButton}
          >
            <RefreshCw size={16} className={membersLoading ? styles.spinning : ''} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            <Filter size={16} />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className={styles.exportButton}
          >
            <Download size={16} />
            Export
          </Button>
          <Button
            onClick={() => navigate('/admin/members/new')}
            className={styles.addButton}
          >
            <Plus size={16} />
            Add Member
          </Button>
        </div>
      </div>

      <div className={styles.controls}>
        <SearchBar
          placeholder="Search members by name, email, or phone..."
          onSearch={handleSearch}
          className={styles.searchBar}
          debounce={300}
        />
        
        {showFilters && (
          <MemberFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}

        {selectedMembers.length > 0 && (
          <BulkActions
            selectedMembers={selectedMembers}
            onClearSelection={() => setSelectedMembers([])}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      <div className={styles.content}>
        {members.length === 0 ? (
          <EmptyState
            title="No members found"
            description={
              searchQuery || Object.values(filters).some(f => f) 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first member"
            }
            icon={Users}
            actions={
              !searchQuery && !Object.values(filters).some(f => f) ? (
                <Button onClick={() => navigate('/admin/members/new')}>
                  <Plus size={16} />
                  Add Your First Member
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className={styles.listHeader}>
              <div className={styles.bulkSelect}>
                <input
                  type="checkbox"
                  checked={selectedMembers.length === members.length}
                  onChange={handleSelectAll}
                  disabled={membersLoading}
                />
                <span>
                  {selectedMembers.length > 0 
                    ? `${selectedMembers.length} selected` 
                    : 'Select all'
                  }
                </span>
              </div>
              {membersLoading && (
                <div className={styles.loadingIndicator}>
                  <RefreshCw size={16} className={styles.spinning} />
                  Loading...
                </div>
              )}
            </div>

            <div className={styles.memberGrid}>
              {members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelected={selectedMembers.includes(member.id)}
                  onSelect={() => handleMemberSelect(member.id)}
                  onDelete={() => handleMemberDelete(member.id)}
                  onStatusChange={(status) => handleStatusChange(member.id, status)}
                  disabled={membersLoading}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className={styles.pagination}
                disabled={membersLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersList;