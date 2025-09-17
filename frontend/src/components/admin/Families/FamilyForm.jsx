// frontend/src/components/admin/Families/FamilyForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useMembers } from '../../../hooks/useMembers';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../shared/LoadingSpinner';
import AddMemberModal from './AddMemberModal';
import { MemberSelector } from './MemberSelector';
import './Families.module.css';

const RELATIONSHIP_TYPES = [
  { value: 'head', label: 'Head of Household' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' }
];

const FamilyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { 
    family, 
    loading, 
    fetchFamily, 
    createFamily, 
    updateFamily,
    addMemberToFamily,
    removeMemberFromFamily,
    setPrimaryContact
  } = useFamilies();

  const { members: allMembers, fetchMembers } = useMembers();

  const [formData, setFormData] = useState({
    family_name: '',
    address: '',
    notes: '',
    primary_contact_id: '',
    initial_members: []
  });

  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchFamily(id);
    }
    fetchMembers({ family_id__isnull: true }); // Get members without families
  }, [isEditing, id, fetchFamily, fetchMembers]);

  useEffect(() => {
    if (family && isEditing) {
      setFormData({
        family_name: family.family_name || '',
        address: family.address || '',
        notes: family.notes || '',
        primary_contact_id: family.primary_contact?.id || '',
        initial_members: []
      });
      setFamilyMembers(family.family_relationships || []);
    }
  }, [family, isEditing]);

  useEffect(() => {
    // Filter out members who are already in families
    if (allMembers) {
      const available = allMembers.filter(member => 
        !member.family_id && !familyMembers.some(fm => fm.member?.id === member.id)
      );
      setAvailableMembers(available);
    }
  }, [allMembers, familyMembers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.family_name.trim()) {
      newErrors.family_name = 'Family name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      if (isEditing) {
        await updateFamily(id, formData);
        navigate(`/admin/families/${id}`);
      } else {
        const newFamily = await createFamily(formData);
        navigate(`/admin/families/${newFamily.id}`);
      }
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      if (isEditing) {
        const newRelationship = await addMemberToFamily(id, memberData);
        setFamilyMembers(prev => [...prev, newRelationship]);
      } else {
        // For new families, add to initial_members array
        setFormData(prev => ({
          ...prev,
          initial_members: [...prev.initial_members, memberData]
        }));
      }
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (memberId, relationshipId) => {
    try {
      if (isEditing) {
        await removeMemberFromFamily(id, memberId);
        setFamilyMembers(prev => prev.filter(fm => fm.id !== relationshipId));
      } else {
        // For new families, remove from initial_members array
        setFormData(prev => ({
          ...prev,
          initial_members: prev.initial_members.filter(m => m.member_id !== memberId)
        }));
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleSetPrimaryContact = async (memberId) => {
    try {
      if (isEditing) {
        await setPrimaryContact(id, memberId);
        setFormData(prev => ({
          ...prev,
          primary_contact_id: memberId
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          primary_contact_id: memberId
        }));
      }
    } catch (error) {
      console.error('Error setting primary contact:', error);
    }
  };

  const getDisplayMembers = () => {
    if (isEditing) {
      return familyMembers;
    } else {
      return formData.initial_members.map(im => ({
        id: `temp-${im.member_id}`,
        member: allMembers.find(m => m.id === im.member_id),
        relationship_type: im.relationship_type,
        relationship_type_display: RELATIONSHIP_TYPES.find(rt => rt.value === im.relationship_type)?.label,
        notes: im.notes
      }));
    }
  };

  if (loading) {
    return <LoadingSpinner message={isEditing ? "Loading family..." : "Loading form..."} />;
  }

  return (
    <div className="family-form">
      {/* Header */}
      <div className="form-header">
        <div className="header-content">
          <h1>{isEditing ? 'Edit Family' : 'Add New Family'}</h1>
          <p>{isEditing ? 'Update family information and members' : 'Create a new family unit'}</p>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/families')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="family-form"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Family' : 'Create Family')}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form id="family-form" onSubmit={handleSubmit} className="family-form-content">
        <div className="form-sections">
          {/* Basic Information */}
          <Card className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="family_name">Family Name *</label>
              <input
                type="text"
                id="family_name"
                name="family_name"
                value={formData.family_name}
                onChange={handleInputChange}
                className={errors.family_name ? 'error' : ''}
                placeholder="e.g., The Smith Family"
                required
              />
              {errors.family_name && (
                <span className="error-text">{errors.family_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Family address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Additional notes about the family"
              />
            </div>
          </Card>

          {/* Family Members */}
          <Card className="form-section">
            <div className="section-header">
              <h2>Family Members</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMemberModal(true)}
                disabled={availableMembers.length === 0}
              >
                Add Member
              </Button>
            </div>

            {availableMembers.length === 0 && getDisplayMembers().length === 0 && (
              <p className="no-members-text">
                No members available to add. All existing members are already assigned to families.
              </p>
            )}

            {getDisplayMembers().length > 0 && (
              <div className="family-members-list">
                {getDisplayMembers()
                  .sort((a, b) => {
                    const priority = { head: 1, spouse: 2, child: 3, dependent: 4, other: 5 };
                    return (priority[a.relationship_type] || 5) - (priority[b.relationship_type] || 5);
                  })
                  .map((relationship) => (
                    <div key={relationship.id} className="member-card">
                      <div className="member-info">
                        <div className="member-details">
                          <h4>{relationship.member?.get_full_name || relationship.member?.first_name + ' ' + relationship.member?.last_name}</h4>
                          <div className="member-meta">
                            <Badge 
                              variant={
                                relationship.relationship_type === 'head' ? 'primary' :
                                relationship.relationship_type === 'spouse' ? 'secondary' :
                                relationship.relationship_type === 'child' ? 'info' : 'default'
                              }
                            >
                              {relationship.relationship_type_display}
                            </Badge>
                            {relationship.member?.email && (
                              <span className="member-email">{relationship.member.email}</span>
                            )}
                            {relationship.member?.phone && (
                              <span className="member-phone">{relationship.member.phone}</span>
                            )}
                          </div>
                        </div>
                        
                        {relationship.notes && (
                          <p className="member-notes">{relationship.notes}</p>
                        )}
                      </div>

                      <div className="member-actions">
                        {!formData.primary_contact_id || formData.primary_contact_id !== relationship.member?.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimaryContact(relationship.member?.id)}
                          >
                            Set as Primary
                          </Button>
                        ) : (
                          <Badge variant="success" size="sm">Primary Contact</Badge>
                        )}
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(relationship.member?.id, relationship.id)}
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

          {/* Primary Contact Section */}
          {getDisplayMembers().length > 0 && (
            <Card className="form-section">
              <h2>Primary Contact</h2>
              {formData.primary_contact_id ? (
                <div className="primary-contact-info">
                  {(() => {
                    const primaryMember = getDisplayMembers().find(
                      m => m.member?.id === formData.primary_contact_id
                    )?.member;
                    return primaryMember ? (
                      <div className="contact-details">
                        <h4>{primaryMember.get_full_name || `${primaryMember.first_name} ${primaryMember.last_name}`}</h4>
                        <p>Email: {primaryMember.email}</p>
                        <p>Phone: {primaryMember.phone}</p>
                      </div>
                    ) : (
                      <p>Primary contact information not available</p>
                    );
                  })()}
                </div>
              ) : (
                <p className="no-primary-contact">
                  No primary contact selected. Click "Set as Primary" next to a family member above.
                </p>
              )}
            </Card>
          )}
        </div>
      </form>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        availableMembers={availableMembers}
        existingRelationships={getDisplayMembers().map(m => m.relationship_type)}
      />
    </div>
    );
};

export default FamilyForm;