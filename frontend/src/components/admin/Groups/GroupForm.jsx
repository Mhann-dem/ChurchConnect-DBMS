import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, AlertCircle, Users } from 'lucide-react';
import styles from './Groups.module.css';

const GroupForm = ({ group, onSuccess, onCancel, isLoading = false }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_name: '',
    meeting_schedule: '',
    category: '',
    active: true,
    max_members: '',
    is_public: true,
    meeting_location: '',
    contact_email: '',
    contact_phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Categories - in a real app, these would come from the API
  const groupCategories = [
    { value: '', label: 'Select Category' },
    { value: 'ministry', label: 'Ministry' },
    { value: 'small-group', label: 'Small Group' },
    { value: 'committee', label: 'Committee' },
    { value: 'service', label: 'Service Team' },
    { value: 'youth', label: 'Youth Group' },
    { value: 'seniors', label: 'Seniors Group' },
    { value: 'worship', label: 'Worship Team' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'prayer', label: 'Prayer Group' },
    { value: 'study', label: 'Bible Study' },
    { value: 'support', label: 'Support Group' },
    { value: 'other', label: 'Other' }
  ];

  // Initialize form data when group prop changes
  useEffect(() => {
    if (group) {
      console.log('[GroupForm] Editing group:', group);
      setFormData({
        name: group.name || '',
        description: group.description || '',
        leader_name: group.leader_name || '',
        meeting_schedule: group.meeting_schedule || '',
        category: group.category || '',
        active: group.active !== undefined ? group.active : true,
        max_members: group.max_members || '',
        is_public: group.is_public !== undefined ? group.is_public : true,
        meeting_location: group.meeting_location || '',
        contact_email: group.contact_email || '',
        contact_phone: group.contact_phone || ''
      });
    } else {
      console.log('[GroupForm] Creating new group');
      // Reset form for new group
      setFormData({
        name: '',
        description: '',
        leader_name: '',
        meeting_schedule: '',
        category: '',
        active: true,
        max_members: '',
        is_public: true,
        meeting_location: '',
        contact_email: '',
        contact_phone: ''
      });
    }
    
    setErrors({});
    setIsDirty(false);
  }, [group]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setIsDirty(true);
  }, [errors]);

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
    
    if (formData.leader_name && formData.leader_name.length > 100) {
      newErrors.leader_name = 'Leader name must be less than 100 characters';
    }
    
    if (formData.meeting_schedule && formData.meeting_schedule.length > 200) {
      newErrors.meeting_schedule = 'Meeting schedule must be less than 200 characters';
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
    
    return newErrors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      console.log('[GroupForm] Validation errors:', validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        leader_name: formData.leader_name.trim(),
        meeting_schedule: formData.meeting_schedule.trim(),
        meeting_location: formData.meeting_location.trim(),
        contact_email: formData.contact_email.trim(),
        contact_phone: formData.contact_phone.trim(),
        max_members: formData.max_members ? parseInt(formData.max_members) : null
      };
      
      console.log('[GroupForm] Submitting data:', submitData);
      
      // Call success handler
      await onSuccess(submitData);
      
      // Reset form state
      setIsDirty(false);
    } catch (error) {
      console.error('[GroupForm] Submission error:', error);
      
      // Handle validation errors from API
      if (error.validationErrors) {
        setErrors(error.validationErrors);
      } else {
        setErrors({ 
          submit: error.message || 'An error occurred while saving the group' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSuccess]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmDiscard) return;
    }
    
    onCancel?.();
  }, [isDirty, onCancel]);

  return (
    <form onSubmit={handleSubmit} className={styles.groupForm}>
      {/* General Error */}
      {errors.submit && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{errors.submit}</span>
        </div>
      )}
      
      {/* Basic Information */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Basic Information</h3>
        
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
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>
          
          <div className={styles.formField}>
            <label htmlFor="category" className={styles.label}>
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.select}
            >
              {groupCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
            placeholder="Describe the group's purpose and activities"
            rows="4"
            maxLength="1000"
          />
          {errors.description && (
            <span className={styles.errorText}>{errors.description}</span>
          )}
          <span className={styles.charCount}>
            {formData.description.length}/1000
          </span>
        </div>
      </div>
      
      {/* Leadership & Contact */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Leadership & Contact</h3>
        
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="leader_name" className={styles.label}>
              Group Leader
            </label>
            <input
              type="text"
              id="leader_name"
              name="leader_name"
              value={formData.leader_name}
              onChange={handleChange}
              className={`${styles.input} ${errors.leader_name ? styles.inputError : ''}`}
              placeholder="Leader's full name"
              maxLength="100"
            />
            {errors.leader_name && (
              <span className={styles.errorText}>{errors.leader_name}</span>
            )}
          </div>
          
          <div className={styles.formField}>
            <label htmlFor="contact_email" className={styles.label}>
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
            />
            {errors.contact_email && (
              <span className={styles.errorText}>{errors.contact_email}</span>
            )}
          </div>
          
          <div className={styles.formField}>
            <label htmlFor="contact_phone" className={styles.label}>
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
            />
            {errors.contact_phone && (
              <span className={styles.errorText}>{errors.contact_phone}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Meeting Information */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Meeting Information</h3>
        
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
            placeholder="e.g., Sundays at 10:00 AM, First Friday of each month"
            maxLength="200"
          />
          {errors.meeting_schedule && (
            <span className={styles.errorText}>{errors.meeting_schedule}</span>
          )}
        </div>
        
        <div className={styles.formField}>
          <label htmlFor="meeting_location" className={styles.label}>
            Meeting Location
          </label>
          <input
            type="text"
            id="meeting_location"
            name="meeting_location"
            value={formData.meeting_location}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Fellowship Hall, Room 205"
            maxLength="200"
          />
        </div>
      </div>
      
      {/* Settings */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Settings</h3>
        
        <div className={styles.formGrid}>
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
              placeholder="Leave empty for no limit"
              min="1"
              max="1000"
            />
            {errors.max_members && (
              <span className={styles.errorText}>{errors.max_members}</span>
            )}
          </div>
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
            />
            <label htmlFor="active" className={styles.checkboxLabel}>
              Active Group
              <span className={styles.checkboxDescription}>
                Active groups appear in member registration and are available for new members
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
            />
            <label htmlFor="is_public" className={styles.checkboxLabel}>
              Public Group
              <span className={styles.checkboxDescription}>
                Public groups are visible to all members and can accept new member requests
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelButton}
          disabled={isSubmitting}
        >
          <X size={16} />
          Cancel
        </button>
        
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || isLoading}
        >
          <Save size={16} />
          {isSubmitting ? 'Saving...' : (group ? 'Update Group' : 'Create Group')}
        </button>
      </div>
    </form>
  );
};

export default GroupForm;