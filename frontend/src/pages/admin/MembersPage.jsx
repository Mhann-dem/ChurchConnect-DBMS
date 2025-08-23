import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMembers } from '../../hooks/useMembers';
import { useToast } from '../../hooks/useToast';
import styles from './AdminPages.module.css';

// Safe component imports with fallbacks
let MembersList, MemberForm, MemberFilters, BulkActions;
let SearchBar, LoadingSpinner, Toast, Pagination, EmptyState;
let Button, Card, Modal, ConfirmDialog;

try {
  // Try to import admin components
  const adminComponents = require('../../components/admin/Members');
  MembersList = adminComponents.MembersList;
  MemberForm = adminComponents.MemberForm;
  MemberFilters = adminComponents.MemberFilters;
  BulkActions = adminComponents.BulkActions;
} catch (error) {
  console.warn('Admin components not found, using fallbacks');
}

try {
  // Try to import shared components
  const sharedComponents = require('../../components/shared');
  SearchBar = sharedComponents.SearchBar;
  LoadingSpinner = sharedComponents.LoadingSpinner;
  Toast = sharedComponents.Toast;
  Pagination = sharedComponents.Pagination;
  EmptyState = sharedComponents.EmptyState;
  Modal = sharedComponents.Modal;
  ConfirmDialog = sharedComponents.ConfirmDialog;
} catch (error) {
  console.warn('Shared components not found, using fallbacks');
}

try {
  // Try to import UI components
  const uiComponents = require('../../components/ui');
  Button = uiComponents.Button;
  Card = uiComponents.Card;
} catch (error) {
  console.warn('UI components not found, using fallbacks');
}

// Fallback components
const FallbackButton = ({ children, onClick, variant = 'primary', disabled = false, className = '', size, type = 'button', ...props }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
    style={{
      padding: size === 'small' ? '6px 12px' : '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: 
        variant === 'primary' ? '#007bff' : 
        variant === 'danger' ? '#dc3545' : 
        variant === 'outline' ? 'transparent' :
        variant === 'secondary' ? '#6c757d' :
        variant === 'ghost' ? 'transparent' : '#6c757d',
      color: variant === 'outline' || variant === 'ghost' ? '#007bff' : 'white',
      border: variant === 'outline' ? '1px solid #007bff' : 'none',
      opacity: disabled ? 0.6 : 1,
      fontSize: size === 'small' ? '14px' : '16px'
    }}
    {...props}
  >
    {children}
  </button>
);

const FallbackCard = ({ children, className = '', ...props }) => (
  <div
    className={`card ${className}`}
    style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}
    {...props}
  >
    {children}
  </div>
);

const FallbackLoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

