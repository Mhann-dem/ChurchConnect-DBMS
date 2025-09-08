import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Users, RefreshCw, AlertCircle } from 'lucide-react';
import MemberCard from './MemberCard';
import MemberFilters from './MemberFilters';
import BulkActions from './BulkActions';
import styles from './Members.module.css';

// Simple UI components
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

// Mock hooks
const useAuth = () => ({
  isAuthenticated: true,
  isLoading: false,
  authChecked: true
});

const useMembers = ({ page, search, filters, autoFetch = true }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  const mockMembers = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      phone: '5551234567',
      status: 'active',
      registration_date: '2023-01-15',
      groups: [{ id: 1, name: 'Youth Ministry' }],
      pledge_amount: 100,
      pledge_frequency: 'monthly'
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      phone: '5559876543',
      status: 'active',
      registration_date: '2023-02-20',
      groups: [{ id: 2, name: 'Choir' }],
      pledge_amount: 75,
      pledge_frequency: 'monthly'
    }
  ];

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply search filter if provided
      let filteredMembers = mockMembers;
      if (search) {
        filteredMembers = mockMembers.filter(member =>
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          member.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setMembers(filteredMembers);
      setTotalMembers(filteredMembers.length);
      setTotalPages(Math.ceil(filteredMembers.length / 10));
    } catch (err) {
      setError('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  const deleteMember = useCallback(async (memberId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setMembers(prev => prev.filter(member => member.id !== memberId));
    setTotalMembers(prev => prev - 1);
  }, []);

  const updateMemberStatus = useCallback(async (memberId, status) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setMembers(prev => prev.map(member =>
      member.id === memberId ? { ...member, status } : member
    ));
  }, []);

  const refetch = useCallback(() => {
    return fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    totalPages,
    totalMembers,
    fetchMembers,
    deleteMember,
    updateMemberStatus,
    refetch
  };
};

const useToast = () => ({
  showToast: (message, type) => {
    console.log(`Toast: ${type} - ${message}`);
  }
});

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
    autoFetch: false
  });

  // Fetch members when auth is ready and parameters change
  useEffect(() => {
    if (!authChecked || authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    const currentFetchKey = JSON.stringify({ currentPage, searchQuery, filters });
    if (lastFetchRef.current !== currentFetchKey) {
      lastFetchRef.current = currentFetchKey;
      fetchMembers();
    }
  }, [authChecked, authLoading, isAuthenticated, currentPage, searchQuery, filters, navigate, fetchMembers]);

  const handleSearch = useCallback((query) => {
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
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
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
      showToast('Failed to delete member', 'error');
    }
  }, [deleteMember, showToast]);

  const handleStatusChange = useCallback(async (memberId, newStatus) => {
    try {
      await updateMemberStatus(memberId, newStatus);
      showToast(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to update member status', 'error');
    }
  }, [updateMemberStatus, showToast]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      showToast('Members list refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh members list', 'error');
    }
  }, [refetch, showToast]);

  const handleExport = useCallback(() => {
    showToast('Export functionality coming soon', 'info');
  }, [showToast]);

  const handleBulkAction = useCallback(async (action, memberIds, data = {}) => {
    // Simulate bulk action
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (action) {
      case 'delete':
        setSelectedMembers([]);
        return { message: `Deleted ${memberIds.length} members` };
      case 'export':
        return { message: `Exported ${memberIds.length} members` };
      case 'tag':
        return { message: `Tagged ${memberIds.length} members` };
      case 'email':
        return { message: `Sent email to ${memberIds.length} members` };
      case 'activate':
        return { message: `Activated ${memberIds.length} members` };
      case 'deactivate':
        return { message: `Deactivated ${memberIds.length} members` };
      default:
        throw new Error('Unknown action');
    }
  }, []);

  const handleImportMembers = useCallback(async (memberData, options = {}) => {
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const successful = memberData.length;
    const skipped = 0;
    
    // Add imported members to the list
    const newMembers = memberData.map((data, index) => ({
      id: Date.now() + index,
      first_name: data.firstName || 'Unknown',
      last_name: data.lastName || 'User',
      email: data.email || `user${index}@example.com`,
      phone: data.phone || '555-0000',
      status: 'active',
      registration_date: new Date().toISOString(),
      groups: [],
      pledge_amount: data.pledgeAmount || 0,
      pledge_frequency: data.pledgeFrequency || 'monthly'
    }));
    
    setMembers(prev => [...newMembers, ...prev]);
    setTotalMembers(prev => prev + successful);
    
    return { successful, skipped };
  }, []);

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
            totalMembers={totalMembers}
            filteredCount={members.length}
          />
        )}

        {selectedMembers.length > 0 && (
          <BulkActions
            selectedMembers={selectedMembers}
            onClearSelection={() => setSelectedMembers([])}
            onBulkAction={handleBulkAction}
            onImportMembers={handleImportMembers}
            totalMembers={totalMembers}
            allMembers={members}
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