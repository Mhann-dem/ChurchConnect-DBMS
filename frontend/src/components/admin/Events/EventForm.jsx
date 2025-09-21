// frontend/src/components/admin/Events/EventForm.jsx - Enhanced with proper database integration
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, MapPin, Users, DollarSign, Tag, Clock, Save, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { eventsService } from '../../../services/events';
import groupsService from '../../../services/groups';
import LoadingSpinner from '../../shared/LoadingSpinner';

const EventForm = ({ event, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [saveProgress, setSaveProgress] = useState(0);
  
  const { formSuccess, formError, loading: loadingToast, updateProgress } = useToast ();

  // Enhanced form state with validation tracking
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'other',
    category_id: '',
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
    target_group_ids: [],
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

  // Initialize form data with enhanced error tracking
  useEffect(() => {
    if (event) {
      console.log('[EventForm] Initializing with event:', event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'other',
        category_id: event.category?.id || '',
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
        target_group_ids: event.target_groups?.map(g => g.id) || [],
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
        organizer: 'Church Administrator' // Default organizer
      }));
    }
  }, [event]);

  // Load groups and categories with enhanced error handling
  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      const loadingToastId = loadingToast('Loading form data...');

      try {
        updateProgress(loadingToastId, 25, 'Loading groups...');
        
        const [groupsResponse, categoriesResponse] = await Promise.allSettled([
          groupsService?.getGroups?.() || Promise.resolve({ results: [] }),
          eventsService.getCategories?.() || Promise.resolve({ results: [] })
        ]);

        updateProgress(loadingToastId, 75, 'Processing data...');

        // Handle groups response
        if (groupsResponse.status === 'fulfilled') {
          setGroups(groupsResponse.value.results || []);
        } else {
          console.warn('Groups service failed:', groupsResponse.reason);
          setGroups([]);
        }

        // Handle categories response
        if (categoriesResponse.status === 'fulfilled') {
          setCategories(categoriesResponse.value.results || []);
        } else {
          console.warn('Categories service failed:', categoriesResponse.reason);
          setCategories([]);
        }

        updateProgress(loadingToastId, 100, 'Form data loaded');
        setTimeout(() => {
          // Remove loading toast
          const { removeToast } = useToast ();
          removeToast(loadingToastId);
        }, 500);

      } catch (err) {
        console.error('Error loading form data:', err);
        formError('load', 'form data', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  // Enhanced input change handler with validation
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
          const startDate = new Date(formData.start_datetime);
          const endDate = new Date(formData.end_datetime);
          
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
    }

    setErrors(newErrors);
  };

  // Multi-select change handler
  const handleMultiSelectChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
    setFormTouched(prev => ({ ...prev, [field]: true }));
  };

  // Comprehensive form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = ['title', 'start_datetime', 'end_datetime'];
    requiredFields.forEach(field => {
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });

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

  // Enhanced form submission with progress tracking
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[EventForm] Form submission started', { event: !!event, formData });
    
    if (!validateForm()) {
      formError('validate', 'event form', 'Please fix the validation errors');
      return;
    }

    setSaving(true);
    setSaveProgress(0);
    setErrors({});

    // Show progress toast
    const progressToastId = loadingToast(
      event ? 'Updating event...' : 'Creating event...'
    );

    try {
      updateProgress(progressToastId, 20, 'Preparing data...');

      // Prepare data for submission
      const submitData = {
        ...formData,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        category_id: formData.category_id || null,
        registration_deadline: formData.registration_deadline || null
      };

      // Remove empty string values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      updateProgress(progressToastId, 40, 'Submitting to server...');

      let savedEvent;
      if (event) {
        console.log('[EventForm] Updating event', event.id);
        updateProgress(progressToastId, 60, 'Updating event...');
        savedEvent = await eventsService.updateEvent(event.id, submitData);
        updateProgress(progressToastId, 80, 'Event updated successfully');
      } else {
        console.log('[EventForm] Creating new event');
        updateProgress(progressToastId, 60, 'Creating event...');
        savedEvent = await eventsService.createEvent(submitData);
        updateProgress(progressToastId, 80, 'Event created successfully');
      }

      updateProgress(progressToastId, 100, 'Finalizing...');

      console.log('[EventForm] Save successful:', savedEvent);

      // Remove progress toast
      const { removeToast } = useToast ();
      setTimeout(() => removeToast(progressToastId), 500);

      // Show success message
      formSuccess(
        event ? 'update' : 'create', 
        'Event',
        {
          title: event ? 'Event Updated!' : 'Event Created!',
          message: `"${savedEvent.title}" has been ${event ? 'updated' : 'created'} successfully.`
        }
      );

      // Call parent callback
      if (onSave) {
        onSave(savedEvent);
      }

    } catch (err) {
      console.error('[EventForm] Save error:', err);
      
      // Remove progress toast
      const { removeToast } = useToast ();
      removeToast(progressToastId);
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response?.status === 400 && err.response?.data) {
        // Validation errors from backend
        const backendErrors = err.response.data;
        setErrors(backendErrors);
        errorMessage = 'Please fix the validation errors';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (err.response?.status === 404) {
        errorMessage = 'Event not found';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = err.message || 'Failed to save event';
      }
      
      formError(
        event ? 'update' : 'create',
        'event',
        errorMessage,
        {
          onRetry: () => handleSubmit(e)
        }
      );
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  };

  // Form field component with enhanced validation display
  const FormField = ({ 
    label, 
    field, 
    type = 'text', 
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
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
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
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    form: {
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
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '8px',
      padding: '12px',
      backgroundColor: '#f3f4f6',
      borderRadius: '6px'
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

  if (loading) {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.content}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '48px',
            gap: '16px' 
          }}>
            <LoadingSpinner />
            <p>Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button 
            onClick={onCancel}
            style={modalStyles.closeButton}
            disabled={saving}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
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
                disabled={saving}
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
                disabled={saving}
              />
            </FormField>

            <div style={modalStyles.formRow}>
              <FormField label="Event Type" field="event_type" required>
                <select
                  value={formData.event_type}
                  onChange={(e) => handleInputChange('event_type', e.target.value)}
                  style={{
                    ...modalStyles.select,
                    ...(errors.event_type ? modalStyles.inputError : {})
                  }}
                  disabled={saving}
                >
                  {eventTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Category" field="category_id">
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  style={{
                    ...modalStyles.select,
                    ...(errors.category_id ? modalStyles.inputError : {})
                  }}
                  disabled={saving}
                >
                  <option value="">No category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Date and Time */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>
              <Calendar size={20} />
              Date & Time
            </h3>

            <div style={modalStyles.formRow}>
              <FormField label="Start Date & Time" field="start_datetime" required>
                <input
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => handleInputChange('start_datetime', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.start_datetime ? modalStyles.inputError : {}),
                    ...(formTouched.start_datetime && !errors.start_datetime && formData.start_datetime ? modalStyles.inputSuccess : {})
                  }}
                  disabled={saving}
                />
              </FormField>

              <FormField label="End Date & Time" field="end_datetime" required>
                <input
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) => handleInputChange('end_datetime', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.end_datetime ? modalStyles.inputError : {}),
                    ...(formTouched.end_datetime && !errors.end_datetime && formData.end_datetime ? modalStyles.inputSuccess : {})
                  }}
                  disabled={saving}
                />
              </FormField>
            </div>

            <FormField 
              label="Registration Deadline" 
              field="registration_deadline"
              description="Optional deadline for registrations"
            >
              <input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.registration_deadline ? modalStyles.inputError : {})
                }}
                disabled={saving}
              />
            </FormField>
          </div>

          {/* Location */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>
              <MapPin size={20} />
              Location
            </h3>

            <FormField label="Event Location" field="location">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.location ? modalStyles.inputError : {})
                }}
                placeholder="Event location or address"
                disabled={saving}
              />
            </FormField>

            <FormField 
              label="Location Details" 
              field="location_details"
              description="Additional directions, room numbers, parking info"
            >
              <textarea
                value={formData.location_details}
                onChange={(e) => handleInputChange('location_details', e.target.value)}
                style={{
                  ...modalStyles.textarea,
                  ...(errors.location_details ? modalStyles.inputError : {})
                }}
                placeholder="Additional location information"
                rows={3}
                disabled={saving}
              />
            </FormField>
          </div>

          {/* Registration */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>
              <Users size={20} />
              Registration
            </h3>

            <FormField field="requires_registration">
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.requires_registration}
                  onChange={(e) => handleInputChange('requires_registration', e.target.checked)}
                  style={modalStyles.checkbox}
                  disabled={saving}
                />
                Requires Registration
              </label>
            </FormField>

            {formData.requires_registration && (
              <>
                <div style={modalStyles.formRow}>
                  <FormField label="Maximum Capacity" field="max_capacity">
                    <input
                      type="number"
                      min="1"
                      value={formData.max_capacity}
                      onChange={(e) => handleInputChange('max_capacity', e.target.value)}
                      style={{
                        ...modalStyles.input,
                        ...(errors.max_capacity ? modalStyles.inputError : {})
                      }}
                      placeholder="Leave blank for unlimited"
                      disabled={saving}
                    />
                  </FormField>

                  <FormField label="Registration Fee" field="registration_fee">
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={16} style={{
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280'
                      }} />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.registration_fee}
                        onChange={(e) => handleInputChange('registration_fee', e.target.value)}
                        style={{
                          ...modalStyles.input,
                          paddingLeft: '28px',
                          ...(errors.registration_fee ? modalStyles.inputError : {})
                        }}
                        disabled={saving}
                      />
                    </div>
                  </FormField>
                </div>

                <FormField 
                  label="External Registration URL" 
                  field="external_registration_url"
                  description="Optional link to external registration system"
                >
                  <input
                    type="url"
                    value={formData.external_registration_url}
                    onChange={(e) => handleInputChange('external_registration_url', e.target.value)}
                    style={{
                      ...modalStyles.input,
                      ...(errors.external_registration_url ? modalStyles.inputError : {})
                    }}
                    placeholder="https://..."
                    disabled={saving}
                  />
                </FormField>
              </>
            )}
          </div>

          {/* Organization */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Organization</h3>

            <FormField label="Organizer" field="organizer">
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => handleInputChange('organizer', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(errors.organizer ? modalStyles.inputError : {})
                }}
                placeholder="Event organizer name"
                disabled={saving}
              />
            </FormField>

            <div style={modalStyles.formRow}>
              <FormField label="Contact Email" field="contact_email">
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.contact_email ? modalStyles.inputError : {}),
                    ...(formTouched.contact_email && !errors.contact_email && formData.contact_email ? modalStyles.inputSuccess : {})
                  }}
                  placeholder="Contact email"
                  disabled={saving}
                />
              </FormField>

              <FormField label="Contact Phone" field="contact_phone">
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  style={{
                    ...modalStyles.input,
                    ...(errors.contact_phone ? modalStyles.inputError : {})
                  }}
                  placeholder="Contact phone"
                  disabled={saving}
                />
              </FormField>
            </div>
          </div>

          {/* Target Audience */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Target Audience</h3>

            {groups.length > 0 && (
              <FormField label="Target Groups" field="target_group_ids">
                <div style={modalStyles.checkboxGroup}>
                  {groups.map(group => (
                    <label key={group.id} style={modalStyles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.target_group_ids.includes(group.id)}
                        onChange={(e) => handleMultiSelectChange('target_group_ids', group.id, e.target.checked)}
                        style={modalStyles.checkbox}
                        disabled={saving}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </FormField>
            )}

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
                  disabled={saving}
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
                  disabled={saving}
                />
              </FormField>
            </div>
          </div>

          {/* Additional Settings */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>Additional Settings</h3>

            <div style={modalStyles.formRow}>
              <FormField label="Status" field="status" required>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  style={{
                    ...modalStyles.select,
                    ...(errors.status ? modalStyles.inputError : {})
                  }}
                  disabled={saving}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </FormField>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  style={modalStyles.checkbox}
                  disabled={saving}
                />
                Show on public calendar
              </label>

              <label style={modalStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  style={modalStyles.checkbox}
                  disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
            </FormField>
          </div>

          {/* Form Actions */}
          <div style={modalStyles.actions}>
            <button
              type="button"
              onClick={onCancel}
              style={modalStyles.cancelButton}
              disabled={saving}
              onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...modalStyles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
              disabled={saving}
              onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
            >
              {saving && <Loader size={16} className="animate-spin" />}
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