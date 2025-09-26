// frontend/src/components/admin/Families/FamilyForm.jsx - Enhanced with validation and error handling
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useMembers } from '../../../hooks/useMembers';
import { usePerformanceMonitoring } from '../../../hooks/usePerformanceMonitoring';
import { validateFamilyForm, validateMemberData, useFormValidation } from '../../../utils/validation';
import ErrorBoundary from '../../shared/ErrorBoundary';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../shared/LoadingSpinner';
import AddMemberModal from './AddMemberModal';
import './Families.module.css';

const RELATIONSHIP_TYPES = [
  { value: 'head', label: 'Head of Household', icon: '👑', color: '#3B82F6' },
  { value: 'spouse', label: 'Spouse', icon: '💑', color: '#EC4899' },
  { value: 'child', label: 'Child', icon: '🧒', color: '#10B981' },
  { value: 'dependent', label: 'Dependent', icon: '🤝', color: '#F59E0B' },
  { value: 'other', label: 'Other', icon: '👤', color: '#6B7280' }
];

const FamilyFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { trackApiCall, trackInteraction } = usePerformanceMonitoring();

  const { 
    family, 
    loading: familyLoading, 
    fetchFamily, 
    createFamily, 
    updateFamily,
    addMemberToFamily,
    removeMemberFromFamily,
    setPrimaryContact,
    clearError
  } = useFamilies();

  const { members: allMembers, fetchMembers, loading: membersLoading } = useMembers();

  // Form validation hook
  const {
    data: formData,
    errors: formErrors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset
  } = useFormValidation(
    {
      family_name: '',
      address: '',
      notes: '',
      primary_contact_id: '',
      initial_members: []
    },
    validateFamilyForm
  );

  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitErrors, setSubmitErrors] = useState({});

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (isEditing && id) {
          await trackApiCall(
            () => fetchFamily(id),
            'fetch_family_for_edit',
            { familyId: id }
          );
        }
        
        await trackApiCall(
          () => fetchMembers({ family_id__isnull: true }),
          'fetch_available_members'
        );
      } catch (error) {
        console.error('Error initializing form data:', error);
      }
    };

    initializeData();
  }, [isEditing, id, fetchFamily, fetchMembers, trackApiCall]);

  // Update form when family data is loaded
  useEffect(() => {
    if (family && isEditing) {
      reset({
        family_name: family.family_name || '',
        address: family.address || '',
        notes: family.notes || '',
        primary_contact_id: family.primary_contact?.id || '',
        initial_members: []
      });
      setFamilyMembers(family.family_relationships || []);
    }
  }, [family, isEditing, reset]);

  // Update available members
  useEffect(() => {
    if (allMembers) {
      const available = allMembers.filter(member => 
        !member.family_id && !familyMembers.some(fm => fm.member?.id === member.id)
      );
      setAvailableMembers(available);
    }
  }, [allMembers, familyMembers]);

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(submitErrors).length > 0) {
      setSubmitErrors({});
    }
    clearError();
  }, [formData, clearError, submitErrors]);

  const handleInputChange = trackInteraction('form_field_change', (name, value) => {
    handleChange(name, value);
  });

  const handleInputBlur = (name) => {
    handleBlur(name);
  };

  const validateForm = () => {
    const validation = validateAll();
    
    // Additional validation for members
    if (!isEditing && getDisplayMembers().length === 0) {
      setSubmitErrors(prev => ({
        ...prev,
        members: 'Please add at least one family member'
      }));
      return false;
    }

    return validation.isValid && Object.keys(submitErrors).length === 0;
  };

  const handleSubmit = trackInteraction('submit_family_form', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSubmitErrors({});
    
    try {
      if (isEditing) {
        await trackApiCall(
          () => updateFamily(id, formData),
          'update_family',
          { familyId: id, familyName: formData.family_name }
        );
        navigate(`/admin/families/${id}`);
      } else {
        const newFamily = await trackApiCall(
          () => createFamily(formData),
          'create_family',
          { familyName: formData.family_name, memberCount: formData.initial_members.length }
        );
        navigate(`/admin/families/${newFamily.id}`);
      }
    } catch (error) {
      if (error.response?.data) {
        setSubmitErrors(error.response.data);
      } else {
        setSubmitErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  });

  const handleAddMember = trackInteraction('add_member_to_family', async (memberData) => {
    // Validate member data
    const validation = validateMemberData(
      memberData, 
      getDisplayMembers().map(m => m.relationship_type)
    );
    
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    try {
      if (isEditing) {
        const newRelationship = await trackApiCall(
          () => addMemberToFamily(id, validation.sanitizedData),
          'add_member_existing_family',
          { familyId: id, relationshipType: memberData.relationship_type }
        );
        setFamilyMembers(prev => [...prev, newRelationship]);
      } else {
        // For new families, add to initial_members array
        handleInputChange('initial_members', [
          ...formData.initial_members, 
          validation.sanitizedData
        ]);
      }
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error; // Re-throw to be handled by the modal
    }
  });

  const handleRemoveMember = trackInteraction('remove_member_from_family', async (memberId, relationshipId) => {
    try {
      if (isEditing) {
        await trackApiCall(
          () => removeMemberFromFamily(id, memberId),
          'remove_member_existing_family',
          { familyId: id, memberId }
        );
        setFamilyMembers(prev => prev.filter(fm => fm.id !== relationshipId));
        
        // Clear primary contact if it was this member
        if (formData.primary_contact_id === memberId) {
          handleInputChange('primary_contact_id', '');
        }
      } else {
        // For new families, remove from initial_members array
        handleInputChange('initial_members', 
          formData.initial_members.filter(m => m.member_id !== memberId)
        );
        
        // Clear primary contact if it was this member
        if (formData.primary_contact_id === memberId) {
          handleInputChange('primary_contact_id', '');
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  });

  const handleSetPrimaryContact = trackInteraction('set_primary_contact', async (memberId) => {
    try {
      if (isEditing) {
        await trackApiCall(
          () => setPrimaryContact(id, memberId),
          'set_primary_contact_existing_family',
          { familyId: id, memberId }
        );
      }
      handleInputChange('primary_contact_id', memberId);
    } catch (error) {
      console.error('Error setting primary contact:', error);
    }
  });

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

  // Memoized values for performance
  const displayMembers = useMemo(() => getDisplayMembers(), [isEditing, familyMembers, formData.initial_members, allMembers]);
  const primaryContact = useMemo(() => {
    return displayMembers.find(m => m.member?.id === formData.primary_contact_id);
  }, [displayMembers, formData.primary_contact_id]);

  const isLoading = familyLoading || membersLoading;

  if (isLoading) {
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
            disabled={saving}
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
        {/* General Error Display */}
        {(submitErrors.general || submitErrors.non_field_errors) && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Error</h4>
            <p style={{ color: '#991b1b', margin: 0 }}>
              {submitErrors.general || submitErrors.non_field_errors}
            </p>
          </div>
        )}

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
                onChange={(e) => handleInputChange('family_name', e.target.value)}
                onBlur={() => handleInputBlur('family_name')}
                className={formErrors.family_name || submitErrors.family_name ? 'error' : ''}
                placeholder="e.g., The Smith Family"
                required
                disabled={saving}
              />
              {(formErrors.family_name || submitErrors.family_name) && (
                <span className="error-text">
                  {formErrors.family_name || submitErrors.family_name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                onBlur={() => handleInputBlur('address')}
                className={formErrors.address || submitErrors.address ? 'error' : ''}
                rows="3"
                placeholder="Family address"
                disabled={saving}
              />
              {(formErrors.address || submitErrors.address) && (
                <span className="error-text">
                  {formErrors.address || submitErrors.address}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                onBlur={() => handleInputBlur('notes')}
                className={formErrors.notes || submitErrors.notes ? 'error' : ''}
                rows="4"
                placeholder="Additional notes about the family"
                disabled={saving}
              />
              {(formErrors.notes || submitErrors.notes) && (
                <span className="error-text">
                  {formErrors.notes || submitErrors.notes}
                </span>
              )}
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
                disabled={availableMembers.length === 0 || saving}
              >
                Add Member
              </Button>
            </div>

            {/* Member validation error */}
            {submitErrors.members && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#dc2626'
              }}>
                {submitErrors.members}
              </div>
            )}

            {availableMembers.length === 0 && displayMembers.length === 0 && (
              <p className="no-members-text">
                No members available to add. All existing members are already assigned to families.
              </p>
            )}

            {displayMembers.length > 0 && (
              <div className="family-members-list">
                {displayMembers
                  .sort((a, b) => {
                    const priority = { head: 1, spouse: 2, child: 3, dependent: 4, other: 5 };
                    return (priority[a.relationship_type] || 5) - (priority[b.relationship_type] || 5);
                  })
                  .map((relationship) => {
                    const relationshipType = RELATIONSHIP_TYPES.find(rt => rt.value === relationship.relationship_type);
                    const isPrimary = formData.primary_contact_id === relationship.member?.id;
                    
                    return (
                      <div key={relationship.id} className="member-card">
                        <div className="member-info">
                          <div className="member-details">
                            <h4>
                              {relationship.member?.get_full_name || 
                               `${relationship.member?.first_name} ${relationship.member?.last_name}`}
                            </h4>
                            <div className="member-meta">
                              <Badge 
                                variant={
                                  relationship.relationship_type === 'head' ? 'primary' :
                                  relationship.relationship_type === 'spouse' ? 'secondary' :
                                  relationship.relationship_type === 'child' ? 'info' : 'default'
                                }
                              >
                                {relationshipType?.icon} {relationship.relationship_type_display}
                              </Badge>
                              {isPrimary && (
                                <Badge variant="success" size="sm">Primary Contact</Badge>
                              )}
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
                          {!isPrimary && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimaryContact(relationship.member?.id)}
                              disabled={saving}
                            >
                              Set as Primary
                            </Button>
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(relationship.member?.id, relationship.id)}
                            className="remove-btn"
                            disabled={saving}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          {/* Primary Contact Section */}
          {displayMembers.length > 0 && (
            <Card className="form-section">
              <h2>Primary Contact</h2>
              {primaryContact ? (
                <div className="primary-contact-info">
                  <div className="contact-details">
                    <h4>
                      {primaryContact.member?.get_full_name || 
                       `${primaryContact.member?.first_name} ${primaryContact.member?.last_name}`}
                    </h4>
                    <p>Email: {primaryContact.member?.email || 'Not provided'}</p>
                    <p>Phone: {primaryContact.member?.phone || 'Not provided'}</p>
                    <p>Relationship: {primaryContact.relationship_type_display}</p>
                  </div>
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
        existingRelationships={displayMembers.map(m => m.relationship_type)}
      />
    </div>
  );
};

// Main component wrapped with error boundary
const FamilyForm = () => {
  return (
    <ErrorBoundary fallbackMessage="There was an error loading the family form. Please refresh the page and try again.">
      <FamilyFormContent />
    </ErrorBoundary>
  );
};

export default FamilyForm;