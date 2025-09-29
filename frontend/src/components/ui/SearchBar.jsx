// src/components/shared/SearchBar.jsx - COMPLETE FIXED VERSION (Icon Inside Input)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';

const SearchBar = ({ 
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...', 
  debounceMs = 300,
  disabled = false,
  className = '',
  showClearButton = true,
  autoFocus = false
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // Call onChange immediately for controlled component behavior
    if (onChange) {
      onChange(newValue);
    }
    
    // Call onSearch if provided (legacy support)
    if (onSearch) {
      onSearch(newValue);
    }
  };

  // Handle clear
  const handleClear = () => {
    setInternalValue('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      ...(typeof className === 'object' ? className : {})
    }}>
      {/* Search Icon - Inside on the left */}
      <Search 
        size={20} 
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: disabled ? '#d1d5db' : '#9ca3af',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Input Field */}
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '11px 40px 11px 46px', // Left padding for icon, right for clear button
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.5',
          transition: 'all 0.2s ease',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          cursor: disabled ? 'not-allowed' : 'text',
          outline: 'none',
          color: '#1f2937'
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        }}
      />
      
      {/* Clear Button - Inside on the right */}
      {showClearButton && internalValue && !disabled && (
        <button
          onClick={handleClear}
          type="button"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            padding: 0,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#6b7280',
            transition: 'all 0.2s ease',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  showClearButton: PropTypes.bool,
  autoFocus: PropTypes.bool
};

export default SearchBar;