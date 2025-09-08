// frontend/src/services/events.js
import api from './api';

export const eventsService = {
  // Events CRUD
  getEvents: (params = {}) => api.get('/events/', { params }),
  getEvent: (id) => api.get(`/events/${id}/`),
  createEvent: (data) => api.post('/events/', data),
  updateEvent: (id, data) => api.put(`/events/${id}/`, data),
  deleteEvent: (id) => api.delete(`/events/${id}/`),

  // Event-specific endpoints
  getUpcomingEvents: (days = 30) => api.get(`/events/upcoming/?days=${days}`),
  getCalendarEvents: (params = {}) => api.get('/events/calendar/', { params }),
  getEventStatistics: () => api.get('/events/statistics/'),

  // Registrations
  registerForEvent: (eventId, data) => api.post(`/events/${eventId}/register/`, data),
  getEventRegistrations: (eventId) => api.get(`/events/${eventId}/registrations/`),
  
  // Registration management
  getRegistrations: (params = {}) => api.get('/event-registrations/', { params }),
  updateRegistration: (id, data) => api.put(`/event-registrations/${id}/`, data),
  confirmRegistration: (id) => api.post(`/event-registrations/${id}/confirm/`),
  cancelRegistration: (id) => api.post(`/event-registrations/${id}/cancel/`),
  markAttended: (id) => api.post(`/event-registrations/${id}/mark_attended/`),

  // Reminders
  getReminders: (params = {}) => api.get('/event-reminders/', { params }),
  createReminder: (data) => api.post('/event-reminders/', data),
  updateReminder: (id, data) => api.put(`/event-reminders/${id}/`, data),
  deleteReminder: (id) => api.delete(`/event-reminders/${id}/`),
};