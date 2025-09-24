// Enhanced GroupMembers.jsx - Updated with success handling
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, Download, Mail, Phone, Crown, 
  Users, Calendar, MapPin, MoreVertical, Edit, Trash2, UserPlus,
  UserMinus, Shield, Star, Clock, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import { useFormSubmission } from '../../../hooks/useFormSubmission';
import FormContainer from '../../shared/FormContainer';
import { useRealTimeUpdates } from '../../../hooks/useRealTimeUpdates';
import LoadingSpinner from '../../shared/LoadingSpinner';
import SearchBar from '../../shared/SearchBar';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Card from '../../ui/Card';
import EmptyState from '../../shared/EmptyState';
import styles from './Groups.module.css';

const GroupMembers = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [showFilters, setShowFilters] = useState(false);

  // Custom hooks
  const { 
    groupMembers, 
    availableMembers, 
    group, 
    loading, 
    error, 
    fetchGroupMembers, 
    fetchAvailableMembers,
    addMembersToGroup, 
    removeMemberFromGroup,
    updateMemberRole,
    getGroupById
  } = useGroups();

  const { exportMemberData } = useMembers();

  // Form submission handlers for different operations
  const {
    isSubmitting: addingMembers,
    showSuccess: showAddSuccess,
    submissionError: addError,
    handleSubmit: handleAddSubmit,
    clearError: clearAddError
  } = useFormSubmission({
    onSubmit: async (memberIds) => {
      const result = await addMembersToGroup(groupId, memberIds);
      await fetchAvailableMembers(groupId); // Refresh available members
      return result;
    },
    onSuccess: (result, memberIds) => {
      setShowAddMemberModal(false);
      setSelectedMembers([]);
      showToast(`${memberIds.length} member(s) added to group successfully`, 'success');
    },
    successMessage: 'Members added to group successfully!',
    autoCloseDelay: 2000
  });

  const {
    isSubmitting: removingMember,
    showSuccess: showRemoveSuccess,
    submissionError: removeError,
    handleSubmit: handleRemoveSubmit,
    clearError: clearRemoveError
  } = useFormSubmission({
    onSubmit: async (memberId) => {
      const result = await removeMemberFromGroup(groupId, memberId);
      await fetchAvailableMembers(groupId); // Refresh available members
      return result;
    },
    onSuccess: () => {
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
      showToast('Member removed from group successfully', 'success');
    },
    successMessage: 'Member removed from group successfully!',
    autoCloseDelay: 1500
  });

  const {
    isSubmitting: bulkRemoving,
    showSuccess: showBulkRemoveSuccess,
    submissionError: bulkRemoveError,
    handleSubmit: handleBulkRemoveSubmit,
    clearError: clearBulkRemoveError
  } = useFormSubmission({
    onSubmit: async (memberIds) => {
      const results = await Promise.all(
        memberIds.map(memberId => removeMemberFromGroup(groupId, memberId))
      );
      await fetchAvailableMembers(groupId); // Refresh available members
      return results;
    },
    onSuccess: (results, memberIds) => {
      setSelectedMembers([]);
      setShowBulkRemoveConfirm(false);
      showToast(`${memberIds.length} members removed from group successfully`, 'success');
    },
    successMessage: 'Selected members removed successfully!',
    autoCloseDelay: 2000
  });

  // Real-time updates for group members
  useRealTimeUpdates(`group-${groupId}-members`, {
    onMemberAdded: (groupIdUpdate, member) => {
      if (groupIdUpdate === groupId) {
        showToast(`${member.name} joined the group`, 'success');
        fetchGroupMembers(groupId);
      }
    },
    onMemberRemoved: (groupIdUpdate, memberId) => {
      if (groupIdUpdate === groupId) {
        showToast('Member left the group', 'info');
        fetchGroupMembers(groupId);
      }
    },
    onMemberRoleUpdated: (groupIdUpdate, memberId, newRole) => {
      if (groupIdUpdate === groupId) {
        showToast(`Member role updated to ${newRole}`, 'success');
        fetchGroupMembers(groupId);
      }
    }
  });

  // Fetch group and members data
  useEffect(() => {
    if (groupId) {
      fetchGroupMembers(groupId);
      fetchAvailableMembers(groupId);
      getGroupById(groupId);
    }
  }, [groupId, fetchGroupMembers, fetchAvailableMembers, getGroupById]);

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    if (!groupMembers) return [];

    let filtered = groupMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.member_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.member_phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && member.status === 'active') ||
        (filterStatus === 'inactive' && member.status === 'inactive') ||
        (filterStatus === 'pending' && member.status === 'pending');
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.member_name.toLowerCase();
          bValue = b.member_name.toLowerCase();
          break;
        case 'role':
          const roleOrder = { 'leader': 1, 'co-leader': 2, 'coordinator': 3, 'member': 4 };
          aValue = roleOrder[a.role] || 5;
          bValue = roleOrder[b.role] || 5;
          break;
        case 'joinDate':
          aValue = new Date(a.join_date);
          bValue = new Date(b.join_date);
          break;
        case 'status':
          const statusOrder = { 'active': 1, 'pending': 2, 'inactive': 3 };
          aValue = statusOrder[a.status] || 4;
          bValue = statusOrder[b.status] || 4;
          break;
        default:
          aValue = a.member_name.toLowerCase();
          bValue = b.member_name.toLowerCase();
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [groupMembers, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  // Member statistics
  const memberStats = useMemo(() => {
    if (!groupMembers) return { total: 0, active: 0, pending: 0, leaders: 0 };

    const total = groupMembers.length;
    const active = groupMembers.filter(m => m.status === 'active').length;
    const pending = groupMembers.filter(m => m.status === 'pending').length;
    const leaders = groupMembers.filter(m => ['leader', 'co-leader', 'coordinator'].includes(m.role)).length;

    return { total, active, pending, leaders };
  }, [groupMembers]);

  // Handle member selection
  const handleMemberSelect = useCallback((memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedMembers.length === filteredAndSortedMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredAndSortedMembers.map(member => member.member_id));
    }
  }, [selectedMembers.length, filteredAndSortedMembers]);

  // Handle adding members to group
  const handleAddMembers = useCallback(async (memberIds) => {
    clearAddError();
    await handleAddSubmit(memberIds);
  }, [handleAddSubmit, clearAddError]);

  // Handle removing member from group
  const handleRemoveMember = useCallback(async () => {
    if (memberToRemove) {
      clearRemoveError();
      await handleRemoveSubmit(memberToRemove.member_id);
    }
  }, [memberToRemove, handleRemoveSubmit, clearRemoveError]);

  // Handle bulk remove
  const handleBulkRemove = useCallback(async () => {
    clearBulkRemoveError();
    await handleBulkRemoveSubmit(selectedMembers);
  }, [selectedMembers, handleBulkRemoveSubmit, clearBulkRemoveError]);

  // Handle role update
  const handleRoleUpdate = useCallback(async (memberId, newRole) => {
    try {
      await updateMemberRole(groupId, memberId, newRole);
      showToast('Member role updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update member role', 'error');
    }
  }, [groupId, updateMemberRole, showToast]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const memberIds = selectedMembers.length > 0 ? selectedMembers : groupMembers.map(m => m.member_id);
      await exportMemberData(memberIds, 'csv');
      showToast('Members exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export members', 'error');
    }
  }, [selectedMembers, groupMembers, exportMemberData, showToast]);

  // Format join date
  const formatJoinDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Get role badge variant
  const getRoleBadgeVariant = useCallback((role) => {
    switch (role) {
      case 'leader':
        return 'primary';
      case 'co-leader':
        return 'secondary';
      case 'coordinator':
        return 'warning';
      default:
        return 'default';
    }
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  }, []);

  if (loading && !groupMembers) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading group members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h3>Error loading group members</h3>
        <p>{error}</p>
        <Button onClick={() => navigate('/admin/groups')}>
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.groupMembersContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/groups')}
              className={styles.backButton}
              icon={ArrowLeft}
            >
              Back to Groups
            </Button>
            <div className={styles.titleSection}>
              <h1>{group?.name} Members</h1>
              <div className={styles.headerMeta}>
                <Badge variant="info">
                  {filteredAndSortedMembers.length} of {memberStats.total} members
                </Badge>
                {group?.category && (
                  <Badge variant="secondary">{group.category}</Badge>
                )}
                {!group?.is_public && (
                  <Badge variant="warning">Private</Badge>
                )}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              icon={Download}
              disabled={filteredAndSortedMembers.length === 0}
            >
              Export
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddMemberModal(true)}
              icon={Plus}
            >
              Add Members
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <Users size={20} />
            <div>
              <h3>Total Members</h3>
              <span className={styles.statValue}>{memberStats.total}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <CheckCircle size={20} />
            <div>
              <h3>Active</h3>
              <span className={styles.statValue}>{memberStats.active}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <Clock size={20} />
            <div>
              <h3>Pending</h3>
              <span className={styles.statValue}>{memberStats.pending}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <Crown size={20} />
            <div>
              <h3>Leaders</h3>
              <span className={styles.statValue}>{memberStats.leaders}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchAndFilters}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search members..."
            className={styles.searchBar}
          />
          
          <div className={styles.viewControls}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="role">Sort by Role</option>
              <option value="joinDate">Sort by Join Date</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={styles.sortOrderButton}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            
            <div className={styles.viewModeToggle}>
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className={styles.filtersCard}>
            <div className={styles.filtersHeader}>
              <h3>Filters</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterRole('all');
                  setFilterStatus('all');
                }}
              >
                Clear
              </Button>
            </div>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Roles</option>
                  <option value="leader">Leaders</option>
                  <option value="co-leader">Co-Leaders</option>
                  <option value="coordinator">Coordinators</option>
                  <option value="member">Members</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Bulk Actions */}
        {selectedMembers.length > 0 && (
          <Card className={styles.bulkActions}>
            <div className={styles.bulkActionContent}>
              <span className={styles.selectionCount}>
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </span>
              <div className={styles.bulkActionButtons}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  Export Selected
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBulkRemoveConfirm(true)}
                >
                  Remove Selected
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Members List */}
      {filteredAndSortedMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description={
            searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'This group has no members yet'
          }
          action={
            searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? {
                  label: 'Clear Filters',
                  action: () => {
                    setSearchTerm('');
                    setFilterRole('all');
                    setFilterStatus('all');
                  }
                }
              : {
                  label: 'Add First Member',
                  action: () => setShowAddMemberModal(true)
                }
          }
        />
      ) : (
        <>
          {/* Select All Header */}
          <div className={styles.selectAllHeader}>
            <label className={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={selectedMembers.length === filteredAndSortedMembers.length && filteredAndSortedMembers.length > 0}
                onChange={handleSelectAll}
                className={styles.selectAllCheckbox}
              />
              Select All ({filteredAndSortedMembers.length})
            </label>
          </div>

          {/* Members Display */}
          {viewMode === 'cards' ? (
            <div className={styles.membersGrid}>
              {filteredAndSortedMembers.map((member) => (
                <MemberCard
                  key={member.member_id}
                  member={member}
                  selected={selectedMembers.includes(member.member_id)}
                  onSelect={() => handleMemberSelect(member.member_id)}
                  onRoleUpdate={handleRoleUpdate}
                  onRemove={(member) => {
                    setMemberToRemove(member);
                    setShowRemoveConfirm(true);
                  }}
                  formatJoinDate={formatJoinDate}
                  getRoleBadgeVariant={getRoleBadgeVariant}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          ) : (
            <div className={styles.membersList}>
              <div className={styles.listHeader}>
                <div>Member</div>
                <div>Role</div>
                <div>Status</div>
                <div>Joined</div>
                <div>Contact</div>
                <div>Actions</div>
              </div>
              
              {filteredAndSortedMembers.map((member) => (
                <MemberListItem
                  key={member.member_id}
                  member={member}
                  selected={selectedMembers.includes(member.member_id)}
                  onSelect={() => handleMemberSelect(member.member_id)}
                  onRoleUpdate={handleRoleUpdate}
                  onRemove={(member) => {
                    setMemberToRemove(member);
                    setShowRemoveConfirm(true);
                  }}
                  formatJoinDate={formatJoinDate}
                  getRoleBadgeVariant={getRoleBadgeVariant}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading overlay */}
      {(loading && groupMembers) || addingMembers || removingMember || bulkRemoving ? (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </div>
      ) : null}

      {/* Add Members Modal with Success Handling */}
      {showAddMemberModal && (
        <FormContainer
          title="Add Members to Group"
          onClose={() => setShowAddMemberModal(false)}
          showSuccess={showAddSuccess}
          successMessage="Members added to group successfully!"
          submissionError={addError}
          isSubmitting={addingMembers}
          maxWidth="700px"
        >
          <AddMembersForm
            availableMembers={availableMembers}
            onAddMembers={handleAddMembers}
            onCancel={() => setShowAddMemberModal(false)}
            loading={loading || addingMembers}
          />
        </FormContainer>
      )}

      {/* Remove Confirmation Dialog with Success Handling */}
      {showRemoveConfirm && (
        <FormContainer
          title="Remove Member"
          onClose={() => setShowRemoveConfirm(false)}
          showSuccess={showRemoveSuccess}
          successMessage="Member removed from group successfully!"
          submissionError={removeError}
          isSubmitting={removingMember}
          maxWidth="400px"
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Remove Member</h3>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              Are you sure you want to remove {memberToRemove?.member_name} from this group?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
                disabled={removingMember}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveMember}
                disabled={removingMember}
              >
                {removingMember ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </FormContainer>
      )}

      {/* Bulk Remove Confirmation Dialog with Success Handling */}
      {showBulkRemoveConfirm && (
        <FormContainer
          title="Remove Members"
          onClose={() => setShowBulkRemoveConfirm(false)}
          showSuccess={showBulkRemoveSuccess}
          successMessage="Selected members removed successfully!"
          submissionError={bulkRemoveError}
          isSubmitting={bulkRemoving}
          maxWidth="400px"
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Remove Members</h3>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              Are you sure you want to remove {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} from this group?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setShowBulkRemoveConfirm(false)}
                disabled={bulkRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleBulkRemove}
                disabled={bulkRemoving}
              >
                {bulkRemoving ? 'Removing...' : 'Remove All'}
              </Button>
            </div>
          </div>
        </FormContainer>
      )}
    </div>
  );
};

// Member Card Component
const MemberCard = ({ 
  member, 
  selected, 
  onSelect, 
  onRoleUpdate, 
  onRemove,
  formatJoinDate,
  getRoleBadgeVariant,
  getStatusBadge
}) => {
  return (
    <Card className={`${styles.memberCard} ${selected ? styles.selected : ''}`}>
      <div className={styles.memberCardHeader}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className={styles.memberCheckbox}
        />
        <Avatar
          src={member.photo_url}
          alt={member.member_name}
          size="sm"
          className={styles.memberAvatar}
        />
        <div className={styles.memberDetails}>
          <strong>{member.member_name}</strong>
          <span>{member.member_email}</span>
        </div>
      </div>
      
      <div className={styles.memberCell}>
        <Badge variant={getRoleBadgeVariant(member.role)}>
          {member.role || 'Member'}
        </Badge>
      </div>
      
      <div className={styles.memberCell}>
        {getStatusBadge(member.status)}
      </div>
      
      <div className={styles.memberCell}>
        {formatJoinDate(member.join_date)}
      </div>
      
      <div className={styles.memberCell}>
        <div className={styles.contactInfo}>
          {member.member_phone && (
            <div className={styles.contactItem}>
              <Phone size={12} />
              <span>{member.member_phone}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.memberCell}>
        <div className={styles.listActions}>
          <select
            value={member.role || 'member'}
            onChange={(e) => onRoleUpdate(member.member_id, e.target.value)}
            className={styles.roleSelectSmall}
          >
            <option value="member">Member</option>
            <option value="coordinator">Coordinator</option>
            <option value="co-leader">Co-Leader</option>
            <option value="leader">Leader</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(member)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Member List Item Component
const MemberListItem = ({ 
  member, 
  selected, 
  onSelect, 
  onRoleUpdate, 
  onRemove,
  formatJoinDate,
  getRoleBadgeVariant,
  getStatusBadge
}) => {
  return (
    <div className={`${styles.memberListItem} ${selected ? styles.selected : ''}`}>
      <div className={styles.memberCell}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className={styles.memberCheckbox}
        />
        <Avatar
          src={member.photo_url}
          alt={member.member_name}
          size="sm"
          className={styles.memberAvatar}
        />
        <div className={styles.memberDetails}>
          <strong>{member.member_name}</strong>
          <span>{member.member_email}</span>
        </div>
      </div>
      
      <div className={styles.memberCell}>
        <Badge variant={getRoleBadgeVariant(member.role)}>
          {member.role || 'Member'}
        </Badge>
      </div>
      
      <div className={styles.memberCell}>
        {getStatusBadge(member.status)}
      </div>
      
      <div className={styles.memberCell}>
        {formatJoinDate(member.join_date)}
      </div>
      
      <div className={styles.memberCell}>
        <div className={styles.contactInfo}>
          {member.member_phone && (
            <div className={styles.contactItem}>
              <Phone size={12} />
              <span>{member.member_phone}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.memberCell}>
        <div className={styles.listActions}>
          <select
            value={member.role || 'member'}
            onChange={(e) => onRoleUpdate(member.member_id, e.target.value)}
            className={styles.roleSelectSmall}
          >
            <option value="member">Member</option>
            <option value="coordinator">Coordinator</option>
            <option value="co-leader">Co-Leader</option>
            <option value="leader">Leader</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(member)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Add Members Form Component
const AddMembersForm = ({ availableMembers, onAddMembers, onCancel, loading }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    if (!availableMembers) return [];
    
    return availableMembers.filter(member =>
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableMembers, searchTerm]);

  const handleMemberToggle = useCallback((memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id));
    }
  }, [selectedMembers.length, filteredMembers]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (selectedMembers.length > 0) {
      onAddMembers(selectedMembers);
    }
  }, [selectedMembers, onAddMembers]);

  return (
    <form onSubmit={handleSubmit} className={styles.addMembersForm}>
      <div className={styles.formHeader}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search available members..."
          className={styles.modalSearchBar}
          disabled={loading}
        />
        
        <div className={styles.selectAllContainer}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length}
              onChange={handleSelectAll}
              disabled={filteredMembers.length === 0 || loading}
            />
            Select All ({filteredMembers.length})
          </label>
          
          {selectedMembers.length > 0 && (
            <span className={styles.selectedCount}>
              {selectedMembers.length} selected
            </span>
          )}
        </div>
      </div>
      
      <div className={styles.availableMembersList}>
        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner size="small" />
            <p>Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No available members"
            description={
              searchTerm 
                ? "No members match your search criteria"
                : "All active members are already in this group"
            }
          />
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className={styles.availableMemberItem}>
              <label className={styles.memberCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className={styles.memberCheckbox}
                  disabled={loading}
                />
                <Avatar
                  src={member.photo_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  size="sm"
                  className={styles.memberAvatar}
                />
                <div className={styles.memberDetails}>
                  <span className={styles.memberName}>
                    {member.first_name} {member.last_name}
                  </span>
                  <span className={styles.memberEmail}>{member.email}</span>
                  {member.phone && (
                    <span className={styles.memberPhone}>{member.phone}</span>
                  )}
                </div>
              </label>
            </div>
          ))
        )}
      </div>
      
      <div className={styles.modalActions} style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb',
        marginTop: '20px'
      }}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={selectedMembers.length === 0 || loading}
          icon={loading ? undefined : UserPlus}
        >
          {loading 
            ? 'Adding...' 
            : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </form>
  );
};

export default GroupMembers;