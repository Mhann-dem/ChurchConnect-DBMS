// frontend/src/components/admin/Families/FamilyForm.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamilies } from '../../../hooks/useFamilies';
import { useMembers } from '../../../hooks/useMembers';
import ErrorBoundary from '../../shared/ErrorBoundary';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../shared/LoadingSpinner';
import AddMemberModal from './AddMemberModal';
import { 
  UsersIcon, 
  HomeIcon, 
  UserPlusIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  SaveIcon,
  XIcon,
  EditIcon
} from 'lucide-react';
import './Families.module.css';

const RELATIONSHIP_TYPES = [
  { value: 'head', label: 'Head of Household', color: '#3B82F6' },
  { value: 'spouse', label: 'Spouse', color: '#EC4899' },
  { value: 'child', label: 'Child', color: '#10B981' },
  { value: 'dependent', label: 'Dependent', color: '#F59E0B' },
  { value: 'other', label: 'Other', color: '#6B7280' }
];

// Enhanced validation with better UX feedback
const validateFamilyForm = (data) => {
  const errors = {};
  
  if (!data.family_name?.trim()) {
    errors.family_name = 'Family name is required';
  } else if (data.family_name.trim().length < 2) {
    errors.family_name = 'Family name must be at least 2 characters';
  } else if (data.family_name.trim().length > 100) {
    errors.family_name = 'Family name must be less than 100 characters';
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
  const formRef = useRef(null);
  const mountedRef = useRef(true);
  const navigationTimeoutRef = useRef(null);

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

  // Enhanced form state with better UX
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
  const [successMessage, setSuccessMessage] = useState('');
  const [navigationAttempts, setNavigationAttempts] = useState(0);

  // Enhanced loading state
  const isLoading = familyLoading || membersLoading;

  // Initialize data with better error handling
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('FamilyForm: Initializing data...', { isEditing, id });
        
        if (isEditing && id) {
          console.log('FamilyForm: Fetching family data for editing...');
          await fetchFamily(id);
        }
        
        console.log('FamilyForm: Fetching available members...');
        await fetchMembers({ family_id__isnull: true });
        
      } catch (error) {
        console.error('Error initializing form data:', error);
        setErrors({ 
          general: 'Failed to load form data. Please refresh and try again.' 
        });
      }
    };

    if (mountedRef.current) {
      initializeData();
    }

    return () => {
      mountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [isEditing, id, fetchFamily, fetchMembers]);

  // Update form when family data is loaded
  useEffect(() => {
    if (family && isEditing && mountedRef.current) {
      console.log('FamilyForm: Populating form with family data:', family);
      
      setFormData({
        family_name: family.family_name || '',
        address: family.address || '',
        notes: family.notes || '',
        primary_contact_id: family.primary_contact?.id || '',
        initial_members: []
      });
      
      setFamilyMembers(family.family_relationships || []);
      
      // Show success message if coming from creation
      if (family.id && !family.family_relationships?.length) {
        setSuccessMessage('Family loaded successfully! You can now add members.');
      }
    }
  }, [family, isEditing]);

  // Update available members
  useEffect(() => {
    if (allMembers && mountedRef.current) {
      const available = allMembers.filter(member => 
        !member.family_id && !familyMembers.some(fm => fm.member?.id === member.id)
      );
      setAvailableMembers(available);
      console.log('FamilyForm: Available members updated:', available.length);
    }
  }, [allMembers, familyMembers]);

  // Clear errors when form data changes
  useEffect(() => {
    if (mountedRef.current) {
      clearError();
    }
  }, [formData, clearError]);

  // Enhanced input handlers with real-time validation
  const handleInputChange = useCallback((name, value) => {
    if (!mountedRef.current) return;
    
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

    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  }, [errors, successMessage]);

  const handleInputBlur = useCallback((name) => {
    if (!mountedRef.current) return;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Real-time validation on blur
    const validation = validateFamilyForm({ ...formData, [name]: formData[name] });
    if (validation.errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validation.errors[name]
      }));
    }
  }, [formData]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const validation = validateFamilyForm(formData);
    setErrors(validation.errors);
    
    // Additional validation for members (only for new families)
    if (!isEditing && getDisplayMembers().length === 0) {
      setErrors(prev => ({
        ...prev,
        members: 'Please add at least one family member'
      }));
      return false;
    }

    // Mark all fields as touched for error display
    setTouched({
      family_name: true,
      address: true,
      notes: true
    });

    return validation.isValid;
  }, [formData, isEditing]);

  // Enhanced navigation with retry logic
  const safeNavigate = useCallback((path, options = {}) => {
    const attempt = (retryCount = 0) => {
      try {
        console.log(`Navigation attempt ${retryCount + 1} to:`, path);
        navigate(path, { 
          replace: true, 
          ...options,
          state: { ...options.state, timestamp: Date.now() }
        });
      } catch (error) {
        console.error(`Navigation attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < 2) {
          // Retry with increasing delay
          navigationTimeoutRef.current = setTimeout(() => {
            attempt(retryCount + 1);
          }, (retryCount + 1) * 500);
        } else {
          // Final fallback - direct window navigation
          console.log('Using fallback window navigation to:', path);
          window.location.href = path;
        }
      }
    };

    attempt();
  }, [navigate]);

  // Enhanced form submission with better UX
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error with smooth animation
      navigationTimeoutRef.current = setTimeout(() => {
        const firstErrorField = document.querySelector('.error, [class*="error"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          });
          firstErrorField.focus();
        }
      }, 100);
      return;
    }

    if (!mountedRef.current) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      console.log('FamilyForm: Submitting form...', { isEditing, formData });
      
      let result;
      if (isEditing) {
        result = await updateFamily(id, formData);
        console.log('Family updated successfully:', result);
        
        setSuccessMessage('Family updated successfully!');
        
        // Navigate after showing success message
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            safeNavigate(`/admin/families/${id}`);
          }
        }, 1500);
        
      } else {
        result = await createFamily(formData);
        console.log('Family created successfully:', result);
        
        setSuccessMessage('Family created successfully!');
        
        // Navigate after showing success message
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            safeNavigate(`/admin/families/${result.id}`);
          }
        }, 1500);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (!mountedRef.current) return;
      
      // Enhanced error handling with better UX
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.message && !errorData.detail) {
          setErrors(errorData);
          
          // Scroll to first error field with delay for better UX
          navigationTimeoutRef.current = setTimeout(() => {
            const firstErrorField = document.querySelector('.error, [class*="error"]');
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstErrorField.focus();
            }
          }, 100);
        } else {
          setErrors({ 
            general: errorData.message || errorData.detail || 'Failed to save family. Please try again.' 
          });
        }
      } else if (error.message) {
        setErrors({ 
          general: error.message
        });
      } else {
        setErrors({ 
          general: 'An unexpected error occurred. Please check your connection and try again.' 
        });
      }
      
      // Scroll to error message
      navigationTimeoutRef.current = setTimeout(() => {
        const errorElement = document.querySelector('[class*="error"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  // Enhanced cancel handler
  const handleCancel = useCallback(() => {
    try {
      if (isEditing) {
        safeNavigate(`/admin/families/${id}`);
      } else {
        safeNavigate('/admin/families');
      }
    } catch (error) {
      console.error('Cancel navigation error:', error);
      // Fallback navigation
      const fallbackPath = isEditing ? `/admin/families/${id}` : '/admin/families';
      window.location.href = fallbackPath;
    }
  }, [isEditing, id, safeNavigate]);

  // Enhanced member management
  const handleAddMember = async (memberData) => {
    if (!mountedRef.current) return;
    
    try {
      if (isEditing) {
        const newRelationship = await addMemberToFamily(id, memberData);
        setFamilyMembers(prev => [...prev, newRelationship]);
        setSuccessMessage('Member added successfully!');
      } else {
        // For new families, add to initial_members array
        const member = allMembers?.find(m => m.id === memberData.member_id);
        const newMember = {
          ...memberData,
          id: `temp-${Date.now()}`,
          member: member
        };
        
        handleInputChange('initial_members', [
          ...formData.initial_members, 
          memberData
        ]);
        
        setSuccessMessage('Member added to family!');
      }
      setShowAddMemberModal(false);
      
      // Clear success message after delay
      navigationTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setSuccessMessage('');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error adding member:', error);
      setErrors({ 
        members: 'Failed to add member. Please try again.' 
      });
      throw error;
    }
  };

  const handleRemoveMember = async (memberId, relationshipId) => {
    if (!mountedRef.current) return;
    
    try {
      if (isEditing) {
        await removeMemberFromFamily(id, memberId);
        setFamilyMembers(prev => prev.filter(fm => fm.id !== relationshipId));
        
        // Clear primary contact if it was this member
        if (formData.primary_contact_id === memberId) {
          handleInputChange('primary_contact_id', '');
        }
        
        setSuccessMessage('Member removed from family!');
      } else {
        // For new families, remove from initial_members array
        handleInputChange('initial_members', 
          formData.initial_members.filter(m => m.member_id !== memberId)
        );
        
        // Clear primary contact if it was this member
        if (formData.primary_contact_id === memberId) {
          handleInputChange('primary_contact_id', '');
        }
        
        setSuccessMessage('Member removed!');
      }
      
      // Clear success message after delay
      navigationTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setSuccessMessage('');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error removing member:', error);
      setErrors({
        members: 'Failed to remove member. Please try again.'
      });
    }
  };

  const handleSetPrimaryContact = async (memberId) => {
    if (!mountedRef.current) return;
    
    try {
      if (isEditing) {
        await setPrimaryContact(id, memberId);
      }
      handleInputChange('primary_contact_id', memberId);
      setSuccessMessage('Primary contact updated!');
      
      // Clear success message after delay
      navigationTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setSuccessMessage('');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error setting primary contact:', error);
      setErrors({
        primary_contact: 'Failed to set primary contact. Please try again.'
      });
    }
  };

  // Get display members with better handling
  const getDisplayMembers = useCallback(() => {
    if (isEditing) {
      return familyMembers;
    } else {
      return formData.initial_members.map(im => ({
        id: `temp-${im.member_id}`,
        member: allMembers?.find(m => m.id === im.member_id),
        relationship_type: im.relationship_type,
        relationship_type_display: RELATIONSHIP_TYPES.find(rt => rt.value === im.relationship_type)?.label,
        notes: im.notes
      })).filter(m => m.member); // Filter out members that couldn't be found
    }
  }, [isEditing, familyMembers, formData.initial_members, allMembers]);

  // Memoized values for performance
  const displayMembers = useMemo(() => getDisplayMembers(), [getDisplayMembers]);
  
  const primaryContact = useMemo(() => {
    return displayMembers.find(m => m.member?.id === formData.primary_contact_id);
  }, [displayMembers, formData.primary_contact_id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing) return formData.family_name.trim() || formData.address.trim() || formData.notes.trim() || formData.initial_members.length > 0;
    
    if (!family) return false;
    
    return (
      formData.family_name !== (family.family_name || '') ||
      formData.address !== (family.address || '') ||
      formData.notes !== (family.notes || '') ||
      formData.primary_contact_id !== (family.primary_contact?.id || '')
    );
  }, [isEditing, formData, family]);

  // Enhanced loading screen
  if (isLoading && (!family || isEditing)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <LoadingSpinner size="lg" />
          <h3 style={{ marginTop: '1rem', color: '#374151' }}>
            {isEditing ? "Loading family data..." : "Loading form..."}
          </h3>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            Please wait while we prepare everything for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-form" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 0'
    }}>
      {/* Enhanced Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 2rem auto',
        padding: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '2rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#1e293b'
            }}>
              {isEditing ? <EditIcon size={32} /> : <UserPlusIcon size={32} />}
              {isEditing ? 'Edit Family' : 'Create New Family'}
            </h1>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '1.1rem'
            }}>
              {isEditing ? 'Update family information and members' : 'Set up a new family unit with members and relationships'}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XIcon size={16} />
              Cancel
            </Button>
            <Button
              type="submit"
              form="family-form"
              disabled={saving || !formData.family_name?.trim()}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving || !formData.family_name?.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '140px',
                justifyContent: 'center',
                opacity: saving || !formData.family_name?.trim() ? 0.6 : 1
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon size={16} />
                  {isEditing ? 'Update Family' : 'Create Family'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <form 
          ref={formRef}
          id="family-form" 
          onSubmit={handleSubmit} 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}
        >
          {/* Success Message */}
          {successMessage && (
            <div style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#065f46',
              fontWeight: '500',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <CheckCircleIcon size={20} />
              {successMessage}
            </div>
          )}

          {/* General Error Display */}
          {(errors.general || errors.non_field_errors) && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#991b1b'
            }}>
              <AlertCircleIcon size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Error</h4>
                <p style={{ margin: 0 }}>
                  {errors.general || errors.non_field_errors}
                </p>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gap: '2rem'
          }}>
            {/* Basic Information */}
            <Card style={{
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.5rem'
              }}>
                <HomeIcon size={24} color="#3b82f6" />
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  Basic Information
                </h2>
              </div>
              
              <div style={{
                display: 'grid',
                gap: '1.5rem'
              }}>
                <div>
                  <label htmlFor="family_name" style={{
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
                    id="family_name"
                    name="family_name"
                    value={formData.family_name}
                    onChange={(e) => handleInputChange('family_name', e.target.value)}
                    onBlur={() => handleInputBlur('family_name')}
                    placeholder="e.g., The Smith Family"
                    required
                    disabled={saving}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.family_name ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease-in-out',
                      backgroundColor: errors.family_name ? '#fef2f2' : 'white'
                    }}
                  />
                  {errors.family_name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      color: '#ef4444',
                      fontSize: '14px'
                    }}>
                      <AlertCircleIcon size={16} />
                      {errors.notes}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Family Members Section */}
            <Card style={{
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <UsersIcon size={24} color="#3b82f6" />
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Family Members ({displayMembers.length})
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMemberModal(true)}
                  disabled={availableMembers.length === 0 || saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  <UserPlusIcon size={16} />
                  Add Member
                </Button>
              </div>

              {/* Members Error */}
              {errors.members && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626'
                }}>
                  <AlertCircleIcon size={16} />
                  {errors.members}
                </div>
              )}

              {/* No Available Members Message */}
              {availableMembers.length === 0 && displayMembers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px',
                  color: '#6b7280'
                }}>
                  <UsersIcon size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                    No Members Available
                  </h3>
                  <p style={{ margin: 0 }}>
                    All existing members are already assigned to families. 
                    Create new members first to add them to this family.
                  </p>
                </div>
              )}

              {/* Members List */}
              {displayMembers.length > 0 && (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {displayMembers
                    .sort((a, b) => {
                      const priority = { head: 1, spouse: 2, child: 3, dependent: 4, other: 5 };
                      return (priority[a.relationship_type] || 5) - (priority[b.relationship_type] || 5);
                    })
                    .map((relationship) => {
                      const relationshipType = RELATIONSHIP_TYPES.find(rt => rt.value === relationship.relationship_type);
                      const isPrimary = formData.primary_contact_id === relationship.member?.id;
                      
                      return (
                        <div 
                          key={relationship.id} 
                          style={{
                            backgroundColor: isPrimary ? '#eff6ff' : 'white',
                            border: `2px solid ${isPrimary ? '#3b82f6' : '#e5e7eb'}`,
                            borderRadius: '12px',
                            padding: '1.5rem',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '1.125rem',
                                  fontWeight: '600',
                                  color: '#1e293b'
                                }}>
                                  {relationship.member?.get_full_name || 
                                   `${relationship.member?.first_name} ${relationship.member?.last_name}`}
                                </h4>
                                <Badge 
                                  variant={
                                    relationship.relationship_type === 'head' ? 'primary' :
                                    relationship.relationship_type === 'spouse' ? 'secondary' :
                                    relationship.relationship_type === 'child' ? 'success' : 'default'
                                  }
                                  style={{
                                    backgroundColor: relationshipType?.color + '20',
                                    color: relationshipType?.color,
                                    border: `1px solid ${relationshipType?.color}40`
                                  }}
                                >
                                  {relationship.relationship_type_display}
                                </Badge>
                                {isPrimary && (
                                  <Badge variant="success" size="sm">
                                    Primary Contact
                                  </Badge>
                                )}
                              </div>
                              
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '8px',
                                marginBottom: '12px',
                                fontSize: '14px',
                                color: '#6b7280'
                              }}>
                                {relationship.member?.email && (
                                  <div>Email: {relationship.member.email}</div>
                                )}
                                {relationship.member?.phone && (
                                  <div>Phone: {relationship.member.phone}</div>
                                )}
                                {relationship.member?.date_of_birth && (
                                  <div>
                                    DOB: {new Date(relationship.member.date_of_birth).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              {relationship.notes && (
                                <div style={{
                                  backgroundColor: '#f8fafc',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#475569',
                                  fontStyle: 'italic',
                                  marginTop: '8px'
                                }}>
                                  <strong>Notes:</strong> {relationship.notes}
                                </div>
                              )}
                            </div>

                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              alignItems: 'flex-end'
                            }}>
                              {!isPrimary && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSetPrimaryContact(relationship.member?.id)}
                                  disabled={saving}
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 8px'
                                  }}
                                >
                                  Set as Primary
                                </Button>
                              )}
                              
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(relationship.member?.id, relationship.id)}
                                disabled={saving}
                                style={{
                                  color: '#dc2626',
                                  fontSize: '12px',
                                  padding: '4px 8px'
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>

            {/* Primary Contact Summary */}
            {displayMembers.length > 0 && (
              <Card style={{
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                backgroundColor: primaryContact ? '#f0fdf4' : '#fef2f2'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '1rem'
                }}>
                  <CheckCircleIcon 
                    size={24} 
                    color={primaryContact ? '#10b981' : '#ef4444'} 
                  />
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Primary Contact
                  </h2>
                </div>
                
                {primaryContact ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #d1fae5'
                  }}>
                    <h4 style={{
                      margin: '0 0 1rem 0',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#065f46'
                    }}>
                      {primaryContact.member?.get_full_name || 
                       `${primaryContact.member?.first_name} ${primaryContact.member?.last_name}`}
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div><strong>Email:</strong> {primaryContact.member?.email || 'Not provided'}</div>
                      <div><strong>Phone:</strong> {primaryContact.member?.phone || 'Not provided'}</div>
                      <div><strong>Relationship:</strong> {primaryContact.relationship_type_display}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      margin: 0,
                      color: '#991b1b',
                      fontWeight: '500'
                    }}>
                      No primary contact selected. Click "Set as Primary" next to a family member above.
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#92400e'
              }}>
                <AlertCircleIcon size={20} />
                <div>
                  <strong>Unsaved Changes</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    You have unsaved changes. Make sure to save before leaving this page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        availableMembers={availableMembers}
        existingRelationships={displayMembers.map(m => m.relationship_type)}
      />

      {/* Loading Overlay */}
      {saving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            minWidth: '300px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem auto'
            }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
              {isEditing ? 'Updating Family...' : 'Creating Family...'}
            </h3>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Please wait while we save your changes.
            </p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Main component with error boundary
const FamilyForm = () => {
  return (
    <ErrorBoundary 
      fallbackMessage="There was an error loading the family form. Please refresh the page and try again."
    >
      <FamilyFormContent />
    </ErrorBoundary>
  );
};

export default FamilyForm;