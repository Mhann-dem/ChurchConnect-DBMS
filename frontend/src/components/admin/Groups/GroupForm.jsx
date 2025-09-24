// Enhanced GroupForm.jsx - Updated with success handler
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, X, AlertCircle, Users, Clock, Mail, Phone, MapPin, Settings, Info, CheckCircle } from 'lucide-react';
import { useMembers } from '../../../hooks/useMembers';
import { useFormSubmission } from '../../../hooks/useFormSubmission';
import FormContainer from '../../shared/FormContainer';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import styles from './Groups.module.css';

const GroupForm = ({ group, onSave, onCancel, loading = false }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_id: '',
    leader_name: '',
    meeting_schedule: '',
    category: '',
    active: true,
    max_members: '',
    is_public: true,
    meeting_location: '',
    contact_email: '',
    contact_phone: '',
    tags: [],
    requirements: '',
    age_group: '',
    meeting_frequency: 'weekly',
    start_date: '',
    end_date: '',
    registration_required: false,
    auto_approve: true
  });
  
  const [errors, setErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');

  const { members, loading: membersLoading, searchMembers } = useMembers();

  // Form submission handler
  const {
    isSubmitting: formSubmitting,
    showSuccess,
    submissionError,
    handleSubmit: handleFormSubmit,
    clearError
  } = useFormSubmission({
    onSubmit: async (submitData) => {
      // Prepare data for submission
      const preparedData = {
        ...submitData,
        name: submitData.name.trim(),
        description: submitData.description.trim(),
        leader_name: submitData.leader_name.trim(),
        meeting_schedule: submitData.meeting_schedule.trim(),
        meeting_location: submitData.meeting_location.trim(),
        contact_email: submitData.contact_email.trim(),
        contact_phone: submitData.contact_phone.trim(),
        requirements: submitData.requirements.trim(),
        max_members: submitData.max_members ? parseInt(submitData.max_members) : null,
        leader_id: submitData.leader_id || null
      };
      
      return await onSave(preparedData);
    },
    onClose: onCancel,
    successMessage: group ? 'Group updated successfully!' : 'Group created successfully!',
    autoCloseDelay: 2500
  });

  // Categories with descriptions
  const groupCategories = [
    { value: '', label: 'Select Category', description: '' },
    { value: 'ministry', label: 'Ministry', description: 'Core church ministries and departments' },
    { value: 'small-group', label: 'Small Group', description: 'Small fellowship and study groups' },
    { value: 'committee', label: 'Committee', description: 'Administrative and decision-making groups' },
    { value: 'service', label: 'Service Team', description: 'Volunteer and service teams' },
    { value: 'youth', label: 'Youth Group', description: 'Youth and young adult groups' },
    { value: 'seniors', label: 'Seniors Group', description: 'Senior adult groups and activities' },
    { value: 'worship', label: 'Worship Team', description: 'Music and worship ministry teams' },
    { value: 'outreach', label: 'Outreach', description: 'Community outreach and missions' },
    { value: 'prayer', label: 'Prayer Group', description: 'Prayer and intercession groups' },
    { value: 'study', label: 'Bible Study', description: 'Bible study and discipleship groups' },
    { value: 'support', label: 'Support Group', description: 'Support and recovery groups' },
    { value: 'sports', label: 'Sports & Recreation', description: 'Sports teams and recreational activities' },
    { value: 'arts', label: 'Arts & Culture', description: 'Creative arts and cultural groups' },
    { value: 'other', label: 'Other', description: 'Other group types' }
  ];

  const ageGroups = [
    { value: '', label: 'All Ages' },
    { value: 'children', label: 'Children (0-12)' },
    { value: 'youth', label: 'Youth (13-18)' },
    { value: 'young-adults', label: 'Young Adults (18-30)' },
    { value: 'adults', label: 'Adults (30-65)' },
    { value: 'seniors', label: 'Seniors (65+)' }
  ];

  const meetingFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 Weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'as-needed', label: 'As Needed' },
    { value: 'other', label: 'Other' }
  ];

  // Available leaders (members who can be leaders)
  const availableLeaders = useMemo(() => {
    return members?.filter(member => member.active && member.can_lead) || [];
  }, [members]);

  // Initialize form data when group prop changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        leader_id: group.leader_id || '',
        leader_name: group.leader_name || '',
        meeting_schedule: group.meeting_schedule || '',
        category: group.category || '',
        active: group.active !== undefined ? group.active : true,
        max_members: group.max_members || '',
        is_public: group.is_public !== undefined ? group.is_public : true,
        meeting_location: group.meeting_location || '',
        contact_email: group.contact_email || '',
        contact_phone: group.contact_phone || '',
        tags: group.tags || [],
        requirements: group.requirements || '',
        age_group: group.age_group || '',
        meeting_frequency: group.meeting_frequency || 'weekly',
        start_date: group.start_date || '',
        end_date: group.end_date || '',
        registration_required: group.registration_required || false,
        auto_approve: group.auto_approve !== undefined ? group.auto_approve : true
      });
    } else {
      // Reset form for new group
      setFormData({
        name: '',
        description: '',
        leader_id: '',
        leader_name: '',
        meeting_schedule: '',
        category: '',
        active: true,
        max_members: '',
        is_public: true,
        meeting_location: '',
        contact_email: '',
        contact_phone: '',
        tags: [],
        requirements: '',
        age_group: '',
        meeting_frequency: 'weekly',
        start_date: '',
        end_date: '',
        registration_required: false,
        auto_approve: true
      });
    }
    
    setErrors({});
    setFormTouched({});
    setCurrentStep(1);
  }, [group]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Special handling for leader selection
    if (name === 'leader_id') {
      const selectedLeader = availableLeaders.find(leader => leader.id === value);
      setFormData(prev => ({
        ...prev,
        leader_id: value,
        leader_name: selectedLeader ? `${selectedLeader.first_name} ${selectedLeader.last_name}` : ''
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormTouched(prev => ({ ...prev, [name]: true }));
  }, [errors, availableLeaders]);

  // Handle tag management
  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
      setFormTouched(prev => ({ ...prev, tags: true }));
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setFormTouched(prev => ({ ...prev, tags: true }));
  }, []);

  const handleTagInputKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    if (formData.requirements && formData.requirements.length > 500) {
      newErrors.requirements = 'Requirements must be less than 500 characters';
    }
    
    if (formData.max_members) {
      const maxMembers = parseInt(formData.max_members);
      if (isNaN(maxMembers) || maxMembers < 1) {
        newErrors.max_members = 'Max members must be a positive number';
      } else if (maxMembers > 1000) {
        newErrors.max_members = 'Max members cannot exceed 1000';
      }
    }
    
    if (formData.contact_email && formData.contact_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email.trim())) {
        newErrors.contact_email = 'Please enter a valid email address';
      }
    }
    
    if (formData.contact_phone && formData.contact_phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = formData.contact_phone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone && !phoneRegex.test(cleanPhone)) {
        newErrors.contact_phone = 'Please enter a valid phone number';
      }
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    
    return newErrors;
  }, [formData]);

  const validateCurrentStep = () => {
    const stepErrors = {};
    
    if (currentStep === 1) {
      if (!formData.name.trim()) stepErrors.name = 'Group name is required';
      if (!formData.category) stepErrors.category = 'Please select a category';
    }
    
    return stepErrors;
  };

  // Handle step navigation
  const nextStep = () => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      setErrors(stepErrors);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate current step first
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    // If not on final step, go to next step
    if (currentStep < 4) {
      nextStep();
      return;
    }

    // Validate entire form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    clearError();
    
    await handleFormSubmit(formData, e);
  }, [formData, validateForm, currentStep, clearError, handleFormSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (Object.keys(formTouched).length > 0) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmDiscard) return;
    }
    
    onCancel?.();
  }, [formTouched, onCancel]);

  // Form steps configuration
  const steps = [
    { number: 1, title: 'Basic Info', icon: Info },
    { number: 2, title: 'Leadership', icon: Users },
    { number: 3, title: 'Meetings', icon: Clock },
    { number: 4, title: 'Settings', icon: Settings }
  ];

  return (
    <FormContainer
      title={group ? 'Edit Group' : 'Create New Group'}
      onClose={handleCancel}
      showSuccess={showSuccess}
      successMessage={group ? 'Group updated successfully!' : 'Group created successfully!'}
      submissionError={submissionError}
      isSubmitting={formSubmitting || loading}
      maxWidth="900px"
    >
      <div className={styles.groupFormContainer}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {steps.map((step) => (
            <div
              key={step.number}
              className={`${styles.stepItem} ${
                currentStep === step.number ? styles.active :
                currentStep > step.number ? styles.completed : styles.inactive
              }`}
            >
              <div className={styles.stepIcon}>
                {currentStep > step.number ? (
                  <CheckCircle size={20} />
                ) : (
                  <step.icon size={20} />
                )}
              </div>
              <span className={styles.stepTitle}>{step.title}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.groupForm}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className={styles.formStep}>
              <div className={styles.stepHeader}>
                <h3>Basic Information</h3>
                <p>Essential details about your group</p>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="name" className={styles.label}>
                    Group Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="Enter group name"
                    required
                    maxLength="100"
                    disabled={formSubmitting}
                  />
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </div>
                
                <div className={styles.formField}>
                  <label htmlFor="category" className={styles.label}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                    required
                    disabled={formSubmitting}
                  >
                    {groupCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {formData.category && (
                    <span className={styles.fieldDescription}>
                      {groupCategories.find(c => c.value === formData.category)?.description}
                    </span>
                  )}
                  {errors.category && (
                    <span className={styles.errorText}>{errors.category}</span>
                  )}
                </div>
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  placeholder="Describe the group's purpose, activities, and what members can expect"
                  rows="4"
                  maxLength="1000"
                  disabled={formSubmitting}
                />
                {errors.description && (
                  <span className={styles.errorText}>{errors.description}</span>
                )}
                <span className={styles.charCount}>
                  {formData.description.length}/1000
                </span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="age_group" className={styles.label}>
                    Target Age Group
                  </label>
                  <select
                    id="age_group"
                    name="age_group"
                    value={formData.age_group}
                    onChange={handleChange}
                    className={styles.select}
                    disabled={formSubmitting}
                  >
                    {ageGroups.map((age) => (
                      <option key={age.value} value={age.value}>
                        {age.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="max_members" className={styles.label}>
                    Maximum Members
                  </label>
                  <input
                    type="number"
                    id="max_members"
                    name="max_members"
                    value={formData.max_members}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.max_members ? styles.inputError : ''}`}
                    placeholder="Leave empty for unlimited"
                    min="1"
                    max="1000"
                    disabled={formSubmitting}
                  />
                  {errors.max_members && (
                    <span className={styles.errorText}>{errors.max_members}</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className={styles.formField}>
                <label className={styles.label}>Tags</label>
                <div className={styles.tagInput}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className={styles.input}
                    placeholder="Add tags (press Enter)"
                    disabled={formSubmitting}
                  />
                  <Button type="button" onClick={addTag} size="sm" variant="outline" disabled={formSubmitting}>
                    Add
                  </Button>
                </div>
                <div className={styles.tagList}>
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={styles.tag}
                      onClick={() => !formSubmitting && removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Leadership & Contact */}
          {currentStep === 2 && (
            <div className={styles.formStep}>
              <div className={styles.stepHeader}>
                <h3>Leadership & Contact</h3>
                <p>Assign leadership and contact information</p>
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="leader_id" className={styles.label}>
                  Group Leader
                </label>
                <select
                  id="leader_id"
                  name="leader_id"
                  value={formData.leader_id}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={membersLoading || formSubmitting}
                >
                  <option value="">Select a leader (optional)</option>
                  {availableLeaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.first_name} {leader.last_name} - {leader.email}
                    </option>
                  ))}
                </select>
                {formData.leader_id && (
                  <div className={styles.selectedLeader}>
                    {(() => {
                      const leader = availableLeaders.find(l => l.id === formData.leader_id);
                      return leader ? (
                        <div className={styles.leaderPreview}>
                          <Avatar
                            src={leader.photo_url}
                            name={`${leader.first_name} ${leader.last_name}`}
                            size="sm"
                          />
                          <div>
                            <strong>{leader.first_name} {leader.last_name}</strong>
                            <p>{leader.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="contact_email" className={styles.label}>
                    <Mail size={16} />
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.contact_email ? styles.inputError : ''}`}
                    placeholder="group@church.com"
                    disabled={formSubmitting}
                  />
                  {errors.contact_email && (
                    <span className={styles.errorText}>{errors.contact_email}</span>
                  )}
                </div>
                
                <div className={styles.formField}>
                  <label htmlFor="contact_phone" className={styles.label}>
                    <Phone size={16} />
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.contact_phone ? styles.inputError : ''}`}
                    placeholder="(555) 123-4567"
                    disabled={formSubmitting}
                  />
                  {errors.contact_phone && (
                    <span className={styles.errorText}>{errors.contact_phone}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Meeting Information */}
          {currentStep === 3 && (
            <div className={styles.formStep}>
              <div className={styles.stepHeader}>
                <h3>Meeting Information</h3>
                <p>When and where your group meets</p>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="meeting_frequency" className={styles.label}>
                    Meeting Frequency
                  </label>
                  <select
                    id="meeting_frequency"
                    name="meeting_frequency"
                    value={formData.meeting_frequency}
                    onChange={handleChange}
                    className={styles.select}
                    disabled={formSubmitting}
                  >
                    {meetingFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="meeting_schedule" className={styles.label}>
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    id="meeting_schedule"
                    name="meeting_schedule"
                    value={formData.meeting_schedule}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.meeting_schedule ? styles.inputError : ''}`}
                    placeholder="e.g., Sundays at 10:00 AM"
                    maxLength="200"
                    disabled={formSubmitting}
                  />
                  {errors.meeting_schedule && (
                    <span className={styles.errorText}>{errors.meeting_schedule}</span>
                  )}
                </div>
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="meeting_location" className={styles.label}>
                  <MapPin size={16} />
                  Meeting Location
                </label>
                <input
                  type="text"
                  id="meeting_location"
                  name="meeting_location"
                  value={formData.meeting_location}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Fellowship Hall, Room 205, or Virtual"
                  maxLength="200"
                  disabled={formSubmitting}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="start_date" className={styles.label}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={formSubmitting}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="end_date" className={styles.label}>
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                    disabled={formSubmitting}
                  />
                  {errors.end_date && (
                    <span className={styles.errorText}>{errors.end_date}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <div className={styles.formStep}>
              <div className={styles.stepHeader}>
                <h3>Group Settings</h3>
                <p>Configure group visibility and membership settings</p>
              </div>

              <div className={styles.formField}>
                <label htmlFor="requirements" className={styles.label}>
                  Membership Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  className={`${styles.textarea} ${errors.requirements ? styles.inputError : ''}`}
                  placeholder="Any special requirements or qualifications for membership"
                  rows="3"
                  maxLength="500"
                  disabled={formSubmitting}
                />
                {errors.requirements && (
                  <span className={styles.errorText}>{errors.requirements}</span>
                )}
                <span className={styles.charCount}>
                  {formData.requirements.length}/500
                </span>
              </div>
              
              <div className={styles.checkboxGroup}>
                <div className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className={styles.checkbox}
                    disabled={formSubmitting}
                  />
                  <label htmlFor="active" className={styles.checkboxLabel}>
                    Active Group
                    <span className={styles.checkboxDescription}>
                      Active groups appear in member registration and accept new members
                    </span>
                  </label>
                </div>
                
                <div className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className={styles.checkbox}
                    disabled={formSubmitting}
                  />
                  <label htmlFor="is_public" className={styles.checkboxLabel}>
                    Public Group
                    <span className={styles.checkboxDescription}>
                      Public groups are visible to all members and can receive join requests
                    </span>
                  </label>
                </div>

                <div className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    id="registration_required"
                    name="registration_required"
                    checked={formData.registration_required}
                    onChange={handleChange}
                    className={styles.checkbox}
                    disabled={formSubmitting}
                  />
                  <label htmlFor="registration_required" className={styles.checkboxLabel}>
                    Registration Required
                    <span className={styles.checkboxDescription}>
                      Members must formally register to join this group
                    </span>
                  </label>
                </div>

                <div className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    id="auto_approve"
                    name="auto_approve"
                    checked={formData.auto_approve}
                    onChange={handleChange}
                    className={styles.checkbox}
                    disabled={!formData.registration_required || formSubmitting}
                  />
                  <label htmlFor="auto_approve" className={styles.checkboxLabel}>
                    Auto-approve Registrations
                    <span className={styles.checkboxDescription}>
                      Automatically approve new member requests (requires registration)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Form Navigation */}
          <div className={styles.formNavigation}>
            <div className={styles.navLeft}>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={formSubmitting}>
                  Previous
                </Button>
              )}
            </div>

            <div className={styles.navRight}>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={formSubmitting}>
                Cancel
              </Button>
              
              {currentStep < 4 ? (
                <Button type="button" variant="primary" onClick={nextStep} disabled={formSubmitting}>
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={formSubmitting || loading}
                  icon={Save}
                >
                  {formSubmitting ? 'Saving...' : (group ? 'Update Group' : 'Create Group')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormContainer>
  );
};

export default GroupForm;