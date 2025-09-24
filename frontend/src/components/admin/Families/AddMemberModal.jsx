// frontend/src/components/admin/Families/AddMemberModal.jsx - Updated with success handler
import React, { useState, useEffect } from 'react';
import { useMembers } from '../../../hooks/useMembers';
import { useFormSubmission } from '../../../hooks/useFormSubmission';
import { FormContainer } from '../../shared/FormContainer';
import Button from '../../ui/Button';
import SearchBar from '../../shared/SearchBar';
import LoadingSpinner from '../../shared/LoadingSpinner';
import './Families.module.css';

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
  const { members, fetchMembers, loading } = useMembers();
  const [selectedMember, setSelectedMember] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [filteredMembers, setFilteredMembers] = useState([]);

  // Form submission handler
  const {
    isSubmitting: formSubmitting,
    showSuccess,
    submissionError,
    handleSubmit: handleFormSubmit,
    clearError
  } = useFormSubmission({
    onSubmit: async (formData) => {
      const memberData = {
        member_id: formData.selectedMember,
        relationship_type: formData.relationshipType,
        notes: formData.notes.trim()
      };

      return await onAddMember(memberData);
    },
    onSuccess: () => {
      // Reset form after successful submission
      resetForm();
    },
    onClose: onClose,
    successMessage: 'Family member added successfully!',
    autoCloseDelay: 2000
  });

  useEffect(() => {
    if (isOpen && (!availableMembers || availableMembers.length === 0)) {
      // Fetch members without families
      fetchMembers({ family_id__isnull: true });
    }
  }, [isOpen, availableMembers, fetchMembers]);

  useEffect(() => {
    // Use availableMembers if provided, otherwise use members from hook
    const membersToFilter = availableMembers.length > 0 ? availableMembers : (members || []);
    
    if (searchTerm) {
      const filtered = membersToFilter.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(membersToFilter);
    }
  }, [searchTerm, availableMembers, members]);

  const resetForm = () => {
    setSelectedMember('');
    setRelationshipType('');
    setNotes('');
    setSearchTerm('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    clearError();
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

    // Check for duplicate relationship types that should be unique
    if (relationshipType === 'head' && existingRelationships.includes('head')) {
      newErrors.relationshipType = 'A family can only have one head of household';
    }

    if (relationshipType === 'spouse' && existingRelationships.includes('spouse')) {
      newErrors.relationshipType = 'A family can only have one spouse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clear errors and submit
    setErrors({});
    clearError();

    const formData = {
      selectedMember,
      relationshipType,
      notes
    };

    handleFormSubmit(formData, e);
  };

  const getAvailableRelationshipTypes = () => {
    return RELATIONSHIP_TYPES.filter(type => {
      // Allow multiple children and dependents, but only one head and spouse
      if (type.value === 'head' && existingRelationships.includes('head')) {
        return false;
      }
      if (type.value === 'spouse' && existingRelationships.includes('spouse')) {
        return false;
      }
      return true;
    });
  };

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <FormContainer
      title="Add Family Member"
      onClose={handleClose}
      showSuccess={showSuccess}
      successMessage="Family member added successfully!"
      submissionError={submissionError}
      isSubmitting={formSubmitting}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} className="add-member-form">
        {/* Member Selection */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="member-search" style={{ 
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
            className="member-search"
            disabled={formSubmitting}
            style={{ marginBottom: '12px' }}
          />
          
          {loading && <LoadingSpinner size="sm" />}
          
          <div className="member-selection" style={{
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#f9fafb'
          }}>
            {filteredMembers.length === 0 ? (
              <p className="no-members" style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#6b7280',
                margin: 0 
              }}>
                {searchTerm ? 'No members found matching your search.' : 'No available members to add.'}
              </p>
            ) : (
              <div className="members-list">
                {filteredMembers.map((member) => (
                  <label 
                    key={member.id} 
                    className="member-option"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="radio"
                      name="selectedMember"
                      value={member.id}
                      checked={selectedMember === member.id}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      style={{ marginRight: '12px' }}
                      disabled={formSubmitting}
                    />
                    <div className="member-info">
                      <div className="member-name" style={{ 
                        fontWeight: '600', 
                        fontSize: '14px',
                        marginBottom: '4px' 
                      }}>
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="member-details" style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        display: 'flex',
                        gap: '12px'
                      }}>
                        {member.email && <span className="member-email">{member.email}</span>}
                        {member.phone && <span className="member-phone">{member.phone}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.member && (
            <span className="error-text" style={{ 
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
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
            disabled={formSubmitting}
          >
            <option value="">Select relationship type</option>
            {getAvailableRelationshipTypes().map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.relationshipType && (
            <span className="error-text" style={{ 
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
        <div className="form-group" style={{ marginBottom: '20px' }}>
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
              minHeight: '80px'
            }}
            disabled={formSubmitting}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          marginTop: '20px'
        }}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={formSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedMember || !relationshipType || formSubmitting}
            style={{
              opacity: (!selectedMember || !relationshipType || formSubmitting) ? 0.6 : 1
            }}
          >
            {formSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </FormContainer>
  );
};

export default AddMemberModal;