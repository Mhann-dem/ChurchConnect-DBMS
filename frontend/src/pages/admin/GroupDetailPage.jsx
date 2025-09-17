import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  UserMinus,
  ArrowLeft,
  RefreshCw,
  X,
  Download
} from 'lucide-react';
import groupsService from '../../services/groups';
import membersService from '../../services/members';
import { validateId } from '../../utils/validation';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';
import styles from './AdminPages.module.css';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Refs for cleanup
  const abortControllerRef = useRef();
  const isMountedRef = useRef(true);

  // Enhanced ID validation
  const validatedId = useMemo(() => {
    try {
      return validateId(id);
    } catch (error) {
      console.error('Invalid group ID:', error);
      return null;
    }
  }, [id]);

  // Hooks with fallback handling
  const groupsHook = useGroups();
  const membersHook = useMembers();
  
  const {
    getGroup,
    updateGroup,
    deleteGroup,
    loading: groupLoading = false
  } = groupsHook || {};
  
  const { 
    getMembers, 
    loading: membersLoading = false 
  } = membersHook || {};

  // State management
  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
  const [activeTab, setActiveTab] = useState(location.hash?.slice(1) || 'overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    group: false,
    members: false,
    availableMembers: false
  });
  const [errors, setErrors] = useState({
    group: null,
    members: null,
    availableMembers: null
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    leader_name: '',
    meeting_schedule: '',
    meeting_location: '',
    max_capacity: '',
    contact_email: '',
    contact_phone: '',
    category: '',
    is_public: true,
    active: true
  });

  // Component cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Enhanced ID validation with navigation
  useEffect(() => {
    if (!validatedId) {
      showToast('Invalid group ID provided', 'error');
      navigate('/admin/groups', { replace: true });
      return;
    }
  }, [validatedId, navigate, showToast]);

  // Update URL hash when tab changes
  useEffect(() => {
    const newHash = `#${activeTab}`;
    if (location.hash !== newHash) {
      window.history.replaceState(null, '', `${location.pathname}${newHash}`);
    }
  }, [activeTab, location]);

  // Enhanced data loading with direct service integration
  const fetchGroupDetails = useCallback(async (forceRefresh = false) => {
    if (!validatedId || !isMountedRef.current) return;

    try {
      // Cancel any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      setLoadingStates(prev => ({ ...prev, group: true }));
      setErrors(prev => ({ ...prev, group: null }));

      console.log('[GroupDetailPage] Loading group details for ID:', validatedId);

      // Use service directly with fallback to hook
      let groupData;
      if (getGroup && typeof getGroup === 'function') {
        groupData = await getGroup(validatedId);
      } else {
        console.log('[GroupDetailPage] Using direct service call for group data');
        const result = await groupsService.getGroup(validatedId);
        if (result.success) {
          groupData = result.data;
        } else {
          throw new Error(result.error || 'Failed to fetch group');
        }
      }

      if (!isMountedRef.current) return;

      if (!groupData) {
        throw new Error('Group not found');
      }

      setGroup(groupData);
      console.log('[GroupDetailPage] Group data loaded:', groupData);

      // Load group members
      try {
        setLoadingStates(prev => ({ ...prev, members: true }));
        const membersResult = await groupsService.getGroupMembers(validatedId);
        
        if (isMountedRef.current) {
          if (membersResult.success) {
            const members = membersResult.data?.results || membersResult.data || [];
            setGroupMembers(Array.isArray(members) ? members : []);
          } else {
            console.error('Failed to load group members:', membersResult.error);
            setErrors(prev => ({ ...prev, members: membersResult.error }));
          }
        }
      } catch (memberError) {
        console.error('Error loading group members:', memberError);
        if (isMountedRef.current) {
          setErrors(prev => ({ ...prev, members: memberError.message }));
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingStates(prev => ({ ...prev, members: false }));
        }
      }

      // Set form data for editing
      setEditFormData({
        name: groupData.name || '',
        description: groupData.description || '',
        leader_name: groupData.leader_name || '',
        meeting_schedule: groupData.meeting_schedule || '',
        meeting_location: groupData.meeting_location || '',
        max_capacity: groupData.max_capacity || '',
        contact_email: groupData.contact_email || '',
        contact_phone: groupData.contact_phone || '',
        category: groupData.category || '',
        is_public: groupData.is_public !== undefined ? groupData.is_public : true,
        active: groupData.active !== undefined ? groupData.active : true
      });

    } catch (error) {
      console.error('Failed to load group details:', error);
      
      if (isMountedRef.current) {
        if (error.message === 'Group not found' || error.message?.includes('404')) {
          showToast('Group not found', 'error');
          navigate('/admin/groups', { replace: true });
        } else {
          setErrors(prev => ({ ...prev, group: error.message }));
          showToast(error.message || 'Failed to load group details', 'error');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, group: false }));
      }
    }
  }, [validatedId, getGroup, showToast, navigate]);

  // Enhanced available members loading
  const fetchAvailableMembers = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoadingStates(prev => ({ ...prev, availableMembers: true }));
      setErrors(prev => ({ ...prev, availableMembers: null }));

      // Use service directly with fallback to hook
      let allMembers;
      if (getMembers && typeof getMembers === 'function') {
        allMembers = await getMembers();
      } else {
        console.log('[GroupDetailPage] Using direct service call for members data');
        const result = await membersService.getMembers({ limit: 1000 }); // Get all members
        if (result.success) {
          allMembers = result.data || [];
        } else {
          throw new Error(result.error || 'Failed to fetch members');
        }
      }

      if (isMountedRef.current) {
        setAvailableMembers(Array.isArray(allMembers) ? allMembers : []);
      }

    } catch (error) {
      console.error('Failed to load available members:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, availableMembers: error.message }));
        showToast('Failed to load members', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, availableMembers: false }));
      }
    }
  }, [getMembers, showToast]);

  // Initial data loading
  useEffect(() => {
    if (validatedId && isMountedRef.current) {
      fetchGroupDetails();
      fetchAvailableMembers();
    }
  }, [validatedId, fetchGroupDetails, fetchAvailableMembers]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('[GroupDetailPage] Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        fetchGroupDetails(true),
        fetchAvailableMembers()
      ]);
      
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('[GroupDetailPage] Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchGroupDetails, fetchAvailableMembers, showToast]);

  // Enhanced group edit handler
  const handleEditGroup = useCallback(async (e) => {
    e.preventDefault();
    if (!validatedId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('[GroupDetailPage] Updating group:', editFormData);

      let updatedGroup;
      if (updateGroup && typeof updateGroup === 'function') {
        updatedGroup = await updateGroup(validatedId, editFormData);
      } else {
        console.log('[GroupDetailPage] Using direct service call for group update');
        const result = await groupsService.updateGroup(validatedId, editFormData);
        if (result.success) {
          updatedGroup = result.data;
        } else {
          throw new Error(result.error || 'Failed to update group');
        }
      }

      if (isMountedRef.current) {
        setGroup(updatedGroup);
        setIsEditModalOpen(false);
        showToast('Group updated successfully', 'success');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast(error.message || 'Failed to update group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [validatedId, editFormData, updateGroup, showToast, isSubmitting]);

  // Enhanced group deletion handler
  const handleDeleteGroup = useCallback(async () => {
    if (!validatedId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (deleteGroup && typeof deleteGroup === 'function') {
        await deleteGroup(validatedId);
      } else {
        console.log('[GroupDetailPage] Using direct service call for group deletion');
        const result = await groupsService.deleteGroup(validatedId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete group');
        }
      }

      if (isMountedRef.current) {
        showToast('Group deleted successfully', 'success');
        navigate('/admin/groups');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [validatedId, deleteGroup, showToast, navigate, isSubmitting]);

  // Enhanced add members handler
  const handleAddMembers = useCallback(async () => {
    if (!validatedId || selectedMembersToAdd.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('[GroupDetailPage] Adding members to group:', selectedMembersToAdd);

      // Add each member to the group
      const addPromises = selectedMembersToAdd.map(memberId => 
        groupsService.addMemberToGroup(validatedId, {
          member_id: memberId,
          role: '',
          status: 'active'
        })
      );

      const results = await Promise.allSettled(addPromises);
      
      // Check results
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      if (failed.length > 0) {
        console.error('Some members failed to add:', failed);
        showToast(`Added ${results.length - failed.length} members, ${failed.length} failed`, 'warning');
      } else {
        showToast('All members added successfully', 'success');
      }

      // Refresh group data
      await fetchGroupDetails(true);
      
      setIsAddMemberModalOpen(false);
      setSelectedMembersToAdd([]);

    } catch (error) {
      console.error('Add members error:', error);
      showToast(error.message || 'Failed to add members', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [validatedId, selectedMembersToAdd, showToast, fetchGroupDetails, isSubmitting]);

  // Enhanced remove member handler
  const handleRemoveMember = useCallback(async (memberId, memberName) => {
    if (!validatedId || !memberId || isSubmitting) return;

    if (!window.confirm(`Remove ${memberName || 'this member'} from the group?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[GroupDetailPage] Removing member from group:', memberId);

      const result = await groupsService.removeMemberFromGroup(validatedId, memberId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member');
      }

      // Refresh group data
      await fetchGroupDetails(true);
      
      showToast('Member removed successfully', 'success');

    } catch (error) {
      console.error('Remove member error:', error);
      showToast(error.message || 'Failed to remove member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [validatedId, showToast, fetchGroupDetails, isSubmitting]);

  // Form input handler
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Member selection handler
  const handleMemberSelection = useCallback((memberId) => {
    setSelectedMembersToAdd(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  // Get available members for group (excluding current members)
  const getAvailableMembersForGroup = useCallback(() => {
    const currentMemberIds = groupMembers.map(member => member.id || member.member_id);
    return availableMembers.filter(member => !currentMemberIds.includes(member.id));
  }, [groupMembers, availableMembers]);

  // Enhanced date formatting
  const formatDateDisplay = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return formatDate(dateString);
    } catch (error) {
      return dateString;
    }
  }, []);

  // Loading state
  if (loadingStates.group || (groupLoading && !group)) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading group details...</p>
      </div>
    );
  }

  // Error state
  if (errors.group && !group) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Group</h2>
        <p>{errors.group}</p>
        <div className={styles.errorActions}>
          <Button onClick={() => fetchGroupDetails(true)}>
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/groups')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className={styles.errorContainer}>
        <h2>Group Not Found</h2>
        <p>The requested group could not be found.</p>
        <Button
          onClick={() => navigate('/admin/groups')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Groups
        </Button>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'members', label: `Members (${groupMembers.length})`, icon: Users },
    { id: 'activity', label: 'Activity', icon: Calendar }
  ];

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <div className={styles.errorActions}>
            <Button onClick={resetError}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/admin/groups')}>
              Back to Groups
            </Button>
          </div>
        </div>
      )}
    >
      <div className={styles.pageContainer}>
        {/* Enhanced Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/groups')}
              className={styles.backButton}
              icon={<ArrowLeft size={16} />}
            >
              Back to Groups
            </Button>
            <div>
              <h1 className={styles.pageTitle}>{group.name}</h1>
              <div className={styles.groupMeta}>
                <Badge variant={group.active ? 'success' : 'warning'}>
                  {group.active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant={group.is_public ? 'info' : 'secondary'}>
                  {group.is_public ? 'Public' : 'Private'}
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
                {group.category && (
                  <Badge variant="outline">{group.category}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />}
              title="Refresh data"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit size={16} />}
              disabled={isSubmitting}
            >
              Edit Group
            </Button>
            <Button 
              variant="danger" 
              onClick={() => setIsDeleteDialogOpen(true)}
              icon={<Trash2 size={16} />}
              disabled={isSubmitting}
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
                    <strong>Category:</strong>
                    <p>{group.category || 'Uncategorized'}</p>
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
                  {group.contact_email ? (
                    <div className={styles.contactItem}>
                      <Mail size={16} />
                      <a href={`mailto:${group.contact_email}`}>
                        {group.contact_email}
                      </a>
                    </div>
                  ) : (
                    <div className={styles.contactItem}>
                      <Mail size={16} />
                      <span className={styles.noContact}>No email provided</span>
                    </div>
                  )}
                  {group.contact_phone ? (
                    <div className={styles.contactItem}>
                      <Phone size={16} />
                      <a href={`tel:${group.contact_phone}`}>
                        {formatPhoneNumber(group.contact_phone)}
                      </a>
                    </div>
                  ) : (
                    <div className={styles.contactItem}>
                      <Phone size={16} />
                      <span className={styles.noContact}>No phone provided</span>
                    </div>
                  )}
                </Card>

                <Card className={styles.statsCard}>
                  <h3>Statistics</h3>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{groupMembers.length}</span>
                    <span className={styles.statLabel}>Total Members</span>
                  </div>
                  {group.max_capacity && (
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{group.max_capacity}</span>
                      <span className={styles.statLabel}>Max Capacity</span>
                    </div>
                  )}
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {formatDateDisplay(group.created_at)}
                    </span>
                    <span className={styles.statLabel}>Created</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {formatDateDisplay(group.updated_at)}
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
                  disabled={isSubmitting || getAvailableMembersForGroup().length === 0}
                >
                  Add Members
                </Button>
              </div>
              
              {errors.members && (
                <div className={styles.errorMessage}>
                  <p>Error loading members: {errors.members}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchGroupDetails(true)}
                  >
                    Retry
                  </Button>
                </div>
              )}
              
              {loadingStates.members ? (
                <div className={styles.loadingState}>
                  <LoadingSpinner size="md" />
                  <p>Loading members...</p>
                </div>
              ) : groupMembers.length === 0 ? (
                <Card className={styles.emptyState}>
                  <Users size={48} />
                  <h3>No members yet</h3>
                  <p>Add members to this group to get started.</p>
                  <Button 
                    onClick={() => setIsAddMemberModalOpen(true)}
                    icon={<UserPlus size={16} />}
                    disabled={getAvailableMembersForGroup().length === 0}
                  >
                    {getAvailableMembersForGroup().length === 0 ? 'No Available Members' : 'Add Members'}
                  </Button>
                </Card>
              ) : (
                <div className={styles.membersGrid}>
                  {groupMembers.map(member => (
                    <Card key={member.id || member.member_id} className={styles.memberCard}>
                      <div className={styles.memberInfo}>
                        <Avatar 
                          src={member.photo_url} 
                          name={`${member.first_name || member.name || ''} ${member.last_name || ''}`}
                          size="md"
                        />
                        <div className={styles.memberDetails}>
                          <h4>{member.first_name || member.name || 'Unknown'} {member.last_name || ''}</h4>
                          <p>{member.email || 'No email'}</p>
                          {member.phone && <p>{formatPhoneNumber(member.phone)}</p>}
                          {member.role && (
                            <Badge variant="secondary">{member.role}</Badge>
                          )}
                          {member.join_date && (
                            <small className={styles.joinDate}>
                              Joined: {formatDateDisplay(member.join_date)}
                            </small>
                          )}
                        </div>
                      </div>
                      <div className={styles.memberActions}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/members/${member.id || member.member_id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveMember(
                            member.id || member.member_id, 
                            `${member.first_name || member.name || ''} ${member.last_name || ''}`
                          )}
                          icon={<UserMinus size={14} />}
                          disabled={isSubmitting}
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
                        {formatDateDisplay(group.created_at)}
                      </span>
                    </div>
                  </div>
                  {group.updated_at && group.updated_at !== group.created_at && (
                    <div className={styles.activityItem}>
                      <Users size={16} />
                      <div>
                        <p>Group updated</p>
                        <span className={styles.activityDate}>
                          {formatDateDisplay(group.updated_at)}
                        </span>
                      </div>
                    </div>
                  )}
                  {groupMembers.length > 0 && (
                    <div className={styles.activityItem}>
                      <UserPlus size={16} />
                      <div>
                        <p>Current member count: {groupMembers.length}</p>
                        <span className={styles.activityDate}>
                          {group.max_capacity ? `${group.max_capacity - groupMembers.length} spots remaining` : 'No capacity limit'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced Edit Group Modal */}
        <Modal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Group"
          size="large"
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={editFormData.category}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  disabled={isSubmitting}
                >
                  <option value="">Select Category</option>
                  <option value="ministry">Ministry</option>
                  <option value="small-group">Small Group</option>
                  <option value="committee">Committee</option>
                  <option value="service">Service Team</option>
                  <option value="youth">Youth Group</option>
                  <option value="seniors">Seniors Group</option>
                  <option value="worship">Worship Team</option>
                  <option value="outreach">Outreach</option>
                  <option value="prayer">Prayer Group</option>
                  <option value="study">Bible Study</option>
                  <option value="support">Support Group</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="leader_name">Leader Name</label>
                <input
                  type="text"
                  id="leader_name"
                  name="leader_name"
                  value={editFormData.leader_name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="max_capacity">Max Capacity</label>
                <input
                  type="number"
                  id="max_capacity"
                  name="max_capacity"
                  value={editFormData.max_capacity}
                  onChange={handleInputChange}
                  min="1"
                  className={styles.formInput}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={editFormData.is_public}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  Public Group
                </label>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={editFormData.active}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                Active Group
              </label>
            </div>

            <div className={styles.formActions}>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !editFormData.name.trim()}
              >
                {isSubmitting ? 'Updating...' : 'Update Group'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Enhanced Add Members Modal */}
        <Modal
          isOpen={isAddMemberModalOpen}
          onClose={() => {
            setIsAddMemberModalOpen(false);
            setSelectedMembersToAdd([]);
          }}
          title="Add Members to Group"
          size="large"
        >
          <div className={styles.addMembersModal}>
            {errors.availableMembers && (
              <div className={styles.errorMessage}>
                <p>Error loading available members: {errors.availableMembers}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchAvailableMembers}
                >
                  Retry
                </Button>
              </div>
            )}
            
            {loadingStates.availableMembers ? (
              <div className={styles.loadingState}>
                <LoadingSpinner size="md" />
                <p>Loading available members...</p>
              </div>
            ) : (
              <>
                <div className={styles.membersList}>
                  {getAvailableMembersForGroup().length === 0 ? (
                    <div className={styles.emptyState}>
                      <Users size={32} />
                      <p>No available members to add. All members are already in this group.</p>
                    </div>
                  ) : (
                    getAvailableMembersForGroup().map(member => (
                      <div key={member.id} className={styles.memberOption}>
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          checked={selectedMembersToAdd.includes(member.id)}
                          onChange={() => handleMemberSelection(member.id)}
                          disabled={isSubmitting}
                        />
                        <label htmlFor={`member-${member.id}`} className={styles.memberLabel}>
                          <Avatar 
                            src={member.photo_url} 
                            name={`${member.first_name || ''} ${member.last_name || ''}`}
                            size="sm"
                          />
                          <div>
                            <p>{member.first_name || 'Unknown'} {member.last_name || ''}</p>
                            <span>{member.email || 'No email'}</span>
                            {member.phone && (
                              <span>{formatPhoneNumber(member.phone)}</span>
                            )}
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                
                <div className={styles.modalActions}>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsAddMemberModalOpen(false);
                      setSelectedMembersToAdd([]);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddMembers}
                    disabled={selectedMembersToAdd.length === 0 || isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Adding...' 
                      : `Add Selected Members (${selectedMembersToAdd.length})`
                    }
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Enhanced Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteGroup}
          title="Delete Group"
          message={
            <>
              <p>Are you sure you want to delete <strong>"{group.name}"</strong>?</p>
              {groupMembers.length > 0 && (
                <p className={styles.warningText}>
                  This group has {groupMembers.length} member(s). They will be removed from the group.
                </p>
              )}
              <p>This action cannot be undone.</p>
            </>
          }
          confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
          loading={isSubmitting}
        />
      </div>
    </ErrorBoundary>
  );
};

export default GroupDetailPage;