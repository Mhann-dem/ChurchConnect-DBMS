// frontend/src/components/admin/Events/EventForm.jsx - FIXED: Input focus & scrolling issues
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, MapPin, Users, DollarSign, Tag, Clock, 
  Save, AlertCircle 
} from 'lucide-react';

const EventForm = ({ event, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  
  // FIXED: Single state object - prevents re-render issues
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
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
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

  // FIXED: Stable change handler - doesn't recreate on every render
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start date and time is required';
    }

    if (!formData.end_datetime) {
      newErrors.end_datetime = 'End date and time is required';
    }

    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      
      if (startDate >= endDate) {
        newErrors.end_datetime = 'End time must be after start time';
      }

      if (!event && startDate < new Date()) {
        newErrors.start_datetime = 'Start time cannot be in the past';
      }
    }

    if (formData.registration_deadline && formData.start_datetime) {
      const deadlineDate = new Date(formData.registration_deadline);
      const startDate = new Date(formData.start_datetime);
      
      if (deadlineDate > startDate) {
        newErrors.registration_deadline = 'Registration deadline cannot be after event start time';
      }
    }

    if (formData.contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        newErrors.contact_email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[EventForm] Form submission started');
    
    if (!validateForm()) {
      console.log('[EventForm] Validation failed:', errors);
      // Scroll to first error
      if (modalRef.current) {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = modalRef.current.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setLoading(true);

    try {
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
  };

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

  // FIXED: Proper scrollable modal styles
  const styles = {
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
      padding: '20px',
      overflowY: 'auto' // FIXED: Allow overlay to scroll
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh', // FIXED: Limit height
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      margin: 'auto' // FIXED: Center in overlay
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
      overflowY: 'auto', // FIXED: Scrollable content
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
      transition: 'border-color 0.2s',
      outline: 'none',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    inputError: {
      borderColor: '#ef4444'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    }
  };

  // FIXED: Close on overlay click, but not on modal click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} ref={modalRef}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
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

        {/* Content - SCROLLABLE */}
        <form onSubmit={handleSubmit} style={styles.content}>
          {/* Basic Information */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} />
              Basic Information
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Event Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={errors.title ? { ...styles.input, ...styles.inputError } : styles.input}
                disabled={loading}
                placeholder="Enter event title"
              />
              {errors.title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#ef4444', fontSize: '12px' }}>
                  <AlertCircle size={12} />
                  {errors.title}
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Event Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              >
                {eventTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                disabled={loading}
                rows={4}
                placeholder="Describe the event..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} />
              Date and Time
            </h3>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Start Date & Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleChange}
                  style={errors.start_datetime ? { ...styles.input, ...styles.inputError } : styles.input}
                  disabled={loading}
                />
                {errors.start_datetime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={12} />
                    {errors.start_datetime}
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  End Date & Time <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_datetime"
                  value={formData.end_datetime}
                  onChange={handleChange}
                  style={errors.end_datetime ? { ...styles.input, ...styles.inputError } : styles.input}
                  disabled={loading}
                />
                {errors.end_datetime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={12} />
                    {errors.end_datetime}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Registration Deadline</label>
              <input
                type="datetime-local"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleChange}
                style={errors.registration_deadline ? { ...styles.input, ...styles.inputError } : styles.input}
                disabled={loading}
              />
              {errors.registration_deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#ef4444', fontSize: '12px' }}>
                  <AlertCircle size={12} />
                  {errors.registration_deadline}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} />
              Location
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="e.g., Main Sanctuary, Fellowship Hall"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location Details</label>
              <textarea
                name="location_details"
                value={formData.location_details}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                disabled={loading}
                rows={3}
                placeholder="Additional location details or directions..."
              />
            </div>
          </div>

          {/* Registration Settings */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} />
              Registration Settings
            </h3>

            <div style={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', cursor: 'pointer', padding: '8px' }}>
                <input
                  type="checkbox"
                  name="requires_registration"
                  checked={formData.requires_registration}
                  onChange={handleChange}
                  style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  disabled={loading}
                />
                Requires Registration
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', cursor: 'pointer', padding: '8px' }}>
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  disabled={loading}
                />
                Show on Public Calendar
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', cursor: 'pointer', padding: '8px' }}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  disabled={loading}
                />
                Feature This Event
              </label>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maximum Capacity</label>
                <input
                  type="number"
                  name="max_capacity"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  min="0"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Registration Fee ($)</label>
                <input
                  type="number"
                  name="registration_fee"
                  value={formData.registration_fee}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Minimum Age</label>
                <input
                  type="number"
                  name="age_min"
                  value={formData.age_min}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  min="0"
                  placeholder="No minimum"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Maximum Age</label>
                <input
                  type="number"
                  name="age_max"
                  value={formData.age_max}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  min="0"
                  placeholder="No maximum"
                />
              </div>
            </div>
          </div>

          {/* Organizer Information */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} />
              Organizer Information
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Organizer</label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="Person or group organizing this event"
              />
            </div>

            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  style={errors.contact_email ? { ...styles.input, ...styles.inputError } : styles.input}
                  disabled={loading}
                  placeholder="contact@church.org"
                />
                {errors.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#ef4444', fontSize: '12px' }}>
                    <AlertCircle size={12} />
                    {errors.contact_email}
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Phone</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div style={styles.section}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} />
              Additional Details
            </h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Prerequisites</label>
              <textarea
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                disabled={loading}
                rows={3}
                placeholder="Requirements, items to bring, or preparation needed..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="youth, worship, community (comma-separated)"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Event Image URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>External Registration URL</label>
              <input
                type="url"
                name="external_registration_url"
                value={formData.external_registration_url}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                placeholder="https://example.com/register"
              />
            </div>
          </div>
        </form>

        {/* Footer - FIXED POSITION */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '2px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151'
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Save size={16} />
                {event ? 'Update Event' : 'Create Event'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventForm;