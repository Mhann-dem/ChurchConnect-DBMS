import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useMembers } from '../../../hooks/useMembers';

// Enhanced Family Form with better UX
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

  const [currentStep, setCurrentStep] = useState(1);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const steps = [
    { number: 1, title: 'Basic Information', icon: '📋' },
    { number: 2, title: 'Add Members', icon: '👥' },
    { number: 3, title: 'Primary Contact', icon: '📞' },
    { number: 4, title: 'Review', icon: '✅' }
  ];

  const RELATIONSHIP_TYPES = [
    { value: 'head', label: 'Head of Household', icon: '👑', color: '#3B82F6' },
    { value: 'spouse', label: 'Spouse', icon: '💑', color: '#EC4899' },
    { value: 'child', label: 'Child', icon: '🧒', color: '#10B981' },
    { value: 'dependent', label: 'Dependent', icon: '🤝', color: '#F59E0B' },
    { value: 'other', label: 'Other', icon: '👤', color: '#6B7280' }
  ];

  useEffect(() => {
    if (isEditing && id) {
      fetchFamily(id);
      setCurrentStep(4); // Go to review step for editing
    }
    fetchMembers({ family_id__isnull: true });
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
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.family_name.trim()) {
        newErrors.family_name = 'Family name is required';
      }
    }
    
    if (step === 2 && !isEditing) {
      if (getDisplayMembers().length === 0) {
        newErrors.members = 'Please add at least one family member';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddMember = (memberData) => {
    if (isEditing) {
      // Handle editing case
      addMemberToFamily(id, memberData).then((newRelationship) => {
        setFamilyMembers(prev => [...prev, newRelationship]);
        setShowAddMemberModal(false);
      });
    } else {
      // Handle new family case
      const member = allMembers.find(m => m.id === memberData.member_id);
      if (member) {
        setFormData(prev => ({
          ...prev,
          initial_members: [...prev.initial_members, memberData]
        }));
        setShowAddMemberModal(false);
      }
    }
  };

  const handleRemoveMember = (memberId, relationshipId) => {
    if (isEditing) {
      removeMemberFromFamily(id, memberId).then(() => {
        setFamilyMembers(prev => prev.filter(fm => fm.id !== relationshipId));
      });
    } else {
      setFormData(prev => ({
        ...prev,
        initial_members: prev.initial_members.filter(m => m.member_id !== memberId)
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
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

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
              <h2 style={{ margin: 0, color: '#1F2937', fontSize: '24px', fontWeight: '600' }}>
                Family Information
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', margin: '8px 0 0 0' }}>
                Start by providing basic information about the family
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Family Name *
                </label>
                <input
                  type="text"
                  name="family_name"
                  value={formData.family_name}
                  onChange={handleInputChange}
                  placeholder="e.g., The Johnson Family"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${errors.family_name ? '#EF4444' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = errors.family_name ? '#EF4444' : '#E5E7EB'}
                />
                {errors.family_name && (
                  <p style={{ color: '#EF4444', fontSize: '14px', margin: '4px 0 0 0' }}>
                    {errors.family_name}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter the family's address"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Additional notes about the family (optional)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
              <h2 style={{ margin: 0, color: '#1F2937', fontSize: '24px', fontWeight: '600' }}>
                Family Members
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', margin: '8px 0 0 0' }}>
                Add members to this family and define their relationships
              </p>
            </div>

            {errors.members && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                color: '#DC2626'
              }}>
                {errors.members}
              </div>
            )}

            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                disabled={availableMembers.length === 0}
                style={{
                  backgroundColor: availableMembers.length === 0 ? '#F3F4F6' : '#3B82F6',
                  color: availableMembers.length === 0 ? '#9CA3AF' : 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: availableMembers.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>+</span>
                Add Family Member
              </button>
              {availableMembers.length === 0 && (
                <p style={{ color: '#6B7280', fontSize: '14px', margin: '8px 0 0 0' }}>
                  No available members to add. All existing members are already assigned to families.
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {getDisplayMembers().map((relationship) => {
                const relationshipType = RELATIONSHIP_TYPES.find(rt => rt.value === relationship.relationship_type);
                return (
                  <div 
                    key={relationship.id}
                    style={{
                      backgroundColor: 'white',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: relationshipType?.color || '#6B7280',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}>
                        {relationshipType?.icon || '👤'}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '18px', 
                          fontWeight: '600',
                          color: '#1F2937'
                        }}>
                          {relationship.member?.first_name} {relationship.member?.last_name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            backgroundColor: relationshipType?.color || '#6B7280',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {relationshipType?.label || 'Other'}
                          </span>
                          {relationship.member?.email && (
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>
                              {relationship.member.email}
                            </span>
                          )}
                          {relationship.member?.phone && (
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>
                              {relationship.member.phone}
                            </span>
                          )}
                        </div>
                        {relationship.notes && (
                          <p style={{ 
                            color: '#6B7280', 
                            fontSize: '14px', 
                            margin: '4px 0 0 0',
                            fontStyle: 'italic'
                          }}>
                            {relationship.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(relationship.member?.id, relationship.id)}
                        style={{
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#FEF2F2';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {getDisplayMembers().length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  backgroundColor: '#F9FAFB',
                  border: '2px dashed #D1D5DB',
                  borderRadius: '12px',
                  color: '#6B7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>
                    No family members yet
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Click "Add Family Member" to start building your family
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        const members = getDisplayMembers();
        return (
          <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
              <h2 style={{ margin: 0, color: '#1F2937', fontSize: '24px', fontWeight: '600' }}>
                Primary Contact
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', margin: '8px 0 0 0' }}>
                Choose who will be the main contact for this family
              </p>
            </div>

            {members.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                color: '#92400E'
              }}>
                <p>Please add family members first before selecting a primary contact.</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    marginTop: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Go Back to Add Members
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {members.map((relationship) => {
                  const isSelected = formData.primary_contact_id === relationship.member?.id;
                  const relationshipType = RELATIONSHIP_TYPES.find(rt => rt.value === relationship.relationship_type);
                  
                  return (
                    <div 
                      key={relationship.id}
                      onClick={() => setFormData(prev => ({ ...prev, primary_contact_id: relationship.member?.id }))}
                      style={{
                        backgroundColor: isSelected ? '#EBF8FF' : 'white',
                        border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: relationshipType?.color || '#6B7280',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        {relationshipType?.icon || '👤'}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '18px', 
                          fontWeight: '600',
                          color: '#1F2937'
                        }}>
                          {relationship.member?.first_name} {relationship.member?.last_name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: relationshipType?.color || '#6B7280',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {relationshipType?.label || 'Other'}
                          </span>
                          {relationship.member?.email && (
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>
                              {relationship.member.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                        backgroundColor: isSelected ? '#3B82F6' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && (
                          <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ margin: 0, color: '#1F2937', fontSize: '24px', fontWeight: '600' }}>
                Review & {isEditing ? 'Update' : 'Create'} Family
              </h2>
              <p style={{ color: '#6B7280', fontSize: '16px', margin: '8px 0 0 0' }}>
                Please review the family information before {isEditing ? 'updating' : 'creating'}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Family Information */}
              <div style={{
                backgroundColor: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                  Family Information
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Family Name: </span>
                    <span style={{ color: '#1F2937' }}>{formData.family_name}</span>
                  </div>
                  {formData.address && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Address: </span>
                      <span style={{ color: '#1F2937' }}>{formData.address}</span>
                    </div>
                  )}
                  {formData.notes && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Notes: </span>
                      <span style={{ color: '#1F2937' }}>{formData.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Members */}
              {getDisplayMembers().length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                    Family Members ({getDisplayMembers().length})
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {getDisplayMembers().map((relationship) => {
                      const relationshipType = RELATIONSHIP_TYPES.find(rt => rt.value === relationship.relationship_type);
                      const isPrimary = formData.primary_contact_id === relationship.member?.id;
                      
                      return (
                        <div key={relationship.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: isPrimary ? '#F0F9FF' : '#F9FAFB',
                          borderRadius: '8px',
                          border: isPrimary ? '1px solid #0EA5E9' : '1px solid #E5E7EB'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: relationshipType?.color || '#6B7280',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}>
                            {relationshipType?.icon || '👤'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#1F2937' }}>
                              {relationship.member?.first_name} {relationship.member?.last_name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6B7280' }}>
                              {relationshipType?.label || 'Other'}
                              {isPrimary && ' • Primary Contact'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '32px'
            }}>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  style={{
                    backgroundColor: 'white',
                    color: '#6B7280',
                    border: '2px solid #E5E7EB',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Back to Edit
                </button>
              )}
              
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: saving ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Family' : 'Create Family')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '32px' }}>⏳</div>
        <p style={{ color: '#6B7280', fontSize: '16px' }}>Loading family form...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '20px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '0 20px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>
              {isEditing ? 'Edit Family' : 'Create New Family'}
            </h1>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '16px' }}>
              {isEditing ? 'Update family information and members' : 'Add a new family to your church directory'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/families')}
            style={{
              backgroundColor: 'white',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Cancel
          </button>
        </div>

        {/* Progress Steps */}
        {!isEditing && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {steps.map((step, index) => (
                <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: currentStep >= step.number ? '#10B981' : '#E5E7EB',
                      color: currentStep >= step.number ? 'white' : '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      transition: 'all 0.3s ease'
                    }}>
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentStep >= step.number ? '#10B981' : '#9CA3AF',
                      textAlign: 'center'
                    }}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div style={{
                      height: '2px',
                      flex: 1,
                      backgroundColor: currentStep > step.number ? '#10B981' : '#E5E7EB',
                      marginTop: '-20px',
                      transition: 'all 0.3s ease'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit}>
            {getStepContent()}
            
            {/* Navigation Buttons */}
            {!isEditing && currentStep < 4 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '24px 32px',
                backgroundColor: '#F9FAFB',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  style={{
                    backgroundColor: currentStep === 1 ? 'transparent' : 'white',
                    color: currentStep === 1 ? 'transparent' : '#6B7280',
                    border: currentStep === 1 ? 'none' : '2px solid #E5E7EB',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: currentStep === 1 ? 'default' : 'pointer',
                    visibility: currentStep === 1 ? 'hidden' : 'visible'
                  }}
                >
                  Previous
                </button>
                
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {currentStep === 3 ? 'Review' : 'Next'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Add Member Modal would go here */}
        {showAddMemberModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Add Family Member</h3>
              <p>Add Member Modal Component would be rendered here</p>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyForm;