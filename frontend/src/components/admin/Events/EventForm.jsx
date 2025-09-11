// frontend/src/components/admin/Events/EventForm.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, MapPin, Users, DollarSign, Tag, Clock } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { eventsService } from '../../../services/events';
import { groupsService } from '../../../services/groups';
import LoadingSpinner from '../../shared/LoadingSpinner';
import styles from './Events.module.css';

const EventForm = ({ event, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  
  const { showToast } = useToast();

  // Form state
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

  // Initialize form data
  useEffect(() => {
    if (event) {
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
    }
  }, [event]);

  // Load groups and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [groupsResponse, categoriesResponse] = await Promise.all([
          groupsService.getGroups(),
          eventsService.getCategories()
        ]);
        setGroups(groupsResponse.results || []);
        setCategories(categoriesResponse.results || []);
      } catch (err) {
        console.error('Error loading form data:', err);
        showToast('Failed to load form data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiSelectChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
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

      let savedEvent;
      if (event) {
        savedEvent = await eventsService.updateEvent(event.id, submitData);
      } else {
        savedEvent = await eventsService.createEvent(submitData);
      }

      onSave(savedEvent);
    } catch (err) {
      console.error('Error saving event:', err);
      
      // Handle validation errors from backend
      if (err.response?.data) {
        const backendErrors = err.response.data;
        setErrors(backendErrors);
      }
      
      showToast(
        event ? 'Failed to update event' : 'Failed to create event', 
        'error'
      );
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
            <p>Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button 
            onClick={onCancel}
            className={styles.modalCloseButton}
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Tag className="w-4 h-4" />
                Basic Information
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  placeholder="Enter event title"
                  disabled={saving}
                />
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  placeholder="Describe the event"
                  rows={4}
                  disabled={saving}
                />
                {errors.description && (
                  <span className={styles.errorText}>{errors.description}</span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Event Type *
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => handleInputChange('event_type', e.target.value)}
                    className={`${styles.select} ${errors.event_type ? styles.inputError : ''}`}
                    disabled={saving}
                  >
                    {eventTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.event_type && (
                    <span className={styles.errorText}>{errors.event_type}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`${styles.select} ${errors.category_id ? styles.inputError : ''}`}
                    disabled={saving}
                  >
                    <option value="">No category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <span className={styles.errorText}>{errors.category_id}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Calendar className="w-4 h-4" />
                Date & Time
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => handleInputChange('start_datetime', e.target.value)}
                    className={`${styles.input} ${errors.start_datetime ? styles.inputError : ''}`}
                    disabled={saving}
                  />
                  {errors.start_datetime && (
                    <span className={styles.errorText}>{errors.start_datetime}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => handleInputChange('end_datetime', e.target.value)}
                    className={`${styles.input} ${errors.end_datetime ? styles.inputError : ''}`}
                    disabled={saving}
                  />
                  {errors.end_datetime && (
                    <span className={styles.errorText}>{errors.end_datetime}</span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                  className={`${styles.input} ${errors.registration_deadline ? styles.inputError : ''}`}
                  disabled={saving}
                />
                {errors.registration_deadline && (
                  <span className={styles.errorText}>{errors.registration_deadline}</span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <MapPin className="w-4 h-4" />
                Location
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Event Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
                  placeholder="Event location or address"
                  disabled={saving}
                />
                {errors.location && (
                  <span className={styles.errorText}>{errors.location}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Location Details
                </label>
                <textarea
                  value={formData.location_details}
                  onChange={(e) => handleInputChange('location_details', e.target.value)}
                  className={`${styles.textarea} ${errors.location_details ? styles.inputError : ''}`}
                  placeholder="Additional location information, directions, room number, etc."
                  rows={3}
                  disabled={saving}
                />
                {errors.location_details && (
                  <span className={styles.errorText}>{errors.location_details}</span>
                )}
              </div>
            </div>

            {/* Registration */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <Users className="w-4 h-4" />
                Registration
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.requires_registration}
                    onChange={(e) => handleInputChange('requires_registration', e.target.checked)}
                    className={styles.checkbox}
                    disabled={saving}
                  />
                  Requires Registration
                </label>
              </div>

              {formData.requires_registration && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Maximum Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_capacity}
                        onChange={(e) => handleInputChange('max_capacity', e.target.value)}
                        className={`${styles.input} ${errors.max_capacity ? styles.inputError : ''}`}
                        placeholder="Leave blank for unlimited"
                        disabled={saving}
                      />
                      {errors.max_capacity && (
                        <span className={styles.errorText}>{errors.max_capacity}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Registration Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.registration_fee}
                        onChange={(e) => handleInputChange('registration_fee', e.target.value)}
                        className={`${styles.input} ${errors.registration_fee ? styles.inputError : ''}`}
                        disabled={saving}
                      />
                      {errors.registration_fee && (
                        <span className={styles.errorText}>{errors.registration_fee}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      External Registration URL
                    </label>
                    <input
                      type="url"
                      value={formData.external_registration_url}
                      onChange={(e) => handleInputChange('external_registration_url', e.target.value)}
                      className={`${styles.input} ${errors.external_registration_url ? styles.inputError : ''}`}
                      placeholder="Optional external registration link"
                      disabled={saving}
                    />
                    {errors.external_registration_url && (
                      <span className={styles.errorText}>{errors.external_registration_url}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Organization */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Organization</h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Organizer
                </label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                  className={`${styles.input} ${errors.organizer ? styles.inputError : ''}`}
                  placeholder="Event organizer name"
                  disabled={saving}
                />
                {errors.organizer && (
                  <span className={styles.errorText}>{errors.organizer}</span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className={`${styles.input} ${errors.contact_email ? styles.inputError : ''}`}
                    placeholder="Contact email for questions"
                    disabled={saving}
                  />
                  {errors.contact_email && (
                    <span className={styles.errorText}>{errors.contact_email}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className={`${styles.input} ${errors.contact_phone ? styles.inputError : ''}`}
                    placeholder="Contact phone number"
                    disabled={saving}
                  />
                  {errors.contact_phone && (
                    <span className={styles.errorText}>{errors.contact_phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Target Audience</h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Target Groups
                </label>
                <div className={styles.checkboxGroup}>
                  {groups.map(group => (
                    <label key={group.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.target_group_ids.includes(group.id)}
                        onChange={(e) => handleMultiSelectChange('target_group_ids', group.id, e.target.checked)}
                        className={styles.checkbox}
                        disabled={saving}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Minimum Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age_min}
                    onChange={(e) => handleInputChange('age_min', e.target.value)}
                    className={`${styles.input} ${errors.age_min ? styles.inputError : ''}`}
                    disabled={saving}
                  />
                  {errors.age_min && (
                    <span className={styles.errorText}>{errors.age_min}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Maximum Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age_max}
                    onChange={(e) => handleInputChange('age_max', e.target.value)}
                    className={`${styles.input} ${errors.age_max ? styles.inputError : ''}`}
                    disabled={saving}
                  />
                  {errors.age_max && (
                    <span className={styles.errorText}>{errors.age_max}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Settings</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
                    disabled={saving}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="postponed">Postponed</option>
                  </select>
                  {errors.status && (
                    <span className={styles.errorText}>{errors.status}</span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className={styles.checkbox}
                    disabled={saving}
                  />
                  Show on public calendar
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className={styles.checkbox}
                    disabled={saving}
                  />
                  Feature this event prominently
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Prerequisites
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                  className={`${styles.textarea} ${errors.prerequisites ? styles.inputError : ''}`}
                  placeholder="Requirements, items to bring, or preparation needed"
                  rows={3}
                  disabled={saving}
                />
                {errors.prerequisites && (
                  <span className={styles.errorText}>{errors.prerequisites}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className={`${styles.input} ${errors.tags ? styles.inputError : ''}`}
                  placeholder="Comma-separated tags for categorization"
                  disabled={saving}
                />
                {errors.tags && (
                  <span className={styles.errorText}>{errors.tags}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Event Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  className={`${styles.input} ${errors.image_url ? styles.inputError : ''}`}
                  placeholder="URL to event poster or promotional image"
                  disabled={saving}
                />
                {errors.image_url && (
                  <span className={styles.errorText}>{errors.image_url}</span>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving && <LoadingSpinner size="small" />}
              {event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;