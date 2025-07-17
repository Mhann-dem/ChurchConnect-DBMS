import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  placeholder = 'Search...', 
  value = '', 
  onChange 
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    if (onChange) {
      onChange(newValue);
    }
    if (onSearch) {
      onSearch(newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear"
          >
            ×
          </button>
        )}
        <button type="submit" className="search-button">
          🔍
        </button>
      </div>
    </form>
  );
};

export default SearchBar;