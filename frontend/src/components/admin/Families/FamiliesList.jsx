// frontend/src/components/admin/Families/FamiliesList.jsx - NAVIGATION & BUTTON FIXES
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useDebounce } from '../../../hooks/useDebounce';
import ErrorBoundary from '../../shared/ErrorBoundary';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import SearchBar from '../../shared/SearchBar';
import Pagination from '../../shared/Pagination';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EmptyState from '../../shared/EmptyState';
import ConfirmDialog from '../../shared/ConfirmDialog';
import FamilyFilters from './FamilyFilters';
import BulkActions from './BulkActions';
import { PlusIcon, FilterIcon, UsersIcon, HomeIcon, PhoneIcon, MailIcon, RefreshCwIcon } from 'lucide-react';
import styles from './Families.module.css';

const FamiliesListContent = () => {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const initialFetchRef = useRef(false);
  
  const { 
    families, 
    loading, 
    error, 
    pagination, 
    fetchFamilies, 
    deleteFamily,
    bulkDeleteFamilies,
    clearError
  } = useFamilies();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    has_children: '',
    member_count_min: '',
    member_count_max: '',
    missing_primary_contact: '',
    created_at__gte: '',
    created_at__lte: '',
    ordering: 'family_name'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [familyToDelete, setFamilyToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchParams = useMemo(() => {
    const params = {
      page: currentPage,
      page_size: pageSize,
      ordering: filters.ordering || 'family_name'
    };
    
    if (debouncedSearchTerm?.trim()) {
      params.search = debouncedSearchTerm.trim();
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'ordering') {
        params[key] = value;
      }
    });
    
    return params;
  }, [currentPage, pageSize, debouncedSearchTerm, filters]);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('FamiliesList: Fetching with params:', searchParams);
      await fetchFamilies(searchParams);
    } catch (error) {
      console.error('FamiliesList: Failed to fetch families:', error);
    }
  }, [fetchFamilies, searchParams]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchData();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (error && mountedRef.current) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          clearError();
        }
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSelectFamily = useCallback((familyId) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!families) return;
    setSelectedFamilies(prev => 
      prev.length === families.length ? [] : families.map(family => family.id)
    );
  }, [families]);

  const handleDeleteFamily = useCallback((family) => {
    setFamilyToDelete(family);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!familyToDelete || !mountedRef.current) return;

    try {
      await deleteFamily(familyToDelete.id);
      setSelectedFamilies(prev => prev.filter(id => id !== familyToDelete.id));
      await fetchData();
    } catch (error) {
      console.error('Error deleting family:', error);
    } finally {
      if (mountedRef.current) {
        setShowDeleteDialog(false);
        setFamilyToDelete(null);
      }
    }
  }, [familyToDelete, deleteFamily, fetchData]);

  const handleBulkAction = useCallback(async (action, familyIds) => {
    if (!mountedRef.current) return;
    
    try {
      if (action === 'delete') {
        await bulkDeleteFamilies(familyIds || selectedFamilies);
        setSelectedFamilies([]);
        await fetchData();
      } else if (action === 'export') {
        const selectedFamiliesData = families?.filter(f => 
          (familyIds || selectedFamilies).includes(f.id)
        ) || [];
        const dataStr = JSON.stringify(selectedFamiliesData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `families-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error in bulk action:', error);
    }
  }, [families, selectedFamilies, bulkDeleteFamilies, fetchData]);

  // FIXED: Proper button handlers that work with your Button component
  const handleAddFamily = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add Family button clicked - navigating to new family form');
    
    try {
      navigate('/admin/families/new');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation method
      window.location.href = '/admin/families/new';
    }
  }, [navigate]);

  const handleRefresh = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Refresh button clicked');
    
    if (isRefreshing || loading) return;
    
    setIsRefreshing(true);
    try {
      clearError();
      await fetchData();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loading, clearError, fetchData]);

  const handleFilterToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Filter toggle clicked');
    setShowFilters(!showFilters);
  }, [showFilters]);

  // FIXED: Card navigation handlers
  const handleViewFamily = useCallback((e, familyId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/families/${familyId}`);
  }, [navigate]);

  const handleEditFamily = useCallback((e, familyId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/families/${familyId}/edit`);
  }, [navigate]);

  if (loading && (!families || families.length === 0) && !initialFetchRef.current) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LoadingSpinner message="Loading families..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <UsersIcon size={32} />
            Family Management
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            Manage family units and relationships
          </p>
        </div>
        
        {/* FIXED: Proper button implementations */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: isRefreshing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isRefreshing || loading ? 'not-allowed' : 'pointer',
              opacity: isRefreshing || loading ? 0.6 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing && !loading) {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing && !loading) {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <RefreshCwIcon size={18} style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={handleFilterToggle}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'white',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#3b82f6';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#d1d5db';
                e.target.style.color = '#374151';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <FilterIcon size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={handleAddFamily}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }
            }}
          >
            <PlusIcon size={18} />
            Add New Family
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: showFilters ? '16px' : '0' }}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search families by name, contact, address..."
            disabled={loading}
          />
        </div>

        {showFilters && (
          <FamilyFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
            disabled={loading}
          />
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFamilies.length > 0 && (
        <BulkActions
          selectedCount={selectedFamilies.length}
          onAction={(action) => handleBulkAction(action, selectedFamilies)}
          onClear={() => setSelectedFamilies([])}
        />
      )}

      {/* Results Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>
            {pagination?.count || 0} families found
            {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
          </span>
          {families && families.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedFamilies.length === families.length}
                onChange={handleSelectAll}
                disabled={loading}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                Select all ({families.length})
              </span>
            </label>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Show:</label>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px'
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ color: '#dc2626', margin: '0 0 4px 0' }}>Error Loading Families</h4>
            <p style={{ color: '#991b1b', margin: 0 }}>
              {typeof error === 'string' ? error : 'An unexpected error occurred'}
            </p>
          </div>
          <button 
            onClick={fetchData}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Families Grid */}
      {!families || families.length === 0 ? (
        !loading && (
          <EmptyState
            title="No families found"
            message={
              debouncedSearchTerm
                ? `No families match your search "${debouncedSearchTerm}"`
                : "Get started by adding your first family"
            }
            actionText="Add Family"
            onAction={handleAddFamily}
          />
        )
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {families.map((family) => (
              <div
                key={family.id}
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${hoveredCard === family.id ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  transform: hoveredCard === family.id ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: hoveredCard === family.id ? '0 8px 25px 0 rgba(0, 0, 0, 0.12)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={() => setHoveredCard(family.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {loading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    zIndex: 10
                  }}>
                    <LoadingSpinner size="small" />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>
                      <Link 
                        to={`/admin/families/${family.id}`} 
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <HomeIcon size={18} />
                          {family.family_name}
                        </span>
                      </Link>
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Primary: {family.primary_contact_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Badge variant="secondary" size="small">
                      {family.member_count || 0} member{(family.member_count || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Contact Information */}
                {(family.primary_contact_email || family.primary_contact_phone) && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    {family.primary_contact_email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                        <MailIcon size={14} />
                        <span>{family.primary_contact_email}</span>
                      </div>
                    )}
                    {family.primary_contact_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                        <PhoneIcon size={14} />
                        <span>{family.primary_contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Family Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Adults:</span>
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{family.adults_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Children:</span>
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>{family.children_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Created:</span>
                    <span style={{ color: '#1e293b', fontWeight: '600' }}>
                      {family.created_at ? new Date(family.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Warning Indicators */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {!family.primary_contact_name && (
                    <Badge variant="warning" size="small">No Primary Contact</Badge>
                  )}
                  {(family.member_count || 0) === 0 && (
                    <Badge variant="danger" size="small">No Members</Badge>
                  )}
                </div>

                {/* FIXED: Card Actions with proper buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedFamilies.includes(family.id)}
                      onChange={() => handleSelectFamily(family.id)}
                      disabled={loading}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Select</span>
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => handleViewFamily(e, family.id)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = '#f3f4f6';
                          e.target.style.color = '#374151';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleEditFamily(e, family.id)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = '#f3f4f6';
                          e.target.style.color = '#374151';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteFamily(family);
                      }}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = '#fef2f2';
                          e.target.style.color = '#b91c1c';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#dc2626';
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && Math.ceil((pagination.count || 0) / pageSize) > 1 && (
            <Pagination
              currentPage={pagination.currentPage || currentPage}
              totalPages={Math.ceil((pagination.count || 0) / pageSize)}
              onPageChange={handlePageChange}
              totalItems={pagination.count || 0}
              itemsPerPage={pageSize}
              showItemsPerPage={true}
              onItemsPerPageChange={setPageSize}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => !loading && setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Family"
        message={
          familyToDelete
            ? `Are you sure you want to delete the family "${familyToDelete.family_name}"? This will remove all family relationships and cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const FamiliesList = () => {
  return (
    <ErrorBoundary fallbackMessage="There was an error loading the families list. Please refresh the page and try again.">
      <FamiliesListContent />
    </ErrorBoundary>
  );
};

export default FamiliesList;