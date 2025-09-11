// hooks/usePagination.js - Production Ready with advanced pagination features
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Production-ready pagination hook with advanced features
 * @param {Object} config - Configuration object
 * @returns {Object} Pagination state and utilities
 */
const usePagination = (config = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 25,
    totalItems = 0,
    maxPageButtons = 5,
    pageSizeOptions = [10, 25, 50, 100],
    boundaryRange = 1,
    siblingRange = 1,
    showFirstLast = true,
    showPrevNext = true,
    onPageChange = null,
    onPageSizeChange = null,
    persistState = false,
    persistKey = 'pagination'
  } = config;

  // State
  const [currentPage, setCurrentPage] = useState(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${persistKey}_page`);
        return saved ? Math.max(1, parseInt(saved, 10)) : initialPage;
      } catch {
        return initialPage;
      }
    }
    return initialPage;
  });

  const [pageSize, setPageSize] = useState(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${persistKey}_pageSize`);
        return saved ? Math.max(1, parseInt(saved, 10)) : initialPageSize;
      } catch {
        return initialPageSize;
      }
    }
    return initialPageSize;
  });

  const [totalCount, setTotalCount] = useState(totalItems);

  // Refs for persistence and callbacks
  const mountedRef = useRef(true);
  const callbacksRef = useRef({ onPageChange, onPageSizeChange });

  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = { onPageChange, onPageSizeChange };
  }, [onPageChange, onPageSizeChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Persist state to localStorage
  const persistToDisk = useCallback((page, size) => {
    if (!persistState || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${persistKey}_page`, page.toString());
      localStorage.setItem(`${persistKey}_pageSize`, size.toString());
    } catch (error) {
      console.warn('Failed to persist pagination state:', error);
    }
  }, [persistState, persistKey]);

  // Computed values
  const computedValues = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);
    
    const hasNextPage = safePage < totalPages;
    const hasPrevPage = safePage > 1;
    const isFirstPage = safePage === 1;
    const isLastPage = safePage === totalPages;
    
    return {
      totalPages,
      safePage,
      startIndex,
      endIndex,
      hasNextPage,
      hasPrevPage,
      isFirstPage,
      isLastPage,
      startItem: totalCount === 0 ? 0 : startIndex + 1,
      endItem: totalCount === 0 ? 0 : endIndex + 1,
      itemsOnPage: totalCount === 0 ? 0 : Math.min(pageSize, totalCount - startIndex)
    };
  }, [currentPage, pageSize, totalCount]);

  // Generate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const { totalPages, safePage } = computedValues;
    
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const leftSiblingIndex = Math.max(safePage - siblingRange, 1);
    const rightSiblingIndex = Math.min(safePage + siblingRange, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > boundaryRange + 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - boundaryRange - 1;

    // Add first pages
    for (let i = 1; i <= Math.min(boundaryRange, totalPages); i++) {
      pages.push(i);
    }

    // Add left dots if needed
    if (shouldShowLeftDots) {
      pages.push('...');
    }

    // Add sibling pages
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i > boundaryRange && i <= totalPages - boundaryRange) {
        pages.push(i);
      }
    }

    // Add right dots if needed
    if (shouldShowRightDots) {
      pages.push('...');
    }

    // Add last pages
    for (let i = Math.max(totalPages - boundaryRange + 1, boundaryRange + 1); i <= totalPages; i++) {
      if (i > rightSiblingIndex) {
        pages.push(i);
      }
    }

    return Array.from(new Set(pages)); // Remove duplicates
  }, [computedValues, maxPageButtons, siblingRange, boundaryRange]);

  // Navigation functions with validation and callbacks
  const goToPage = useCallback((page) => {
    if (!mountedRef.current) return;
    
    const { totalPages } = computedValues;
    const targetPage = Math.max(1, Math.min(page, totalPages));
    
    if (targetPage === currentPage) return; // No change needed
    
    setCurrentPage(targetPage);
    persistToDisk(targetPage, pageSize);
    
    if (callbacksRef.current.onPageChange) {
      callbacksRef.current.onPageChange(targetPage, pageSize);
    }
  }, [currentPage, pageSize, computedValues, persistToDisk]);

  const goToNextPage = useCallback(() => {
    if (computedValues.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, computedValues.hasNextPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    if (computedValues.hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, computedValues.hasPrevPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(computedValues.totalPages);
  }, [goToPage, computedValues.totalPages]);

  // Page size change with auto-page adjustment
  const changePageSize = useCallback((newPageSize) => {
    if (!mountedRef.current || newPageSize === pageSize) return;
    
    const validPageSize = Math.max(1, newPageSize);
    
    // Calculate new page to maintain roughly the same position
    const currentItemIndex = (currentPage - 1) * pageSize;
    const newCurrentPage = Math.max(1, Math.ceil((currentItemIndex + 1) / validPageSize));
    
    setPageSize(validPageSize);
    setCurrentPage(newCurrentPage);
    persistToDisk(newCurrentPage, validPageSize);
    
    if (callbacksRef.current.onPageSizeChange) {
      callbacksRef.current.onPageSizeChange(validPageSize, newCurrentPage);
    }
  }, [currentPage, pageSize, persistToDisk]);

  // Auto-adjust current page when total count changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const { totalPages, safePage } = computedValues;
    
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
      persistToDisk(safePage, pageSize);
      
      if (callbacksRef.current.onPageChange) {
        callbacksRef.current.onPageChange(safePage, pageSize);
      }
    }
  }, [totalCount, pageSize, currentPage, computedValues, persistToDisk]);

  // Update total count
  const updateTotalCount = useCallback((newTotal) => {
    if (!mountedRef.current) return;
    setTotalCount(Math.max(0, newTotal));
  }, []);

  // Reset pagination
  const reset = useCallback((options = {}) => {
    if (!mountedRef.current) return;
    
    const {
      page = initialPage,
      size = initialPageSize,
      total = totalItems
    } = options;
    
    setCurrentPage(page);
    setPageSize(size);
    setTotalCount(total);
    persistToDisk(page, size);
  }, [initialPage, initialPageSize, totalItems, persistToDisk]);

  // Get current page information for display
  const getPageInfo = useCallback(() => {
    const { startItem, endItem, itemsOnPage } = computedValues;
    
    return {
      currentPage,
      pageSize,
      totalCount,
      totalPages: computedValues.totalPages,
      startItem,
      endItem,
      itemsOnPage,
      displayText: totalCount === 0 
        ? 'No items'
        : `Showing ${startItem}-${endItem} of ${totalCount} items`
    };
  }, [currentPage, pageSize, totalCount, computedValues]);

  // Get slice bounds for array slicing
  const getSliceBounds = useCallback(() => {
    const { startIndex } = computedValues;
    return {
      start: startIndex,
      end: startIndex + pageSize
    };
  }, [computedValues, pageSize]);

  // Get pagination parameters for API calls
  const getPaginationParams = useCallback((format = 'standard') => {
    const { startIndex } = computedValues;
    
    const params = {
      standard: {
        page: currentPage,
        limit: pageSize,
        offset: startIndex
      },
      django: {
        page: currentPage,
        page_size: pageSize
      },
      graphql: {
        first: pageSize,
        skip: startIndex
      },
      elasticsearch: {
        from: startIndex,
        size: pageSize
      }
    };
    
    return params[format] || params.standard;
  }, [currentPage, pageSize, computedValues]);

  // Validate page number
  const isValidPage = useCallback((page) => {
    return page >= 1 && page <= computedValues.totalPages;
  }, [computedValues.totalPages]);

  // Jump to page containing specific item index
  const goToItemIndex = useCallback((itemIndex) => {
    const targetPage = Math.max(1, Math.ceil((itemIndex + 1) / pageSize));
    goToPage(targetPage);
  }, [pageSize, goToPage]);

  // Get range of items for current page
  const getCurrentPageItems = useCallback((items = []) => {
    if (!Array.isArray(items)) return [];
    
    const { start, end } = getSliceBounds();
    return items.slice(start, end);
  }, [getSliceBounds]);

  // Quick navigation functions
  const quickNavigation = useMemo(() => ({
    canGoToFirst: !computedValues.isFirstPage,
    canGoToPrev: computedValues.hasPrevPage,
    canGoToNext: computedValues.hasNextPage,
    canGoToLast: !computedValues.isLastPage,
    
    goToFirst: goToFirstPage,
    goToPrev: goToPrevPage,
    goToNext: goToNextPage,
    goToLast: goToLastPage
  }), [computedValues, goToFirstPage, goToPrevPage, goToNextPage, goToLastPage]);

  // Pagination summary for accessibility
  const getAriaLabel = useCallback(() => {
    const { totalPages } = computedValues;
    return `Page ${currentPage} of ${totalPages}`;
  }, [currentPage, computedValues]);

  // Export pagination state
  const exportState = useCallback(() => ({
    currentPage,
    pageSize,
    totalCount,
    timestamp: Date.now()
  }), [currentPage, pageSize, totalCount]);

  // Import pagination state
  const importState = useCallback((state) => {
    if (!state || !mountedRef.current) return;
    
    const { currentPage: importedPage, pageSize: importedSize, totalCount: importedTotal } = state;
    
    if (importedPage) setCurrentPage(Math.max(1, importedPage));
    if (importedSize) setPageSize(Math.max(1, importedSize));
    if (importedTotal !== undefined) setTotalCount(Math.max(0, importedTotal));
  }, []);

  return {
    // Current state
    currentPage,
    pageSize,
    totalCount,
    
    // Computed values
    ...computedValues,
    
    // Page numbers for UI
    pageNumbers,
    
    // Navigation functions
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    goToItemIndex,
    
    // Configuration
    changePageSize,
    updateTotalCount,
    reset,
    
    // Utility functions
    getPageInfo,
    getSliceBounds,
    getPaginationParams,
    getCurrentPageItems,
    isValidPage,
    getAriaLabel,
    
    // Quick navigation
    ...quickNavigation,
    
    // State management
    exportState,
    importState,
    
    // Configuration options
    pageSizeOptions,
    
    // Debugging info
    debug: {
      persistKey,
      persistState,
      config: {
        maxPageButtons,
        boundaryRange,
        siblingRange,
        showFirstLast,
        showPrevNext
      }
    }
  };
};

export default usePagination;