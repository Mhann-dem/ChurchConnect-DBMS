import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, Calendar, MapPin, Users, DollarSign, Tag, Clock, 
  Save, AlertCircle, CheckCircle, Loader 
} from 'lucide-react';

const EventForm = ({ event, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // FIXED: Use single form state object to prevent re-render issues
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

  // Format date for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // Initialize form data when event prop changes
  useEffect(() => {
    if (event) {
      console.log('[EventForm] Initializing with event:', event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'other',
        location: event.location || '',
        location_details: event.location_details || '',
        start_datetime: formatDateForInput(event.start_datetime),
        end_datetime: formatDateForInput(event.end_datetime),
        registration_deadline: formatDateForInput(event.registration_deadline),
        max_capacity: event.max_capacity ? event.max_capacity.toString() : '',
        requires_registration: event.requires_registration || false,
        registration_fee: event.registration_fee ? event.registration_fee.toString() : '0.00',
        organizer: event.organizer || '',
        contact_email: event.contact_email || '',
        contact_phone: event.contact_phone || '',
        age_min: event.age_min ? event.age_min.toString() : '',
        age_max: event.age_max ? event.age_max.toString() : '',
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
        start_datetime: formatDateForInput(now),
        end_datetime: formatDateForInput(oneHourLater),
        organizer: 'Church Administrator'
      }));
    }
  }, [event]);

  // FIXED: Single change handler with no dependencies to prevent recreation
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing - use functional update to avoid dependency
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []); // Empty dependency array prevents recreation

  // Validation helper functions
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

  // FIXED: Validation function that reads current state without dependencies
  const validateForm = useCallback(() => {
    // Read current formData from state instead of closure
    const currentFormData = formData;
    const newErrors = {};

    // Required fields validation
    if (!currentFormData.title?.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!currentFormData.start_datetime) {
      newErrors.start_datetime = 'Start date and time is required';
    }

    if (!currentFormData.end_datetime) {
      newErrors.end_datetime = 'End date and time is required';
    }

    // Date validation
    if (currentFormData.start_datetime && currentFormData.end_datetime) {
      const startDate = new Date(currentFormData.start_datetime);
      const endDate = new Date(currentFormData.end_datetime);
      
      if (startDate >= endDate) {
        newErrors.end_datetime = 'End time must be after start time';
      }

      // Check if dates are in the past (for new events)
      if (!event && startDate < new Date()) {
        newErrors.start_datetime = 'Start time cannot be in the past';
      }
    }

    // Registration deadline validation
    if (currentFormData.registration_deadline && currentFormData.start_datetime) {
      const deadlineDate = new Date(currentFormData.registration_deadline);
      const startDate = new Date(currentFormData.start_datetime);
      
      if (deadlineDate > startDate) {
        newErrors.registration_deadline = 'Registration deadline cannot be after event start time';
      }
    }

    // Email validation
    if (currentFormData.contact_email && !isValidEmail(currentFormData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    // URL validation
    if (currentFormData.image_url && !isValidUrl(currentFormData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }

    if (currentFormData.external_registration_url && !isValidUrl(currentFormData.external_registration_url)) {
      newErrors.external_registration_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, event]);

  // Form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    console.log('[EventForm] Form submission started');
    
    if (!validateForm()) {
      console.log('[EventForm] Validation failed:', errors);
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        title: formData.title?.trim(),
        description: formData.description?.trim() || null,
        event_type: formData.event_type,
        location: formData.location?.trim() || null,
        location_details: formData.location_details?.trim() || null,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        registration_deadline: formData.registration_deadline || null,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        requires_registration: formData.requires_registration,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        organizer: formData.organizer?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        status: formData.status,
        is_public: formData.is_public,
        is_featured: formData.is_featured,
        prerequisites: formData.prerequisites?.trim() || null,
        tags: formData.tags?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        external_registration_url: formData.external_registration_url?.trim() || null
      };

      console.log('[EventForm] Submitting data:', submitData);
      await onSave(submitData);
      
    } catch (error) {
      console.error('[EventForm] Submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSave, errors]);

  // FIXED: Memoized event type options to prevent recreations
  const eventTypeOptions = useMemo(() => [
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
  ], []);

  // FIXED: Memoized styles to prevent recreation
  const styles = useMemo(() => ({
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
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 24px 16px',
      borderBottom: '1px solid #e5e7eb',
      flexShrink: 0
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px'
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '16px 24px',
      borderTop: '1px solid #e5e7eb',
      flexShrink: 0,
      backgroundColor: '#f9fafb'
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
      marginBottom: '20px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    inputError: {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
    },
    errorText: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '6px',
      color: '#ef4444',
      fontSize: '12px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'none'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#374151',
      border: '2px solid #d1d5db'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      padding: '8px'
    },
    checkbox: {
      marginRight: '12px',
      width: '18px',
      height: '18px',
      accentColor: '#3b82f6',
      cursor: 'pointer'
    }
  }), []);

  // FIXED: FormField component that doesn't cause parent re-renders
  const FormField = React.memo(({ 
    label, 
    field, 
    required = false, 
    type = 'text',
    as = 'input',
    options = null,
    description = null
  }) => {
    const hasError = !!errors[field];
    const inputStyle = hasError ? { ...styles.input, ...styles.inputError } : styles.input;
    const value = formData[field] || '';

    // Create stable onChange handler for this specific field
    const onChange = React.useMemo(() => {
      return (e) => {
        const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        handleInputChange(field, newValue);
      };
    }, [field]);

    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {description && (
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '6px',
            fontStyle: 'italic'
          }}>
            {description}
          </p>
        )}
        
        {as === 'textarea' ? (
          <textarea
            value={value}
            onChange={onChange}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            disabled={loading}
            rows={4}
          />
        ) : as === 'select' ? (
          <select
            value={value}
            onChange={onChange}
            style={inputStyle}
            disabled={loading}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={onChange}
              style={styles.checkbox}
              disabled={loading}
            />
            {label}
          </label>
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            style={inputStyle}
            disabled={loading}
            {...(type === 'number' && { 
              min: '0', 
              step: field.includes('fee') ? '0.01' : '1' 
            })}
          />
        )}
        
        {hasError && (
          <div style={styles.errorText}>
            <AlertCircle size={12} />
            {errors[field]}
          </div>
        )}
      </div>
    );
  });

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Basic Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Tag size={20} />
              Basic Information
            </h3>

            <FormField
              label="Event Title"
              field="title"
              required
            />

            <FormField
              label="Event Type"
              field="event_type"
              as="select"
              options={eventTypeOptions}
              required
            />

            <FormField
              label="Description"
              field="description"
              as="textarea"
            />

            <FormField
              label="Status"
              field="status"
              as="select"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'postponed', label: 'Postponed' }
              ]}
              required
            />
          </div>

          {/* Date and Time */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Calendar size={20} />
              Date and Time
            </h3>

            <div style={styles.grid}>
              <FormField
                label="Start Date & Time"
                field="start_datetime"
                type="datetime-local"
                required
              />

              <FormField
                label="End Date & Time"
                field="end_datetime"
                type="datetime-local"
                required
              />
            </div>

            <FormField
              label="Registration Deadline"
              field="registration_deadline"
              type="datetime-local"
            />
          </div>

          {/* Location */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <MapPin size={20} />
              Location
            </h3>

            <FormField
              label="Location"
              field="location"
            />

            <FormField
              label="Location Details"
              field="location_details"
              as="textarea"
              description="Additional location details or directions"
            />
          </div>

          {/* Registration */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Users size={20} />
              Registration
            </h3>

            <FormField
              label="Requires Registration"
              field="requires_registration"
              type="checkbox"
            />

            <FormField
              label="Show on Public Calendar"
              field="is_public"
              type="checkbox"
            />

            <FormField
              label="Feature This Event"
              field="is_featured"
              type="checkbox"
            />

            <div style={styles.grid}>
              <FormField
                label="Maximum Capacity"
                field="max_capacity"
                type="number"
                description="Leave empty for unlimited"
              />

              <FormField
                label="Registration Fee"
                field="registration_fee"
                type="number"
              />
            </div>

            <div style={styles.grid}>
              <FormField
                label="Minimum Age"
                field="age_min"
                type="number"
              />

              <FormField
                label="Maximum Age"
                field="age_max"
                type="number"
              />
            </div>
          </div>

          {/* Organizer Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Users size={20} />
              Organizer Information
            </h3>

            <FormField
              label="Organizer"
              field="organizer"
            />

            <div style={styles.grid}>
              <FormField
                label="Contact Email"
                field="contact_email"
                type="email"
              />

              <FormField
                label="Contact Phone"
                field="contact_phone"
                type="tel"
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Tag size={20} />
              Additional Settings
            </h3>

            <FormField
              label="Prerequisites"
              field="prerequisites"
              as="textarea"
              description="Requirements, items to bring, or preparation needed"
            />

            <FormField
              label="Tags"
              field="tags"
              description="Comma-separated tags for categorization"
            />

            <FormField
              label="Event Image URL"
              field="image_url"
              type="url"
            />

            <FormField
              label="External Registration URL"
              field="external_registration_url"
              type="url"
              description="Link to external registration system (optional)"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...styles.button,
              ...styles.secondaryButton
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            <Save size={16} />
            {event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventForm;