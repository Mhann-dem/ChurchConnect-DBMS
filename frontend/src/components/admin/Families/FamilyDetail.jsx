// frontend/src/components/admin/Families/FamilyDetail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ConfirmDialog from '../../shared/ConfirmDialog';
import AddMemberModal from './AddMemberModal';
import './Families.module.css';

const FamilyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    family, 
    loading, 
    fetchFamily, 
    deleteFamily,
    addMemberToFamily,
    removeMemberFromFamily,
    getFamilyMembers,
    setPrimaryContact
  } = useFamilies();

  const [familyData, setFamilyData] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFamily(id);
    }
  }, [id, fetchFamily]);

  useEffect(() => {
    if (family) {
      setFamilyData(family);
    }
  }, [family]);

  const handleDelete = async () => {
    try {
      await deleteFamily(id);
      navigate('/admin/families');
    } catch (error) {
      console.error('Error deleting family:', error);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      await addMemberToFamily(id, memberData);
      // Refresh family data
      fetchFamily(id);
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async () => {
    if (memberToRemove) {
      try {
        await removeMemberFromFamily(id, memberToRemove.member.id);
        // Refresh family data
        fetchFamily(id);
        setShowRemoveMemberDialog(false);
        setMemberToRemove(null);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleSetPrimaryContact = async (memberId) => {
    try {
      await setPrimaryContact(id, memberId);
      // Refresh family data
      fetchFamily(id);
    } catch (error) {
      console.error('Error setting primary contact:', error);
    }
  };

  const getRelationshipPriority = (type) => {
    const priorities = { head: 1, spouse: 2, child: 3, dependent: 4, other: 5 };
    return priorities[type] || 5;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading family details..." />;
  }

  if (!familyData) {
    return (
      <div className="family-detail error">
        <h1>Family Not Found</h1>
        <p>The requested family could not be found.</p>
        <Button as={Link} to="/admin/families">
          Back to Families
        </Button>
      </div>
    );
  }

  const sortedMembers = (familyData.family_relationships || []).sort((a, b) => 
    getRelationshipPriority(a.relationship_type) - getRelationshipPriority(b.relationship_type)
  );

  return (
    <div className="family-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-content">
          <div className="header-title">
            <h1>{familyData.family_name}</h1>
            <div className="family-stats">
              <Badge variant="secondary">
                {familyData.member_count} member{familyData.member_count !== 1 ? 's' : ''}
              </Badge>
              {familyData.children_count > 0 && (
                <Badge variant="info">
                  {familyData.children_count} child{familyData.children_count !== 1 ? 'ren' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="warning-badges">
            {!familyData.primary_contact_name && (
              <Badge variant="warning">No Primary Contact</Badge>
            )}
            {familyData.member_count === 0 && (
              <Badge variant="error">No Members</Badge>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <Button
            variant="outline"
            onClick={() => setShowAddMemberModal(true)}
          >
            Add Member
          </Button>
          <Button
            variant="outline"
            as={Link}
            to={`/admin/families/${id}/edit`}
          >
            Edit Family
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Family
          </Button>
        </div>
      </div>

      <div className="detail-content">
        {/* Family Information */}
        <Card className="family-info-card">
          <h2>Family Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Family Name</label>
              <span>{familyData.family_name}</span>
            </div>
            
            <div className="info-item">
              <label>Primary Contact</label>
              <span>
                {familyData.primary_contact_name ? (
                  <div>
                    <div className="contact-name">{familyData.primary_contact_name}</div>
                    {familyData.primary_contact_email && (
                      <div className="contact-detail">
                        <a href={`mailto:${familyData.primary_contact_email}`}>
                          {familyData.primary_contact_email}
                        </a>
                      </div>
                    )}
                    {familyData.primary_contact_phone && (
                      <div className="contact-detail">
                        <a href={`tel:${familyData.primary_contact_phone}`}>
                          {familyData.primary_contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="no-data">Not set</span>
                )}
              </span>
            </div>

            <div className="info-item">
              <label>Total Members</label>
              <span>{familyData.member_count}</span>
            </div>

            <div className="info-item">
              <label>Adults</label>
              <span>{familyData.adults_count}</span>
            </div>

            <div className="info-item">
              <label>Children</label>
              <span>{familyData.children_count}</span>
            </div>

            <div className="info-item">
              <label>Dependents</label>
              <span>{familyData.dependents_count}</span>
            </div>

            <div className="info-item full-width">
              <label>Address</label>
              <span>{familyData.address || <span className="no-data">No address provided</span>}</span>
            </div>

            <div className="info-item full-width">
              <label>Notes</label>
              <span>{familyData.notes || <span className="no-data">No notes</span>}</span>
            </div>

            <div className="info-item">
              <label>Created</label>
              <span>{formatDate(familyData.created_at)}</span>
            </div>

            <div className="info-item">
              <label>Last Updated</label>
              <span>{formatDateTime(familyData.updated_at)}</span>
            </div>
          </div>
        </Card>

        {/* Family Members */}
        <Card className="family-members-card">
          <div className="card-header">
            <h2>Family Members ({familyData.member_count})</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMemberModal(true)}
            >
              Add Member
            </Button>
          </div>

          {sortedMembers.length === 0 ? (
            <div className="empty-state">
              <p>No members in this family yet.</p>
              <Button onClick={() => setShowAddMemberModal(true)}>
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="members-list">
              {sortedMembers.map((relationship) => (
                <div key={relationship.id} className="member-item">
                  <div className="member-info">
                    <div className="member-identity">
                      <h4>
                        <Link 
                          to={`/admin/members/${relationship.member?.id}`}
                          className="member-name"
                        >
                          {relationship.member_name}
                        </Link>
                      </h4>
                      <Badge 
                        variant={
                          relationship.relationship_type === 'head' ? 'primary' :
                          relationship.relationship_type === 'spouse' ? 'secondary' :
                          relationship.relationship_type === 'child' ? 'info' : 'default'
                        }
                      >
                        {relationship.relationship_type_display}
                      </Badge>
                      {familyData.primary_contact?.id === relationship.member?.id && (
                        <Badge variant="success" size="sm">Primary Contact</Badge>
                      )}
                    </div>

                    <div className="member-details">
                      {relationship.member_email && (
                        <div className="detail-item">
                          <span className="label">Email:</span>
                          <a href={`mailto:${relationship.member_email}`}>
                            {relationship.member_email}
                          </a>
                        </div>
                      )}
                      {relationship.member_phone && (
                        <div className="detail-item">
                          <span className="label">Phone:</span>
                          <a href={`tel:${relationship.member_phone}`}>
                            {relationship.member_phone}
                          </a>
                        </div>
                      )}
                      {relationship.member_date_of_birth && (
                        <div className="detail-item">
                          <span className="label">Date of Birth:</span>
                          <span>{formatDate(relationship.member_date_of_birth)}</span>
                        </div>
                      )}
                      {relationship.member_gender && (
                        <div className="detail-item">
                          <span className="label">Gender:</span>
                          <span>{relationship.member_gender}</span>
                        </div>
                      )}
                      {relationship.notes && (
                        <div className="detail-item full-width">
                          <span className="label">Relationship Notes:</span>
                          <span>{relationship.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="member-actions">
                    {familyData.primary_contact?.id !== relationship.member?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimaryContact(relationship.member?.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      as={Link}
                      to={`/admin/members/${relationship.member?.id}`}
                    >
                      View Member
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMemberToRemove(relationship);
                        setShowRemoveMemberDialog(true);
                      }}
                      className="remove-btn"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        existingRelationships={sortedMembers.map(m => m.relationship_type)}
      />

      {/* Delete Family Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Family"
        message={`Are you sure you want to delete "${familyData.family_name}"? This will remove all family relationships and cannot be undone.`}
        confirmText="Delete Family"
        cancelText="Cancel"
        type="danger"
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        isOpen={showRemoveMemberDialog}
        onClose={() => {
          setShowRemoveMemberDialog(false);
          setMemberToRemove(null);
        }}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={
          memberToRemove
            ? `Are you sure you want to remove ${memberToRemove.member_name} from this family? This action cannot be undone.`
            : ''
        }
        confirmText="Remove Member"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default FamilyDetail;