const FallbackSearchBar = ({ value, onChange, placeholder, className = '' }) => (
  <input
    type="text"
    value={value || ''}
    onChange={(e) => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    className={className}
    style={{
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px'
    }}
  />
);

const FallbackEmptyState = ({ title, message, action, className = '' }) => (
  <div className={className} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
      {title || 'No Data Found'}
    </h3>
    <p style={{ margin: '0 0 20px 0', color: '#888' }}>
      {message || 'No items to display'}
    </p>
    {action && action}
  </div>
);

const FallbackMembersList = ({ 
  members = [], 
  selectedMembers = [], 
  onSelectMember, 
  onSelectAllMembers, 
  onEdit, 
  onDelete, 
  onView, 
  loading = false 
}) => {
  const SafeButton = Button || FallbackButton;
  const SafeEmptyState = EmptyState || FallbackEmptyState;

  if (loading) {
    return <FallbackLoadingSpinner />;
  }

  if (!members || members.length === 0) {
    return (
      <SafeEmptyState 
        title="No Members Found" 
        message="No members match your current search criteria."
        className={styles.emptyState}
      />
    );
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectedMembers.length === members.length && members.length > 0}
            onChange={(e) => onSelectAllMembers && onSelectAllMembers(e.target.checked)}
          />
          <span style={{ marginLeft: '8px' }}>Select All ({members.length} members)</span>
        </label>
      </div>
      {members.map((member) => (
        <div 
          key={member.id} 
          style={{ 
            padding: '15px', 
            borderBottom: '1px solid #eee', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={selectedMembers.includes(member.id)}
              onChange={() => onSelectMember && onSelectMember(member.id)}
            />
            <div style={{ marginLeft: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600' }}>
                {member.first_name || ''} {member.last_name || ''}
              </h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {member.email || 'No email'}
              </p>
              {member.phone && (
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {member.phone}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <SafeButton 
              onClick={() => onView && onView(member.id)} 
              variant="primary" 
              size="small"
            >
              View
            </SafeButton>
            <SafeButton 
              onClick={() => onEdit && onEdit(member)} 
              variant="secondary" 
              size="small"
            >
              Edit
            </SafeButton>
            <SafeButton 
              onClick={() => onDelete && onDelete(member.id)} 
              variant="danger" 
              size="small"
            >
              Delete
            </SafeButton>
          </div>
        </div>
      ))}
    </div>
  );
};

const FallbackMemberFilters = ({ 
  ageFilter, 
  groupFilter, 
  statusFilter, 
  joinDateFilter, 
  onAgeChange, 
  onGroupChange, 
  onStatusChange, 
  onJoinDateChange 
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Age Group:</label>
      <select 
        value={ageFilter || 'all'} 
        onChange={(e) => onAgeChange && onAgeChange(e.target.value)} 
        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      >
        <option value="all">All Ages</option>
        <option value="18-25">18-25</option>
        <option value="26-40">26-40</option>
        <option value="41-60">41-60</option>
        <option value="60+">60+</option>
      </select>
    </div>
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Group:</label>
      <select 
        value={groupFilter || 'all'} 
        onChange={(e) => onGroupChange && onGroupChange(e.target.value)} 
        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      >
        <option value="all">All Groups</option>
        <option value="youth">Youth</option>
        <option value="adults">Adults</option>
        <option value="seniors">Seniors</option>
      </select>
    </div>
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status:</label>
      <select 
        value={statusFilter || 'all'} 
        onChange={(e) => onStatusChange && onStatusChange(e.target.value)} 
        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Join Date:</label>
      <select 
        value={joinDateFilter || 'all'} 
        onChange={(e) => onJoinDateChange && onJoinDateChange(e.target.value)} 
        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
      >
        <option value="all">All Time</option>
        <option value="last-month">Last Month</option>
        <option value="last-3-months">Last 3 Months</option>
        <option value="last-year">Last Year</option>
      </select>
    </div>
  </div>
);

const FallbackPagination = ({ currentPage, totalPages, onPageChange }) => {
  const SafeButton = Button || FallbackButton;
  
  if (totalPages <= 1) return null;
  
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
      <SafeButton 
        onClick={() => onPageChange && onPageChange(1)} 
        disabled={currentPage <= 1}
        variant="outline"
        size="small"
      >
        First
      </SafeButton>
      <SafeButton 
        onClick={() => onPageChange && onPageChange(currentPage - 1)} 
        disabled={currentPage <= 1}
        variant="outline"
        size="small"
      >
        Previous
      </SafeButton>
      
      {pages.map(page => (
        <SafeButton
          key={page}
          onClick={() => onPageChange && onPageChange(page)}
          variant={page === currentPage ? 'primary' : 'outline'}
          size="small"
        >
          {page}
        </SafeButton>
      ))}
      
      <SafeButton 
        onClick={() => onPageChange && onPageChange(currentPage + 1)} 
        disabled={currentPage >= totalPages}
        variant="outline"
        size="small"
      >
        Next
      </SafeButton>
      <SafeButton 
        onClick={() => onPageChange && onPageChange(totalPages)} 
        disabled={currentPage >= totalPages}
        variant="outline"
        size="small"
      >
        Last
      </SafeButton>
    </div>
  );
};

const FallbackMemberForm = ({ member, onSubmit, onCancel, isEditing = false }) => {
  const SafeButton = Button || FallbackButton;
  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    preferred_name: member?.preferred_name || '',
    date_of_birth: member?.date_of_birth || '',
    gender: member?.gender || '',
    address: member?.address || '',
    preferred_contact_method: member?.preferred_contact_method || 'email'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name:</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name:</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Preferred Name (optional):</label>
        <input
          type="text"
          value={formData.preferred_name}
          onChange={(e) => handleInputChange('preferred_name', e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone:</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth:</label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender:</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Preferred Contact:</label>
          <select
            value={formData.preferred_contact_method}
            onChange={(e) => handleInputChange('preferred_contact_method', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="sms">SMS</option>
            <option value="mail">Mail</option>
            <option value="no_contact">No Contact</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address (optional):</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows="3"
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <SafeButton type="button" onClick={onCancel} variant="outline">
          Cancel
        </SafeButton>
        <SafeButton type="submit" variant="primary">
          {isEditing ? 'Update' : 'Create'} Member
        </SafeButton>
      </div>
    </form>
  );
};

const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize')) || 25);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [ageFilter, setAgeFilter] = useState(searchParams.get('age') || 'all');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [joinDateFilter, setJoinDateFilter] = useState(searchParams.get('joinDate') || 'all');

  // Safe hook initialization
  let members = [], totalMembers = 0, loading = false, error = null;
  let createMember, updateMember, deleteMember, searchMembers, exportMembers;
  let showToast = () => {};

  try {
    const membersHook = useMembers();
    if (membersHook) {
      ({
        members = [],
        totalMembers = 0,
        loading = false,
        error = null,
        createMember,
        updateMember,
        deleteMember,
        searchMembers,
        exportMembers
      } = membersHook);
    }
  } catch (hookError) {
    console.error('useMembers hook error:', hookError);
    error = 'Failed to initialize members data';
  }

  try {
    const toastHook = useToast();
    if (toastHook?.showToast) {
      showToast = toastHook.showToast;
    }
  } catch (hookError) {
    console.error('useToast hook error:', hookError);
  }

  // Safe members array
  const safeMembers = Array.isArray(members) ? members : [];

  // Use fallback components if imports failed
  const SafeButton = Button || FallbackButton;
  const SafeCard = Card || FallbackCard;
  const SafeLoadingSpinner = LoadingSpinner || FallbackLoadingSpinner;
  const SafeSearchBar = SearchBar || FallbackSearchBar;
  const SafeMembersList = MembersList || FallbackMembersList;
  const SafeMemberFilters = MemberFilters || FallbackMemberFilters;
  const SafePagination = Pagination || FallbackPagination;
  const SafeMemberForm = MemberForm || FallbackMemberForm;
  const SafeModal = Modal;
  const SafeConfirmDialog = ConfirmDialog;

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (ageFilter !== 'all') params.set('age', ageFilter);
    if (groupFilter !== 'all') params.set('group', groupFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (joinDateFilter !== 'all') params.set('joinDate', joinDateFilter);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (pageSize !== 25) params.set('pageSize', pageSize.toString());
    setSearchParams(params);
  }, [searchQuery, ageFilter, groupFilter, statusFilter, joinDateFilter, currentPage, pageSize, setSearchParams]);

  // Fetch members when filters change
  useEffect(() => {
    if (searchMembers) {
      const filters = {
        search: searchQuery,
        age: ageFilter !== 'all' ? ageFilter : null,
        group: groupFilter !== 'all' ? groupFilter : null,
        status: statusFilter !== 'all' ? statusFilter : null,
        joinDate: joinDateFilter !== 'all' ? joinDateFilter : null,
        page: currentPage,
        pageSize: pageSize
      };
      searchMembers(filters);
    }
  }, [searchQuery, ageFilter, groupFilter, statusFilter, joinDateFilter, currentPage, pageSize, searchMembers]);

  const handleCreateMember = async (memberData) => {
    try {
      if (createMember) {
        const newMember = await createMember(memberData);
        setShowForm(false);
        showToast('Member created successfully', 'success');
        if (newMember?.id) {
          navigate(`/admin/members/${newMember.id}`);
        }
      }
    } catch (error) {
      showToast('Failed to create member', 'error');
      console.error('Create member error:', error);
    }
  };

  const handleUpdateMember = async (memberId, memberData) => {
    try {
      if (updateMember) {
        await updateMember(memberId, memberData);
        setSelectedMember(null);
        setShowForm(false);
        showToast('Member updated successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to update member', 'error');
      console.error('Update member error:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      if (deleteMember) {
        await deleteMember(memberId);
        showToast('Member deleted successfully', 'success');
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      showToast('Failed to delete member', 'error');
      console.error('Delete member error:', error);
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowForm(true);
  };

  const handleViewMember = (memberId) => {
    navigate(`/admin/members/${memberId}`);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedMember(null);
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      const isSelected = prev.includes(memberId);
      if (isSelected) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllMembers = (selectAll) => {
    if (selectAll) {
      setSelectedMembers(safeMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleExportMembers = async () => {
    try {
      if (exportMembers) {
        const filters = {
          search: searchQuery,
          age: ageFilter !== 'all' ? ageFilter : null,
          group: groupFilter !== 'all' ? groupFilter : null,
          status: statusFilter !== 'all' ? statusFilter : null,
          joinDate: joinDateFilter !== 'all' ? joinDateFilter : null
        };
        await exportMembers(filters);
        showToast('Members exported successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to export members', 'error');
      console.error('Export error:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setAgeFilter('all');
    setGroupFilter('all');
    setStatusFilter('all');
    setJoinDateFilter('all');
    setCurrentPage(1);
  };

  const confirmDelete = (memberId) => {
    setDeleteConfirmId(memberId);
  };

  if (loading && safeMembers.length === 0) {
    return (
      <div className={styles.loadingContainer} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
        <SafeLoadingSpinner />
        <p style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>Loading members...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalMembers / pageSize);

  return (
    <div className={styles.membersPage} style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div>
          <h1 className={styles.pageTitle} style={{ 
            margin: '0 0 5px 0', 
            fontSize: '28px',
            fontWeight: '700',
            color: '#333'
          }}>
            Members Management
          </h1>
          <p className={styles.pageSubtitle} style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '16px'
          }}>
            Manage church members and their information ({totalMembers} total)
          </p>
        </div>
        <div className={styles.headerActions} style={{ display: 'flex', gap: '10px' }}>
          <SafeButton
            variant="outline"
            onClick={handleExportMembers}
            disabled={safeMembers.length === 0}
          >
            Export CSV
          </SafeButton>
          <SafeButton
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            Add New Member
          </SafeButton>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedMembers.length > 0 && (
        <SafeCard className={styles.bulkActionsCard}>
          <div className={styles.bulkActionsContent} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div className={styles.bulkActionsInfo}>
              <span className={styles.selectedCount} style={{ 
                marginRight: '15px',
                fontWeight: '600',
                color: '#007bff'
              }}>
                {selectedMembers.length} members selected
              </span>
              <SafeButton
                variant="outline"
                size="small"
                onClick={() => setSelectedMembers([])}
              >
                Clear Selection
              </SafeButton>
            </div>
          </div>
        </SafeCard>
      )}

      {/* Search and Filters */}
      <SafeCard className={styles.filtersCard}>
        <div className={styles.filtersContent}>
          <div className={styles.searchRow} style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'flex-end', 
            marginBottom: '15px' 
          }}>
            <div className={styles.searchContainer} style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                Search Members:
              </label>
              <SafeSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search members by name, email, or phone..."
                className={styles.searchInput}
              />
            </div>
            <SafeButton
              variant="outline"
              onClick={clearFilters}
              disabled={
                !searchQuery && 
                ageFilter === 'all' && 
                groupFilter === 'all' && 
                statusFilter === 'all' && 
                joinDateFilter === 'all'
              }
            >
              Clear Filters
            </SafeButton>
          </div>
          
          <SafeMemberFilters
            ageFilter={ageFilter}
            groupFilter={groupFilter}
            statusFilter={statusFilter}
            joinDateFilter={joinDateFilter}
            onAgeChange={setAgeFilter}
            onGroupChange={setGroupFilter}
            onStatusChange={setStatusFilter}
            onJoinDateChange={setJoinDateFilter}
          />
        </div>
      </SafeCard>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer} style={{ 
          padding: '20px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <div className={styles.errorContent}>
            <div className={styles.errorMessage}>
              <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Error Loading Members</h4>
              <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <SafeCard className={styles.membersListCard}>
        <SafeMembersList
          members={safeMembers}
          selectedMembers={selectedMembers}
          onSelectMember={handleSelectMember}
          onSelectAllMembers={handleSelectAllMembers}
          onEdit={handleEditMember}
          onDelete={confirmDelete}
          onView={handleViewMember}
          loading={loading}
        />
      </SafeCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer} style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div className={styles.pageSizeSelector} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <span className={styles.pageSizeLabel}>Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className={styles.pageSizeSelect}
              style={{ 
                padding: '5px 10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className={styles.pageSizeLabel}>per page</span>
          </div>
          
          <SafePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Member Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div className={styles.modalContent} style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            maxWidth: '700px', 
            width: '90%', 
            maxHeight: '90vh', 
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <div className={styles.modalHeader} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <h2 className={styles.modalTitle} style={{ 
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#333'
              }}>
                {selectedMember ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button
                onClick={handleCloseForm}
                className={styles.modalCloseButton}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer', 
                  padding: '0', 
                  width: '30px', 
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  borderRadius: '50%'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            {SafeModal && SafeMemberForm ? (
              <SafeModal
                isOpen={showForm}
                onClose={handleCloseForm}
                title={selectedMember ? 'Edit Member' : 'Add New Member'}
                size="large"
              >
                <SafeMemberForm
                  member={selectedMember}
                  onSubmit={selectedMember ? 
                    (data) => handleUpdateMember(selectedMember.id, data) : 
                    handleCreateMember
                  }
                  onCancel={handleCloseForm}
                  isEditing={!!selectedMember}
                />
              </SafeModal>
            ) : (
              <SafeMemberForm
                member={selectedMember}
                onSubmit={selectedMember ? 
                  (data) => handleUpdateMember(selectedMember.id, data) : 
                  handleCreateMember
                }
                onCancel={handleCloseForm}
                isEditing={!!selectedMember}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay} style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div className={styles.confirmDialog} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#dc3545',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Delete Member
            </h3>
            <p style={{ 
              margin: '0 0 25px 0', 
              color: '#666',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this member? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <SafeButton
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </SafeButton>
              <SafeButton
                variant="danger"
                onClick={() => handleDeleteMember(deleteConfirmId)}
              >
                Delete
              </SafeButton>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      {Toast && <Toast />}
    </div>
  );
};

export default MembersPage;