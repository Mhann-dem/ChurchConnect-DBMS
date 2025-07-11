import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Groups.module.css';
import { useGroups } from '../../../hooks/useGroups';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/LoadingSpinner';
import SearchBar from '../../shared/SearchBar';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Card from '../../ui/Card';

const GroupMembers = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');

  // Custom hooks
  const { 
    groupMembers, 
    availableMembers, 
    group, 
    loading, 
    error, 
    fetchGroupMembers, 
    addMembersToGroup, 
    removeMemberFromGroup,
    updateMemberRole,
    getGroupById
  } = useGroups();

  const { members } = useMembers();

  // Fetch group and members data
  useEffect(() => {
    if (groupId) {
      fetchGroupMembers(groupId);
      getGroupById(groupId);
    }
  }, [groupId, fetchGroupMembers, getGroupById]);

  // Filter and sort members
  const filteredMembers = groupMembers
    .filter(member => {
      const matchesSearch = member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.member_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.member_name.toLowerCase();
          bValue = b.member_name.toLowerCase();
          break;
        case 'role':
          aValue = a.role || 'member';
          bValue = b.role || 'member';
          break;
        case 'joinDate':
          aValue = new Date(a.join_date);
          bValue = new Date(b.join_date);
          break;
        default:
          aValue = a.member_name.toLowerCase();
          bValue = b.member_name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle member selection
  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.member_id));
    }
  };

  // Handle adding members to group
  const handleAddMembers = async (memberIds) => {
    try {
      await addMembersToGroup(groupId, memberIds);
      setShowAddMemberModal(false);
      showToast('Members added to group successfully', 'success');
    } catch (error) {
      showToast('Failed to add members to group', 'error');
    }
  };

  // Handle removing member from group
  const handleRemoveMember = async () => {
    if (memberToRemove) {
      try {
        await removeMemberFromGroup(groupId, memberToRemove.member_id);
        setShowRemoveConfirm(false);
        setMemberToRemove(null);
        showToast('Member removed from group successfully', 'success');
      } catch (error) {
        showToast('Failed to remove member from group', 'error');
      }
    }
  };

  // Handle bulk remove
  const handleBulkRemove = async () => {
    try {
      await Promise.all(
        selectedMembers.map(memberId => removeMemberFromGroup(groupId, memberId))
      );
      setSelectedMembers([]);
      showToast('Selected members removed from group successfully', 'success');
    } catch (error) {
      showToast('Failed to remove selected members', 'error');
    }
  };

  // Handle role update
  const handleRoleUpdate = async (memberId, newRole) => {
    try {
      await updateMemberRole(groupId, memberId, newRole);
      showToast('Member role updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update member role', 'error');
    }
  };

  // Format join date
  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
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
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
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
            >
              ← Back to Groups
            </Button>
            <h1>{group?.name} Members</h1>
            <Badge variant="info" className={styles.memberCount}>
              {filteredMembers.length} members
            </Badge>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="primary"
              onClick={() => setShowAddMemberModal(true)}
              className={styles.addMemberButton}
            >
              Add Members
            </Button>
          </div>
        </div>
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
          
          <div className={styles.filters}>
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
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="role">Sort by Role</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>
            
            <Button
              variant="ghost"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={styles.sortOrderButton}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMembers.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectionCount}>
              {selectedMembers.length} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkRemove}
            >
              Remove Selected
            </Button>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className={styles.membersGrid}>
        {/* Select All Header */}
        <div className={styles.selectAllHeader}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
              onChange={handleSelectAll}
              className={styles.selectAllCheckbox}
            />
            Select All
          </label>
        </div>

        {/* Members Cards */}
        {filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No members found</h3>
            <p>
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'This group has no members yet'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.member_id} className={styles.memberCard}>
              <div className={styles.memberCardHeader}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.member_id)}
                  onChange={() => handleMemberSelect(member.member_id)}
                  className={styles.memberCheckbox}
                />
                <Avatar
                  src={member.photo_url}
                  alt={member.member_name}
                  size="md"
                  className={styles.memberAvatar}
                />
              </div>
              
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.member_name}</h3>
                <p className={styles.memberEmail}>{member.member_email}</p>
                <p className={styles.memberPhone}>{member.member_phone}</p>
                
                <div className={styles.memberMeta}>
                  <Badge
                    variant={getRoleBadgeVariant(member.role)}
                    className={styles.roleBadge}
                  >
                    {member.role || 'Member'}
                  </Badge>
                  <span className={styles.joinDate}>
                    Joined: {formatJoinDate(member.join_date)}
                  </span>
                </div>
              </div>
              
              <div className={styles.memberActions}>
                <select
                  value={member.role || 'member'}
                  onChange={(e) => handleRoleUpdate(member.member_id, e.target.value)}
                  className={styles.roleSelect}
                >
                  <option value="member">Member</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="co-leader">Co-Leader</option>
                  <option value="leader">Leader</option>
                </select>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setMemberToRemove(member);
                    setShowRemoveConfirm(true);
                  }}
                  className={styles.removeButton}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Members Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Members to Group"
        size="lg"
      >
        <AddMembersForm
          groupId={groupId}
          availableMembers={availableMembers}
          onAddMembers={handleAddMembers}
          onCancel={() => setShowAddMemberModal(false)}
        />
      </Modal>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.member_name} from this group?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

// Add Members Form Component
const AddMembersForm = ({ groupId, availableMembers, onAddMembers, onCancel }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = availableMembers.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMembers.length > 0) {
      onAddMembers(selectedMembers);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.addMembersForm}>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search available members..."
        className={styles.modalSearchBar}
      />
      
      <div className={styles.availableMembersList}>
        {filteredMembers.length === 0 ? (
          <div className={styles.noMembersMessage}>
            <p>No available members found</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className={styles.availableMemberItem}>
              <label className={styles.memberCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className={styles.memberCheckbox}
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
                </div>
              </label>
            </div>
          ))
        )}
      </div>
      
      <div className={styles.modalActions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={selectedMembers.length === 0}
        >
          Add {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </form>
  );
};

export default GroupMembers;