import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Users, UserPlus, Download, RefreshCw, X, AlertCircle } from 'lucide-react';
import MemberRegistrationForm from '../../components/form/MemberRegistrationForm';
import BulkActions from '../../components/admin/Members/BulkActions';
import MembersList from '../../components/admin/Members/MembersList';
import MemberFilters from '../../components/admin/Members/MemberFilters';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import { useDebounce } from '../../hooks/useDebounce';

// Simple UI Components
const Card = ({ children, className = '', style = {} }) => (
  <div 
    style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      ...style
    }}
    className={className}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'default', size = 'md', onClick, disabled = false, className = '', icon, ...props }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: '500',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1
  };

  const variants = {
    default: {
      background: '#3b82f6',
      color: 'white',
      padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 20px',
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
    },
    outline: {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 20px',
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
    },
    ghost: {
      background: 'transparent',
      color: '#6b7280',
      padding: size === 'sm' ? '4px 8px' : size === 'lg' ? '10px 20px' : '6px 12px',
      fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px'
    },
    primary: {
      background: '#3b82f6',
      color: 'white',
      padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 20px',
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
    }
  };

  return (
    <button
      style={{ ...baseStyle, ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

const LoadingSpinner = ({ size = 'md' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
    <div style={{
      width: size === 'sm' ? '20px' : size === 'lg' ? '40px' : '30px',
      height: size === 'sm' ? '20px' : size === 'lg' ? '40px' : '30px',
      border: '2px solid #e5e7eb',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // UI State
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination and filter state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [membersPerPage, setMembersPerPage] = useState(parseInt(searchParams.get('limit')) || 25);
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    ageRange: searchParams.get('ageRange') || '',
    status: searchParams.get('status') || 'all',
    joinedAfter: searchParams.get('joinedAfter') || '',
    joinedBefore: searchParams.get('joinedBefore') || ''
  });

  // Debounced search
  const debouncedSearchQuery = useDebounce(currentSearchQuery, 500);

  // AFTER - Add ALL filter properties as dependencies
  const hookOptions = useMemo(() => ({
    search: debouncedSearchQuery,
    filters: {
      status: filters.status,
      gender: filters.gender,
      ageRange: filters.ageRange,
      joinedAfter: filters.joinedAfter,
      joinedBefore: filters.joinedBefore
    },
    page: currentPage,
    limit: membersPerPage,
    autoFetch: true
  }), [
    debouncedSearchQuery, 
    filters.status,
    filters.gender,
    filters.ageRange,
    filters.joinedAfter,
    filters.joinedBefore,
    currentPage, 
    membersPerPage
  ]);

  // Call useMembers hook with memoized options
  const {
    members = [],
    totalMembers = 0,
    activeMembers = 0,
    inactiveMembers = 0,
    isLoading = false,
    error = null,
    refresh,
    totalPages = 1
  } = useMembers(hookOptions) || {};

  // Type-safe values
  const safeMembers = Array.isArray(members) ? members : [];
  const safeTotalMembers = Number(totalMembers) || 0;
  const safeActiveMembers = Number(activeMembers) || 0;
  const safeInactiveMembers = Number(inactiveMembers) || 0;
  const safeTotalPages = Number(totalPages) || 1;

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (membersPerPage !== 25) params.set('limit', membersPerPage.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params, { replace: true });
  }, [debouncedSearchQuery, currentPage, membersPerPage, filters, setSearchParams]);

  // Handlers
  const handleSearch = useCallback((query) => {
    setCurrentSearchQuery(query || '');
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      gender: '',
      ageRange: '',
      status: 'all',
      joinedAfter: '',
      joinedBefore: ''
    });
    setCurrentSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      showToast('Refreshing member list...', 'info');
      if (refresh) {
        await refresh();
        showToast('Member list refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('[MembersPage] Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    }
  }, [refresh, showToast]);

  const handleRegistrationSuccess = useCallback(async (newMember) => {
    setShowRegistrationForm(false);
    showToast('Member registered successfully!', 'success');
    if (refresh) {
      setTimeout(() => refresh(), 1000);
    }
  }, [refresh, showToast]);

  const handleBulkAction = useCallback(async (action, memberIds, actionData = {}) => {
    try {
      showToast(`Bulk ${action} completed successfully`, 'success');
      setSelectedMembers(new Set());
      if (refresh) refresh();
    } catch (error) {
      console.error('[MembersPage] Bulk action error:', error);
      showToast(`Bulk ${action} failed`, 'error');
    }
  }, [refresh, showToast]);

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
      const memberIds = safeMembers.map(member => member?.id).filter(Boolean);
      setSelectedMembers(new Set(memberIds));
    } else {
      setSelectedMembers(new Set());
    }
  }, [safeMembers]);

  // Loading state
  if (isLoading && safeMembers.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && safeMembers.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <Card style={{ padding: '48px', textAlign: 'center', maxWidth: '500px' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginBottom: '16px' }}>
              Error Loading Members
            </h2>
            <p style={{ color: '#dc2626', marginBottom: '32px' }}>
              {error}
            </p>
            <Button onClick={handleRefresh} variant="primary">
              <RefreshCw size={16} />
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                Members
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Manage church members and their information
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                icon={<RefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />}
              >
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsExporting(true)}
                disabled={isLoading || isExporting}
                icon={<Download size={16} />}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              
              <Button
                variant="primary"
                onClick={() => setShowRegistrationForm(true)}
                disabled={isLoading}
                icon={<Plus size={16} />}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            padding: '16px 0',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {safeTotalMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Members</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                {safeActiveMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {safeInactiveMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Inactive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                {selectedMembers.size}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Selected</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '300px' }}>
            <div style={{
              position: 'relative',
              flex: '1',
              maxWidth: '400px'
            }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Search members by name, email, phone..."
                value={currentSearchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                disabled={isLoading}
              />
              {currentSearchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              disabled={isLoading}
              icon={<Filter size={16} />}
            >
              Filters {hasActiveFilters ? '(Active)' : ''}
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={membersPerPage}
              onChange={(e) => setMembersPerPage(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
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
          <MemberFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalMembers={safeTotalMembers}
            filteredCount={safeMembers.length}
          />
        )}

        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <BulkActions
            selectedMembers={Array.from(selectedMembers)}
            onClearSelection={() => setSelectedMembers(new Set())}
            onBulkAction={handleBulkAction}
            totalMembers={safeTotalMembers}
            allMembers={safeMembers}
            disabled={isLoading}
          />
        )}

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {safeMembers.length === 0 && !isLoading ? (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              <UserPlus size={64} style={{ color: '#d1d5db', margin: '0 auto 24px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                {debouncedSearchQuery || hasActiveFilters 
                  ? 'No Members Found' 
                  : 'No Members Registered Yet'
                }
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                {debouncedSearchQuery || hasActiveFilters
                  ? 'No members match your current search criteria. Try adjusting your filters.'
                  : 'Get started by adding your first church member to the database.'
                }
              </p>
              
              {debouncedSearchQuery || hasActiveFilters ? (
                <Button onClick={handleClearFilters} variant="outline">
                  <X size={16} />
                  Clear Search & Filters
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowRegistrationForm(true)}
                  size="lg"
                  variant="primary"
                >
                  <Plus size={20} />
                  Add First Member
                </Button>
              )}
            </Card>
          ) : (
            <>
              <MembersList
                members={safeMembers}
                selectedMembers={selectedMembers}
                onMemberSelection={handleMemberSelection}
                onSelectAll={handleSelectAll}
                currentPage={currentPage}
                totalPages={safeTotalPages}
                totalMembers={safeTotalMembers}
                membersPerPage={membersPerPage}
                onPageChange={handlePageChange}
                isLoading={isLoading}
                searchQuery={debouncedSearchQuery}
                onNavigateToMember={(id) => navigate(`/admin/members/${id}`)}
              />

              {/* Pagination */}
              {safeTotalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '24px'
                }}>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Page {currentPage} of {safeTotalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= safeTotalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Registration Form Modal */}
        {showRegistrationForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Register New Member
                </h2>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                <MemberRegistrationForm
                  isAdminMode={true}
                  onSuccess={handleRegistrationSuccess}
                  onCancel={() => setShowRegistrationForm(false)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;