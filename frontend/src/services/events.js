// frontend/src/services/events.js - BACKEND COMPATIBLE VERSION
import api from './api';

export const eventsService = {
  // Events CRUD - Matching your backend exactly
  getEvents: async (params = {}) => {
    try {
      console.log('[EventsService] Getting events with params:', params);
      const response = await api.get('/events/', { params });
      console.log('[EventsService] Events response:', response);
      
      // FIXED: Handle Django REST pagination structure
      if (response.data && response.data.results) {
        // DRF pagination response
        return {
          data: {
            results: response.data.results,
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous
          }
        };
      } else if (Array.isArray(response.data)) {
        // Simple array response
        return {
          data: {
            results: response.data,
            count: response.data.length
          }
        };
      } else {
        // Single object or other format
        return response;
      }
    } catch (error) {
      console.error('[EventsService] Error getting events:', error);
      throw error;
    }
  },
  
  getEvent: async (id) => {
    try {
      const response = await api.get(`/events/${id}/`);
      return { data: response.data, success: true };
    } catch (error) {
      console.error('[EventsService] Error getting event:', error);
      throw error;
    }
  },
  
  createEvent: async (data) => {
    try {
      console.log('[EventsService] Creating event:', data);
      const response = await api.post('/events/', data);
      console.log('[EventsService] Event created:', response);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error creating event:', error);
      throw error;
    }
  },
  
  updateEvent: async (id, data) => {
    try {
      console.log('[EventsService] Updating event:', id, data);
      const response = await api.put(`/events/${id}/`, data);
      console.log('[EventsService] Event updated:', response);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error updating event:', error);
      throw error;
    }
  },
  
  deleteEvent: async (id) => {
    try {
      console.log('[EventsService] Deleting event:', id);
      const response = await api.delete(`/events/${id}/`);
      console.log('[EventsService] Event deleted:', response);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[EventsService] Error deleting event:', error);
      throw error;
    }
  },

  // Event-specific endpoints matching your backend views
  getUpcomingEvents: async (days = 30, limit = 50) => {
    try {
      const response = await api.get(`/events/events/upcoming/`, { 
        params: { days, limit } 
      });
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting upcoming events:', error);
      throw error;
    }
  },
    
  getCalendarEvents: async (params = {}) => {
    try {
      const response = await api.get('/events/calendar/', { params });
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting calendar events:', error);
      throw error;
    }
  },
    
  getEventStatistics: async () => {
    try {
      const response = await api.get('/events/statistics/');
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting statistics:', error);
      // Return fallback stats if API fails
      return {
        summary: {
          total_events: 0,
          published_events: 0,
          upcoming_events: 0,
          past_events: 0,
          total_registrations: 0,
          confirmed_registrations: 0
        },
        breakdown: { by_status: {}, by_type: {} },
        monthly_stats: []
      };
    }
  },
  
  exportEvents: async (params = {}) => {
    try {
      const response = await api.get('/events/export/', { 
        params, 
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error exporting events:', error);
      throw error;
    }
  },

  // Event registration endpoints
  registerForEvent: async (eventId, data) => {
    try {
      const response = await api.post(`/events/events/${eventId}/register/`, data);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error registering for event:', error);
      throw error;
    }
  },
    
  getEventRegistrations: async (eventId) => {
    try {
      const response = await api.get(`/events/events/${eventId}/registrations/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting registrations:', error);
      throw error;
    }
  },
    
  getEventVolunteers: async (eventId) => {
    try {
      const response = await api.get(`/events/events/${eventId}/volunteers/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting volunteers:', error);
      throw error;
    }
  },
    
  duplicateEvent: async (eventId, data) => {
    try {
      const response = await api.post(`/events/events/${eventId}/duplicate/`, data);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error duplicating event:', error);
      throw error;
    }
  },

  // Bulk operations
  bulkAction: async (data) => {
    try {
      const response = await api.post('/events/bulk_action/', data);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error performing bulk action:', error);
      throw error;
    }
  },
  
  // Registration management
  getRegistrations: async (params = {}) => {
    try {
      const response = await api.get('/events/registrations/', { params });
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting registrations:', error);
      throw error;
    }
  },
    
  getRegistration: async (id) => {
    try {
      const response = await api.get(`/events/registrations/${id}/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error getting registration:', error);
      throw error;
    }
  },
    
  updateRegistration: async (id, data) => {
    try {
      const response = await api.put(`/events/registrations/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error updating registration:', error);
      throw error;
    }
  },
    
  deleteRegistration: async (id) => {
    try {
      const response = await api.delete(`/events/registrations/${id}/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error deleting registration:', error);
      throw error;
    }
  },
    
  confirmRegistration: async (id) => {
    try {
      const response = await api.post(`/events/registrations/${id}/confirm/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error confirming registration:', error);
      throw error;
    }
  },
    
  cancelRegistration: async (id) => {
    try {
      const response = await api.post(`/events/registrations/${id}/cancel/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error cancelling registration:', error);
      throw error;
    }
  },
    
  markAttended: async (id) => {
    try {
      const response = await api.post(`/events/registrations/${id}/mark_attended/`);
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error marking attendance:', error);
      throw error;
    }
  },
    
  exportRegistrations: async (params = {}) => {
    try {
      const response = await api.get('/events/registrations/export/', { 
        params, 
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      console.error('[EventsService] Error exporting registrations:', error);
      throw error;
    }
  },

  // Categories endpoint (for EventForm)
  getCategories: async (params = {}) => {
    try {
      const response = await api.get('/events/categories/', { params });
      return response.data || { results: [] };
    } catch (error) {
      console.error('[EventsService] Error getting categories:', error);
      // Return empty results for now
      return { results: [] };
    }
  },

  // Helper methods for frontend
  formatEventForCalendar: (events) => {
    if (!Array.isArray(events)) return [];
    
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      backgroundColor: eventsService.getEventTypeColor(event.event_type),
      borderColor: eventsService.getEventTypeColor(event.event_type),
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

// Export as both named and default for compatibility
export default eventsService;