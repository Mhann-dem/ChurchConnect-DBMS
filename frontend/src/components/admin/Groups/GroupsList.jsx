import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users, Calendar, MapPin, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import GroupCard from './GroupCard';
import GroupForm from './GroupForm';
import { useGroups } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../shared/LoadingSpinner';
import Modal from '../shared/Modal';
import SearchBar from '../shared/SearchBar';
import ConfirmDialog from '../shared/ConfirmDialog';
import styles from './Groups.module.css';

const GroupsList = () => {
  const navigate = useNavigate();
  const { groups, loading, error, fetchGroups, deleteGroup } = useGroups();
  const { showToast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter groups based on search term and status
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.leader_name && group.leader_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && group.active) ||
                         (filterStatus === 'inactive' && !group.active);
    
    return matchesSearch && matchesFilter;
  });

  // Handle create group
  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowCreateForm(true);
  };

  // Handle edit group
  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setShowEditForm(true);
  };

  // Handle delete group
  const handleDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (groupToDelete) {
      try {
        await deleteGroup(groupToDelete.id);
        showToast('Group deleted successfully', 'success');
        setShowDeleteDialog(false);
        setGroupToDelete(null);
        fetchGroups(); // Refresh the list
      } catch (error) {
        showToast('Failed to delete group', 'error');
      }
    }
  };

  // Handle view group details
  const handleViewGroup = (group) => {
    navigate(`/admin/groups/${group.id}`);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedGroup(null);
    fetchGroups();
    showToast(selectedGroup ? 'Group updated successfully' : 'Group created successfully', 'success');
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedGroup(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Groups</h3>
          <p>{error}</p>
          <button onClick={fetchGroups} className={styles.retryButton}>
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
            onChange={setSearchTerm}
            placeholder="Search groups, leaders, or descriptions..."
            className={styles.searchBar}
          />
        </div>
        
        <div className={styles.filters}>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
            <span className={styles.statValue}>{groups.length}</span>
            <span className={styles.statLabel}>Total Groups</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{groups.filter(g => g.active).length}</span>
            <span className={styles.statLabel}>Active Groups</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MapPin size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {groups.reduce((total, group) => total + (group.member_count || 0), 0)}
            </span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
        </div>
      </div>

      {/* Groups Grid/List */}
      <div className={styles.content}>
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