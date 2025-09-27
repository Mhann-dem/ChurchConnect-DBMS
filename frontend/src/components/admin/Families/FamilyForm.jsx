// frontend/src/components/admin/Families/FamilyForm.jsx - FIXED VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useMembers } from '../../../hooks/useMembers';
import ErrorBoundary from '../../shared/ErrorBoundary';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../shared/LoadingSpinner';
import AddMemberModal from './AddMemberModal';
import './Families.module.css';

const RELATIONSHIP_TYPES = [
  { value: 'head', label: 'Head of Household', color: '#3B82F6' },
  { value: 'spouse', label: 'Spouse', color: '#EC4899' },
  { value: 'child', label: 'Child', color: '#10B981' },
  { value: 'dependent', label: 'Dependent', color: '#F59E0B' },
  { value: 'other', label: 'Other', color: '#6B7280' }
];

// Simple validation functions
const validateFamilyForm = (data) => {
  const errors = {};
  
  if (!data.family_name?.trim()) {
    errors.family_name = 'Family name is required';
  }
  
  if (data.address && data.address.length > 500) {
    errors.address = 'Address must be less than 500 characters';
  }
  
  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Notes must be less than 1000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const FamilyFormContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

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

  // Form state
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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (isEditing && id) {
          await fetchFamily(id);
        }
        
        await fetchMembers({ family_id__isnull: true });
      } catch (error) {
        console.error('Error initializing form data:', error);
      }
    };

    initializeData();
  }, [isEditing, id, fetchFamily, fetchMembers]);

  // Update form when family data is loaded
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
    clearError();
  }, [formData, clearError]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInputBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field on blur
    const validation = validateFamilyForm({ ...formData, [name]: formData[name] });
    if (validation.errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validation.errors[name]
      }));
    }
  };

  const validateForm = () => {
    const validation = validateFamilyForm(formData);
    setErrors(validation.errors);
    
    // Additional validation for members
    if (!isEditing && getDisplayMembers().length === 0) {
      setErrors(prev => ({
        ...prev,
        members: 'Please add at least one family member'
      }));
      return false;
    }

    return validation.isValid && Object.keys(errors).length === 0;
  };

  const handleCancel = useCallback(() => {
    try {
      if (isEditing) {
        navigate(`/admin/families/${id}`, { replace: true });
      } else {
        navigate('/admin/families', { replace: true });
      }
    } catch (error) {
      console.error('Cancel navigation error:', error);
      // Fallback navigation
      if (isEditing) {
        window.location.href = `/admin/families/${id}`;
      } else {
        window.location.href = '/admin/families';
      }
    }
  }, [navigate, isEditing, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error, [class*="error"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    setErrors({});
    
    try {
      console.log('Submitting family form:', { isEditing, formData });
      
      let result;
      if (isEditing) {
        result = await updateFamily(id, formData);
        console.log('Family updated:', result);
        
        // Show success message before navigation
        setTimeout(() => {
          try {
            navigate(`/admin/families/${id}`, { replace: true });
          } catch (navError) {
            console.error('Navigation error after update:', navError);
            window.location.href = `/admin/families/${id}`;
          }
        }, 1000);
        
      } else {
        result = await createFamily(formData);
        console.log('Family created:', result);
        
        // Show success message before navigation
        setTimeout(() => {
          try {
            navigate(`/admin/families/${result.id}`, { replace: true });
          } catch (navError) {
            console.error('Navigation error after create:', navError);
            window.location.href = `/admin/families/${result.id}`;
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Enhanced error handling
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.message) {
          setErrors(errorData);
          
          // Scroll to first error field
          setTimeout(() => {
            const firstErrorField = document.querySelector('.error, [class*="error"]');
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          setErrors({ 
            general: errorData.message || errorData.detail || 'Failed to save family' 
          });
        }
      } else {
        setErrors({ 
          general: error.message || 'An unexpected error occurred. Please try again.' 
        });
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
        handleInputChange('initial_members', [
          ...formData.initial_members, 
          memberData
        ]);
      }
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const handleRemoveMember = async (memberId, relationshipId) => {
    try {
      if (isEditing) {
        await removeMemberFromFamily(id, memberId);
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
  };

  const handleSetPrimaryContact = async (memberId) => {
    try {
      if (isEditing) {
        await setPrimaryContact(id, memberId);
      }
      handleInputChange('primary_contact_id', memberId);
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
        member: allMembers?.find(m => m.id === im.member_id),
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
        {(errors.general || errors.non_field_errors) && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Error</h4>
            <p style={{ color: '#991b1b', margin: 0 }}>
              {errors.general || errors.non_field_errors}
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
                className={errors.family_name ? 'error' : ''}
                placeholder="e.g., The Smith Family"
                required
                disabled={saving}
              />
              {errors.family_name && (
                <span className="error-text">
                  {errors.family_name}
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
                className={errors.address ? 'error' : ''}
                rows="3"
                placeholder="Family address"
                disabled={saving}
              />
              {errors.address && (
                <span className="error-text">
                  {errors.address}
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
                className={errors.notes ? 'error' : ''}
                rows="4"
                placeholder="Additional notes about the family"
                disabled={saving}
              />
              {errors.notes && (
                <span className="error-text">
                  {errors.notes}
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
            {errors.members && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#dc2626'
              }}>
                {errors.members}
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
                                {relationship.relationship_type_display}
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