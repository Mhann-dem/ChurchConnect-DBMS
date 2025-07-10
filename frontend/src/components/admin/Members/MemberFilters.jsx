import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Users, Tag, MapPin, Phone, Mail } from 'lucide-react';
import './Members.module.css';

const MemberFilters = ({ 
  onFilterChange, 
  onClearFilters, 
  activeFilters = {}, 
  groups = [],
  tags = [],
  totalMembers = 0,
  filteredCount = 0
}) => {
  const [searchTerm, setSearchTerm] = useState(activeFilters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    ageRange: '',
    gender: '',
    groups: [],
    tags: [],
    pledgeStatus: '',
    joinedAfter: '',
    joinedBefore: '',
    contactMethod: '',
    hasPhone: false,
    hasEmail: false,
    isActive: true,
    location: '',
    ...activeFilters
  });

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange('search', searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMultiSelectChange = (key, value) => {
    const currentValues = filters[key] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFilterChange(key, newValues);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      ageRange: '',
      gender: '',
      groups: [],
      tags: [],
      pledgeStatus: '',
      joinedAfter: '',
      joinedBefore: '',
      contactMethod: '',
      hasPhone: false,
      hasEmail: false,
      isActive: true,
      location: ''
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.ageRange) count++;
    if (filters.gender) count++;
    if (filters.groups.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.pledgeStatus) count++;
    if (filters.joinedAfter) count++;
    if (filters.joinedBefore) count++;
    if (filters.contactMethod) count++;
    if (filters.hasPhone) count++;
    if (filters.hasEmail) count++;
    if (filters.location) count++;
    return count;
  };

  const ageRanges = [
    { value: '0-17', label: 'Under 18' },
    { value: '18-25', label: '18-25' },
    { value: '26-40', label: '26-40' },
    { value: '41-60', label: '41-60' },
    { value: '61+', label: '61+' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const pledgeStatuses = [
    { value: 'active', label: 'Active Pledger' },
    { value: 'inactive', label: 'No Active Pledge' },
    { value: 'completed', label: 'Completed Pledge' },
    { value: 'cancelled', label: 'Cancelled Pledge' }
  ];

  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'sms', label: 'SMS' },
    { value: 'mail', label: 'Mail' },
    { value: 'no_contact', label: 'No Contact' }
  ];

  return (
    <div className="member-filters">
      <div className="filters-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleFilterChange('search', '');
                }}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-actions">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`toggle-advanced-btn ${showAdvanced ? 'active' : ''}`}
          >
            <Filter size={16} />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <span className="filter-count">{getActiveFilterCount()}</span>
            )}
          </button>

          {getActiveFilterCount() > 0 && (
            <button onClick={clearAllFilters} className="clear-filters-btn">
              <X size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="results-summary">
        <span className="results-text">
          Showing {filteredCount.toLocaleString()} of {totalMembers.toLocaleString()} members
        </span>
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-grid">
            {/* Age Range Filter */}
            <div className="filter-group">
              <label htmlFor="age-range">Age Range</label>
              <select
                id="age-range"
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              >
                <option value="">All Ages</option>
                {ageRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div className="filter-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pledge Status Filter */}
            <div className="filter-group">
              <label htmlFor="pledge-status">Pledge Status</label>
              <select
                id="pledge-status"
                value={filters.pledgeStatus}
                onChange={(e) => handleFilterChange('pledgeStatus', e.target.value)}
              >
                <option value="">All Status</option>
                {pledgeStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Method Filter */}
            <div className="filter-group">
              <label htmlFor="contact-method">Preferred Contact</label>
              <select
                id="contact-method"
                value={filters.contactMethod}
                onChange={(e) => handleFilterChange('contactMethod', e.target.value)}
              >
                <option value="">All Methods</option>
                {contactMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="filter-group">
              <label htmlFor="joined-after">Joined After</label>
              <input
                type="date"
                id="joined-after"
                value={filters.joinedAfter}
                onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="joined-before">Joined Before</label>
              <input
                type="date"
                id="joined-before"
                value={filters.joinedBefore}
                onChange={(e) => handleFilterChange('joinedBefore', e.target.value)}
              />
            </div>

            {/* Location Filter */}
            <div className="filter-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                placeholder="City, State, or ZIP"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Groups Filter */}
          {groups.length > 0 && (
            <div className="filter-section">
              <h4>Groups & Ministries</h4>
              <div className="checkbox-grid">
                {groups.map(group => (
                  <label key={group.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filters.groups.includes(group.id)}
                      onChange={() => handleMultiSelectChange('groups', group.id)}
                    />
                    <span className="checkbox-label">
                      <Users size={14} />
                      {group.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="filter-section">
              <h4>Tags</h4>
              <div className="checkbox-grid">
                {tags.map(tag => (
                  <label key={tag.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag.id)}
                      onChange={() => handleMultiSelectChange('tags', tag.id)}
                    />
                    <span className="checkbox-label">
                      <Tag size={14} />
                      <span 
                        className="tag-color" 
                        style={{ backgroundColor: tag.color }}
                      ></span>
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className="filter-section">
            <h4>Quick Filters</h4>
            <div className="quick-filters">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.hasPhone}
                  onChange={(e) => handleFilterChange('hasPhone', e.target.checked)}
                />
                <span className="checkbox-label">
                  <Phone size={14} />
                  Has Phone Number
                </span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.hasEmail}
                  onChange={(e) => handleFilterChange('hasEmail', e.target.checked)}
                />
                <span className="checkbox-label">
                  <Mail size={14} />
                  Has Email Address
                </span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.checked)}
                />
                <span className="checkbox-label">
                  Active Members Only
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          <div className="active-filter-tags">
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button onClick={() => handleFilterChange('search', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.ageRange && (
              <span className="filter-tag">
                Age: {ageRanges.find(r => r.value === filters.ageRange)?.label}
                <button onClick={() => handleFilterChange('ageRange', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.gender && (
              <span className="filter-tag">
                Gender: {genderOptions.find(g => g.value === filters.gender)?.label}
                <button onClick={() => handleFilterChange('gender', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.pledgeStatus && (
              <span className="filter-tag">
                Pledge: {pledgeStatuses.find(p => p.value === filters.pledgeStatus)?.label}
                <button onClick={() => handleFilterChange('pledgeStatus', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.groups.length > 0 && filters.groups.map(groupId => {
              const group = groups.find(g => g.id === groupId);
              return (
                <span key={groupId} className="filter-tag">
                  Group: {group?.name}
                  <button onClick={() => handleMultiSelectChange('groups', groupId)}>
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {filters.tags.length > 0 && filters.tags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return (
                <span key={tagId} className="filter-tag">
                  Tag: {tag?.name}
                  <button onClick={() => handleMultiSelectChange('tags', tagId)}>
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFilters;
