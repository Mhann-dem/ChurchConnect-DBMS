 
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for managing search functionality
 * Provides search state, filtering, and pagination
 */
export const useSearch = (initialData = [], options = {}) => {
  const {
    searchFields = ['name', 'email'], // Default fields to search
    debounceDelay = 300,
    caseSensitive = false,
    exactMatch = false,
    minSearchLength = 2,
    filterKey = 'all',
    sortKey = 'name',
    sortOrder = 'asc',
    pageSize = 25,
    enablePagination = true,
    enableFiltering = true,
    enableSorting = true
  } = options;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: sortKey,
    order: sortOrder
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState(initialData);
  const [savedSearches, setSavedSearches] = useState([]);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Search function
  const performSearch = useCallback((items, term, fields) => {
    if (!term || term.length < minSearchLength) return items;

    const searchValue = caseSensitive ? term : term.toLowerCase();
    
    return items.filter(item => {
      return fields.some(field => {
        const fieldValue = getNestedValue(item, field);
        if (fieldValue === null || fieldValue === undefined) return false;
        
        const stringValue = caseSensitive 
          ? String(fieldValue) 
          : String(fieldValue).toLowerCase();
        
        if (exactMatch) {
          return stringValue === searchValue;
        }
        
        return stringValue.includes(searchValue);
      });
    });
  }, [caseSensitive, exactMatch, minSearchLength]);

  // Helper function to get nested object values
  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }, []);

  // Filter function
  const applyFilters = useCallback((items, filterConfig) => {
    if (!enableFiltering || Object.keys(filterConfig).length === 0) return items;

    return items.filter(item => {
      return Object.entries(filterConfig).every(([key, value]) => {
        if (value === '' || value === null || value === undefined) return true;
        
        const itemValue = getNestedValue(item, key);
        
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
          const numValue = Number(itemValue);
          return numValue >= value.min && numValue <= value.max;
        }
        
        if (typeof value === 'object' && value.start && value.end) {
          const itemDate = new Date(itemValue);
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          return itemDate >= startDate && itemDate <= endDate;
        }
        
        return itemValue === value;
      });
    });
  }, [enableFiltering, getNestedValue]);

  // Sort function
  const applySorting = useCallback((items, config) => {
    if (!enableSorting || !config.key) return items;

    return [...items].sort((a, b) => {
      const aValue = getNestedValue(a, config.key);
      const bValue = getNestedValue(b, config.key);
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return config.order === 'desc' ? -comparison : comparison;
    });
  }, [enableSorting, getNestedValue]);

  // Pagination function
  const applyPagination = useCallback((items, page, size) => {
    if (!enablePagination) return { items, totalPages: 1 };

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / size);

    return { items: paginatedItems, totalPages };
  }, [enablePagination]);

  // Process data with search, filter, sort, and pagination
  const processedData = useMemo(() => {
    setIsSearching(true);
    
    let result = [...data];
    
    // Apply search
    if (debouncedSearchTerm) {
      result = performSearch(result, debouncedSearchTerm, searchFields);
    }
    
    // Apply filters
    result = applyFilters(result, filters);
    
    // Apply sorting
    result = applySorting(result, sortConfig);
    
    // Apply pagination
    const { items, totalPages } = applyPagination(result, currentPage, pageSize);
    
    setIsSearching(false);
    
    return {
      items,
      totalItems: result.length,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [
    data,
    debouncedSearchTerm,
    filters,
    sortConfig,
    currentPage,
    pageSize,
    performSearch,
    applyFilters,
    applySorting,
    applyPagination,
    searchFields
  ]);

  // Update search term
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((filterKey) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Update sort configuration
  const updateSort = useCallback((key, order = 'asc') => {
    setSortConfig({ key, order });
    setCurrentPage(1);
  }, []);

  // Toggle sort order
  const toggleSortOrder = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  // Navigate to specific page
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= processedData.totalPages) {
      setCurrentPage(page);
    }
  }, [processedData.totalPages]);

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (processedData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [processedData.hasNextPage]);

  // Navigate to previous page
  const previousPage = useCallback(() => {
    if (processedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [processedData.hasPreviousPage]);

  // Reset search state
  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
    setSortConfig({ key: sortKey, order: sortOrder });
  }, [sortKey, sortOrder]);

  // Save current search configuration
  const saveSearch = useCallback((name) => {
    const searchConfig = {
      id: Date.now().toString(),
      name,
      searchTerm,
      filters,
      sortConfig,
      timestamp: new Date().toISOString()
    };
    
    setSavedSearches(prev => [...prev, searchConfig]);
    return searchConfig;
  }, [searchTerm, filters, sortConfig]);

  // Load saved search
  const loadSearch = useCallback((searchId) => {
    const savedSearch = savedSearches.find(search => search.id === searchId);
    if (savedSearch) {
      setSearchTerm(savedSearch.searchTerm);
      setFilters(savedSearch.filters);
      setSortConfig(savedSearch.sortConfig);
      setCurrentPage(1);
    }
  }, [savedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  }, []);

  // Get search suggestions based on current term
  const getSearchSuggestions = useCallback((term = searchTerm) => {
    if (!term || term.length < minSearchLength) return [];

    const suggestions = new Set();
    const searchValue = caseSensitive ? term : term.toLowerCase();

    data.forEach(item => {
      searchFields.forEach(field => {
        const fieldValue = getNestedValue(item, field);
        if (fieldValue) {
          const stringValue = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase();
          if (stringValue.includes(searchValue)) {
            suggestions.add(String(fieldValue));
          }
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  }, [data, searchFields, searchTerm, caseSensitive, minSearchLength, getNestedValue]);

  return {
    // State
    searchTerm,
    filters,
    sortConfig,
    currentPage,
    isSearching,
    savedSearches,
    
    // Processed data
    ...processedData,
    
    // Search methods
    updateSearchTerm,
    resetSearch,
    getSearchSuggestions,
    
    // Filter methods
    updateFilters,
    clearFilter,
    clearAllFilters,
    
    // Sort methods
    updateSort,
    toggleSortOrder,
    
    // Pagination methods
    goToPage,
    nextPage,
    previousPage,
    
    // Saved search methods
    saveSearch,
    loadSearch,
    deleteSavedSearch,
    
    // Computed values
    hasActiveFilters: Object.keys(filters).length > 0,
    hasActiveSearch: searchTerm.length >= minSearchLength,
    isEmpty: processedData.items.length === 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === processedData.totalPages,
    
    // Helper methods
    getNestedValue
  };
};