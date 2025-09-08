// frontend/src/components/admin/Events/EventForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from '../../../hooks/useForm';
import { useEvents } from '../../../hooks/useEvents';
import { useGroups } from '../../../hooks/useGroups';
import Button from '../../ui/Button';
import Input from '../../form/FormControls/Input';
import Select from '../../form/FormControls/Select';
import TextArea from '../../form/FormControls/TextArea';
import Checkbox from '../../form/FormControls/Checkbox';
import DatePicker from '../../form/FormControls/DatePicker';

const EventForm = ({ event, onClose }) => {
  const { createEvent, updateEvent } = useEvents();
  const { groups } = useGroups();
  const [loading, setLoading] = useState(false);

  const initialValues = {
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
    registration_fee: 0,
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
    ...event
  };

  const { values, errors, handleChange, handleSubmit, setValues } = useForm(
    initialValues,
    handleFormSubmit,
    validateForm
  );

  useEffect(() => {
    if (event) {
      setValues({
        ...event,
        start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : '',
        end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : '',
        registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : '',
        target_group_ids: event.target_groups?.map(g => g.id) || []
      });
    }
  }, [event, setValues]);

  function validateForm(values) {
    const errors = {};
    
    if (!values.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!values.start_datetime) {
      errors.start_datetime = 'Start date and time is required';
    }
    
    if (!values.end_datetime) {
      errors.end_datetime = 'End date and time is required';
    }
    
    if (values.start_datetime && values.end_datetime) {
      if (new Date(values.start_datetime) >= new Date(values.end_datetime)) {
        errors.end_datetime = 'End time must be after start time';
      }
    }
    
    if (values.age_min && values.age_max) {
      if (parseInt(values.age_min) > parseInt(values.age_max)) {
        errors.age_max = 'Maximum age must be greater than minimum age';
      }
    }
    
    if (values.max_capacity && parseInt(values.max_capacity) < 1) {
      errors.max_capacity = 'Capacity must be at least 1';
    }
    
    return errors;
  }

  async function handleFormSubmit(formValues) {
    setLoading(true);
    try {
      const eventData = {
        ...formValues,
        max_capacity: formValues.max_capacity ? parseInt(formValues.max_capacity) : null,
        age_min: formValues.age_min ? parseInt(formValues.age_min) : null,
        age_max: formValues.age_max ? parseInt(formValues.age_max) : null,
        registration_fee: parseFloat(formValues.registration_fee) || 0,
      };

      if (event?.id) {
        await updateEvent(event.id, eventData);
      } else {
        await createEvent(eventData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  }

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
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <Input
            label="Event Title"
            name="title"
            value={values.title}
            onChange={handleChange}
            error={errors.title}
            required
          />
        </div>

        <div className="md:col-span-2">
          <TextArea
            label="Description"
            name="description"
            value={values.description}
            onChange={handleChange}
            error={errors.description}
            rows={4}
          />
        </div>

        <Select
          label="Event Type"
          name="event_type"
          value={values.event_type}
          onChange={handleChange}
          options={eventTypeOptions}
          error={errors.event_type}
        />

        <Select
          label="Status"
          name="status"
          value={values.status}
          onChange={handleChange}
          options={statusOptions}
          error={errors.status}
        />

        {/* Date and Time */}
        <Input
          type="datetime-local"
          label="Start Date & Time"
          name="start_datetime"
          value={values.start_datetime}
          onChange={handleChange}
          error={errors.start_datetime}
          required
        />

        <Input
          type="datetime-local"
          label="End Date & Time"
          name="end_datetime"
          value={values.end_datetime}
          onChange={handleChange}
          error={errors.end_datetime}
          required
        />

        {/* Location */}
        <Input
          label="Location"
          name="location"
          value={values.location}
          onChange={handleChange}
          error={errors.location}
        />

        <div className="md:col-span-2">
          <TextArea
            label="Location Details"
            name="location_details"
            value={values.location_details}
            onChange={handleChange}
            error={errors.location_details}
            placeholder="Additional location information, directions, etc."
            rows={2}
          />
        </div>

        {/* Registration */}
        <div className="md:col-span-2">
          <Checkbox
            label="Requires Registration"
            name="requires_registration"
            checked={values.requires_registration}
            onChange={handleChange}
          />
        </div>

        {values.requires_registration && (
          <>
            <Input
              type="datetime-local"
              label="Registration Deadline"
              name="registration_deadline"
              value={values.registration_deadline}
              onChange={handleChange}
              error={errors.registration_deadline}
            />

            <Input
              type="number"
              label="Maximum Capacity"
              name="max_capacity"
              value={values.max_capacity}
              onChange={handleChange}
              error={errors.max_capacity}
              placeholder="Leave blank for unlimited"
            />

            <Input
              type="number"
              step="0.01"
              label="Registration Fee"
              name="registration_fee"
              value={values.registration_fee}
              onChange={handleChange}
              error={errors.registration_fee}
            />
          </>
        )}

        {/* Organizer Information */}
        <Input
          label="Organizer"
          name="organizer"
          value={values.organizer}
          onChange={handleChange}
          error={errors.organizer}
        />

        <Input
          type="email"
          label="Contact Email"
          name="contact_email"
          value={values.contact_email}
          onChange={handleChange}
          error={errors.contact_email}
        />

        <Input
          type="tel"
          label="Contact Phone"
          name="contact_phone"
          value={values.contact_phone}
          onChange={handleChange}
          error={errors.contact_phone}
        />

        {/* Target Audience */}
        <Input
          type="number"
          label="Minimum Age"
          name="age_min"
          value={values.age_min}
          onChange={handleChange}
          error={errors.age_min}
        />

        <Input
          type="number"
          label="Maximum Age"
          name="age_max"
          value={values.age_max}
          onChange={handleChange}
          error={errors.age_max}
        />

        {/* Target Groups */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Groups
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {groups.map(group => (
              <Checkbox
                key={group.id}
                label={group.name}
                name="target_group_ids"
                value={group.id}
                checked={values.target_group_ids.includes(group.id)}
                onChange={(e) => {
                  const groupId = group.id;
                  const currentIds = values.target_group_ids;
                  const newIds = e.target.checked
                    ? [...currentIds, groupId]
                    : currentIds.filter(id => id !== groupId);
                  handleChange({ target: { name: 'target_group_ids', value: newIds } });
                }}
              />
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="md:col-span-2">
          <TextArea
            label="Prerequisites"
            name="prerequisites"
            value={values.prerequisites}
            onChange={handleChange}
            error={errors.prerequisites}
            placeholder="Requirements, items to bring, etc."
            rows={3}
          />
        </div>

        <Input
          label="Tags"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          error={errors.tags}
          placeholder="Comma-separated tags"
        />

        <Input
          type="url"
          label="Event Image URL"
          name="image_url"
          value={values.image_url}
          onChange={handleChange}
          error={errors.image_url}
        />

        {/* Visibility Options */}
        <div className="md:col-span-2 space-y-2">
          <Checkbox
            label="Show on public calendar"
            name="is_public"
            checked={values.is_public}
            onChange={handleChange}
          />
          
          <Checkbox
            label="Featured event"
            name="is_featured"
            checked={values.is_featured}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;