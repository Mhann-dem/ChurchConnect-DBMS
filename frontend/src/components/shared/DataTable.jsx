// src/components/shared/DataTable.jsx
import React, { useState } from 'react';
import styles from './Shared.module.css';

const DataTable = ({ 
  data, 
  columns, 
  onRowClick,
  sortable = true,
  selectable = false,
  onSelectionChange,
  selectedRows = [],
  actions = [],
  emptyMessage = 'No data available'
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [allSelected, setAllSelected] = useState(false);

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSelectAll = () => {
    if (allSelected) {
      setAllSelected(false);
      onSelectionChange([]);
    } else {
      setAllSelected(true);
      onSelectionChange(data.map(row => row.id));
    }
  };

  const handleRowSelect = (rowId) => {
    const newSelection = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    onSelectionChange(newSelection);
    setAllSelected(newSelection.length === data.length);
  };

  if (data.length === 0) {
    return (
      <div className={styles.emptyTable}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {selectable && (
              <th className={styles.selectColumn}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${styles.tableHeader} ${
                  sortable && column.sortable !== false ? styles.sortable : ''
                }`}
                onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
              >
                <div className={styles.headerContent}>
                  {column.title}
                  {sortable && column.sortable !== false && (
                    <span className={styles.sortIcon}>
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {actions.length > 0 && (
              <th className={styles.actionsColumn}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.id}
              className={`${styles.tableRow} ${
                onRowClick ? styles.clickable : ''
              } ${selectedRows.includes(row.id) ? styles.selected : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {selectable && (
                <td className={styles.selectColumn}>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleRowSelect(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select row ${row.id}`}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className={styles.tableCell}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions.length > 0 && (
                <td className={styles.actionsColumn}>
                  <div className={styles.actionButtons}>
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        className={`${styles.actionButton} ${styles[action.type] || ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                        title={action.title}
                      >
                        {action.icon || action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;