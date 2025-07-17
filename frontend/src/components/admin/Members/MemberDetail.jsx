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
  ExternalLink
} from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import LoadingSpinner from '../../shared/LoadingSpinner';
import MemberForm from './MemberForm';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import styles from './Members.module.css';
import { useMembers } from '../../../hooks/useMembers';
import { formatPhoneNumber as formatPhone } from '../../../utils/formatters';


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
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const totalPledgeAmount = memberPledges.reduce((sum, pledge) => {
    return sum + (pledge.status === 'active' ? pledge.amount : 0);
  }, 0);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading member details...</p>
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
                  onClick={() => setShowDeleteDialog(true)} 
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
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'groups' ? styles.active : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups & Ministries
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'pledges' ? styles.active : ''}`}
          onClick={() => setActiveTab('pledges')}
        >
          Pledges & Giving
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'family' ? styles.active : ''}`}
          onClick={() => setActiveTab('family')}
        >
          Family
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notes' ? styles.active : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes & History
        </button>
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
                      <a href={`tel:${member.phone}`}>{formatPhone(member.phone)}</a>
                    </span>
                  </div>
                  {member.alternate_phone && (
                    <div className={styles.infoItem}>
                      <Phone size={16} />
                      <span>
                        <a href={`tel:${member.alternate_phone}`}>
                          {formatPhone(member.alternate_phone)} (Alt)
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
                      {memberGroups.length}
                    </div>
                    <div className={styles.statLabel}>Groups</div>
                  </div>
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
                            {formatPhone(member.emergency_contact_phone)}
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

      {/* Edit Modal */}
      {showEditModal && (
        <Modal 
          title="Edit Member"
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          size="large"
        >
          <MemberForm 
            member={member}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
            isEditing={true}
          />
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Member"
          message={`Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`}
          variant="danger"
        />
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <Modal
          title="Add Note"
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
        >
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
        </Modal>
      )}
    </div>
  );
};

export default MemberDetail;