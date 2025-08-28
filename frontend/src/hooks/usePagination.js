// hooks/usePagination.js - Hook for managing pagination state and logic

import { useState, useCallback, useMemo } from 'react';

const usePagination = ({
  initialPage = 1,
  initialPageSize = 25,
  totalItems = 0,
  maxPageButtons = 5
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(totalItems);

  // Use totalCount as the authoritative source for totalItems
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalCount - 1);
  }, [startIndex, pageSize, totalCount]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPrevPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  // Generate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const pages = [];
    const halfMaxButtons = Math.floor(maxPageButtons / 2);
    
    let startPage = Math.max(1, currentPage - halfMaxButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages, maxPageButtons]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Page size change handler
  const changePageSize = useCallback((newPageSize) => {
    const newCurrentPage = Math.ceil(((currentPage - 1) * pageSize + 1) / newPageSize);
    setPageSize(newPageSize);
    setCurrentPage(newCurrentPage);
  }, [currentPage, pageSize]);

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  // Get current page info for display
  const getPageInfo = useCallback(() => {
    const start = totalCount === 0 ? 0 : startIndex + 1;
    const end = totalCount === 0 ? 0 : endIndex + 1;
    
    return {
      start,
      end,
      total: totalCount,
      currentPage,
      totalPages,
      pageSize
    };
  }, [startIndex, endIndex, totalCount, currentPage, totalPages, pageSize]);

  // Get slice bounds for array slicing
  const getSliceBounds = useCallback(() => {
    return {
      start: startIndex,
      end: startIndex + pageSize
    };
  }, [startIndex, pageSize]);

  // Check if page is valid
  const isValidPage = useCallback((page) => {
    return page >= 1 && page <= totalPages;
  }, [totalPages]);

  // Get pagination metadata for API calls
  const getPaginationParams = useCallback(() => {
    return {
      page: currentPage,
      limit: pageSize,
      offset: startIndex
    };
  }, [currentPage, pageSize, startIndex]);

  return {
    // State
    currentPage,
    pageSize,
    totalPages,
    totalItems: totalCount, // Use totalCount as totalItems
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    pageNumbers,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    reset,
    setTotalCount, // ADDED: Export this for the hook to use
    
    // Utilities
    getPageInfo,
    getSliceBounds,
    isValidPage,
    getPaginationParams
  };
};

export default usePagination;