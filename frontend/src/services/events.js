// frontend/src/services/events.js
import api from './api';

export const eventsService = {
  // Events CRUD
  getEvents: (params = {}) => api.get('/events/events/', { params }),
  getEvent: (id) => api.get(`/events/events/${id}/`),
  createEvent: (data) => api.post('/events/events/', data),
  updateEvent: (id, data) => api.put(`/events/events/${id}/`, data),
  deleteEvent: (id) => api.delete(`/events/events/${id}/`),

  // Event-specific endpoints
  getUpcomingEvents: (days = 30, limit = 50) => 
    api.get(`/events/events/upcoming/?days=${days}&limit=${limit}`),
  getCalendarEvents: (params = {}) => 
    api.get('/events/events/calendar/', { params }),
  getEventStatistics: () => 
    api.get('/events/events/statistics/'),
  exportEvents: (params = {}) => 
    api.get('/events/events/export/', { params, responseType: 'blob' }),

  // Event registration endpoints
  registerForEvent: (eventId, data) => 
    api.post(`/events/events/${eventId}/register/`, data),
  getEventRegistrations: (eventId) => 
    api.get(`/events/events/${eventId}/registrations/`),
  getEventVolunteers: (eventId) => 
    api.get(`/events/events/${eventId}/volunteers/`),
  duplicateEvent: (eventId, data) => 
    api.post(`/events/events/${eventId}/duplicate/`, data),

  // Bulk operations
  bulkAction: (data) => 
    api.post('/events/events/bulk_action/', data),
  
  // Registration management
  getRegistrations: (params = {}) => 
    api.get('/events/registrations/', { params }),
  getRegistration: (id) => 
    api.get(`/events/registrations/${id}/`),
  updateRegistration: (id, data) => 
    api.put(`/events/registrations/${id}/`, data),
  deleteRegistration: (id) => 
    api.delete(`/events/registrations/${id}/`),
  confirmRegistration: (id) => 
    api.post(`/events/registrations/${id}/confirm/`),
  cancelRegistration: (id) => 
    api.post(`/events/registrations/${id}/cancel/`),
  markAttended: (id) => 
    api.post(`/events/registrations/${id}/mark_attended/`),
  exportRegistrations: (params = {}) => 
    api.get('/events/registrations/export/', { params, responseType: 'blob' }),

  // Event reminders
  getReminders: (params = {}) => 
    api.get('/events/reminders/', { params }),
  createReminder: (data) => 
    api.post('/events/reminders/', data),
  updateReminder: (id, data) => 
    api.put(`/events/reminders/${id}/`, data),
  deleteReminder: (id) => 
    api.delete(`/events/reminders/${id}/`),

  // Event categories
  getCategories: (params = {}) => 
    api.get('/events/categories/', { params }),
  createCategory: (data) => 
    api.post('/events/categories/', data),
  updateCategory: (id, data) => 
    api.put(`/events/categories/${id}/`, data),
  deleteCategory: (id) => 
    api.delete(`/events/categories/${id}/`),

  // Event volunteers
  getVolunteers: (params = {}) => 
    api.get('/events/volunteers/', { params }),
  createVolunteer: (data) => 
    api.post('/events/volunteers/', data),
  updateVolunteer: (id, data) => 
    api.put(`/events/volunteers/${id}/`, data),
  deleteVolunteer: (id) => 
    api.delete(`/events/volunteers/${id}/`),

  // Helper methods for frontend
  formatEventForCalendar: (events) => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      backgroundColor: event.color || '#3498db',
      borderColor: event.color || '#3498db',
      textColor: '#ffffff',
      extendedProps: {
        description: event.description,
        location: event.location,
        organizer: event.organizer,
        event_type: event.event_type,
        status: event.status,
        is_public: event.is_public,
        registration_count: event.registration_count,
        max_capacity: event.max_capacity
      }
    }));
  },

  getEventStatusColor: (status) => {
    const colors = {
      draft: '#6b7280',
      published: '#3b82f6',
      cancelled: '#ef4444',
      completed: '#10b981',
      postponed: '#f59e0b'
    };
    return colors[status] || colors.draft;
  },

  getEventTypeColor: (eventType) => {
    const colors = {
      service: '#3498db',
      meeting: '#e74c3c',
      social: '#2ecc71',
      youth: '#f39c12',
      workshop: '#9b59b6',
      outreach: '#1abc9c',
      conference: '#e67e22',
      retreat: '#8e44ad',
      fundraiser: '#27ae60',
      kids: '#f1c40f',
      seniors: '#95a5a6',
      prayer: '#34495e',
      bible_study: '#2c3e50',
      baptism: '#16a085',
      wedding: '#e91e63',
      funeral: '#607d8b',
      other: '#95a5a6'
    };
    return colors[eventType] || colors.other;
  },

  // Validation helpers
  validateEventData: (eventData) => {
    const errors = {};

    if (!eventData.title?.trim()) {
      errors.title = 'Event title is required';
    }

    if (!eventData.start_datetime) {
      errors.start_datetime = 'Start date and time is required';
    }

    if (!eventData.end_datetime) {
      errors.end_datetime = 'End date and time is required';
    }

    if (eventData.start_datetime && eventData.end_datetime) {
      const startDate = new Date(eventData.start_datetime);
      const endDate = new Date(eventData.end_datetime);
      
      if (startDate >= endDate) {
        errors.end_datetime = 'End time must be after start time';
      }
    }

    if (eventData.age_min && eventData.age_max) {
      const minAge = parseInt(eventData.age_min);
      const maxAge = parseInt(eventData.age_max);
      
      if (minAge > maxAge) {
        errors.age_max = 'Maximum age cannot be less than minimum age';
      }
    }

    if (eventData.max_capacity && parseInt(eventData.max_capacity) < 1) {
      errors.max_capacity = 'Maximum capacity must be at least 1';
    }

    if (eventData.registration_fee && parseFloat(eventData.registration_fee) < 0) {
      errors.registration_fee = 'Registration fee cannot be negative';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};