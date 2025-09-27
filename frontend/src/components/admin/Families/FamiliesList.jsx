// frontend/src/components/admin/Families/FamiliesList.jsx - COMPLETE UI/UX FIX
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useDebounce } from '../../../hooks/useDebounce';
import ErrorBoundary from '../../shared/ErrorBoundary';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import SearchBar from '../../shared/SearchBar';
import Pagination from '../../shared/Pagination';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EmptyState from '../../shared/EmptyState';
import ConfirmDialog from '../../shared/ConfirmDialog';
import FamilyFilters from './FamilyFilters';
import BulkActions from './BulkActions';
import { PlusIcon, FilterIcon, UsersIcon, HomeIcon, PhoneIcon, MailIcon } from 'lucide-react';

// Enhanced styles as CSS-in-JS for immediate application
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  headerContent: {
    flex: 1
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  controls: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  searchSection: {
    marginBottom: '16px'
  },
  resultsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0'
  },
  familiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  familyCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    position: 'relative'
  },
  familyCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.12)',
    borderColor: '#3b82f6'
  },
  familyCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  familyInfo: {
    flex: 1
  },
  familyName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    textDecoration: 'none'
  },
  familyNameLink: {
    color: 'inherit',
    textDecoration: 'none'
  },
  primaryContact: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  familyStats: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  familyDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#64748b',
    fontWeight: '500'
  },
  detailValue: {
    color: '#1e293b',
    fontWeight: '600'
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#475569'
  },
  warningBadges: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  loadingOverlay: {
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
  }
};

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
      }, 5000);
      
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

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
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

  // FIXED: Proper navigation with error handling
  const handleAddFamily = useCallback(() => {
    try {
      console.log('Navigating to family creation...');
      navigate('/admin/families/new');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/admin/families/new';
    }
  }, [navigate]);

  if (loading && (!families || families.length === 0) && !initialFetchRef.current) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LoadingSpinner message="Loading families..." />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Enhanced Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <UsersIcon size={32} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
            Family Management
          </h1>
          <p style={styles.subtitle}>Manage family units and relationships</p>
        </div>
        <div style={styles.headerActions}>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <FilterIcon size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="primary"
            onClick={handleAddFamily}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <PlusIcon size={18} />
            Add New Family
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={styles.controls}>
        <div style={styles.searchSection}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search families by name, contact, address..."
            disabled={loading}
            style={{
              width: '100%',
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              transition: 'border-color 0.2s ease-in-out'
            }}
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
      <div style={styles.resultsBar}>
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
                style={styles.checkbox}
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
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* Families Grid */}
      {!families || families.length === 0 ? (
        !loading && (
          <EmptyState
            title="No families found"
            description={
              debouncedSearchTerm
                ? `No families match your search "${debouncedSearchTerm}"`
                : "Get started by adding your first family"
            }
            action={{
              label: "Add Family",
              onClick: handleAddFamily
            }}
          />
        )
      ) : (
        <>
          <div style={styles.familiesGrid}>
            {families.map((family) => (
              <div
                key={family.id}
                style={{
                  ...styles.familyCard,
                  ...(hoveredCard === family.id ? styles.familyCardHover : {}),
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={() => setHoveredCard(family.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {loading && (
                  <div style={styles.loadingOverlay}>
                    <LoadingSpinner size="sm" />
                  </div>
                )}

                <div style={styles.familyCardHeader}>
                  <div style={styles.familyInfo}>
                    <h3>
                      <Link 
                        to={`/admin/families/${family.id}`} 
                        style={styles.familyNameLink}
                      >
                        <span style={styles.familyName}>
                          <HomeIcon size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                          {family.family_name}
                        </span>
                      </Link>
                    </h3>
                    <p style={styles.primaryContact}>
                      Primary: {family.primary_contact_name || 'Not set'}
                    </p>
                  </div>
                  <div style={styles.familyStats}>
                    <Badge variant="secondary">
                      {family.member_count || 0} member{(family.member_count || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Contact Information */}
                {(family.primary_contact_email || family.primary_contact_phone) && (
                  <div style={styles.contactInfo}>
                    {family.primary_contact_email && (
                      <div style={styles.contactItem}>
                        <MailIcon size={14} />
                        <span>{family.primary_contact_email}</span>
                      </div>
                    )}
                    {family.primary_contact_phone && (
                      <div style={styles.contactItem}>
                        <PhoneIcon size={14} />
                        <span>{family.primary_contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Family Details */}
                <div style={styles.familyDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Adults:</span>
                    <span style={styles.detailValue}>{family.adults_count || 0}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Children:</span>
                    <span style={styles.detailValue}>{family.children_count || 0}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Created:</span>
                    <span style={styles.detailValue}>
                      {family.created_at ? new Date(family.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Warning Indicators */}
                <div style={styles.warningBadges}>
                  {!family.primary_contact_name && (
                    <Badge variant="warning" size="sm">No Primary Contact</Badge>
                  )}
                  {(family.member_count || 0) === 0 && (
                    <Badge variant="error" size="sm">No Members</Badge>
                  )}
                </div>

                {/* Card Actions */}
                <div style={styles.cardActions}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedFamilies.includes(family.id)}
                      onChange={() => handleSelectFamily(family.id)}
                      disabled={loading}
                      style={styles.checkbox}
                    />
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Select</span>
                  </label>

                  <div style={styles.actionButtons}>
                    <Button
                      variant="ghost"
                      size="sm"
                      as={Link}
                      to={`/admin/families/${family.id}`}
                      disabled={loading}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      as={Link}
                      to={`/admin/families/${family.id}/edit`}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFamily(family)}
                      disabled={loading}
                      style={{ color: '#dc2626' }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.count}
              itemsPerPage={pageSize}
              disabled={loading}
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
        disabled={loading}
      />
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