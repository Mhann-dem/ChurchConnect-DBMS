import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  MessageSquare,
  DollarSign,
  Tag,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import styles from './Members.module.css';

// Simple utility functions
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const formatCurrency = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Simple UI components
const Card = ({ children, className = '' }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

const Button = ({ children, variant = 'default', size = 'md', onClick, disabled = false, className = '', ...props }) => {
  const variantClasses = {
    default: styles.buttonDefault,
    outline: styles.buttonOutline,
    primary: styles.buttonPrimary
  };
  
  return (
    <button 
      className={`${styles.button} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', style = {} }) => {
  const variantClasses = {
    default: styles.badgeDefault,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    error: styles.badgeError,
    info: styles.badgeInfo,
    outline: styles.badgeOutline
  };
  
  return (
    <span className={`${styles.badge} ${variantClasses[variant]}`} style={style}>
      {children}
    </span>
  );
};

const Avatar = ({ src, alt, size = 'md', fallback, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    medium: styles.avatarMedium,
    large: styles.avatarLarge
  };
  
  const handleImageError = () => setImageError(true);
  
  if (imageError || !src) {
    return (
      <div className={`${styles.avatarFallback} ${sizeClasses[size]} ${className}`}>
        {fallback || alt?.[0] || '?'}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${styles.avatar} ${sizeClasses[size]} ${className}`}
      onError={handleImageError}
    />
  );
};

const LoadingSpinner = ({ size = 'md', message }) => (
  <div className={styles.loadingContainer}>
    <div className={`${styles.spinner} ${styles[`spinner-${size}`]}`} />
    {message && <p>{message}</p>}
  </div>
);

// Mock hooks for demonstration
const useAuth = () => ({
  user: { id: 1, role: 'admin' }
});

const useToast = () => ({
  showToast: (message, type) => {
    console.log(`Toast: ${type} - ${message}`);
    // In a real app, this would show a toast notification
  }
});

const useMembers = () => ({
  getMemberById: async (id) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockMemberData;
  },
  updateMember: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...mockMemberData, ...data };
  },
  deleteMember: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
  getMemberGroups: async (id) => mockGroups,
  getMemberPledges: async (id) => mockPledges,
  getMemberTags: async (id) => mockTags,
  getFamilyMembers: async (id) => mockFamily,
  getMemberNotes: async (id) => mockNotes,
  addMemberNote: async (id, note) => ({
    id: Date.now(),
    ...note,
    created_at: new Date().toISOString(),
    author_name: 'Current User'
  })
});

// Mock data
const mockMemberData = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  preferred_name: 'Johnny',
  email: 'john.doe@email.com',
  phone: '5551234567',
  alternate_phone: '5559876543',
  address: '123 Main St, City, State 12345',
  date_of_birth: '1985-06-15',
  gender: 'Male',
  status: 'active',
  registration_date: '2023-01-15',
  preferred_contact_method: 'email',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '5555551234',
  photo_url: null
};

const mockGroups = [
  { id: 1, name: 'Youth Ministry', description: 'Ministry for young adults', join_date: '2023-02-01', role: 'Member' },
  { id: 2, name: 'Choir', description: 'Church choir group', join_date: '2023-03-01', role: 'Leader' }
];

const mockPledges = [
  { id: 1, amount: 100, frequency: 'monthly', status: 'active', start_date: '2023-01-01', end_date: null, notes: 'Regular tithe' }
];

const mockTags = [
  { id: 1, name: 'New Member', color: '#10B981' },
  { id: 2, name: 'Volunteer', color: '#F59E0B' }
];

const mockFamily = [
  { 
    id: 2, 
    first_name: 'Jane', 
    last_name: 'Doe', 
    relationship: 'Spouse', 
    date_of_birth: '1987-08-20',
    photo_url: null
  }
];

