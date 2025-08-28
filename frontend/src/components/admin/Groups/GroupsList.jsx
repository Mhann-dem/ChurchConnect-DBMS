import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users, Calendar, MapPin, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import GroupCard from './GroupCard';
import GroupForm from './GroupForm';
import { useGroups } from '../../../hooks/useGroups';
import { useToast } from '../../../hooks/useToast';
import styles from './Groups.module.css';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Modal from '../../ui/Modal';
import SearchBar from '../../ui/SearchBar';
import ConfirmDialog from '../../ui/ConfirmDialog';

const GroupsList = () => {
  const navigate = useNavigate();
  const { 
    groups, 
    loading, 
    error, 
    refreshGroups, 
    deleteGroup,
    searchGroups,
    filterGroups 
  } = useGroups();
  
  const { showToast } = useToast();
  const mountedRef = useRef(true);
  const searchTimeoutRef = useRef(null);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [localGroups, setLocalGroups] = useState([]); // Local filtered state

  // FIXED: Single effect for initial load only
  useEffect(() => {
    console.log('[GroupsList] Component mounted, loading groups...');
    
    // Only fetch if we don't have groups yet
    if (groups.length === 0 && !loading) {
      refreshGroups();
    }
    
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount

  // FIXED: Update local groups when groups change
  useEffect(() => {
    setLocalGroups(groups);
  }, [groups]);

  // FIXED: Stable search handler with debouncing
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search to prevent excessive API calls
    searchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.log('[GroupsList] Performing debounced search:', newSearchTerm);
        
        if (newSearchTerm.trim()) {
          // Use the hook's search function
          searchGroups(newSearchTerm.trim());
        } else {
          // If search is empty, refresh all groups
          refreshGroups();
        }
      }
    }, 500); // 500ms debounce
  }, [searchGroups, refreshGroups]);

  // FIXED: Stable filter handler
  const handleFilterChange = useCallback((newFilter) => {
    console.log('[GroupsList] Filter changed:', newFilter);
    setFilterStatus(newFilter);
    
    // Convert filter status to API format
    const filterValue = newFilter === 'all' ? null : (newFilter === 'active');
    
    // Use the hook's filter function
    filterGroups({ active: filterValue });
  }, [filterGroups]);

  // Filter groups locally for immediate UI feedback
  const filteredGroups = localGroups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.leader_name && group.leader_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && group.active) ||
                         (filterStatus === 'inactive' && !group.active);
    
    return matchesSearch && matchesFilter;
  });

  // FIXED: Stable event handlers
  const handleCreateGroup = useCallback(() => {
    setSelectedGroup(null);
    setShowCreateForm(true);
  }, []);

  const handleEditGroup = useCallback((group) => {
    setSelectedGroup(group);
    setShowEditForm(true);
  }, []);

  const handleDeleteGroup = useCallback((group) => {
    setGroupToDelete(group);
    setShowDeleteDialog(true);
  }, []);

  const handleViewGroup = useCallback((group) => {
    navigate(`/admin/groups/${group.id}`);
  }, [navigate]);

  // FIXED: Stable delete confirmation
  const confirmDelete = useCallback(async () => {
    if (groupToDelete && mountedRef.current) {
      try {
        await deleteGroup(groupToDelete.id);
        showToast('Group deleted successfully', 'success');
        setShowDeleteDialog(false);
        setGroupToDelete(null);
        
        // Remove from local state immediately for better UX
        setLocalGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
        
        // Refresh the list from server
        refreshGroups();
      } catch (error) {
        console.error('[GroupsList] Delete error:', error);
        showToast('Failed to delete group', 'error');
      }
    }
  }, [groupToDelete, deleteGroup, showToast, refreshGroups]);

  // FIXED: Stable form handlers
  const handleFormSuccess = useCallback(() => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedGroup(null);
    
    // Show success message
    showToast(
      selectedGroup ? 'Group updated successfully' : 'Group created successfully', 
      'success'
    );
    
    // Refresh the list
    refreshGroups();
  }, [selectedGroup, showToast, refreshGroups]);

  const handleFormCancel = useCallback(() => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedGroup(null);
  }, []);

  if (loading && localGroups.length === 0) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && localGroups.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Groups</h3>
          <p>{error}</p>
          <button onClick={() => refreshGroups()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Groups & Ministries</h1>
          <p className={styles.subtitle}>
            Manage church groups, ministries, and their members
          </p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreateGroup}
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Filters and Search */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search groups, leaders, or descriptions..."
            className={styles.searchBar}
          />
        </div>
        
        <div className={styles.filters}>
          <select 
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Groups</option>
            <option value="active">Active Groups</option>
            <option value="inactive">Inactive Groups</option>
          </select>
          
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <div className={styles.gridIcon}></div>
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <div className={styles.listIcon}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{localGroups.length}</span>
            <span className={styles.statLabel}>Total Groups</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{localGroups.filter(g => g.active).length}</span>
            <span className={styles.statLabel}>Active Groups</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MapPin size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {localGroups.reduce((total, group) => total + (group.member_count || 0), 0)}
            </span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
        </div>
      </div>

      {/* Groups Grid/List */}
      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner size="small" />
            <span>Loading groups...</span>
          </div>
        )}
        
        {filteredGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3>No groups found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'No groups match your current filters.' 
                : 'Create your first group to get started.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                className={styles.createButton}
                onClick={handleCreateGroup}
              >
                <Plus size={16} />
                Create First Group
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'cards' ? styles.groupsGrid : styles.groupsList}>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onView={handleViewGroup}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={handleFormCancel}
        title="Create New Group"
        className={styles.formModal}
      >
        <GroupForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={handleFormCancel}
        title="Edit Group"
        className={styles.formModal}
      >
        <GroupForm
          group={selectedGroup}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${groupToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default GroupsList;