import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { useMembers } from '../../hooks/useMembers';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  UserPlus, 
  Mail, 
  Phone,
  UserMinus
} from 'lucide-react';
import styles from './AdminPages.module.css';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getGroup, 
    updateGroup, 
    deleteGroup, 
    addMemberToGroup, 
    removeMemberFromGroup,
    loading: groupLoading 
  } = useGroups();
  const { getMembers, loading: membersLoading } = useMembers();
  const { showToast } = useToast();

  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    leader_name: '',
    meeting_schedule: '',
    meeting_location: '',
    max_capacity: '',
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    fetchGroupDetails();
    fetchAvailableMembers();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const groupData = await getGroup(id);
      setGroup(groupData);
      setGroupMembers(groupData.members || []);
      setEditFormData({
        name: groupData.name || '',
        description: groupData.description || '',
        leader_name: groupData.leader_name || '',
        meeting_schedule: groupData.meeting_schedule || '',
        meeting_location: groupData.meeting_location || '',
        max_capacity: groupData.max_capacity || '',
        contact_email: groupData.contact_email || '',
        contact_phone: groupData.contact_phone || ''
      });
    } catch (error) {
      showToast('Failed to load group details', 'error');
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const allMembers = await getMembers();
      setAvailableMembers(allMembers);
    } catch (error) {
      showToast('Failed to load members', 'error');
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      const updatedGroup = await updateGroup(id, editFormData);
      setGroup(updatedGroup);
      setIsEditModalOpen(false);
      showToast('Group updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update group', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(id);
      showToast('Group deleted successfully', 'success');
      navigate('/admin/groups');
    } catch (error) {
      showToast('Failed to delete group', 'error');
    }
  };

  const handleAddMembers = async () => {
    try {
      for (const memberId of selectedMembersToAdd) {
        await addMemberToGroup(id, memberId);
      }
      await fetchGroupDetails();
      setIsAddMemberModalOpen(false);
      setSelectedMembersToAdd([]);
      showToast('Members added successfully', 'success');
    } catch (error) {
      showToast('Failed to add members', 'error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMemberFromGroup(id, memberId);
      await fetchGroupDetails();
      showToast('Member removed successfully', 'success');
    } catch (error) {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberSelection = (memberId) => {
    setSelectedMembersToAdd(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getAvailableMembersForGroup = () => {
    const currentMemberIds = groupMembers.map(member => member.id);
    return availableMembers.filter(member => !currentMemberIds.includes(member.id));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (groupLoading || membersLoading) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <div className={styles.errorState}>
        <h2>Group not found</h2>
        <Button onClick={() => navigate('/admin/groups')}>
          Back to Groups
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'members', label: `Members (${groupMembers.length})`, icon: Users },
    { id: 'activity', label: 'Activity', icon: Calendar }
  ];

  return (
    <ErrorBoundary>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/groups')}
              className={styles.backButton}
            >
              ← Back to Groups
            </Button>
            <div>
              <h1 className={styles.pageTitle}>{group.name}</h1>
              <div className={styles.groupMeta}>
                <Badge variant={group.active ? 'success' : 'warning'}>
                  {group.active ? 'Active' : 'Inactive'}
                </Badge>
                <span className={styles.memberCount}>
                  <Users size={16} />
                  {groupMembers.length} members
                </span>
                {group.max_capacity && (
                  <span className={styles.capacity}>
                    Capacity: {groupMembers.length}/{group.max_capacity}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit size={16} />}
            >
              Edit Group
            </Button>
            <Button 
              variant="danger" 
              onClick={() => setIsDeleteDialogOpen(true)}
              icon={<Trash2 size={16} />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.overviewGrid}>
                <Card className={styles.infoCard}>
                  <h3>Group Information</h3>
                  <div className={styles.infoItem}>
                    <strong>Description:</strong>
                    <p>{group.description || 'No description provided'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Leader:</strong>
                    <p>{group.leader_name || 'No leader assigned'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Meeting Schedule:</strong>
                    <p>{group.meeting_schedule || 'Schedule not set'}</p>
                  </div>
                  {group.meeting_location && (
                    <div className={styles.infoItem}>
                      <MapPin size={16} />
                      <p>{group.meeting_location}</p>
                    </div>
                  )}
                </Card>

                <Card className={styles.contactCard}>
                  <h3>Contact Information</h3>
                  {group.contact_email && (
                    <div className={styles.contactItem}>
                      <Mail size={16} />
                      <a href={`mailto:${group.contact_email}`}>
                        {group.contact_email}
                      </a>
                    </div>
                  )}
                  {group.contact_phone && (
                    <div className={styles.contactItem}>
                      <Phone size={16} />
                      <a href={`tel:${group.contact_phone}`}>
                        {group.contact_phone}
                      </a>
                    </div>
                  )}
                </Card>

                <Card className={styles.statsCard}>
                  <h3>Statistics</h3>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{groupMembers.length}</span>
                    <span className={styles.statLabel}>Total Members</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {formatDate(group.created_at)}
                    </span>
                    <span className={styles.statLabel}>Created</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {formatDate(group.updated_at)}
                    </span>
                    <span className={styles.statLabel}>Last Updated</span>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className={styles.membersTab}>
              <div className={styles.membersHeader}>
                <h3>Group Members</h3>
                <Button 
                  onClick={() => setIsAddMemberModalOpen(true)}
                  icon={<UserPlus size={16} />}
                >
                  Add Members
                </Button>
              </div>
              
              {groupMembers.length === 0 ? (
                <Card className={styles.emptyState}>
                  <Users size={48} />
                  <h3>No members yet</h3>
                  <p>Add members to this group to get started.</p>
                  <Button 
                    onClick={() => setIsAddMemberModalOpen(true)}
                    icon={<UserPlus size={16} />}
                  >
                    Add Members
                  </Button>
                </Card>
              ) : (
                <div className={styles.membersGrid}>
                  {groupMembers.map(member => (
                    <Card key={member.id} className={styles.memberCard}>
                      <div className={styles.memberInfo}>
                        <Avatar 
                          src={member.photo_url} 
                          name={`${member.first_name} ${member.last_name}`}
                          size="md"
                        />
                        <div className={styles.memberDetails}>
                          <h4>{member.first_name} {member.last_name}</h4>
                          <p>{member.email}</p>
                          {member.phone && <p>{member.phone}</p>}
                          {member.role && (
                            <Badge variant="secondary">{member.role}</Badge>
                          )}
                        </div>
                      </div>
                      <div className={styles.memberActions}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/members/${member.id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          icon={<UserMinus size={14} />}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activityTab}>
              <Card>
                <h3>Recent Activity</h3>
                <div className={styles.activityList}>
                  <div className={styles.activityItem}>
                    <Calendar size={16} />
                    <div>
                      <p>Group created</p>
                      <span className={styles.activityDate}>
                        {formatDate(group.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.activityItem}>
                    <Users size={16} />
                    <div>
                      <p>Last member added</p>
                      <span className={styles.activityDate}>
                        {formatDate(group.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Edit Group Modal */}
        <Modal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Group"
        >
          <form onSubmit={handleEditGroup} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Group Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={editFormData.description}
                onChange={handleInputChange}
                rows="3"
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="leader_name">Leader Name</label>
                <input
                  type="text"
                  id="leader_name"
                  name="leader_name"
                  value={editFormData.leader_name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="max_capacity">Max Capacity</label>
                <input
                  type="number"
                  id="max_capacity"
                  name="max_capacity"
                  value={editFormData.max_capacity}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="meeting_schedule">Meeting Schedule</label>
              <input
                type="text"
                id="meeting_schedule"
                name="meeting_schedule"
                value={editFormData.meeting_schedule}
                onChange={handleInputChange}
                placeholder="e.g., Sundays at 9:00 AM"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="meeting_location">Meeting Location</label>
              <input
                type="text"
                id="meeting_location"
                name="meeting_location"
                value={editFormData.meeting_location}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="contact_email">Contact Email</label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={editFormData.contact_email}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact_phone">Contact Phone</label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={editFormData.contact_phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Group</Button>
            </div>
          </form>
        </Modal>

        {/* Add Members Modal */}
        <Modal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          title="Add Members to Group"
        >
          <div className={styles.addMembersModal}>
            <div className={styles.membersList}>
              {getAvailableMembersForGroup().map(member => (
                <div key={member.id} className={styles.memberOption}>
                  <input
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={selectedMembersToAdd.includes(member.id)}
                    onChange={() => handleMemberSelection(member.id)}
                  />
                  <label htmlFor={`member-${member.id}`} className={styles.memberLabel}>
                    <Avatar 
                      src={member.photo_url} 
                      name={`${member.first_name} ${member.last_name}`}
                      size="sm"
                    />
                    <div>
                      <p>{member.first_name} {member.last_name}</p>
                      <span>{member.email}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <Button 
                variant="outline"
                onClick={() => setIsAddMemberModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMembers}
                disabled={selectedMembersToAdd.length === 0}
              >
                Add Selected Members ({selectedMembersToAdd.length})
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteGroup}
          title="Delete Group"
          message={`Are you sure you want to delete "${group.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </ErrorBoundary>
  );
};

export default GroupDetailPage;