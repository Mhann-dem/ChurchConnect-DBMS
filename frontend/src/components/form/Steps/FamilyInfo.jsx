// frontend/src/components/form/Steps/FamilyInfo.jsx
import React, { useState } from 'react';
import { Plus, Trash2, Users, User, Calendar, AlertCircle } from 'lucide-react';
import { Input, Select, TextArea } from '../FormControls';
import styles from '../Form.module.css';

const FamilyInfo = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue,
  isAdminMode = false
}) => {
  const [expandedMember, setExpandedMember] = useState(null);

  const relationshipOptions = [
    { value: '', label: 'Select relationship' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'other', label: 'Other Relative' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'dependent', label: 'Dependent' }
  ];

  const genderOptions = [
    { value: '', label: 'Select gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    // { value: 'other', label: 'Other' },
    // { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  // Safe handlers with fallbacks
  const handleChange = onChange || (() => console.warn('onChange not provided'));
  const handleBlur = onBlur || (() => console.warn('onBlur not provided'));
  const handleSetFieldValue = setFieldValue || ((field, value) => {
    console.warn('setFieldValue not provided, falling back to onChange');
    if (onChange) {
      const mockEvent = { target: { name: field, value } };
      onChange(mockEvent);
    }
  });

  const addFamilyMember = () => {
    const newMember = {
      id: Date.now(),
      firstName: '',
      lastName: '',
      relationship: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phone: '',
      isChild: false,
      notes: ''
    };

    const updatedMembers = [...(formData.familyMembers || []), newMember];
    handleSetFieldValue('familyMembers', updatedMembers);
    setExpandedMember(newMember.id);
  };

  const removeFamilyMember = (memberId) => {
    const updatedMembers = (formData.familyMembers || []).filter(member => member.id !== memberId);
    handleSetFieldValue('familyMembers', updatedMembers);
    
    if (expandedMember === memberId) {
      setExpandedMember(null);
    }
  };

  const updateFamilyMember = (memberId, field, value) => {
    const updatedMembers = (formData.familyMembers || []).map(member => {
      if (member.id === memberId) {
        const updatedMember = { ...member, [field]: value };
        
        // Auto-determine if this is a child based on relationship or age
        if (field === 'relationship') {
          updatedMember.isChild = value === 'child';
        } else if (field === 'dateOfBirth' && value) {
          const age = calculateAge(value);
          updatedMember.isChild = age < 18;
        }
        
        return updatedMember;
      }
      return member;
    });
    
    handleSetFieldValue('familyMembers', updatedMembers);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const toggleMemberExpanded = (memberId) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  const validateMember = (member) => {
    const memberErrors = {};
    
    if (!member.firstName?.trim()) {
      memberErrors.firstName = 'First name is required';
    }
    
    if (!member.lastName?.trim()) {
      memberErrors.lastName = 'Last name is required';
    }
    
    if (!member.relationship) {
      memberErrors.relationship = 'Relationship is required';
    }
    
    if (!member.dateOfBirth) {
      memberErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(member.dateOfBirth);
      if (age < 0) {
        memberErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      memberErrors.email = 'Please enter a valid email address';
    }
    
    return memberErrors;
  };

  const hasErrors = (memberId) => {
    const member = (formData.familyMembers || []).find(m => m.id === memberId);
    if (!member) return false;
    
    const memberErrors = validateMember(member);
    return Object.keys(memberErrors).length > 0;
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <Users className={styles.stepIcon} size={24} />
        <div>
          <h2 className={styles.stepTitle}>Family Information</h2>
          <p className={styles.stepDescription}>
            Add family members and emergency contact information
          </p>
        </div>
      </div>

      {/* Emergency Contact Section - Required */}
      <div className={styles.emergencyContactSection}>
        <h3 className={styles.sectionTitle}>Emergency Contact Information {!isAdminMode && '*'}</h3>
        <div className={styles.formGrid}>
          <Input
            name="emergencyContactName"
            label="Emergency Contact Name"
            value={formData.emergencyContactName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.emergencyContactName}
            touched={touched.emergencyContactName}
            required={!isAdminMode}
            placeholder="Enter emergency contact name"
          />

          <Input
            name="emergencyContactPhone"
            type="tel"
            label="Emergency Contact Phone"
            value={formData.emergencyContactPhone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.emergencyContactPhone}
            touched={touched.emergencyContactPhone}
            required={!isAdminMode}
            placeholder="Enter emergency contact phone"
          />
        </div>
      </div>

      <div className={styles.familySection}>
        <div className={styles.familyIntro}>
          <div className={styles.infoBox}>
            <AlertCircle className={styles.infoIcon} size={20} />
            <div>
              <h4>Family Registration</h4>
              <p>
                You can add family members who will be attending church with you. 
                This helps us keep families connected and plan for appropriate programs.
              </p>
            </div>
          </div>
        </div>

        {/* Family Members List */}
        <div className={styles.familyMembersList}>
          {formData.familyMembers && formData.familyMembers.length > 0 ? (
            formData.familyMembers.map((member, index) => (
              <div key={member.id} className={styles.familyMemberCard}>
                <div className={styles.familyMemberHeader}>
                  <div className={styles.familyMemberSummary}>
                    <User className={styles.memberIcon} size={16} />
                    <div className={styles.memberSummaryInfo}>
                      <span className={styles.memberName}>
                        {member.firstName || 'New'} {member.lastName || 'Member'}
                      </span>
                      <span className={styles.memberDetails}>
                        {member.relationship && (
                          <span className={styles.relationship}>
                            {relationshipOptions.find(r => r.value === member.relationship)?.label}
                          </span>
                        )}
                        {member.dateOfBirth && (
                          <span className={styles.age}>
                            Age: {calculateAge(member.dateOfBirth)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.familyMemberActions}>
                    {hasErrors(member.id) && (
                      <AlertCircle className={styles.errorIndicator} size={16} />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleMemberExpanded(member.id)}
                      className={styles.expandButton}
                    >
                      {expandedMember === member.id ? 'Collapse' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFamilyMember(member.id)}
                      className={styles.removeButton}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expandedMember === member.id && (
                  <div className={styles.familyMemberForm}>
                    <div className={styles.formGrid}>
                      <Input
                        name={`firstName-${member.id}`}
                        label="First Name"
                        value={member.firstName}
                        onChange={(e) => updateFamilyMember(member.id, 'firstName', e.target.value)}
                        placeholder="Enter first name"
                        required
                      />

                      <Input
                        name={`lastName-${member.id}`}
                        label="Last Name"
                        value={member.lastName}
                        onChange={(e) => updateFamilyMember(member.id, 'lastName', e.target.value)}
                        placeholder="Enter last name"
                        required
                      />

                      <Select
                        name={`relationship-${member.id}`}
                        label="Relationship"
                        value={member.relationship}
                        onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                        options={relationshipOptions}
                        required
                      />

                      <Input
                        name={`dateOfBirth-${member.id}`}
                        type="date"
                        label="Date of Birth"
                        value={member.dateOfBirth}
                        onChange={(e) => updateFamilyMember(member.id, 'dateOfBirth', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />

                      <Select
                        name={`gender-${member.id}`}
                        label="Gender"
                        value={member.gender}
                        onChange={(e) => updateFamilyMember(member.id, 'gender', e.target.value)}
                        options={genderOptions}
                      />

                      <Input
                        name={`email-${member.id}`}
                        type="email"
                        label="Email"
                        value={member.email}
                        onChange={(e) => updateFamilyMember(member.id, 'email', e.target.value)}
                        placeholder="Enter email address"
                      />

                      <Input
                        name={`phone-${member.id}`}
                        type="tel"
                        label="Phone"
                        value={member.phone}
                        onChange={(e) => updateFamilyMember(member.id, 'phone', e.target.value)}
                        placeholder="Enter phone number"
                      />

                      <div className={styles.fullWidth}>
                        <TextArea
                          name={`notes-${member.id}`}
                          label="Notes"
                          value={member.notes}
                          onChange={(e) => updateFamilyMember(member.id, 'notes', e.target.value)}
                          placeholder="Any additional notes about this family member"
                          rows={2}
                        />
                      </div>
                    </div>

                    {member.isChild && (
                      <div className={styles.childNotice}>
                        <AlertCircle className={styles.childIcon} size={16} />
                        <span>This person is marked as a child and will be included in children's programs.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <Users className={styles.emptyIcon} size={48} />
              <h3>No family members added yet</h3>
              <p>Click the button below to add your first family member</p>
            </div>
          )}
        </div>

        {/* Add Family Member Button */}
        <div className={styles.addMemberSection}>
          <button
            type="button"
            onClick={addFamilyMember}
            className={styles.addMemberButton}
          >
            <Plus size={16} />
            Add Family Member
          </button>
        </div>

        {/* Privacy Notice */}
        <div className={styles.privacyNotice}>
          <div className={styles.privacyHeader}>
            <AlertCircle className={styles.privacyIcon} size={16} />
            <h4>Privacy Notice</h4>
          </div>
          <p>
            Family information is kept confidential and is used only for church programs, 
            communications, and emergency contacts. We will not share this information 
            with third parties without your explicit consent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilyInfo;