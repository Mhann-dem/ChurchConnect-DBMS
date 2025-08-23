import React, { useState, useEffect, useCallback } from 'react';
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

// Safe utility functions with maximum error handling
const safeFormatDate = (dateString) => {
  try {
    if (!dateString) return 'Not provided';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const safeFormatPhone = (phoneNumber) => {
  try {
    if (!phoneNumber) return 'Not provided';
    return formatPhone ? formatPhone(phoneNumber) : phoneNumber;
  } catch (error) {
    console.error('Phone formatting error:', error);
    return phoneNumber || 'Not provided';
  }
};

const safeGet = (obj, path, defaultValue = 'Not provided') => {
  try {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result ?? defaultValue;
  } catch (error) {
    console.error('Safe get error:', error);
    return defaultValue;
  }
};

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Initialize hooks with error boundaries
  let showToast, membersHook;
  
  try {
    const toastHook = useToast();
    showToast = toastHook?.showToast || (() => console.log('Toast not available'));
  } catch (error) {
    console.error('Toast hook error:', error);
    showToast = () => console.log('Toast not available');
  }

  try {
    membersHook = useMembers();
  } catch (error) {
    console.error('Members hook error:', error);
    membersHook = {
      member: null,
      loading: false,
      error: 'Failed to initialize members hook',
      getMember: () => Promise.resolve(),
      updateMember: () => Promise.resolve(),
      deleteMember: () => Promise.resolve(),
      getMemberActivity: () => Promise.resolve([]),
      getMemberPledges: () => Promise.resolve([]),
      getMemberGroups: () => Promise.resolve([])
    };
  }

  const {
    loading,
    error,
    getMember,
    updateMember,
    deleteMember,
    getMemberActivity,
    getMemberPledges,
    getMemberGroups
  } = membersHook;

  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberActivity, setMemberActivity] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [componentError, setComponentError] = useState(null);

  // Safe member data access
  const safeMember = member || {};

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!id) {
        setComponentError('No member ID provided');
        return;
      }

      if (hasFetched || !isMounted) return;
      
      try {
        if (getMember) {
          const memberData = await getMember(id);
          if (isMounted) {
            setMember(memberData);
            await loadMemberData(id);
            setHasFetched(true);
          }
        } else {
          throw new Error('getMember function not available');
        }
      } catch (err) {
        console.error('Failed to load member data:', err);
        if (isMounted) {
          setComponentError(err.message || 'Failed to load member data');
          showToast('Failed to load member data', 'error');
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, hasFetched, getMember, showToast]);

  const loadMemberData = async (memberId) => {
    try {
      const results = await Promise.allSettled([
        getMemberActivity ? getMemberActivity(memberId) : Promise.resolve([]),
        getMemberPledges ? getMemberPledges(memberId) : Promise.resolve([]),
        getMemberGroups ? getMemberGroups(memberId) : Promise.resolve([])
      ]);
      
      setMemberActivity(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
      setMemberPledges(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
      setMemberGroups(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
    } catch (error) {
      console.error('Error loading member data:', error);
      showToast('Failed to load member details', 'error');
    }
  };

  const handleEditMember = async (updatedData) => {
    try {
      if (updateMember) {
        const updatedMember = await updateMember(id, updatedData);
        setMember(updatedMember);
        setIsEditModalOpen(false);
        showToast('Member updated successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to update member', 'error');
    }
  };

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    try {
      if (deleteMember) {
        await deleteMember(id);
        setIsDeleteDialogOpen(false);
        showToast('Member deleted successfully', 'success');
        navigate('/admin/members');
      }
    } catch (error) {
      showToast('Failed to delete member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = useCallback((status) => {
    try {
      const statusMap = {
        active: { variant: 'success', text: 'Active' },
        inactive: { variant: 'secondary', text: 'Inactive' },
        pending: { variant: 'warning', text: 'Pending' }
      };
      const config = statusMap[status] || statusMap.inactive;
      
      if (Badge) {
        return <Badge variant={config.variant}>{config.text}</Badge>;
      } else {
        return <span className={`badge badge-${config.variant}`}>{config.text}</span>;
      }
    } catch (error) {
      console.error('Status badge error:', error);
      return <span>{status || 'Unknown'}</span>;
    }
  }, []);

  const getPreferredContactBadge = useCallback((method) => {
    try {
      const methodMap = {
        email: { variant: 'primary', text: 'Email' },
        phone: { variant: 'info', text: 'Phone' },
        sms: { variant: 'success', text: 'SMS' },
        mail: { variant: 'secondary', text: 'Mail' },
        no_contact: { variant: 'danger', text: 'No Contact' }
      };
      const config = methodMap[method] || methodMap.email;
      
      if (Badge) {
        return <Badge variant={config.variant}>{config.text}</Badge>;
      } else {
        return <span className={`badge badge-${config.variant}`}>{config.text}</span>;
      }
    } catch (error) {
      console.error('Contact badge error:', error);
      return <span>{method || 'Unknown'}</span>;
    }
  }, []);

  const renderOverviewTab = useCallback(() => {
    try {
      return (
        <div className={styles.memberOverview}>
          <div className={styles.memberHeader}>
            <div className={styles.memberInfo}>
              {Avatar ? (
                <Avatar
                  src={safeGet(safeMember, 'photo_url')}
                  alt={`${safeGet(safeMember, 'first_name', '')} ${safeGet(safeMember, 'last_name', '')}`}
                  size="xlarge"
                  className={styles.memberAvatar}
                />
              ) : (
                <div className={`${styles.memberAvatar} avatar-placeholder`}>
                  {safeGet(safeMember, 'first_name', 'U').charAt(0)}
                </div>
              )}
              
              <div className={styles.memberDetails}>
                <h2 className={styles.memberName}>
                  {safeGet(safeMember, 'first_name', '')} {safeGet(safeMember, 'last_name', '')}
                  {safeGet(safeMember, 'preferred_name') && safeGet(safeMember, 'preferred_name') !== 'Not provided' && (
                    <span className={styles.preferredName}>
                      "{safeGet(safeMember, 'preferred_name')}"
                    </span>
                  )}
                </h2>
                <p className={styles.memberEmail}>{safeGet(safeMember, 'email', 'No email')}</p>
                <div className={styles.memberBadges}>
                  {getStatusBadge(safeGet(safeMember, 'is_active') ? 'active' : 'inactive')}
                  {getPreferredContactBadge(safeGet(safeMember, 'preferred_contact_method'))}
                </div>
              </div>
            </div>
            <div className={styles.memberActions}>
              {Button && (
                <>
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
                </>
              )}
            </div>
          </div>

          <div className={styles.memberGrid}>
            {Card && (
              <>
                <Card className={styles.infoCard}>
                  <div className={styles.cardHeader}>
                    <h3>Contact Information</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Email:</span>
                      <span className={styles.value}>{safeGet(safeMember, 'email')}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Phone:</span>
                      <span className={styles.value}>{safeFormatPhone(safeGet(safeMember, 'phone'))}</span>
                    </div>
                    {safeGet(safeMember, 'alternate_phone') && safeGet(safeMember, 'alternate_phone') !== 'Not provided' && (
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Alternate Phone:</span>
                        <span className={styles.value}>{safeFormatPhone(safeGet(safeMember, 'alternate_phone'))}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Address:</span>
                      <span className={styles.value}>{safeGet(safeMember, 'address')}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Preferred Contact:</span>
                      <span className={styles.value}>{getPreferredContactBadge(safeGet(safeMember, 'preferred_contact_method'))}</span>
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
                      <span className={styles.value}>{safeFormatDate(safeGet(safeMember, 'date_of_birth'))}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Gender:</span>
                      <span className={styles.value}>{safeGet(safeMember, 'gender')}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Preferred Language:</span>
                      <span className={styles.value}>{safeGet(safeMember, 'preferred_language')}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Registration Date:</span>
                      <span className={styles.value}>{safeFormatDate(safeGet(safeMember, 'registration_date'))}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Last Updated:</span>
                      <span className={styles.value}>{safeFormatDate(safeGet(safeMember, 'last_updated'))}</span>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Overview tab render error:', error);
      return (
        <div className="error-container">
          <p>Error rendering member overview: {error.message}</p>
        </div>
      );
    }
  }, [safeMember, getStatusBadge, getPreferredContactBadge]);

  const renderGroupsTab = useCallback(() => (
    <div className={styles.memberGroups}>
      <div className={styles.tabHeader}>
        <h3>Ministry Groups</h3>
        {Button && (
          <Button variant="primary" size="small">
            Add to Group
          </Button>
        )}
      </div>
      <div className={styles.groupsList}>
        {!memberGroups || memberGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>This member is not part of any ministry groups.</p>
          </div>
        ) : (
          memberGroups.map((group) => (
            <div key={group?.id || Math.random()} className={styles.groupCard}>
              <div className={styles.groupInfo}>
                <h4 className={styles.groupName}>{group?.name || 'Unnamed Group'}</h4>
                <p className={styles.groupDescription}>{group?.description || 'No description'}</p>
                <div className={styles.groupMeta}>
                  <span className={styles.joinDate}>
                    Joined: {safeFormatDate(group?.join_date)}
                  </span>
                  {group?.role && Badge && (
                    <Badge variant="primary">{group.role}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ), [memberGroups]);

  const renderPledgesTab = useCallback(() => (
    <div className={styles.memberPledges}>
      <div className={styles.tabHeader}>
        <h3>Pledges</h3>
        {Button && (
          <Button variant="primary" size="small">
            Add Pledge
          </Button>
        )}
      </div>
      <div className={styles.pledgesList}>
        {!memberPledges || memberPledges.length === 0 ? (
          <div className={styles.emptyState}>
            <p>This member has no recorded pledges.</p>
          </div>
        ) : (
          memberPledges.map((pledge) => (
            <div key={pledge?.id || Math.random()} className={styles.pledgeCard}>
              <div className={styles.pledgeInfo}>
                <div className={styles.pledgeAmount}>
                  ${(pledge?.amount || 0).toLocaleString()}
                </div>
                <div className={styles.pledgeDetails}>
                  <span className={styles.pledgeFrequency}>
                    {pledge?.frequency || 'One-time'}
                  </span>
                  <span className={styles.pledgeDates}>
                    {safeFormatDate(pledge?.start_date)} - {pledge?.end_date ? safeFormatDate(pledge.end_date) : 'Ongoing'}
                  </span>
                </div>
                {Badge && (
                  <Badge variant={pledge?.status === 'active' ? 'success' : 'secondary'}>
                    {pledge?.status || 'unknown'}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ), [memberPledges]);

  const renderActivityTab = useCallback(() => (
    <div className={styles.memberActivity}>
      <h3>Recent Activity</h3>
      <div className={styles.activityList}>
        {!memberActivity || memberActivity.length === 0 ? (
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
                <div className={styles.activityText}>{activity?.description || 'Unknown activity'}</div>
                <div className={styles.activityTime}>
                  {safeFormatDate(activity?.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ), [memberActivity]);

  // Handle component errors
  if (componentError) {
    return (
      <div className={styles.errorContainer}>
        <h2>Component Error</h2>
        <p>{componentError}</p>
        {Button && (
          <Button onClick={() => navigate('/admin/members')}>
            Back to Members
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        {LoadingSpinner ? <LoadingSpinner /> : <div>Loading...</div>}
        <p>Loading member details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Member</h2>
        <p>{error?.message || String(error)}</p>
        {Button && (
          <Button onClick={() => navigate('/admin/members')}>
            Back to Members
          </Button>
        )}
      </div>
    );
  }

  if (!member) {
    return (
      <div className={styles.errorContainer}>
        <h2>Member Not Found</h2>
        <p>The requested member could not be found.</p>
        {Button && (
          <Button onClick={() => navigate('/admin/members')}>
            Back to Members
          </Button>
        )}
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
          {Button && (
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/members')}
              className={styles.backButton}
            >
              ← Back to Members
            </Button>
          )}
        </div>
        <h1 className={styles.pageTitle}>Member Details</h1>
      </div>

      <div className={styles.pageContent}>
        {Tabs ? (
          <Tabs
            tabs={tabsData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className={styles.memberTabs}
          />
        ) : (
          <div className="simple-tabs">
            <div className="tab-nav">
              {tabsData.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="tab-content">
              {tabsData.find(tab => tab.key === activeTab)?.content}
            </div>
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      {isEditModalOpen && Modal && MemberForm && (
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
      {isDeleteDialogOpen && ConfirmDialog && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteMember}
          title="Delete Member"
          message={`Are you sure you want to delete ${safeGet(safeMember, 'first_name', '')} ${safeGet(safeMember, 'last_name', '')}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={isDeleting}
        />
      )}

      {Toast && <Toast />}
    </div>
  );
};

export default MemberDetailPage;