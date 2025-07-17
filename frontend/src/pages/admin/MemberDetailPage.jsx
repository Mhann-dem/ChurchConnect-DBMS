import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Toast from '../../components/shared/Toast';
import MemberForm from '../../components/admin/Members/MemberForm';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import { formatPhoneNumber as formatPhone } from '../../utils/formatters';
import styles from './AdminPages.module.css';



const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    member,
    loading,
    error,
    fetchMember,
    updateMember,
    deleteMember,
    getMemberActivity,
    getMemberPledges,
    getMemberGroups
  } = useMembers();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberActivity, setMemberActivity] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMember(id);
      loadMemberData(id);
    }
  }, [id]);

  const loadMemberData = async (memberId) => {
    try {
      const [activity, pledges, groups] = await Promise.all([
        getMemberActivity(memberId),
        getMemberPledges(memberId),
        getMemberGroups(memberId)
      ]);
      setMemberActivity(activity);
      setMemberPledges(pledges);
      setMemberGroups(groups);
    } catch (error) {
      console.error('Error loading member data:', error);
    }
  };

  const handleEditMember = async (updatedData) => {
    try {
      await updateMember(id, updatedData);
      setIsEditModalOpen(false);
      showToast('Member updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update member', 'error');
    }
  };

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    try {
      await deleteMember(id);
      setIsDeleteDialogOpen(false);
      showToast('Member deleted successfully', 'success');
      navigate('/admin/members');
    } catch (error) {
      showToast('Failed to delete member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: 'success', text: 'Active' },
      inactive: { variant: 'secondary', text: 'Inactive' },
      pending: { variant: 'warning', text: 'Pending' }
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPreferredContactBadge = (method) => {
    const methodMap = {
      email: { variant: 'primary', text: 'Email' },
      phone: { variant: 'info', text: 'Phone' },
      sms: { variant: 'success', text: 'SMS' },
      mail: { variant: 'secondary', text: 'Mail' },
      no_contact: { variant: 'danger', text: 'No Contact' }
    };
    const config = methodMap[method] || methodMap.email;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const renderOverviewTab = () => (
    <div className={styles.memberOverview}>
      <div className={styles.memberHeader}>
        <div className={styles.memberInfo}>
          <Avatar
            src={member.photo_url}
            alt={`${member.first_name} ${member.last_name}`}
            size="xlarge"
            className={styles.memberAvatar}
          />
          <div className={styles.memberDetails}>
            <h2 className={styles.memberName}>
              {member.first_name} {member.last_name}
              {member.preferred_name && (
                <span className={styles.preferredName}>
                  "{member.preferred_name}"
                </span>
              )}
            </h2>
            <p className={styles.memberEmail}>{member.email}</p>
            <div className={styles.memberBadges}>
              {getStatusBadge(member.is_active ? 'active' : 'inactive')}
              {getPreferredContactBadge(member.preferred_contact_method)}
            </div>
          </div>
        </div>
        <div className={styles.memberActions}>
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className={styles.actionButton}
          >
            Edit Member
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            className={styles.actionButton}
          >
            Delete Member
          </Button>
        </div>
      </div>

      <div className={styles.memberGrid}>
        <Card className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <h3>Contact Information</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{member.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Phone:</span>
              <span className={styles.value}>{formatPhone(member.phone)}</span>
            </div>
            {member.alternate_phone && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Alternate Phone:</span>
                <span className={styles.value}>{formatPhone(member.alternate_phone)}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.label}>Address:</span>
              <span className={styles.value}>{member.address || 'Not provided'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Preferred Contact:</span>
              <span className={styles.value}>{getPreferredContactBadge(member.preferred_contact_method)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <h3>Personal Information</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Date of Birth:</span>
              <span className={styles.value}>{formatDate(member.date_of_birth)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Gender:</span>
              <span className={styles.value}>{member.gender}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Preferred Language:</span>
              <span className={styles.value}>{member.preferred_language}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Registration Date:</span>
              <span className={styles.value}>{formatDate(member.registration_date)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Last Updated:</span>
              <span className={styles.value}>{formatDate(member.last_updated)}</span>
            </div>
          </div>
        </Card>

        {member.accessibility_needs && (
          <Card className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3>Accessibility Needs</h3>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.accessibilityText}>{member.accessibility_needs}</p>
            </div>
          </Card>
        )}

        {member.emergency_contact_name && (
          <Card className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3>Emergency Contact</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Name:</span>
                <span className={styles.value}>{member.emergency_contact_name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Phone:</span>
                <span className={styles.value}>{formatPhone(member.emergency_contact_phone)}</span>
              </div>
            </div>
          </Card>
        )}

        {member.notes && (
          <Card className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3>Notes</h3>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.notesText}>{member.notes}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderGroupsTab = () => (
    <div className={styles.memberGroups}>
      <div className={styles.tabHeader}>
        <h3>Ministry Groups</h3>
        <Button variant="primary" size="small">
          Add to Group
        </Button>
      </div>
      <div className={styles.groupsList}>
        {memberGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>This member is not part of any ministry groups.</p>
          </div>
        ) : (
          memberGroups.map((group) => (
            <Card key={group.id} className={styles.groupCard}>
              <div className={styles.groupInfo}>
                <h4 className={styles.groupName}>{group.name}</h4>
                <p className={styles.groupDescription}>{group.description}</p>
                <div className={styles.groupMeta}>
                  <span className={styles.joinDate}>
                    Joined: {formatDate(group.join_date)}
                  </span>
                  {group.role && (
                    <Badge variant="primary">{group.role}</Badge>
                  )}
                </div>
              </div>
              <div className={styles.groupActions}>
                <Button variant="outline" size="small">
                  Edit Role
                </Button>
                <Button variant="danger" size="small">
                  Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderPledgesTab = () => (
    <div className={styles.memberPledges}>
      <div className={styles.tabHeader}>
        <h3>Pledges</h3>
        <Button variant="primary" size="small">
          Add Pledge
        </Button>
      </div>
      <div className={styles.pledgesList}>
        {memberPledges.length === 0 ? (
          <div className={styles.emptyState}>
            <p>This member has no recorded pledges.</p>
          </div>
        ) : (
          memberPledges.map((pledge) => (
            <Card key={pledge.id} className={styles.pledgeCard}>
              <div className={styles.pledgeInfo}>
                <div className={styles.pledgeAmount}>
                  ${pledge.amount.toLocaleString()}
                </div>
                <div className={styles.pledgeDetails}>
                  <span className={styles.pledgeFrequency}>
                    {pledge.frequency}
                  </span>
                  <span className={styles.pledgeDates}>
                    {formatDate(pledge.start_date)} - {pledge.end_date ? formatDate(pledge.end_date) : 'Ongoing'}
                  </span>
                </div>
                <Badge variant={pledge.status === 'active' ? 'success' : 'secondary'}>
                  {pledge.status}
                </Badge>
              </div>
              <div className={styles.pledgeActions}>
                <Button variant="outline" size="small">
                  Edit
                </Button>
                <Button variant="danger" size="small">
                  Cancel
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className={styles.memberActivity}>
      <h3>Recent Activity</h3>
      <div className={styles.activityList}>
        {memberActivity.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No recent activity recorded.</p>
          </div>
        ) : (
          memberActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <div className={styles.activityDot}></div>
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityText}>{activity.description}</div>
                <div className={styles.activityTime}>
                  {formatDate(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Member</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/admin/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className={styles.errorContainer}>
        <h2>Member Not Found</h2>
        <p>The requested member could not be found.</p>
        <Button onClick={() => navigate('/admin/members')}>
          Back to Members
        </Button>
      </div>
    );
  }

  const tabsData = [
    { key: 'overview', label: 'Overview', content: renderOverviewTab() },
    { key: 'groups', label: 'Groups', content: renderGroupsTab() },
    { key: 'pledges', label: 'Pledges', content: renderPledgesTab() },
    { key: 'activity', label: 'Activity', content: renderActivityTab() }
  ];

  return (
    <div className={styles.memberDetailPage}>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumbs}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/members')}
            className={styles.backButton}
          >
            ← Back to Members
          </Button>
        </div>
        <h1 className={styles.pageTitle}>Member Details</h1>
      </div>

      <div className={styles.pageContent}>
        <Tabs
          tabs={tabsData}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className={styles.memberTabs}
        />
      </div>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Member"
        size="large"
      >
        <MemberForm
          member={member}
          onSubmit={handleEditMember}
          onCancel={() => setIsEditModalOpen(false)}
          isEditing={true}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteMember}
        title="Delete Member"
        message={`Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      <Toast />
    </div>
  );
};

export default MemberDetailPage;