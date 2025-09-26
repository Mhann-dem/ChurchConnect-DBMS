// frontend/src/components/admin/Families/FamiliesList.jsx - Enhanced with error boundaries and performance tracking
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePerformanceMonitoring } from '../../../hooks/usePerformanceMonitoring';
import { validateSearchParams } from '../../../utils/validation';
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

import './Families.module.css';

// Loading states enum
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SEARCHING: 'searching',
  FILTERING: 'filtering',
  DELETING: 'deleting'
};

const FamiliesListContent = () => {
  const navigate = useNavigate();
  const { trackApiCall, trackInteraction } = usePerformanceMonitoring();
  
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
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [searchErrors, setSearchErrors] = useState({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoize search parameters for performance
  const searchParams = useMemo(() => {
    const params = {
      page: currentPage,
      page_size: pageSize,
      search: debouncedSearchTerm,
      ...filters
    };
    
    // Validate and sanitize parameters
    const validation = validateSearchParams(params);
    if (validation.isValid) {
      setSearchErrors({});
      return validation.sanitizedParams;
    } else {
      setSearchErrors(validation.errors);
      return {}; // Return empty params if validation fails
    }
  }, [currentPage, pageSize, debouncedSearchTerm, filters]);

  const fetchData = useCallback(async () => {
    if (Object.keys(searchErrors).length > 0) {
      return; // Don't fetch if there are validation errors
    }

    try {
      setLoadingState(LOADING_STATES.LOADING);
      await trackApiCall(
        () => fetchFamilies(searchParams),
        'fetch_families',
        { 
          searchTerm: debouncedSearchTerm,
          filterCount: Object.keys(filters).filter(key => filters[key]).length,
          pageSize 
        }
      );
    } catch (error) {
      console.error('Failed to fetch families:', error);
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  }, [searchParams, searchErrors, fetchFamilies, trackApiCall, debouncedSearchTerm, filters, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear error when component mounts or search params change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [searchParams, clearError]);

  const handleSearch = trackInteraction('search_families', (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setLoadingState(LOADING_STATES.SEARCHING);
  });

  const handleFilterChange = trackInteraction('filter_families', (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setLoadingState(LOADING_STATES.FILTERING);
  });

  const handlePageChange = trackInteraction('paginate_families', (page) => {
    setCurrentPage(page);
  });

  const handlePageSizeChange = trackInteraction('change_page_size', (size) => {
    setPageSize(size);
    setCurrentPage(1);
  });

  const handleSelectFamily = useCallback((familyId) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFamilies(prev => 
      prev.length === families.length ? [] : families.map(family => family.id)
    );
  }, [families]);

  const handleDeleteFamily = useCallback((family) => {
    setFamilyToDelete(family);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = trackInteraction('delete_family', async () => {
    if (!familyToDelete) return;

    try {
      setLoadingState(LOADING_STATES.DELETING);
      await trackApiCall(
        () => deleteFamily(familyToDelete.id),
        'delete_family',
        { familyId: familyToDelete.id, familyName: familyToDelete.family_name }
      );
      
      // Remove from selected families if it was selected
      setSelectedFamilies(prev => prev.filter(id => id !== familyToDelete.id));
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error deleting family:', error);
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
      setShowDeleteDialog(false);
      setFamilyToDelete(null);
    }
  });

  const handleBulkAction = trackInteraction('bulk_family_action', async (action, familyIds) => {
    try {
      setLoadingState(LOADING_STATES.DELETING);
      
      if (action === 'delete') {
        await trackApiCall(
          () => bulkDeleteFamilies(familyIds),
          'bulk_delete_families',
          { familyCount: familyIds.length }
        );
        
        setSelectedFamilies([]);
        await fetchData();
      } else if (action === 'export') {
        // Implement bulk export
        const selectedFamiliesData = families.filter(f => familyIds.includes(f.id));
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
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  });

  const handleAddFamily = trackInteraction('navigate_add_family', () => {
    navigate('/admin/families/new');
  });

  const getRelationshipDisplay = useCallback((relationship) => {
    const displayMap = {
      'head': 'Head of Household',
      'spouse': 'Spouse',
      'child': 'Child',
      'dependent': 'Dependent',
      'other': 'Other'
    };
    return displayMap[relationship] || relationship;
  }, []);

  // Loading state management
  const isLoading = loading || loadingState !== LOADING_STATES.IDLE;
  const loadingMessage = useMemo(() => {
    switch (loadingState) {
      case LOADING_STATES.SEARCHING:
        return 'Searching families...';
      case LOADING_STATES.FILTERING:
        return 'Applying filters...';
      case LOADING_STATES.DELETING:
        return 'Deleting families...';
      case LOADING_STATES.LOADING:
      default:
        return 'Loading families...';
    }
  }, [loadingState]);

  // Show loading spinner for initial load
  if (isLoading && families.length === 0) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  return (
    <div className="families-list">
      {/* Error Display */}
      {Object.keys(searchErrors).length > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Search Parameter Errors:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
            {Object.entries(searchErrors).map(([field, error]) => (
              <li key={field}>{field}: {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header */}
      <div className="families-header">
        <div className="header-content">
          <h1>Families</h1>
          <p>Manage family units and relationships</p>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading}
          >
            Filter {showFilters ? '(Open)' : ''}
          </Button>
          <Button
            variant="primary"
            onClick={handleAddFamily}
            disabled={isLoading}
          >
            Add Family
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="families-controls">
        <div className="search-section">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search families by name, contact, address..."
            className="family-search"
            disabled={isLoading}
          />
          {loadingState === LOADING_STATES.SEARCHING && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <LoadingSpinner size="sm" />
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Searching...</span>
            </div>
          )}
        </div>

        {showFilters && (
          <FamilyFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFamilies.length > 0 && (
        <BulkActions
          selectedCount={selectedFamilies.length}
          onAction={(action) => handleBulkAction(action, selectedFamilies)}
          onClear={() => setSelectedFamilies([])}
          disabled={isLoading}
        />
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <span>
          {pagination.count || 0} families found
          {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
          {isLoading && (
            <span style={{ marginLeft: '8px', color: '#6B7280' }}>
              ({loadingMessage})
            </span>
          )}
        </span>
        <div className="page-size-selector">
          <label>Show: </label>
          <select 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={isLoading}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error State */}
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
            <p style={{ color: '#991b1b', margin: 0 }}>{typeof error === 'string' ? error : 'An unexpected error occurred'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* Families Grid */}
      {families.length === 0 && !isLoading ? (
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
      ) : (
        <>
          <div className="families-grid" style={{ opacity: isLoading ? 0.6 : 1 }}>
            <div className="grid-header">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={families.length > 0 && selectedFamilies.length === families.length}
                  onChange={handleSelectAll}
                  disabled={isLoading || families.length === 0}
                />
                Select All ({families.length})
              </label>
            </div>

            {families.map((family) => (
              <Card key={family.id} className="family-card">
                <div className="family-card-header">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedFamilies.includes(family.id)}
                      onChange={() => handleSelectFamily(family.id)}
                      disabled={isLoading}
                    />
                  </label>
                  <div className="family-info">
                    <h3>
                      <Link 
                        to={`/admin/families/${family.id}`} 
                        className="family-name"
                        onClick={trackInteraction('view_family_details', () => {})}
                      >
                        {family.family_name}
                      </Link>
                    </h3>
                    <p className="primary-contact">
                      Primary Contact: {family.primary_contact_name || 'Not set'}
                    </p>
                  </div>
                  <div className="family-stats">
                    <Badge variant="secondary">
                      {family.member_count || 0} member{(family.member_count || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="family-card-content">
                  <div className="family-details">
                    <div className="detail-row">
                      <span className="label">Adults:</span>
                      <span className="value">{family.adults_count || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Children:</span>
                      <span className="value">{family.children_count || 0}</span>
                    </div>
                    {family.primary_contact_email && (
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value">{family.primary_contact_email}</span>
                      </div>
                    )}
                    {family.primary_contact_phone && (
                      <div className="detail-row">
                        <span className="label">Phone:</span>
                        <span className="value">{family.primary_contact_phone}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Created:</span>
                      <span className="value">
                        {family.created_at ? new Date(family.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Warning indicators */}
                  <div className="family-warnings">
                    {!family.primary_contact_name && (
                      <Badge variant="warning" size="sm">
                        No Primary Contact
                      </Badge>
                    )}
                    {(family.member_count || 0) === 0 && (
                      <Badge variant="error" size="sm">
                        No Members
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="family-card-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    as={Link}
                    to={`/admin/families/${family.id}`}
                    disabled={isLoading}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    as={Link}
                    to={`/admin/families/${family.id}/edit`}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFamily(family)}
                    className="delete-btn"
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Loading overlay for actions */}
          {isLoading && families.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}>
              <LoadingSpinner message={loadingMessage} />
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.count}
              itemsPerPage={pageSize}
              disabled={isLoading}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => !isLoading && setShowDeleteDialog(false)}
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
        disabled={isLoading}
      />
    </div>
  );
};

// Main component wrapped with error boundary
const FamiliesList = () => {
  return (
    <ErrorBoundary fallbackMessage="There was an error loading the families list. Please refresh the page and try again.">
      <FamiliesListContent />
    </ErrorBoundary>
  );
};

export default FamiliesList;