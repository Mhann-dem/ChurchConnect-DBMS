// frontend/src/components/admin/Families/AddMemberModal.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useMembers } from '../../../hooks/useMembers';
import FormContainer from '../../shared/FormContainer';
import Button from '../../ui/Button';
import SearchBar from '../../shared/SearchBar';
import LoadingSpinner from '../../shared/LoadingSpinner';

const RELATIONSHIP_TYPES = [
  { value: 'head', label: 'Head of Household' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' }
];

const AddMemberModal = ({ 
  isOpen, 
  onClose, 
  onAddMember, 
  availableMembers = [],
  existingRelationships = [] 
}) => {
  // ✅ FIXED: Fetch members without families, don't auto-fetch
  const { members, isLoading, fetchMembers } = useMembers({ autoFetch: false });
  
  const [selectedMember, setSelectedMember] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FIXED: Fetch unassigned members when modal opens
  useEffect(() => {
      if (isOpen) {
        console.log('[AddMemberModal] Modal opened, fetching all members');
        fetchMembers({ 
          page_size: 200,  // Fetch more members
          is_active: 'true'  // Only active members
        });
      }
    }, [isOpen, fetchMembers]);

  // Use all fetched members
  const membersToUse = members && members.length > 0 ? members : availableMembers;

  useEffect(() => {
      if (searchTerm) {
        const filtered = membersToUse.filter(member =>
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredMembers(filtered);
      } else {
        setFilteredMembers(membersToUse);
      }
    }, [searchTerm, membersToUse]);

  const resetForm = () => {
    setSelectedMember('');
    setRelationshipType('');
    setNotes('');
    setSearchTerm('');
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedMember) {
      newErrors.member = 'Please select a member';
    }

    if (!relationshipType) {
      newErrors.relationshipType = 'Please select a relationship type';
    }

    // Check for duplicate relationship types
    if (relationshipType === 'head' && existingRelationships.includes('head')) {
      newErrors.relationshipType = 'A family can only have one head of household';
    }

    if (relationshipType === 'spouse' && existingRelationships.includes('spouse')) {
      newErrors.relationshipType = 'A family can only have one spouse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const memberData = {
        member_id: selectedMember,
        relationship_type: relationshipType,
        notes: notes.trim()
      };

      await onAddMember(memberData);
      handleClose();
    } catch (error) {
      console.error('[AddMemberModal] Error:', error);
      setErrors({ submit: error.message || 'Failed to add member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableRelationshipTypes = () => {
    return RELATIONSHIP_TYPES.filter(type => {
      if (type.value === 'head' && existingRelationships.includes('head')) {
        return false;
      }
      if (type.value === 'spouse' && existingRelationships.includes('spouse')) {
        return false;
      }
      return true;
    });
  };

  if (!isOpen) return null;

  return (
    <FormContainer
      title="Add Family Member"
      onClose={handleClose}
      isSubmitting={isSubmitting}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
        {/* Member Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            fontSize: '14px' 
          }}>
            Search and Select Member *
          </label>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name or email..."
            disabled={isSubmitting}
            style={{ marginBottom: '12px' }}
          />
          
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <LoadingSpinner size="sm" />
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                Loading available members...
              </p>
            </div>
          )}
          
          {!isLoading && (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#f9fafb'
            }}>
              {filteredMembers.length === 0 ? (
                <p style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  margin: 0 
                }}>
                  {searchTerm 
                    ? 'No members found matching your search.' 
                    : 'No members available. Please create members first.'}
                </p>
              ) : (
                <div>
                  {filteredMembers.map((member) => (
                    <label 
                      key={member.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        backgroundColor: selectedMember === member.id ? '#eff6ff' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedMember !== member.id) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedMember !== member.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="selectedMember"
                        value={member.id}
                        checked={selectedMember === member.id}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        style={{ marginRight: '12px' }}
                        disabled={isSubmitting}
                      />
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '14px',
                          marginBottom: '4px',
                          color: '#1f2937'
                        }}>
                          {member.first_name} {member.last_name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          display: 'flex',
                          gap: '12px'
                        }}>
                          {member.email && <span>{member.email}</span>}
                          {member.phone && <span>{member.phone}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.member && (
            <span style={{ 
              color: '#ef4444', 
              fontSize: '12px', 
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.member}
            </span>
          )}
        </div>

        {/* Relationship Type */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="relationshipType" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            fontSize: '14px' 
          }}>
            Relationship Type *
          </label>
          <select
            id="relationshipType"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${errors.relationshipType ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
            disabled={isSubmitting}
          >
            <option value="">Select relationship type</option>
            {getAvailableRelationshipTypes().map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.relationshipType && (
            <span style={{ 
              color: '#ef4444', 
              fontSize: '12px', 
              marginTop: '4px',
              display: 'block'
            }}>
              {errors.relationshipType}
            </span>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="notes" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            fontSize: '14px' 
          }}>
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Additional notes about this relationship"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedMember || !relationshipType || isSubmitting}
            style={{
              opacity: (!selectedMember || !relationshipType || isSubmitting) ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </FormContainer>
  );
};

export default AddMemberModal;