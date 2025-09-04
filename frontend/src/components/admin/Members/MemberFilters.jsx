import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Calendar, Users, Tag, MapPin, Phone, Mail } from 'lucide-react';
import styles from './Members.module.css';

const MemberFilters = ({ 
  onFilterChange = () => {}, 
  onClearFilters = () => {}, 
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

  const searchTimeoutRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleFilterChange('search', searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (typeof onFilterChange === 'function') {
      onFilterChange(newFilters);
    }
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
    
    if (typeof onClearFilters === 'function') {
      onClearFilters();
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.ageRange) count++;
    if (filters.gender) count++;
    if (filters.groups && filters.groups.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
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

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={styles.memberFilters}>
      <div className={styles.filtersHeader}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleFilterChange('search', '');
                }}
                className={styles.clearSearchBtn}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`${styles.toggleAdvancedBtn} ${showAdvanced ? styles.active : ''}`}
          >
            <Filter size={16} />
            Advanced Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterCount}>{activeFilterCount}</span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className={styles.clearFiltersBtn}>
              <X size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className={styles.resultsSummary}>
        <span className={styles.resultsText}>
          Showing {filteredCount.toLocaleString()} of {totalMembers.toLocaleString()} members
        </span>
      </div>

      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterGrid}>
            {/* Age Range Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="age-range">Age Range</label>
              <select
                id="age-range"
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className={styles.filterSelect}
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
            <div className={styles.filterGroup}>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className={styles.filterSelect}
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
            <div className={styles.filterGroup}>
              <label htmlFor="pledge-status">Pledge Status</label>
              <select
                id="pledge-status"
                value={filters.pledgeStatus}
                onChange={(e) => handleFilterChange('pledgeStatus', e.target.value)}
                className={styles.filterSelect}
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
            <div className={styles.filterGroup}>
              <label htmlFor="contact-method">Preferred Contact</label>
              <select
                id="contact-method"
                value={filters.contactMethod}
                onChange={(e) => handleFilterChange('contactMethod', e.target.value)}
                className={styles.filterSelect}
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
            <div className={styles.filterGroup}>
              <label htmlFor="joined-after">Joined After</label>
              <input
                type="date"
                id="joined-after"
                value={filters.joinedAfter}
                onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="joined-before">Joined Before</label>
              <input
                type="date"
                id="joined-before"
                value={filters.joinedBefore}
                onChange={(e) => handleFilterChange('joinedBefore', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Location Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                placeholder="City, State, or ZIP"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={styles.filterInput}
              />
            </div>
          </div>

          {/* Groups Filter */}
          {Array.isArray(groups) && groups.length > 0 && (
            <div className={styles.filterSection}>
              <h4>Groups & Ministries</h4>
              <div className={styles.checkboxGrid}>
                {groups.map(group => (
                  <label key={group.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={(filters.groups || []).includes(group.id)}
                      onChange={() => handleMultiSelectChange('groups', group.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxLabel}>
                      <Users size={14} />
                      {group.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className={styles.filterSection}>
              <h4>Tags</h4>
              <div className={styles.checkboxGrid}>
                {tags.map(tag => (
                  <label key={tag.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={(filters.tags || []).includes(tag.id)}
                      onChange={() => handleMultiSelectChange('tags', tag.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxLabel}>
                      <Tag size={14} />
                      <span 
                        className={styles.tagColor} 
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
          <div className={styles.filterSection}>
            <h4>Quick Filters</h4>
            <div className={styles.quickFilters}>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={filters.hasPhone}
                  onChange={(e) => handleFilterChange('hasPhone', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>
                  <Phone size={14} />
                  Has Phone Number
                </span>
              </label>

              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={filters.hasEmail}
                  onChange={(e) => handleFilterChange('hasEmail', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>
                  <Mail size={14} />
                  Has Email Address
                </span>
              </label>

              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>
                  Active Members Only
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active Filters:</span>
          <div className={styles.activeFilterTags}>
            {filters.search && (
              <span className={styles.filterTag}>
                Search: "{filters.search}"
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    handleFilterChange('search', '');
                  }}
                  className={styles.filterTagClose}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.ageRange && (
              <span className={styles.filterTag}>
                Age: {ageRanges.find(r => r.value === filters.ageRange)?.label}
                <button 
                  onClick={() => handleFilterChange('ageRange', '')}
                  className={styles.filterTagClose}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.gender && (
              <span className={styles.filterTag}>
                Gender: {genderOptions.find(g => g.value === filters.gender)?.label}
                <button 
                  onClick={() => handleFilterChange('gender', '')}
                  className={styles.filterTagClose}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.pledgeStatus && (
              <span className={styles.filterTag}>
                Pledge: {pledgeStatuses.find(p => p.value === filters.pledgeStatus)?.label}
                <button 
                  onClick={() => handleFilterChange('pledgeStatus', '')}
                  className={styles.filterTagClose}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.groups && filters.groups.length > 0 && filters.groups.map(groupId => {
              const group = groups.find(g => g.id === groupId);
              return group ? (
                <span key={groupId} className={styles.filterTag}>
                  Group: {group.name}
                  <button 
                    onClick={() => handleMultiSelectChange('groups', groupId)}
                    className={styles.filterTagClose}
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
            {filters.tags && filters.tags.length > 0 && filters.tags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <span key={tagId} className={styles.filterTag}>
                  Tag: {tag.name}
                  <button 
                    onClick={() => handleMultiSelectChange('tags', tagId)}
                    className={styles.filterTagClose}
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
            {filters.location && (
              <span className={styles.filterTag}>
                Location: {filters.location}
                <button 
                  onClick={() => handleFilterChange('location', '')}
                  className={styles.filterTagClose}
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFilters;