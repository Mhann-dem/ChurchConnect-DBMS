// frontend/src/components/admin/Families/FamilyFilters.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import Button from '../../ui/Button';
import { X, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import './Families.module.css';

const FamilyFilters = ({ filters, onFiltersChange, onClose, disabled = false }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    size: true,
    composition: true,
    contact: true,
    date: false,
    sorting: true
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      has_children: '',
      member_count_min: '',
      member_count_max: '',
      missing_primary_contact: '',
      created_at__gte: '',
      created_at__lte: '',
      ordering: 'family_name'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.entries(localFilters).filter(([key, value]) => {
      if (key === 'ordering' && value === 'family_name') return false; // Default ordering doesn't count
      return value && value !== '';
    }).length;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const activeCount = getActiveFilterCount();

  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={24} color="#3b82f6" />
          <h3 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Filter Families
          </h3>
          {activeCount > 0 && (
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {activeCount} active
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleResetFilters}
            disabled={disabled || activeCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: disabled || activeCount === 0 ? 'not-allowed' : 'pointer',
              opacity: disabled || activeCount === 0 ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!disabled && activeCount > 0) {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#d1d5db';
              }
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={onClose}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = '#fef2f2';
                e.target.style.borderColor = '#fecaca';
                e.target.style.color = '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#d1d5db';
                e.target.style.color = '#6b7280';
              }
            }}
          >
            <X size={14} />
            Close
          </button>
        </div>
      </div>

      {/* Filter Sections */}
      <div style={{ display: 'grid', gap: '20px' }}>
        
        {/* Family Size Section */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={() => toggleSection('size')}
            disabled={disabled}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9fafb')}
          >
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              👥 Family Size
            </h4>
            {expandedSections.size ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.size && (
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#4b5563'
                }}>
                  Minimum Members
                </label>
                <input
                  type="number"
                  name="member_count_min"
                  value={localFilters.member_count_min}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#4b5563'
                }}>
                  Maximum Members
                </label>
                <input
                  type="number"
                  name="member_count_max"
                  value={localFilters.member_count_max}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Any"
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Family Composition Section */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={() => toggleSection('composition')}
            disabled={disabled}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9fafb')}
          >
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              👨‍👩‍👧‍👦 Family Composition
            </h4>
            {expandedSections.composition ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.composition && (
            <div style={{ padding: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#4b5563'
              }}>
                Has Children
              </label>
              <select
                name="has_children"
                value={localFilters.has_children}
                onChange={handleInputChange}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Any</option>
                <option value="true">✅ With Children</option>
                <option value="false">❌ Without Children</option>
              </select>
            </div>
          )}
        </div>

        {/* Contact Status Section */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={() => toggleSection('contact')}
            disabled={disabled}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9fafb')}
          >
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              📞 Contact Status
            </h4>
            {expandedSections.contact ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.contact && (
            <div style={{ padding: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#4b5563'
              }}>
                Primary Contact Status
              </label>
              <select
                name="missing_primary_contact"
                value={localFilters.missing_primary_contact}
                onChange={handleInputChange}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Any</option>
                <option value="true">⚠️ Missing Primary Contact</option>
                <option value="false">✅ Has Primary Contact</option>
              </select>
            </div>
          )}
        </div>

        {/* Date Filters Section */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={() => toggleSection('date')}
            disabled={disabled}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9fafb')}
          >
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              📅 Registration Date
            </h4>
            {expandedSections.date ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.date && (
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#4b5563'
                }}>
                  From Date
                </label>
                <input
                  type="date"
                  name="created_at__gte"
                  value={localFilters.created_at__gte}
                  onChange={handleInputChange}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#4b5563'
                }}>
                  To Date
                </label>
                <input
                  type="date"
                  name="created_at__lte"
                  value={localFilters.created_at__lte}
                  onChange={handleInputChange}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sorting Section */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={() => toggleSection('sorting')}
            disabled={disabled}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f9fafb')}
          >
            <h4 style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              🔄 Sort Order
            </h4>
            {expandedSections.sorting ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.sorting && (
            <div style={{ padding: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#4b5563'
              }}>
                Order By
              </label>
              <select
                name="ordering"
                value={localFilters.ordering}
                onChange={handleInputChange}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="family_name">📝 Family Name (A-Z)</option>
                <option value="-family_name">📝 Family Name (Z-A)</option>
                <option value="created_at">⏰ Oldest First</option>
                <option value="-created_at">🆕 Newest First</option>
                <option value="updated_at">📅 Least Recently Updated</option>
                <option value="-updated_at">🔄 Most Recently Updated</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '2px solid #f3f4f6'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
          {activeCount > 0 ? (
            <span>
              <span style={{ fontWeight: '700', color: '#3b82f6' }}>{activeCount}</span> active filter{activeCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>No active filters</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleResetFilters}
            disabled={disabled || activeCount === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: disabled || activeCount === 0 ? 'not-allowed' : 'pointer',
              opacity: disabled || activeCount === 0 ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!disabled && activeCount > 0) {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }
            }}
          >
            Reset All
          </button>
          <button
            onClick={handleApplyFilters}
            disabled={disabled}
            style={{
              padding: '10px 24px',
              backgroundColor: disabled ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FamilyFilters;