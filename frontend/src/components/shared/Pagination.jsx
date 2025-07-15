// src/components/shared/Pagination.jsx
import React from 'react';
import styles from './Shared.module.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage = 25,
  totalItems = 0,
  showItemsPerPage = false,
  onItemsPerPageChange
}) => {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationInfo}>
        <span>
          Showing {startItem} to {endItem} of {totalItems} entries
        </span>
      </div>
      
      <nav className={styles.pagination} aria-label="Pagination">
        <button
          className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          Previous
        </button>
        
        {generatePageNumbers().map((page, index) => (
          <button
            key={index}
            className={`${styles.paginationButton} ${
              page === currentPage ? styles.active : ''
            } ${page === '...' ? styles.ellipsis : ''}`}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        
        <button
          className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
      
      {showItemsPerPage && (
        <div className={styles.itemsPerPageContainer}>
          <label htmlFor="itemsPerPage">Items per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className={styles.itemsPerPageSelect}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;