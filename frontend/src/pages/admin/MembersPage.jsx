import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, RefreshCw, X, Users, Upload } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import { useDebounce } from '../../hooks/useDebounce';

// Simplified Member Card Component
const MemberCard = ({ member, isSelected, onSelect, onNavigate }) => {
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
  };

  return (
    <div
      style={{
        background: isSelected ? '#eff6ff' : 'white',
        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }} onClick={() => onNavigate(member.id)}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {member.first_name?.[0]}{member.last_name?.[0]}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 4px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {member.first_name} {member.last_name}
            </h3>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '500',
              backgroundColor: member.is_active ? '#d1fae5' : '#fee2e2',
              color: member.is_active ? '#065f46' : '#991b1b'
            }}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(member.id)}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            cursor: 'pointer', 
            width: '18px', 
            height: '18px', 
            accentColor: '#3b82f6',
            flexShrink: 0
          }}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        fontSize: '14px', 
        color: '#6b7280' 
      }} onClick={() => onNavigate(member.id)}>
        {member.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📧</span>
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {member.email}
            </span>
          </div>
        )}
        {member.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📱</span>
            <span>{formatPhone(member.phone)}</span>
          </div>
        )}
        {member.registration_date && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Joined: {new Date(member.registration_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};
// Bulk Import Modal Component
const BulkImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = React.useRef(null);

  const downloadTemplate = () => {
    const headers = 'First Name,Last Name,Email,Phone,Date of Birth,Gender,Address';
    const sample = 'John,Doe,john@example.com,555-0123,1990-01-15,Male,123 Main St';
    const csv = headers + '\n' + sample;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      const response = await fetch(`${baseURL}/api/v1/members/bulk_import/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult({
          success: true,
          imported: data.data.imported,
          failed: data.data.failed,
          total: data.data.total || (data.data.imported + data.data.failed)
        });
        if (onImportComplete) onImportComplete(data);
      } else {
        setResult({ success: false, error: data.error || 'Import failed' });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setResult(null);
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }} onClick={resetAndClose}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Import Members
          </h3>
          <button 
            onClick={resetAndClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {!result ? (
          <>
            <p style={{ color: '#6b7280', marginBottom: '20px', lineHeight: '1.5' }}>
              Upload a CSV file with member information. Download our template to ensure correct formatting.
            </p>

            <button
              onClick={downloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '20px',
                fontWeight: '500',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <Download size={16} />
              Download CSV Template
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Upload size={20} />
              Choose CSV File
            </button>

            {file && (
              <div style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  Selected file:
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={resetAndClose}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || importing}
                style={{
                  padding: '8px 16px',
                  background: !file || importing ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: !file || importing ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {importing && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {importing ? 'Importing...' : 'Import Members'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {result.success ? (
                <>
                  <div style={{ 
                    fontSize: '48px', 
                    marginBottom: '16px',
                    color: '#10b981'
                  }}>
                    ✓
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                    Import Complete!
                  </h4>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '16px',
                    textAlign: 'left'
                  }}>
                    <p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>
                      <strong>Imported:</strong> {result.imported} members
                    </p>
                    {result.failed > 0 && (
                      <p style={{ margin: '4px 0 0', color: '#dc2626', fontSize: '14px' }}>
                        <strong>Failed:</strong> {result.failed} records
                      </p>
                    )}
                    <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: '14px' }}>
                      <strong>Total processed:</strong> {result.total}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ 
                    fontSize: '48px', 
                    marginBottom: '16px',
                    color: '#ef4444'
                  }}>
                    ✕
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                    Import Failed
                  </h4>
                  <p style={{ color: '#ef4444', margin: '8px 0 0', fontSize: '14px' }}>
                    {result.error}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={resetAndClose}
              style={{
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Close
            </button>
          </>
        )}
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [membersPerPage, setMembersPerPage] = useState(25);
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    status: searchParams.get('status') || 'all'
  });

  const debouncedSearchQuery = useDebounce(currentSearchQuery, 500);

  const hookOptions = useMemo(() => ({
    search: debouncedSearchQuery,
    filters: {
      status: filters.status,
      gender: filters.gender
    },
    page: currentPage,
    limit: membersPerPage,
    autoFetch: true
  }), [debouncedSearchQuery, filters.status, filters.gender, currentPage, membersPerPage]);

  const {
    members = [],
    totalMembers = 0,
    activeMembers = 0,
    inactiveMembers = 0,
    isLoading = false,
    error = null,
    refresh,
    totalPages = 1
  } = useMembers(hookOptions) || {};

  const safeMembers = Array.isArray(members) ? members : [];

  const handleSearch = useCallback((query) => {
    setCurrentSearchQuery(query || '');
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refresh) {
      await refresh();
      showToast('Members list refreshed', 'success');
    }
  }, [refresh, showToast]);

  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      setSelectedMembers(new Set(safeMembers.map(m => m.id)));
    } else {
      setSelectedMembers(new Set());
    }
  }, [safeMembers]);

  const handleImportComplete = useCallback((data) => {
    showToast(`Imported ${data.data.imported} members successfully!`, 'success');
    setShowImportModal(false);
    if (refresh) {
      setTimeout(() => refresh(), 1000);
    }
  }, [refresh, showToast]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px' 
      }}>
        
        {/* Header Section */}
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '16px', 
            flexWrap: 'wrap', 
            gap: '16px' 
          }}>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#1f2937', 
                margin: '0 0 8px 0' 
              }}>
                Members
              </h1>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>
                Manage church members and their information
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                <RefreshCw size={16} style={{
                  animation: isLoading ? 'spin 1s linear infinite' : 'none'
                }} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                <Upload size={16} />
                Import CSV
              </button>
              
              <button
                onClick={() => navigate('/register')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(59,130,246,0.3)'
                }}
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            gap: '24px',
            padding: '16px 0',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {totalMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Members</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                {activeMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {inactiveMembers.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Inactive</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                {selectedMembers.size}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Selected</div>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '500px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search members by name, email, phone..."
              value={currentSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              disabled={isLoading}
            />
            {currentSearchQuery && (
              <button
                onClick={() => handleSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <select
            value={membersPerPage}
            onChange={(e) => setMembersPerPage(Number(e.target.value))}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Members Grid */}
        {isLoading && safeMembers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            background: 'white', 
            borderRadius: '12px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#6b7280' }}>Loading members...</p>
          </div>
        ) : safeMembers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            background: 'white', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <Users size={64} style={{ color: '#d1d5db', margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>
              No Members Found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px' }}>
              {currentSearchQuery 
                ? 'No members match your search criteria. Try adjusting your search.' 
                : 'Get started by adding your first member or importing from CSV.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                Add First Member
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={20} />
                Import CSV
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            {safeMembers.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <input
                  type="checkbox"
                  checked={selectedMembers.size === safeMembers.length && safeMembers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  {selectedMembers.size > 0 
                    ? `${selectedMembers.size} of ${safeMembers.length} selected` 
                    : `Select all ${safeMembers.length} members`}
                </span>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {safeMembers.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelected={selectedMembers.has(member.id)}
                  onSelect={(id) => {
                    setSelectedMembers(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(id)) newSet.delete(id);
                      else newSet.add(id);
                      return newSet;
                    });
                  }}
                  onNavigate={(id) => navigate(`/admin/members/${id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: '12px', 
                marginTop: '24px' 
              }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: currentPage <= 1 || isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: currentPage <= 1 || isLoading ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: '14px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: currentPage >= totalPages || isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: currentPage >= totalPages || isLoading ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <BulkImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MembersPage;