const mockNotes = [
  {
    id: 1,
    content: 'Interested in joining the music ministry',
    created_at: '2023-06-01T10:00:00Z',
    author_name: 'Pastor Smith',
    author_photo: null
  }
];

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [memberGroups, setMemberGroups] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberTags, setMemberTags] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [memberNotes, setMemberNotes] = useState([]);

  const { 
    getMemberById, 
    updateMember, 
    deleteMember,
    getMemberGroups,
    getMemberPledges,
    getMemberTags,
    getFamilyMembers,
    getMemberNotes,
    addMemberNote
  } = useMembers();

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch member basic information
      const memberData = await getMemberById(id);
      setMember(memberData);
      
      // Fetch related data in parallel
      const [groups, pledges, tags, family, notes] = await Promise.all([
        getMemberGroups(id),
        getMemberPledges(id),
        getMemberTags(id),
        getFamilyMembers(id),
        getMemberNotes(id)
      ]);
      
      setMemberGroups(groups);
      setMemberPledges(pledges);
      setMemberTags(tags);
      setFamilyMembers(family);
      setMemberNotes(notes);
      
    } catch (err) {
      setError(err.message || 'Failed to load member data');
      showToast('Failed to load member data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      const updatedMember = await updateMember(id, updatedData);
      setMember(updatedMember);
      setShowEditModal(false);
      showToast('Member updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update member', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMember(id);
      setShowDeleteDialog(false);
      showToast('Member deleted successfully', 'success');
      navigate('/admin/members');
    } catch (err) {
      showToast('Failed to delete member', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const note = await addMemberNote(id, {
        content: newNote,
        created_by: user.id
      });
      setMemberNotes(prev => [note, ...prev]);
      setNewNote('');
      setShowAddNoteModal(false);
      showToast('Note added successfully', 'success');
    } catch (err) {
      showToast('Failed to add note', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getPledgeStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return 'N/A';
    }
  };

  const totalPledgeAmount = memberPledges.reduce((sum, pledge) => {
    return sum + (pledge.status === 'active' ? pledge.amount : 0);
  }, 0);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading member details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle className={styles.errorIcon} />
        <h3>Error Loading Member</h3>
        <p>{error}</p>
        <Button onClick={() => navigate('/admin/members')} variant="outline">
          <ArrowLeft size={16} />
          Back to Members
        </Button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle className={styles.errorIcon} />
        <h3>Member Not Found</h3>
        <p>The requested member could not be found.</p>
        <Button onClick={() => navigate('/admin/members')} variant="outline">
          <ArrowLeft size={16} />
          Back to Members
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.memberDetail}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <Button 
            onClick={() => navigate('/admin/members')} 
            variant="outline"
            size="sm"
          >
            <ArrowLeft size={16} />
            Back to Members
          </Button>
        </div>
        
        <div className={styles.headerContent}>
          <div className={styles.memberHeader}>
            <Avatar 
              src={member.photo_url} 
              alt={`${member.first_name} ${member.last_name}`}
              size="large"
              fallback={`${member.first_name?.[0]}${member.last_name?.[0]}`}
            />
            <div className={styles.memberInfo}>
              <h1 className={styles.memberName}>
                {member.first_name} {member.last_name}
                {member.preferred_name && (
                  <span className={styles.preferredName}>
                    "{member.preferred_name}"
                  </span>
                )}
              </h1>
              <div className={styles.memberMeta}>
                <Badge variant={getStatusColor(member.status || 'active')}>
                  {member.status || 'active'}
                </Badge>
                <span className={styles.memberAge}>
                  Age: {calculateAge(member.date_of_birth)}
                </span>
                <span className={styles.memberSince}>
                  Member since {formatDate(member.registration_date)}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            {user.role !== 'readonly' && (
              <>
                <Button onClick={handleEdit} variant="outline">
                  <Edit3 size={16} />
                  Edit
                </Button>
                <Button 
                  onClick={handleDelete} 
                  variant="outline"
                  className={styles.deleteButton}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Tags */}
      {memberTags.length > 0 && (
        <div className={styles.tagsSection}>
          <div className={styles.tags}>
            {memberTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                <Tag size={12} />
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'groups', label: 'Groups & Ministries' },
          { id: 'pledges', label: 'Pledges & Giving' },
          { id: 'family', label: 'Family' },
          { id: 'notes', label: 'Notes & History' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.overviewGrid}>
              {/* Contact Information */}
              <Card className={styles.infoCard}>
                <h3>Contact Information</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <Mail size={16} />
                    <span>
                      <a href={`mailto:${member.email}`}>{member.email}</a>
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <Phone size={16} />
                    <span>
                      <a href={`tel:${member.phone}`}>{formatPhoneNumber(member.phone)}</a>
                    </span>
                  </div>
                  {member.alternate_phone && (
                    <div className={styles.infoItem}>
                      <Phone size={16} />
                      <span>
                        <a href={`tel:${member.alternate_phone}`}>
                          {formatPhoneNumber(member.alternate_phone)} (Alt)
                        </a>
                      </span>
                    </div>
                  )}
                  {member.address && (
                    <div className={styles.infoItem}>
                      <MapPin size={16} />
                      <span>{member.address}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Personal Information */}
              <Card className={styles.infoCard}>
                <h3>Personal Information</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <Calendar size={16} />
                    <span>
                      Born: {formatDate(member.date_of_birth)} 
                      ({calculateAge(member.date_of_birth)} years old)
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <User size={16} />
                    <span>Gender: {member.gender}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <MessageSquare size={16} />
                    <span>
                      Preferred Contact: {member.preferred_contact_method}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <Calendar size={16} />
                    <span>
                      Joined: {formatDate(member.registration_date)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className={styles.statsCard}>
                <h3>Quick Stats</h3>
                <div className={styles.statsList}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {memberPledges.filter(p => p.status === 'active').length}
                    </div>
                    <div className={styles.statLabel}>Active Pledges</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {formatCurrency(totalPledgeAmount)}
                    </div>
                    <div className={styles.statLabel}>Total Pledged</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {familyMembers.length}
                    </div>
                    <div className={styles.statLabel}>Family Members</div>
                  </div>
                </div>
              </Card>

              {/* Emergency Contact */}
              {(member.emergency_contact_name || member.emergency_contact_phone) && (
                <Card className={styles.infoCard}>
                  <h3>Emergency Contact</h3>
                  <div className={styles.infoList}>
                    {member.emergency_contact_name && (
                      <div className={styles.infoItem}>
                        <User size={16} />
                        <span>{member.emergency_contact_name}</span>
                      </div>
                    )}
                    {member.emergency_contact_phone && (
                      <div className={styles.infoItem}>
                        <Phone size={16} />
                        <span>
                          <a href={`tel:${member.emergency_contact_phone}`}>
                            {formatPhoneNumber(member.emergency_contact_phone)}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className={styles.groupsTab}>
            <div className={styles.sectionHeader}>
              <h3>Groups & Ministries</h3>
              <Badge variant="outline">{memberGroups.length} groups</Badge>
            </div>
            
            {memberGroups.length > 0 ? (
              <div className={styles.groupsList}>
                {memberGroups.map(group => (
                  <Card key={group.id} className={styles.groupCard}>
                    <div className={styles.groupInfo}>
                      <h4>{group.name}</h4>
                      <p>{group.description}</p>
                      <div className={styles.groupMeta}>
                        <span>Joined: {formatDate(group.join_date)}</span>
                        {group.role && <Badge variant="outline">{group.role}</Badge>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Users size={48} />
                <h4>No Groups Yet</h4>
                <p>This member hasn't joined any groups or ministries.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pledges' && (
          <div className={styles.pledgesTab}>
            <div className={styles.sectionHeader}>
              <h3>Pledges & Giving</h3>
              <div className={styles.pledgesSummary}>
                <Badge variant="outline">
                  {memberPledges.filter(p => p.status === 'active').length} active
                </Badge>
                <Badge variant="outline">
                  {formatCurrency(totalPledgeAmount)} total
                </Badge>
              </div>
            </div>
            
            {memberPledges.length > 0 ? (
              <div className={styles.pledgesList}>
                {memberPledges.map(pledge => (
                  <Card key={pledge.id} className={styles.pledgeCard}>
                    <div className={styles.pledgeInfo}>
                      <div className={styles.pledgeAmount}>
                        {formatCurrency(pledge.amount)}
                        <span className={styles.pledgeFrequency}>
                          {pledge.frequency}
                        </span>
                      </div>
                      <div className={styles.pledgeMeta}>
                        <Badge variant={getPledgeStatusColor(pledge.status)}>
                          {pledge.status}
                        </Badge>
                        <span>
                          {formatDate(pledge.start_date)} - 
                          {pledge.end_date ? formatDate(pledge.end_date) : 'Ongoing'}
                        </span>
                      </div>
                      {pledge.notes && (
                        <p className={styles.pledgeNotes}>{pledge.notes}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <DollarSign size={48} />
                <h4>No Pledges Yet</h4>
                <p>This member hasn't made any pledges.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'family' && (
          <div className={styles.familyTab}>
            <div className={styles.sectionHeader}>
              <h3>Family Members</h3>
              <Badge variant="outline">{familyMembers.length} members</Badge>
            </div>
            
            {familyMembers.length > 0 ? (
              <div className={styles.familyList}>
                {familyMembers.map(familyMember => (
                  <Card key={familyMember.id} className={styles.familyCard}>
                    <Avatar 
                      src={familyMember.photo_url}
                      alt={`${familyMember.first_name} ${familyMember.last_name}`}
                      size="medium"
                      fallback={`${familyMember.first_name?.[0]}${familyMember.last_name?.[0]}`}
                    />
                    <div className={styles.familyInfo}>
                      <h4>
                        {familyMember.first_name} {familyMember.last_name}
                      </h4>
                      <Badge variant="outline">{familyMember.relationship}</Badge>
                      <div className={styles.familyMeta}>
                        <span>Age: {calculateAge(familyMember.date_of_birth)}</span>
                        <a href={`/admin/members/${familyMember.id}`}>
                          <ExternalLink size={14} />
                          View Profile
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Users size={48} />
                <h4>No Family Members</h4>
                <p>No family relationships have been established.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className={styles.notesTab}>
            <div className={styles.sectionHeader}>
              <h3>Notes & History</h3>
              {user.role !== 'readonly' && (
                <Button onClick={() => setShowAddNoteModal(true)} size="sm">
                  Add Note
                </Button>
              )}
            </div>
            
            {memberNotes.length > 0 ? (
              <div className={styles.notesList}>
                {memberNotes.map(note => (
                  <Card key={note.id} className={styles.noteCard}>
                    <div className={styles.noteHeader}>
                      <div className={styles.noteAuthor}>
                        <Avatar 
                          src={note.author_photo}
                          alt={note.author_name}
                          size="small"
                          fallback={note.author_name?.[0]}
                        />
                        <span>{note.author_name}</span>
                      </div>
                      <div className={styles.noteDate}>
                        <Clock size={12} />
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                    <div className={styles.noteContent}>
                      {note.content}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MessageSquare size={48} />
                <h4>No Notes Yet</h4>
                <p>No notes have been added for this member.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add Note</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowAddNoteModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.addNoteForm}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
                className={styles.noteTextarea}
              />
              <div className={styles.noteActions}>
                <Button 
                  onClick={() => setShowAddNoteModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;