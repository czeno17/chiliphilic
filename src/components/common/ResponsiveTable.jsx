import React, { useState } from 'react';
import styles from './ResponsiveTable.module.css';

export const ResponsiveTable = ({ 
  headers, 
  data, 
  renderRow,
  sortable = false,
  searchable = false,
  onRowClick,
  className = '',
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const filteredData = searchable && searchTerm
    ? data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;
  
  const sortedData = sortable && sortConfig.key
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(searchable || sortable) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.search}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search table"
              />
            </div>
          )}
        </div>
      )}
      
      <div className={styles.tableContainer}>
        <table className={styles.table} {...props}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={sortable ? styles.sortable : ''}
                  onClick={() => sortable && handleSort(header.key)}
                  aria-sort={
                    sortConfig.key === header.key 
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  {header.label}
                  {sortable && sortConfig.key === header.key && (
                    <span className={styles.sortIcon}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? styles.clickable : ''}
                >
                  {renderRow(item, index)}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className={styles.empty}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {data.length > 10 && (
        <div className={styles.footer}>
          <span className={styles.count}>
            Showing {sortedData.length} of {data.length} items
          </span>
        </div>
      )}
    </div>
  );
};