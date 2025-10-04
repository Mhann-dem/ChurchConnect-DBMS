import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Users, RefreshCw, AlertCircle } from 'lucide-react';
import MemberCard from './MemberCard';
import MemberFilters from './MemberFilters';
import BulkActions from './BulkActions';
import styles from './Members.module.css';

// Import the REAL hooks instead of mock ones
import { useMembers } from '../../../hooks/useMembers'; // Fix this import path
import useAuth from '../../../hooks/useAuth'; // Fix this import path
import { useToast } from '../../../hooks/useToast'; // Fix this import path

// Simple UI components (keep these as they are)
const Button = ({ children, variant = 'default', onClick, disabled = false, className = '', ...props }) => {
  const variantClasses = {
    default: styles.buttonDefault,
    outline: styles.buttonOutline,
    primary: styles.buttonPrimary
  };
  
  return (
    <button 
      className={`${styles.button} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const SearchBar = ({ placeholder = 'Search...', onSearch, className = '', debounce = 300 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const timeoutRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      }
    }, debounce);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${styles.searchBar} ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        className={styles.searchInput}
      />
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false, className = '' }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`${styles.pagination} ${className}`}>
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
      >
        Previous
      </Button>
      
      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'outline'}
          onClick={() => onPageChange(page)}
          disabled={disabled}
          className={page === currentPage ? styles.activePage : ''}
        >
          {page}
        </Button>
      ))}
      
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => (
  <div className={styles.loadingContainer}>
    <div className={`${styles.spinner} ${styles[`spinner-${size}`]}`} />
    <p>{message}</p>
  </div>
);

const EmptyState = ({ title, description, icon: Icon = Users, actions = null }) => (
  <div className={styles.emptyState}>
    {Icon && <Icon size={48} className={styles.emptyIcon} />}
    <h3>{title}</h3>
    <p>{description}</p>
    {actions}
  </div>
);

const MembersList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading, authChecked } = useAuth();
  
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Use the REAL useMembers hook
  const {
      members,
      isLoading: membersLoading,
      error,
      pagination,
      totalMembers,
      activeMembers,
      inactiveMembers,
      fetchMembers,
      refresh
    } = useMembers({
      autoFetch: true
    });

    // Calculate totalPages from pagination
    const totalPages = pagination?.total_pages || 1;

    // Fetch with filters whenever they change
    useEffect(() => {
      if (currentPage || searchQuery || filters) {
        fetchMembers({
          page: currentPage,
          page_size: 25,
          search: searchQuery,
          is_active: filters.status === 'active' ? 'true' : filters.status === 'inactive' ? 'false' : undefined,
          gender: filters.gender || undefined
        });
      }
    }, [currentPage, searchQuery, filters, fetchMembers]);

  // Debug logging
  useEffect(() => {
    console.log('[MembersList] Debug info:', {
      isAuthenticated,
      authChecked,
      authLoading,
      membersLoading,
      membersCount: members?.length,
      error,
      currentPage,
      searchQuery,
      filters
    });
  }, [isAuthenticated, authChecked, authLoading, membersLoading, members, error, currentPage, searchQuery, filters]);

  const handleSearch = useCallback((query) => {
    console.log('[MembersList] Search query:', query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setSearchQuery(query);
        setCurrentPage(1);
      }
    }, 300);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    console.log('[MembersList] Filter change:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    console.log('[MembersList] Page change:', page);
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
      const result = await deleteMember(memberId);
      if (result.success) {
        showToast('Member deleted successfully', 'success');
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('[MembersList] Delete error:', error);
      showToast(error.message || 'Failed to delete member', 'error');
    }
  }, [deleteMember, showToast]);

  const handleStatusChange = useCallback(async (memberId, newStatus) => {
    try {
      const result = await updateMember(memberId, { status: newStatus });
      if (result.success) {
        showToast(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('[MembersList] Status change error:', error);
      showToast(error.message || 'Failed to update member status', 'error');
    }
  }, [updateMember, showToast]);

  const handleRefresh = useCallback(async () => {
    try {
      clearError(); // Clear any existing errors
      const result = await refresh();
      if (result?.success) {
        showToast('Members list refreshed', 'success');
      }
    } catch (error) {
      console.error('[MembersList] Refresh error:', error);
      showToast('Failed to refresh members list', 'error');
    }
  }, [refresh, showToast, clearError]);

  const handleExport = useCallback(() => {
    showToast('Export functionality coming soon', 'info');
  }, [showToast]);

  const handleBulkAction = useCallback(async (action, memberIds, data = {}) => {
    try {
      let result;
      
      switch (action) {
        case 'delete':
          result = await bulkDeleteMembers(memberIds);
          setSelectedMembers([]);
          break;
        case 'export':
          showToast('Export functionality coming soon', 'info');
          return { message: `Export initiated for ${memberIds.length} members` };
        case 'activate':
          result = await bulkUpdateMembers(memberIds, { status: 'active' });
          break;
        case 'deactivate':
          result = await bulkUpdateMembers(memberIds, { status: 'inactive' });
          break;
        default:
          throw new Error('Unknown action');
      }
      
      if (result?.success) {
        showToast(result.message || `Action completed for ${memberIds.length} members`, 'success');
        return result;
      } else {
        throw new Error(result?.error || 'Bulk action failed');
      }
    } catch (error) {
      console.error('[MembersList] Bulk action error:', error);
      showToast(error.message || 'Bulk action failed', 'error');
      throw error;
    }
  }, [bulkDeleteMembers, bulkUpdateMembers, showToast]);

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
    console.log('[MembersList] Not authenticated, redirecting to login');
    navigate('/admin/login');
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Authentication required. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading for initial members fetch
  if (membersLoading && (!members || members.length === 0)) {
    return (
      <div className={styles.container}>
        <LoadingSpinner message="Loading members..." />
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    console.error('[MembersList] Error state:', error);
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle size={48} />
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

  console.log('[MembersList] Rendering with members:', members?.length || 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Users className={styles.titleIcon} />
            Members
          </h1>
          <p className={styles.subtitle}>
            {totalMembers || 0} total members
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
            onClick={() => navigate('/register')}
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
            totalMembers={totalMembers || 0}
            filteredCount={members?.length || 0}
          />
        )}

        {selectedMembers.length > 0 && (
          <BulkActions
            selectedMembers={selectedMembers}
            onClearSelection={() => setSelectedMembers([])}
            onBulkAction={handleBulkAction}
            totalMembers={totalMembers || 0}
            allMembers={members || []}
          />
        )}
      </div>

      <div className={styles.content}>
        {!members || members.length === 0 ? (
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
                <Button onClick={() => navigate('/register')}>
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
                  checked={selectedMembers.length === members.length && members.length > 0}
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