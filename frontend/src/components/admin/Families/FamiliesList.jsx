// frontend/src/components/admin/Families/FamiliesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useDebounce } from '../../../hooks/useDebounce';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import SearchBar from '../../shared/SearchBar';
import Pagination from '../../shared/Pagination';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EmptyState from '../../shared/EmptyState';
import ConfirmDialog from '../../shared/ConfirmDialog';
import FamilyFilters from './FamilyFilters';

import './Families.module.css';

const FamiliesList = () => {
  const navigate = useNavigate();
  const { 
    families, 
    loading, 
    error, 
    pagination, 
    fetchFamilies, 
    deleteFamily 
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

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = useCallback(() => {
    const params = {
      page: currentPage,
      page_size: pageSize,
      search: debouncedSearchTerm,
      ...filters
    };
    
    // Clean up empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key];
      }
    });

    fetchFamilies(params);
  }, [currentPage, pageSize, debouncedSearchTerm, filters, fetchFamilies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSelectFamily = (familyId) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFamilies.length === families.length) {
      setSelectedFamilies([]);
    } else {
      setSelectedFamilies(families.map(family => family.id));
    }
  };

  const handleDeleteFamily = (family) => {
    setFamilyToDelete(family);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (familyToDelete) {
      try {
        await deleteFamily(familyToDelete.id);
        fetchData();
        setSelectedFamilies(prev => prev.filter(id => id !== familyToDelete.id));
      } catch (error) {
        console.error('Error deleting family:', error);
      }
    }
    setShowDeleteDialog(false);
    setFamilyToDelete(null);
  };

  const handleBulkAction = async (action, familyIds) => {
    // Handle bulk actions here
    if (action === 'delete') {
      // Implement bulk delete
    } else if (action === 'export') {
      // Implement bulk export
    }
    setSelectedFamilies([]);
    fetchData();
  };

  const getRelationshipDisplay = (relationship) => {
    const displayMap = {
      'head': 'Head of Household',
      'spouse': 'Spouse',
      'child': 'Child',
      'dependent': 'Dependent',
      'other': 'Other'
    };
    return displayMap[relationship] || relationship;
  };

  if (loading && families.length === 0) {
    return <LoadingSpinner message="Loading families..." />;
  }

  return (
    <div className="families-list">
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
          >
            Filter
          </Button>
          <Button
            as={Link}
            to="/admin/families/new"
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
          />
        </div>

        {showFilters && (
          <FamilyFilters
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
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
      <div className="results-summary">
        <span>
          {pagination.count} families found
          {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
        </span>
        <div className="page-size-selector">
          <label>Show: </label>
          <select 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Families Grid */}
      {families.length === 0 ? (
        <EmptyState
          title="No families found"
          description={
            debouncedSearchTerm
              ? `No families match your search "${debouncedSearchTerm}"`
              : "Get started by adding your first family"
          }
          action={{
            label: "Add Family",
            onClick: () => navigate('/admin/families/new')
          }}
        />
      ) : (
        <>
          <div className="families-grid">
            <div className="grid-header">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={selectedFamilies.length === families.length}
                  onChange={handleSelectAll}
                />
                Select All
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
                    />
                  </label>
                  <div className="family-info">
                    <h3>
                      <Link to={`/admin/families/${family.id}`} className="family-name">
                        {family.family_name}
                      </Link>
                    </h3>
                    <p className="primary-contact">
                      Primary Contact: {family.primary_contact_name || 'Not set'}
                    </p>
                  </div>
                  <div className="family-stats">
                    <Badge variant="secondary">
                      {family.member_count} member{family.member_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="family-card-content">
                  <div className="family-details">
                    <div className="detail-row">
                      <span className="label">Adults:</span>
                      <span className="value">{family.adults_count}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Children:</span>
                      <span className="value">{family.children_count}</span>
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
                        {new Date(family.created_at).toLocaleDateString()}
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
                    {family.member_count === 0 && (
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
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    as={Link}
                    to={`/admin/families/${family.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFamily(family)}
                    className="delete-btn"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.count}
            itemsPerPage={pageSize}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
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

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default FamiliesList;