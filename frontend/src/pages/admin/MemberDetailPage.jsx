import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  RefreshCw,
  Settings,
  Download,
  Plus,
  X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Toast from '../../components/shared/Toast';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import MemberForm from '../../components/admin/Members/MemberForm';
import { useToast } from '../../hooks/useToast';
import { useMembers } from '../../hooks/useMembers';
import { useGroups } from '../../hooks/useGroups';
import { usePledges } from '../../hooks/usePledges';
import { formatPhoneNumber, formatDate, formatCurrency } from '../../utils/formatters';
import { validateMember, validateId } from '../../utils/validation';
import membersService from '../../services/members';
import groupsService from '../../services/groups';
import pledgesService from '../../services/pledges';
import styles from './AdminPages.module.css';

// Enhanced error boundary component for individual sections
const SectionErrorBoundary = ({ children, fallback, sectionName, onRetry }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setHasError(false);
    setError(null);
  }, [children]);

  if (hasError) {
    return (
      <div className={styles.sectionError}>
        <div className={styles.errorContent}>
          <h4>Error loading {sectionName}</h4>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          {onRetry && (
            <Button size="sm" onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  try {
    return children;
  } catch (error) {
    console.error(`Error in ${sectionName}:`, error);
    setHasError(true);
    setError(error);
    return fallback || (
      <div className={styles.sectionError}>
        Error loading {sectionName}
      </div>
    );
  }
};

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Refs for cleanup and abort controllers
  const abortControllerRef = useRef();
  const isMountedRef = useRef(true);

  // Enhanced ID validation
  const validatedId = useMemo(() => {
    try {
      return validateId(id);
    } catch (error) {
      console.error('Invalid member ID:', error);
      return null;
    }
  }, [id]);

  // State management
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState(location.hash?.slice(1) || 'overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [isAddPledgeModalOpen, setIsAddPledgeModalOpen] = useState(false);
  const [memberActivity, setMemberActivity] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberGroups, setMemberGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    member: false,
    activity: false,
    pledges: false,
    groups: false,
    availableGroups: false
  });
  const [errors, setErrors] = useState({
    member: null,
    activity: null,
    pledges: null,
    groups: null
  });

  // Hooks with error handling
  const membersHook = useMembers();
  const groupsHook = useGroups();
  const pledgesHook = usePledges();

  const {
    loading: hookLoading = false,
    error: hookError = null,
    getMember,
    updateMember,
    deleteMember,
    getMemberActivity,
    getMemberPledges,
    getMemberGroups,
    addMemberToGroup,
    removeMemberFromGroup,
    refetch: refetchMembers
  } = membersHook || {};

  const {
    groups = [],
    getAvailableGroupsForMember
  } = groupsHook || {};

  const {
    createPledge
  } = pledgesHook || {};

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
      showToast('Invalid member ID provided', 'error');
      navigate('/admin/members', { replace: true });
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

  // Safe data access with enhanced validation
  const safeMember = useMemo(() => {
    if (!member) return null;
    
    try {
      return validateMember(member);
    } catch (error) {
      console.error('Member validation error:', error);
      // Return original member data if validation fails but log the error
      return member;
    }
  }, [member]);

  // Enhanced error handling helper
  const handleError = useCallback((error, section, fallback = null) => {
    if (!isMountedRef.current) return fallback;
    
    console.error(`Error in ${section}:`, error);
    setErrors(prev => ({ ...prev, [section]: error.message }));
    
    if (error.name !== 'AbortError') {
      showToast(`Failed to load ${section}`, 'error');
    }
    
    return fallback;
  }, [showToast]);

  // Enhanced data loading with direct service integration
  const loadMemberData = useCallback(async (memberId, options = {}) => {
    if (!memberId || !isMountedRef.current) return;

    const { forceRefresh = false } = options;

    try {
      // Cancel any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoadingStates(prev => ({ ...prev, member: true }));
      setErrors(prev => ({ ...prev, member: null }));

      console.log(`[MemberDetailPage] Loading member data for ID: ${memberId}`);
      
      // Use membersService directly if hooks are unavailable
      let memberData;
      if (getMember && typeof getMember === 'function') {
        memberData = await getMember(memberId, { signal, forceRefresh });
      } else {
        console.log('[MemberDetailPage] Using direct service call for member data');
        const result = await membersService.getMember(memberId);
        if (result.success) {
          memberData = result.data;
        } else {
          throw new Error(result.error || 'Failed to fetch member');
        }
      }
      
      if (!isMountedRef.current || signal.aborted) return;
      
      if (!memberData) {
        throw new Error('Member not found');
      }

      setMember(memberData);
      console.log('[MemberDetailPage] Member data loaded:', memberData);

      // Load additional data in parallel with direct service calls
      const loadAdditionalData = async () => {
        const promises = [];
        
        // Load member activity
        promises.push(
          (async () => {
            try {
              // For now, return empty array as this endpoint might not be implemented
              return { type: 'activity', data: [] };
            } catch (err) {
              return { type: 'activity', error: err };
            }
          })()
        );
        
        // Load member pledges using pledgesService
        promises.push(
          (async () => {
            try {
              const result = await pledgesService.getMemberPledges(memberId);
              if (result.success) {
                return { type: 'pledges', data: result.data?.results || result.data || [] };
              } else {
                throw new Error(result.error || 'Failed to load pledges');
              }
            } catch (err) {
              return { type: 'pledges', error: err };
            }
          })()
        );
        
        // Load member groups using groupsService
        promises.push(
          (async () => {
            try {
              // This would need to be implemented in groupsService as getMemberGroups
              // For now, return empty array
              return { type: 'groups', data: [] };
            } catch (err) {
              return { type: 'groups', error: err };
            }
          })()
        );

        // Load available groups for member using groupsService
        promises.push(
          (async () => {
            try {
              const result = await groupsService.getGroups({ member_not_in: memberId });
              if (result.success) {
                return { type: 'availableGroups', data: result.data?.results || result.data || [] };
              } else {
                throw new Error(result.error || 'Failed to load available groups');
              }
            } catch (err) {
              return { type: 'availableGroups', error: err };
            }
          })()
        );

        const results = await Promise.allSettled(promises);
        
        if (!isMountedRef.current || signal.aborted) return;
        
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            const { type, data, error } = result.value;
            
            if (error) {
              handleError(error, type, []);
            } else {
              switch (type) {
                case 'activity':
                  setMemberActivity(Array.isArray(data) ? data : []);
                  break;
                case 'pledges':
                  setMemberPledges(Array.isArray(data) ? data : []);
                  break;
                case 'groups':
                  setMemberGroups(Array.isArray(data) ? data : []);
                  break;
                case 'availableGroups':
                  setAvailableGroups(Array.isArray(data) ? data : []);
                  break;
              }
            }
          }
        });
      };

      await loadAdditionalData();
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[MemberDetailPage] Data loading aborted');
        return;
      }
      
      console.error('Failed to load member data:', error);
      
      if (isMountedRef.current) {
        if (error.message === 'Member not found' || error.message?.includes('404')) {
          showToast('Member not found', 'error');
          navigate('/admin/members', { replace: true });
        } else {
          setErrors(prev => ({ ...prev, member: error.message }));
          showToast(error.message || 'Failed to load member data', 'error');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, member: false }));
      }
    }
  }, [
    getMember, 
    handleError,
    showToast, 
    navigate
  ]);

  // Initial data load
  useEffect(() => {
    if (validatedId && isMountedRef.current) {
      loadMemberData(validatedId);
    }
  }, [validatedId, loadMemberData]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    if (!validatedId) return;
    
    console.log('[MemberDetailPage] Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      await loadMemberData(validatedId, { forceRefresh: true });
      
      if (refetchMembers) {
        await refetchMembers();
      }
      
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('[MemberDetailPage] Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [validatedId, loadMemberData, refetchMembers, showToast]);

  // Enhanced member edit handler with direct service integration
  const handleEditMember = useCallback(async (updatedData) => {
    if (!validatedId) return;

    try {
      console.log('[MemberDetailPage] Updating member:', updatedData);
      
      let updatedMember;
      if (updateMember && typeof updateMember === 'function') {
        updatedMember = await updateMember(validatedId, updatedData);
      } else {
        console.log('[MemberDetailPage] Using direct service call for member update');
        const result = await membersService.updateMember(validatedId, updatedData);
        if (result.success) {
          updatedMember = result.data;
        } else {
          throw new Error(result.error || 'Failed to update member');
        }
      }
      
      if (isMountedRef.current) {
        setMember(updatedMember);
        setIsEditModalOpen(false);
        showToast('Member updated successfully', 'success');
        
        // Optionally refresh the full data to ensure consistency
        if (refetchMembers && typeof refetchMembers === 'function') {
          refetchMembers();
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast(error.message || 'Failed to update member', 'error');
    }
  }, [validatedId, updateMember, showToast, refetchMembers]);

  // Enhanced member deletion handler with direct service integration
  const handleDeleteMember = useCallback(async () => {
    if (!validatedId) return;

    setIsDeleting(true);
    try {
      if (deleteMember && typeof deleteMember === 'function') {
        await deleteMember(validatedId);
      } else {
        console.log('[MemberDetailPage] Using direct service call for member deletion');
        const result = await membersService.deleteMember(validatedId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete member');
        }
      }
      
      if (isMountedRef.current) {
        setIsDeleteDialogOpen(false);
        showToast('Member deleted successfully', 'success');
        navigate('/admin/members');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete member', 'error');
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }, [validatedId, deleteMember, showToast, navigate]);

  // Add member to group handler with direct service integration
  const handleAddToGroup = useCallback(async (groupId) => {
    if (!validatedId) return;

    try {
      // Use groupsService directly to add member to group
      const result = await groupsService.addMemberToGroup(groupId, {
        member_id: validatedId,
        role: '',
        status: 'active'
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to add member to group');
      }
      
      // Refresh member groups - we'll need to implement this in groupsService
      // For now, we'll reload all data
      await loadMemberData(validatedId, { forceRefresh: true });
      
      setIsAddToGroupModalOpen(false);
      showToast('Member added to group successfully', 'success');
    } catch (error) {
      console.error('Add to group error:', error);
      showToast(error.message || 'Failed to add member to group', 'error');
    }
  }, [validatedId, loadMemberData, showToast]);

  // Remove member from group handler with direct service integration
  const handleRemoveFromGroup = useCallback(async (groupId) => {
    if (!validatedId) return;

    try {
      // Use groupsService directly to remove member from group
      const result = await groupsService.removeMemberFromGroup(groupId, validatedId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member from group');
      }
      
      // Refresh member groups
      await loadMemberData(validatedId, { forceRefresh: true });
      
      showToast('Member removed from group successfully', 'success');
    } catch (error) {
      console.error('Remove from group error:', error);
      showToast(error.message || 'Failed to remove member from group', 'error');
    }
  }, [validatedId, loadMemberData, showToast]);

  // Add pledge handler with direct service integration
  const handleAddPledge = useCallback(async (pledgeData) => {
    if (!validatedId) return;

    try {
      // Use pledgesService directly to create pledge
      const result = await pledgesService.createPledge({ 
        ...pledgeData, 
        member_id: validatedId 
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to add pledge');
      }
      
      // Refresh member pledges
      const pledgesResult = await pledgesService.getMemberPledges(validatedId);
      if (pledgesResult.success) {
        setMemberPledges(Array.isArray(pledgesResult.data?.results) ? pledgesResult.data.results : 
                        Array.isArray(pledgesResult.data) ? pledgesResult.data : []);
      }
      
      setIsAddPledgeModalOpen(false);
      showToast('Pledge added successfully', 'success');
    } catch (error) {
      console.error('Add pledge error:', error);
      showToast(error.message || 'Failed to add pledge', 'error');
    }
  }, [validatedId, showToast]);

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

  // Overview tab content with enhanced error handling
  const OverviewTab = useCallback(() => {
    if (!safeMember) return null;

    return (
      <SectionErrorBoundary 
        sectionName="overview"
        onRetry={() => loadMemberData(validatedId, { forceRefresh: true })}
      >
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
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                icon={<RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />}
                title="Refresh member data"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
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
  }, [safeMember, StatusBadge, ContactMethodBadge, handleRefresh, isRefreshing, loadMemberData, validatedId]);

  // Enhanced Groups tab content with full functionality
  const GroupsTab = useCallback(() => (
    <SectionErrorBoundary 
      sectionName="groups"
      onRetry={() => getMemberGroups && getMemberGroups(validatedId)}
    >
      <div className={styles.memberGroups}>
        <div className={styles.tabHeader}>
          <h3>Ministry Groups</h3>
          <Button
            variant="primary"
            size="small"
            icon={<UserPlus size={16} />}
            onClick={() => setIsAddToGroupModalOpen(true)}
            disabled={!availableGroups.length}
          >
            Add to Group
          </Button>
        </div>
        
        {errors.groups && (
          <div className={styles.errorMessage}>
            <p>Error loading groups: {errors.groups}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getMemberGroups && getMemberGroups(validatedId)}
            >
              Retry
            </Button>
          </div>
        )}
        
        <div className={styles.groupsList}>
          {memberGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <UserPlus size={48} className={styles.emptyIcon} />
              <p>This member is not part of any ministry groups.</p>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => setIsAddToGroupModalOpen(true)}
                disabled={!availableGroups.length}
              >
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
                <div className={styles.groupActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromGroup(group.id)}
                    icon={<X size={14} />}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  ), [memberGroups, availableGroups, errors.groups, getMemberGroups, validatedId, handleRemoveFromGroup]);

  // Enhanced Pledges tab content with full functionality
  const PledgesTab = useCallback(() => (
    <SectionErrorBoundary 
      sectionName="pledges"
      onRetry={() => getMemberPledges && getMemberPledges(validatedId)}
    >
      <div className={styles.memberPledges}>
        <div className={styles.tabHeader}>
          <h3>Financial Pledges</h3>
          <Button
            variant="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={() => setIsAddPledgeModalOpen(true)}
          >
            Add Pledge
          </Button>
        </div>
        
        {errors.pledges && (
          <div className={styles.errorMessage}>
            <p>Error loading pledges: {errors.pledges}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getMemberPledges && getMemberPledges(validatedId)}
            >
              Retry
            </Button>
          </div>
        )}
        
        <div className={styles.pledgesList}>
          {memberPledges.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} className={styles.emptyIcon} />
              <p>This member has no recorded pledges.</p>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => setIsAddPledgeModalOpen(true)}
              >
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
  ), [memberPledges, errors.pledges, getMemberPledges, validatedId]);

  // Enhanced Activity tab content
  const ActivityTab = useCallback(() => (
    <SectionErrorBoundary 
      sectionName="activity"
      onRetry={() => getMemberActivity && getMemberActivity(validatedId)}
    >
      <div className={styles.memberActivity}>
        <div className={styles.tabHeader}>
          <h3>Recent Activity</h3>
          <Button
            variant="outline"
            size="small"
            icon={<Download size={16} />}
          >
            Export Activity
          </Button>
        </div>
        
        {errors.activity && (
          <div className={styles.errorMessage}>
            <p>Error loading activity: {errors.activity}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getMemberActivity && getMemberActivity(validatedId)}
            >
              Retry
            </Button>
          </div>
        )}
        
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
  ), [memberActivity, errors.activity, getMemberActivity, validatedId]);

  // Add to Group Modal Content
  const AddToGroupModal = useCallback(() => (
    <Modal
      isOpen={isAddToGroupModalOpen}
      onClose={() => setIsAddToGroupModalOpen(false)}
      title="Add Member to Group"
      size="medium"
    >
      <div className={styles.addToGroupContent}>
        <p>Select a group to add {safeMember?.first_name} {safeMember?.last_name} to:</p>
        
        <div className={styles.groupOptions}>
          {availableGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <UserPlus size={32} className={styles.emptyIcon} />
              <p>No available groups to join.</p>
            </div>
          ) : (
            availableGroups.map((group) => (
              <div key={group.id} className={styles.groupOption}>
                <div className={styles.groupInfo}>
                  <h4>{group.name}</h4>
                  <p>{group.description}</p>
                  <span className={styles.memberCount}>
                    {group.member_count || 0} members
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddToGroup(group.id)}
                >
                  Add to Group
                </Button>
              </div>
            ))
          )}
        </div>
        
        <div className={styles.modalActions}>
          <Button
            variant="outline"
            onClick={() => setIsAddToGroupModalOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  ), [isAddToGroupModalOpen, safeMember, availableGroups, handleAddToGroup]);

  // Add Pledge Modal Content (simplified form)
  const AddPledgeModal = useCallback(() => {
    const [pledgeAmount, setPledgeAmount] = useState('');
    const [pledgeFrequency, setPledgeFrequency] = useState('monthly');
    const [pledgeStartDate, setPledgeStartDate] = useState('');
    const [pledgeEndDate, setPledgeEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitPledge = async (e) => {
      e.preventDefault();
      if (!pledgeAmount || !pledgeStartDate) return;

      setIsSubmitting(true);
      try {
        await handleAddPledge({
          amount: parseFloat(pledgeAmount),
          frequency: pledgeFrequency,
          start_date: pledgeStartDate,
          end_date: pledgeEndDate || null,
          status: 'active'
        });
        
        // Reset form
        setPledgeAmount('');
        setPledgeFrequency('monthly');
        setPledgeStartDate('');
        setPledgeEndDate('');
      } catch (error) {
        // Error handled in handleAddPledge
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Modal
        isOpen={isAddPledgeModalOpen}
        onClose={() => setIsAddPledgeModalOpen(false)}
        title="Add New Pledge"
        size="medium"
      >
        <form onSubmit={handleSubmitPledge} className={styles.pledgeForm}>
          <div className={styles.formGroup}>
            <label htmlFor="pledgeAmount">Pledge Amount *</label>
            <input
              type="number"
              id="pledgeAmount"
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pledgeFrequency">Frequency</label>
            <select
              id="pledgeFrequency"
              value={pledgeFrequency}
              onChange={(e) => setPledgeFrequency(e.target.value)}
              className={styles.formSelect}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="one_time">One Time</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pledgeStartDate">Start Date *</label>
            <input
              type="date"
              id="pledgeStartDate"
              value={pledgeStartDate}
              onChange={(e) => setPledgeStartDate(e.target.value)}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pledgeEndDate">End Date (Optional)</label>
            <input
              type="date"
              id="pledgeEndDate"
              value={pledgeEndDate}
              onChange={(e) => setPledgeEndDate(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddPledgeModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !pledgeAmount || !pledgeStartDate}
            >
              {isSubmitting ? 'Adding...' : 'Add Pledge'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }, [isAddPledgeModalOpen, handleAddPledge]);

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
  if (hookError || errors.member) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Member</h2>
        <p>{hookError || errors.member}</p>
        <div className={styles.errorActions}>
          <Button onClick={() => loadMemberData(validatedId, { forceRefresh: true })}>
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
    { key: 'groups', label: `Groups (${memberGroups.length})`, content: <GroupsTab /> },
    { key: 'pledges', label: `Pledges (${memberPledges.length})`, content: <PledgesTab /> },
    { key: 'activity', label: 'Activity', content: <ActivityTab /> }
  ];

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <div className={styles.errorActions}>
            <Button onClick={resetError}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/admin/members')}>
              Back to Members
            </Button>
          </div>
        </div>
      )}
    >
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

        {/* Add to Group Modal */}
        <AddToGroupModal />

        {/* Add Pledge Modal */}
        <AddPledgeModal />

        <Toast />
      </div>
    </ErrorBoundary>
  );
};

export default MemberDetailPage;