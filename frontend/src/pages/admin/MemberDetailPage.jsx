import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, UserPlus, Calendar, Phone, Mail, MapPin, User } from 'lucide-react';
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
import { formatPhoneNumber, formatDate, formatCurrency } from '../../utils/formatters';
import { validateMember } from '../../utils/validation';
import styles from './AdminPages.module.css';

// Error boundary component for individual sections
const SectionErrorBoundary = ({ children, fallback, sectionName }) => {
  try {
    return children;
  } catch (error) {
    console.error(`Error in ${sectionName}:`, error);
    return fallback || <div className={styles.sectionError}>Error loading {sectionName}</div>;
  }
};

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State management
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberActivity, setMemberActivity] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    member: false,
    activity: false,
    pledges: false,
    groups: false
  });

  // Members hook with error handling
  const membersHook = useMembers();
  const {
    loading: hookLoading,
    error: hookError,
    getMember,
    updateMember,
    deleteMember,
    getMemberActivity,
    getMemberPledges,
    getMemberGroups
  } = membersHook || {};

  // Validate member ID
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      showToast('Invalid member ID provided', 'error');
      navigate('/admin/members');
      return;
    }
  }, [id, navigate, showToast]);

  // Component cleanup
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Safe data access with validation
  const safeMember = useMemo(() => {
    if (!member) return null;
    
    try {
      const validated = validateMember(member);
      return validated;
    } catch (error) {
      console.error('Member validation error:', error);
      return member;
    }
  }, [member]);

  // Load member data with proper error handling
  const loadMemberData = useCallback(async (memberId) => {
    if (!memberId || !isMounted) return;

    try {
      setLoadingStates(prev => ({ ...prev, member: true }));
      
      if (!getMember) {
        throw new Error('Member service not available');
      }

      const memberData = await getMember(memberId);
      
      if (!isMounted) return;
      
      if (!memberData) {
        throw new Error('Member not found');
      }

      setMember(memberData);

      // Load additional data in parallel
      const additionalDataPromises = [];
      
      if (getMemberActivity) {
        additionalDataPromises.push(
          getMemberActivity(memberId).catch(err => {
            console.error('Failed to load activity:', err);
            return [];
          })
        );
      }
      
      if (getMemberPledges) {
        additionalDataPromises.push(
          getMemberPledges(memberId).catch(err => {
            console.error('Failed to load pledges:', err);
            return [];
          })
        );
      }
      
      if (getMemberGroups) {
        additionalDataPromises.push(
          getMemberGroups(memberId).catch(err => {
            console.error('Failed to load groups:', err);
            return [];
          })
        );
      }

      if (additionalDataPromises.length > 0) {
        const results = await Promise.allSettled(additionalDataPromises);
        
        if (!isMounted) return;
        
        const [activityResult, pledgesResult, groupsResult] = results;
        
        if (activityResult?.status === 'fulfilled') {
          setMemberActivity(Array.isArray(activityResult.value) ? activityResult.value : []);
        }
        
        if (pledgesResult?.status === 'fulfilled') {
          setMemberPledges(Array.isArray(pledgesResult.value) ? pledgesResult.value : []);
        }
        
        if (groupsResult?.status === 'fulfilled') {
          setMemberGroups(Array.isArray(groupsResult.value) ? groupsResult.value : []);
        }
      }
      
    } catch (error) {
      console.error('Failed to load member data:', error);
      if (isMounted) {
        showToast(error.message || 'Failed to load member data', 'error');
        if (error.message === 'Member not found') {
          navigate('/admin/members');
        }
      }
    } finally {
      if (isMounted) {
        setLoadingStates(prev => ({ ...prev, member: false }));
      }
    }
  }, [getMember, getMemberActivity, getMemberPledges, getMemberGroups, showToast, navigate, isMounted]);

  // Initial data load
  useEffect(() => {
    if (id && isMounted) {
      loadMemberData(id);
    }
  }, [id, loadMemberData, isMounted]);

  // Handle member edit
  const handleEditMember = useCallback(async (updatedData) => {
    if (!id || !updateMember) return;

    try {
      const updatedMember = await updateMember(id, updatedData);
      setMember(updatedMember);
      setIsEditModalOpen(false);
      showToast('Member updated successfully', 'success');
    } catch (error) {
      console.error('Update error:', error);
      showToast(error.message || 'Failed to update member', 'error');
    }
  }, [id, updateMember, showToast]);

  // Handle member deletion
  const handleDeleteMember = useCallback(async () => {
    if (!id || !deleteMember) return;

    setIsDeleting(true);
    try {
      await deleteMember(id);
      setIsDeleteDialogOpen(false);
      showToast('Member deleted successfully', 'success');
      navigate('/admin/members');
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete member', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [id, deleteMember, showToast, navigate]);

  // Status badge component
  const StatusBadge = useCallback(({ isActive }) => (
    <Badge variant={isActive ? 'success' : 'secondary'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  ), []);

  // Contact method badge component
  const ContactMethodBadge = useCallback(({ method }) => {
    const variants = {
      email: 'primary',
      phone: 'info',
      sms: 'success',
      mail: 'secondary',
      no_contact: 'danger'
    };
    
    const labels = {
      email: 'Email',
      phone: 'Phone',
      sms: 'SMS',
      mail: 'Mail',
      no_contact: 'No Contact'
    };

    return (
      <Badge variant={variants[method] || 'secondary'}>
        {labels[method] || method}
      </Badge>
    );
  }, []);

  // Overview tab content
  const OverviewTab = useCallback(() => {
    if (!safeMember) return null;

    return (
      <SectionErrorBoundary sectionName="overview">
        <div className={styles.memberOverview}>
          {/* Member Header */}
          <div className={styles.memberHeader}>
            <div className={styles.memberInfo}>
              <Avatar
                src={safeMember.photo_url}
                alt={`${safeMember.first_name} ${safeMember.last_name}`}
                size="xlarge"
                className={styles.memberAvatar}
              />
              
              <div className={styles.memberDetails}>
                <h2 className={styles.memberName}>
                  {safeMember.first_name} {safeMember.last_name}
                  {safeMember.preferred_name && (
                    <span className={styles.preferredName}>
                      "{safeMember.preferred_name}"
                    </span>
                  )}
                </h2>
                <p className={styles.memberEmail}>{safeMember.email}</p>
                <div className={styles.memberBadges}>
                  <StatusBadge isActive={safeMember.is_active} />
                  <ContactMethodBadge method={safeMember.preferred_contact_method} />
                </div>
              </div>
            </div>
            
            <div className={styles.memberActions}>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                icon={<Edit size={16} />}
              >
                Edit Member
              </Button>
              <Button
                variant="danger"
                onClick={() => setIsDeleteDialogOpen(true)}
                icon={<Trash2 size={16} />}
              >
                Delete Member
              </Button>
            </div>
          </div>

          {/* Member Information Cards */}
          <div className={styles.memberGrid}>
            <Card className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3><Mail size={18} /> Contact Information</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>
                    <a href={`mailto:${safeMember.email}`} className={styles.emailLink}>
                      {safeMember.email}
                    </a>
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Phone:</span>
                  <span className={styles.value}>
                    {safeMember.phone ? (
                      <a href={`tel:${safeMember.phone}`} className={styles.phoneLink}>
                        {formatPhoneNumber(safeMember.phone)}
                      </a>
                    ) : 'Not provided'}
                  </span>
                </div>
                
                {safeMember.alternate_phone && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Alternate Phone:</span>
                    <span className={styles.value}>
                      <a href={`tel:${safeMember.alternate_phone}`} className={styles.phoneLink}>
                        {formatPhoneNumber(safeMember.alternate_phone)}
                      </a>
                    </span>
                  </div>
                )}
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Address:</span>
                  <span className={styles.value}>
                    {safeMember.address || 'Not provided'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Preferred Contact:</span>
                  <span className={styles.value}>
                    <ContactMethodBadge method={safeMember.preferred_contact_method} />
                  </span>
                </div>
              </div>
            </Card>

            <Card className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3><User size={18} /> Personal Information</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Date of Birth:</span>
                  <span className={styles.value}>
                    {formatDate(safeMember.date_of_birth) || 'Not provided'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Gender:</span>
                  <span className={styles.value}>
                    {safeMember.gender || 'Not specified'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Preferred Language:</span>
                  <span className={styles.value}>
                    {safeMember.preferred_language || 'English'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Registration Date:</span>
                  <span className={styles.value}>
                    {formatDate(safeMember.registration_date) || 'Unknown'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.label}>Last Updated:</span>
                  <span className={styles.value}>
                    {formatDate(safeMember.last_updated) || 'Never'}
                  </span>
                </div>
              </div>
            </Card>
            
            {safeMember.accessibility_needs && (
              <Card className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <h3>Accessibility Needs</h3>
                </div>
                <div className={styles.cardBody}>
                  <p>{safeMember.accessibility_needs}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </SectionErrorBoundary>
    );
  }, [safeMember, StatusBadge, ContactMethodBadge]);

  // Groups tab content
  const GroupsTab = useCallback(() => (
    <SectionErrorBoundary sectionName="groups">
      <div className={styles.memberGroups}>
        <div className={styles.tabHeader}>
          <h3>Ministry Groups</h3>
          <Button
            variant="primary"
            size="small"
            icon={<UserPlus size={16} />}
          >
            Add to Group
          </Button>
        </div>
        
        <div className={styles.groupsList}>
          {memberGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <UserPlus size={48} className={styles.emptyIcon} />
              <p>This member is not part of any ministry groups.</p>
              <Button variant="outline" size="small">
                Add to Group
              </Button>
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
              </Card>
            ))
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  ), [memberGroups]);

  // Pledges tab content
  const PledgesTab = useCallback(() => (
    <SectionErrorBoundary sectionName="pledges">
      <div className={styles.memberPledges}>
        <div className={styles.tabHeader}>
          <h3>Financial Pledges</h3>
          <Button
            variant="primary"
            size="small"
            icon={<Calendar size={16} />}
          >
            Add Pledge
          </Button>
        </div>
        
        <div className={styles.pledgesList}>
          {memberPledges.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} className={styles.emptyIcon} />
              <p>This member has no recorded pledges.</p>
              <Button variant="outline" size="small">
                Add Pledge
              </Button>
            </div>
          ) : (
            memberPledges.map((pledge) => (
              <Card key={pledge.id} className={styles.pledgeCard}>
                <div className={styles.pledgeInfo}>
                  <div className={styles.pledgeAmount}>
                    {formatCurrency(pledge.amount)}
                  </div>
                  <div className={styles.pledgeDetails}>
                    <span className={styles.pledgeFrequency}>
                      {pledge.frequency_display || pledge.frequency}
                    </span>
                    <span className={styles.pledgeDates}>
                      {formatDate(pledge.start_date)} - {
                        pledge.end_date ? formatDate(pledge.end_date) : 'Ongoing'
                      }
                    </span>
                  </div>
                  <Badge variant={pledge.status === 'active' ? 'success' : 'secondary'}>
                    {pledge.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  ), [memberPledges]);

  // Activity tab content
  const ActivityTab = useCallback(() => (
    <SectionErrorBoundary sectionName="activity">
      <div className={styles.memberActivity}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {memberActivity.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} className={styles.emptyIcon} />
              <p>No recent activity recorded.</p>
            </div>
          ) : (
            memberActivity.map((activity, index) => (
              <div key={activity.id || index} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <div className={styles.activityDot}></div>
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityText}>
                    {activity.description}
                  </div>
                  <div className={styles.activityTime}>
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  ), [memberActivity]);

  // Loading state
  if (loadingStates.member || hookLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading member details...</p>
      </div>
    );
  }

  // Error state
  if (hookError) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Member</h2>
        <p>{hookError}</p>
        <div className={styles.errorActions}>
          <Button onClick={() => loadMemberData(id)}>
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/members')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  // Member not found
  if (!safeMember) {
    return (
      <div className={styles.errorContainer}>
        <h2>Member Not Found</h2>
        <p>The requested member could not be found.</p>
        <Button
          onClick={() => navigate('/admin/members')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Members
        </Button>
      </div>
    );
  }

  // Tab configuration
  const tabsData = [
    { key: 'overview', label: 'Overview', content: <OverviewTab /> },
    { key: 'groups', label: 'Groups', content: <GroupsTab /> },
    { key: 'pledges', label: 'Pledges', content: <PledgesTab /> },
    { key: 'activity', label: 'Activity', content: <ActivityTab /> }
  ];

  return (
    <div className={styles.memberDetailPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumbs}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/members')}
            icon={<ArrowLeft size={16} />}
            className={styles.backButton}
          >
            Back to Members
          </Button>
        </div>
        <h1 className={styles.pageTitle}>Member Details</h1>
      </div>

      {/* Page Content */}
      <div className={styles.pageContent}>
        <Tabs
          tabs={tabsData}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className={styles.memberTabs}
        />
      </div>

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Member"
          size="large"
        >
          <MemberForm
            member={safeMember}
            onSubmit={handleEditMember}
            onCancel={() => setIsEditModalOpen(false)}
            isEditing={true}
          />
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteMember}
          title="Delete Member"
          message={`Are you sure you want to delete ${safeMember.first_name} ${safeMember.last_name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={isDeleting}
        />
      )}

      <Toast />
    </div>
  );
};

export default MemberDetailPage;