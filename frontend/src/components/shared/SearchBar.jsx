// src/components/shared/SearchBar.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './Shared.module.css';

const SearchBar = ({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300,
  showFilters = false,
  filters = [],
  onFilterChange,
  value = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search"
        />
        <div className={styles.searchActions}>
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <button className={styles.searchButton} aria-label="Search">
            🔍
          </button>
          {showFilters && (
            <button
              className={`${styles.filterButton} ${isFilterOpen ? styles.active : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Toggle filters"
            >
              Filter
            </button>
          )}
        </div>
      </div>
      
      {showFilters && isFilterOpen && (
        <div className={styles.filterPanel}>
          <h4>Filters</h4>
          {filters.map((filter) => (
            <div key={filter.key} className={styles.filterGroup}>
              <label className={styles.filterLabel}>{filter.label}</label>
              {filter.type === 'select' && (
                <select
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {filter.type === 'checkbox' && (
                <div className={styles.checkboxGroup}>
                  {filter.options.map((option) => (
                    <label key={option.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={filter.value?.includes(option.value) || false}
                        onChange={(e) => {
                          const current = filter.value || [];
                          const updated = e.target.checked
                            ? [...current, option.value]
                            : current.filter(v => v !== option.value);
                          onFilterChange(filter.key, updated);
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Change onSearch to not be required since we're handling its absence
SearchBar.propTypes = {
  onSearch: PropTypes.func, // Remove .isRequired
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
  showFilters: PropTypes.bool,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['select', 'checkbox']).isRequired,
      value: PropTypes.any,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.any.isRequired,
          label: PropTypes.string.isRequired
        })
      ).isRequired
    })
  ),
  onFilterChange: PropTypes.func,
  value: PropTypes.string
};

// Add defaultProps for onSearch
SearchBar.defaultProps = {
  onSearch: () => {}, // Add default empty function
  filters: [],
  onFilterChange: () => {}
};

export default SearchBar;