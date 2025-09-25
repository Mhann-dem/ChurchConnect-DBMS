// frontend/src/components/admin/Events/EventForm.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, MapPin, Users, DollarSign, Tag, Clock, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const EventForm = ({ event, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  
  // FIXED: Proper form state initialization
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'other',
    location: '',
    location_details: '',
    start_datetime: '',
    end_datetime: '',
    registration_deadline: '',
    max_capacity: '',
    requires_registration: false,
    registration_fee: '0.00',
    organizer: '',
    contact_email: '',
    contact_phone: '',
    age_min: '',
    age_max: '',
    status: 'draft',
    is_public: true,
    is_featured: false,
    prerequisites: '',
    tags: '',
    image_url: '',
    external_registration_url: ''
  });

  // Initialize form data
  useEffect(() => {
    if (event) {
      console.log('[EventForm] Initializing with event:', event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'other',
        location: event.location || '',
        location_details: event.location_details || '',
        start_datetime: event.start_datetime ? 
          format(new Date(event.start_datetime), "yyyy-MM-dd'T'HH:mm") : '',
        end_datetime: event.end_datetime ? 
          format(new Date(event.end_datetime), "yyyy-MM-dd'T'HH:mm") : '',
        registration_deadline: event.registration_deadline ? 
          format(new Date(event.registration_deadline), "yyyy-MM-dd'T'HH:mm") : '',
        max_capacity: event.max_capacity || '',
        requires_registration: event.requires_registration || false,
        registration_fee: event.registration_fee || '0.00',
        organizer: event.organizer || '',
        contact_email: event.contact_email || '',
        contact_phone: event.contact_phone || '',
        age_min: event.age_min || '',
        age_max: event.age_max || '',
        status: event.status || 'draft',
        is_public: event.is_public !== undefined ? event.is_public : true,
        is_featured: event.is_featured || false,
        prerequisites: event.prerequisites || '',
        tags: event.tags || '',
        image_url: event.image_url || '',
        external_registration_url: event.external_registration_url || ''
      });
    } else {
      // Set default values for new events
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        start_datetime: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_datetime: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
        organizer: 'Church Administrator'
      }));
    }
  }, [event]);

  // FIXED: Input change handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Real-time validation for certain fields
    validateField(field, value);
  };

  // Real-time field validation
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'title':
        if (!value?.trim()) {
          newErrors.title = 'Event title is required';
        } else if (value.length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        } else {
          delete newErrors.title;
        }
        break;

      case 'contact_email':
        if (value && !isValidEmail(value)) {
          newErrors.contact_email = 'Please enter a valid email address';
        } else {
          delete newErrors.contact_email;
        }
        break;

      case 'start_datetime':
      case 'end_datetime':
        if (formData.start_datetime && formData.end_datetime) {
          const startDate = new Date(field === 'start_datetime' ? value : formData.start_datetime);
          const endDate = new Date(field === 'end_datetime' ? value : formData.end_datetime);
          
          if (startDate >= endDate) {
            newErrors.end_datetime = 'End time must be after start time';
          } else {
            delete newErrors.end_datetime;
          }
        }
        break;

      case 'registration_fee':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newErrors.registration_fee = 'Fee must be a valid positive number';
        } else {
          delete newErrors.registration_fee;
        }
        break;

      case 'max_capacity':
        if (value && (isNaN(value) || parseInt(value) < 1)) {
          newErrors.max_capacity = 'Capacity must be at least 1';
        } else {
          delete newErrors.max_capacity;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // FIXED: Comprehensive form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start date and time is required';
    }

    if (!formData.end_datetime) {
      newErrors.end_datetime = 'End date and time is required';
    }

    // Date validation
    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      
      if (startDate >= endDate) {
        newErrors.end_datetime = 'End time must be after start time';
      }

      // Check if dates are in the past (for new events)
      if (!event && startDate < new Date()) {
        newErrors.start_datetime = 'Start time cannot be in the past';
      }
    }

    // Registration deadline validation
    if (formData.registration_deadline && formData.start_datetime) {
      const deadlineDate = new Date(formData.registration_deadline);
      const startDate = new Date(formData.start_datetime);
      
      if (deadlineDate > startDate) {
        newErrors.registration_deadline = 'Registration deadline cannot be after event start time';
      }
    }

    // Age validation
    if (formData.age_min && formData.age_max) {
      const minAge = parseInt(formData.age_min);
      const maxAge = parseInt(formData.age_max);
      
      if (minAge > maxAge) {
        newErrors.age_max = 'Maximum age cannot be less than minimum age';
      }
    }

    // Capacity validation
    if (formData.max_capacity && parseInt(formData.max_capacity) < 1) {
      newErrors.max_capacity = 'Maximum capacity must be at least 1';
    }

    // Registration fee validation
    if (formData.registration_fee && parseFloat(formData.registration_fee) < 0) {
      newErrors.registration_fee = 'Registration fee cannot be negative';
    }

    // Email validation
    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    // URL validation
    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }

    if (formData.external_registration_url && !isValidUrl(formData.external_registration_url)) {
      newErrors.external_registration_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Utility functions
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // FIXED: Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[EventForm] Form submission started', { event: !!event, formData });
    
    if (!validateForm()) {
      console.log('[EventForm] Validation failed:', errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        registration_deadline: formData.registration_deadline || null
      };

      // Remove empty string values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      console.log('[EventForm] Submitting data:', submitData);

      await onSave(submitData);
      
    } catch (error) {
      console.error('[EventForm] Submission error:', error);
      // The parent component will handle showing the error toast
    } finally {
      setLoading(false);
    }
  };

  // Form field component
  const FormField = ({ 
    label, 
    field, 
    required = false, 
    children,
    description = null
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '4px'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {description && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '4px',
          fontStyle: 'italic'
        }}>
          {description}
        </p>
      )}
      {children}
      {errors[field] && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          color: '#ef4444',
          fontSize: '12px'
        }}>
          <AlertCircle size={12} />
          {errors[field]}
        </div>
      )}
      {formTouched[field] && !errors[field] && formData[field] && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          color: '#10b981',
          fontSize: '12px'
        }}>
          <CheckCircle size={12} />
          Valid
        </div>
      )}
    </div>
  );

  const eventTypeOptions = [
    { value: 'service', label: 'Church Service' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'social', label: 'Social Event' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'conference', label: 'Conference' },
    { value: 'retreat', label: 'Retreat' },
    { value: 'fundraiser', label: 'Fundraiser' },
    { value: 'youth', label: 'Youth Event' },
    { value: 'kids', label: 'Kids Event' },
    { value: 'seniors', label: 'Seniors Event' },
    { value: 'prayer', label: 'Prayer Meeting' },
    { value: 'bible_study', label: 'Bible Study' },
    { value: 'baptism', label: 'Baptism' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'funeral', label: 'Memorial Service' },
    { value: 'other', label: 'Other' }
  ];

  const modalStyles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 24px 16px',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      color: '#6b7280'
    },
    content: {
      padding: '24px'
    },
    section: {
      marginBottom: '32px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      outline: 'none'
    },
    inputError: {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    },
    inputSuccess: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      marginBottom: '8px'
    },
    checkbox: {
      marginRight: '8px',
      width: '16px',
      height: '16px',
      accentColor: '#3b82f6'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb',
      marginTop: '24px'
    },
    cancelButton: {
      padding: '10px 20px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    saveButton: {
      padding: '10px 20px',
      backgroundColor: '#3b82f6',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={modalStyles.header}>
        <h2 style={modalStyles.title}>
          {event ? 'Edit Event' : 'Create New Event'}
        </h2>
        <button 
          onClick={onCancel}
          style={modalStyles.closeButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={modalStyles.content}>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>
              <Tag size={20} />
              Basic Information
            </h3>

            <FormField label="Event Title" field="title" required>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.title ? modalStyles.inputError : {}),
                  ...(formTouched.title && !errors.title && formData.title ? modalStyles.inputSuccess : {})
                }}
                placeholder="Enter event title"
                disabled={loading}
              />
            </FormField>

            <FormField label="Description" field="description">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={{
                  ...modalStyles.textarea,
                  ...(errors.description ? modalStyles.inputError : {})
                }}
                placeholder="Describe the event"
                rows={4}
                disabled={loading}
              />
            </FormField>

            <div style={modalStyles.formRow}>
              <FormField label="Minimum Age" field="age_min">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age_min}
                  onChange={(e) => handleInputChange('age_min', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.age_min ? modalStyles.inputError : {})
                  }}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Maximum Age" field="age_max">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age_max}
                  onChange={(e) => handleInputChange('age_max', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.age_max ? modalStyles.inputError : {})
                  }}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Additional Settings */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Additional Settings</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  style={modalStyles.checkbox}
                  disabled={loading}
                />
                Show on public calendar
              </label>

              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  style={modalStyles.checkbox}
                  disabled={loading}
                />
                Feature this event prominently
              </label>
            </div>

            <FormField 
              label="Prerequisites" 
              field="prerequisites"
              description="Requirements, items to bring, or preparation needed"
            >
              <textarea
                value={formData.prerequisites}
                onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                style={{
                  ...modalStyles.textarea,
                  ...(errors.prerequisites ? modalStyles.inputError : {})
                }}
                placeholder="Any requirements or things to bring"
                rows={3}
                disabled={loading}
              />
            </FormField>

            <FormField 
              label="Tags" 
              field="tags"
              description="Comma-separated tags for categorization"
            >
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.tags ? modalStyles.inputError : {})
                }}
                placeholder="youth, music, outreach"
                disabled={loading}
              />
            </FormField>

            <FormField label="Event Image URL" field="image_url">
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.image_url ? modalStyles.inputError : {})
                }}
                placeholder="https://..."
                disabled={loading}
              />
            </FormField>
          </div>

          {/* Form Actions */}
          <div style={modalStyles.actions}>
            <button
              type="button"
              onClick={onCancel}
              style={modalStyles.cancelButton}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...modalStyles.saveButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
            >
              {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              <Save size={16} />
              {event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;