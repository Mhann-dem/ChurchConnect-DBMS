// frontend/src/components/admin/Families/AddMemberModal.jsx
import React, { useState, useEffect } from 'react';
import { useMembers } from '../../../hooks/useMembers';
import Modal from '../../shared/Modal';
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

    const memberData = {
      member_id: selectedMember,
      relationship_type: relationshipType,
      notes: notes.trim()
    };

    onAddMember(memberData);
    resetForm();
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Add Family Member"
      size="large"
    >
      <form onSubmit={handleSubmit} className="add-member-form">
        {/* Member Selection */}
        <div className="form-group">
          <label htmlFor="member-search">Search and Select Member</label>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name or email..."
            className="member-search"
          />
          
          {loading && <LoadingSpinner size="sm" />}
          
          <div className="member-selection">
            {filteredMembers.length === 0 ? (
              <p className="no-members">
                {searchTerm ? 'No members found matching your search.' : 'No available members to add.'}
              </p>
            ) : (
              <div className="members-list">
                {filteredMembers.map((member) => (
                  <label key={member.id} className="member-option">
                    <input
                      type="radio"
                      name="selectedMember"
                      value={member.id}
                      checked={selectedMember === member.id}
                      onChange={(e) => setSelectedMember(e.target.value)}
                    />
                    <div className="member-info">
                      <div className="member-name">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="member-details">
                        {member.email && <span className="member-email">{member.email}</span>}
                        {member.phone && <span className="member-phone">{member.phone}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.member && <span className="error-text">{errors.member}</span>}
        </div>

        {/* Relationship Type */}
        <div className="form-group">
          <label htmlFor="relationshipType">Relationship Type</label>
          <select
            id="relationshipType"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            className={errors.relationshipType ? 'error' : ''}
          >
            <option value="">Select relationship type</option>
            {getAvailableRelationshipTypes().map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.relationshipType && (
            <span className="error-text">{errors.relationshipType}</span>
          )}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Additional notes about this relationship"
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedMember || !relationshipType}
          >
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;