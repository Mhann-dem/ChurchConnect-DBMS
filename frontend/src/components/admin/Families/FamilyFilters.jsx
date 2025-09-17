// frontend/src/components/admin/Families/FamilyFilters.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import './Families.module.css';

const FamilyFilters = ({ filters, onFiltersChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      has_children: '',
      member_count_min: '',
      member_count_max: '',
      missing_primary_contact: '',
      created_at__gte: '',
      created_at__lte: '',
      ordering: 'family_name'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => value && value !== '').length;
  };

  return (
    <Card className="family-filters">
      <div className="filters-header">
        <h3>Filter Families</h3>
        <div className="filters-actions">
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="filters-content">
        <div className="filters-grid">
          {/* Family Size Filters */}
          <div className="filter-group">
            <h4>Family Size</h4>
            <div className="filter-row">
              <div className="form-group">
                <label htmlFor="member_count_min">Min Members</label>
                <input
                  type="number"
                  id="member_count_min"
                  name="member_count_min"
                  value={localFilters.member_count_min}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="member_count_max">Max Members</label>
                <input
                  type="number"
                  id="member_count_max"
                  name="member_count_max"
                  value={localFilters.member_count_max}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Any"
                />
              </div>
            </div>
          </div>

          {/* Family Composition */}
          <div className="filter-group">
            <h4>Family Composition</h4>
            <div className="form-group">
              <label htmlFor="has_children">Has Children</label>
              <select
                id="has_children"
                name="has_children"
                value={localFilters.has_children}
                onChange={handleInputChange}
              >
                <option value="">Any</option>
                <option value="true">With Children</option>
                <option value="false">Without Children</option>
              </select>
            </div>
          </div>

          {/* Contact Status */}
          <div className="filter-group">
            <h4>Contact Status</h4>
            <div className="form-group">
              <label htmlFor="missing_primary_contact">Primary Contact</label>
              <select
                id="missing_primary_contact"
                name="missing_primary_contact"
                value={localFilters.missing_primary_contact}
                onChange={handleInputChange}
              >
                <option value="">Any</option>
                <option value="true">Missing Primary Contact</option>
                <option value="false">Has Primary Contact</option>
              </select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="filter-group">
            <h4>Registration Date</h4>
            <div className="filter-row">
              <div className="form-group">
                <label htmlFor="created_at__gte">From</label>
                <input
                  type="date"
                  id="created_at__gte"
                  name="created_at__gte"
                  value={localFilters.created_at__gte}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="created_at__lte">To</label>
                <input
                  type="date"
                  id="created_at__lte"
                  name="created_at__lte"
                  value={localFilters.created_at__lte}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div className="filter-group">
            <h4>Sort By</h4>
            <div className="form-group">
              <label htmlFor="ordering">Order</label>
              <select
                id="ordering"
                name="ordering"
                value={localFilters.ordering}
                onChange={handleInputChange}
              >
                <option value="family_name">Family Name (A-Z)</option>
                <option value="-family_name">Family Name (Z-A)</option>
                <option value="created_at">Oldest First</option>
                <option value="-created_at">Newest First</option>
                <option value="updated_at">Least Recently Updated</option>
                <option value="-updated_at">Most Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="filters-footer">
          <div className="active-filters-count">
            {getActiveFilterCount() > 0 && (
              <span>{getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="filter-actions">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset All
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FamilyFilters;