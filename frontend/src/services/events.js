// frontend/src/services/events.js - FIXED VERSION
import api from './api';

class EventsService {
  constructor() {
    this.baseEndpoint = '/events';
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // FIXED: Get events with proper error handling
  async getEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching events with params:', params);
      
      const response = await api.get(`${this.baseEndpoint}/events/`, { params });
      console.log('[EventsService] Raw API response:', response);
      
      // Handle different response structures
      let eventsData = {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
      
      if (response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          // DRF pagination response
          eventsData = response.data;
        } else if (Array.isArray(response.data)) {
          // Simple array response
          eventsData = {
            results: response.data,
            count: response.data.length,
            next: null,
            previous: null
          };
        } else if (response.data.events && Array.isArray(response.data.events)) {
          // Custom events property
          eventsData = {
            results: response.data.events,
            count: response.data.total || response.data.events.length,
            next: response.data.next,
            previous: response.data.previous
          };
        }
      }
      
      console.log('[EventsService] Processed events data:', eventsData);
      return eventsData;
      
    } catch (error) {
      console.error('[EventsService] Error getting events:', error);
      throw this.enhanceError(error, 'Failed to fetch events');
    }
  }

  // FIXED: Get single event
  async getEvent(id) {
    try {
      console.log('[EventsService] Fetching event:', id);
      
      const response = await api.get(`${this.baseEndpoint}/events/${id}/`);
      console.log('[EventsService] Event response:', response.data);
      
      return { 
        data: response.data, 
        success: true 
      };
      
    } catch (error) {
      console.error('[EventsService] Error getting event:', error);
      throw this.enhanceError(error, 'Failed to fetch event details');
    }
  }

  // FIXED: Create event with validation
  async createEvent(data) {
    try {
      console.log('[EventsService] Creating event:', data);
      
      // Validate required fields
      const validation = this.validateEventData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }
      
      const response = await api.post(`${this.baseEndpoint}/events/`, data);
      console.log('[EventsService] Event created:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error creating event:', error);
      throw this.enhanceError(error, 'Failed to create event');
    }
  }

  // FIXED: Update event
  async updateEvent(id, data) {
    try {
      console.log('[EventsService] Updating event:', id, data);
      
      // Validate data
      const validation = this.validateEventData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }
      
      const response = await api.put(`${this.baseEndpoint}/events/${id}/`, data);
      console.log('[EventsService] Event updated:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error updating event:', error);
      throw this.enhanceError(error, 'Failed to update event');
    }
  }

  // FIXED: Delete event
  async deleteEvent(id) {
    try {
      console.log('[EventsService] Deleting event:', id);
      
      const response = await api.delete(`${this.baseEndpoint}/events/${id}/`);
      console.log('[EventsService] Event deleted:', response);
      
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('[EventsService] Error deleting event:', error);
      throw this.enhanceError(error, 'Failed to delete event');
    }
  }

  // Get calendar events
  async getCalendarEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching calendar events:', params);
      
      const response = await api.get(`${this.baseEndpoint}/events/calendar/`, { params });
      
      const calendarData = {
        results: response.data.results || response.data || [],
        count: response.data.count || (response.data?.length || 0)
      };
      
      return calendarData;
      
    } catch (error) {
      console.error('[EventsService] Error getting calendar events:', error);
      throw this.enhanceError(error, 'Failed to fetch calendar events');
    }
  }

  // Get upcoming events
  async getUpcomingEvents(days = 30, limit = 50) {
    try {
      const response = await api.get(`${this.baseEndpoint}/events/upcoming/`, { 
        params: { days, limit } 
      });
      
      return {
        results: response.data.results || response.data || [],
        count: response.data.count || (response.data?.length || 0),
        days_ahead: days
      };
      
    } catch (error) {
      console.error('[EventsService] Error getting upcoming events:', error);
      throw this.enhanceError(error, 'Failed to fetch upcoming events');
    }
  }

  // Get statistics
  async getEventStatistics() {
    try {
      const response = await api.get(`${this.baseEndpoint}/events/statistics/`);
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error getting statistics:', error);
      // Return fallback stats instead of throwing
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
  }

  // Register for event
  async registerForEvent(eventId, registrationData) {
    try {
      console.log('[EventsService] Registering for event:', eventId, registrationData);
      
      const response = await api.post(`${this.baseEndpoint}/events/${eventId}/register/`, registrationData);
      console.log('[EventsService] Registration successful:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Registration error:', error);
      throw this.enhanceError(error, 'Failed to register for event');
    }
  }

  // Export events
  async exportEvents(params = {}) {
    try {
      console.log('[EventsService] Exporting events:', params);
      
      const response = await api.get(`${this.baseEndpoint}/events/export/`, { 
        params, 
        responseType: 'blob' 
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Export error:', error);
      throw this.enhanceError(error, 'Failed to export events');
    }
  }

  // Bulk actions
  async bulkAction(actionData) {
    try {
      console.log('[EventsService] Performing bulk action:', actionData);
      
      const response = await api.post(`${this.baseEndpoint}/events/bulk_action/`, actionData);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Bulk action error:', error);
      throw this.enhanceError(error, 'Bulk action failed');
    }
  }

  // FIXED: Enhanced data validation
  validateEventData(eventData) {
    const errors = {};
    
    // Required fields
    if (!eventData.title?.trim()) {
      errors.title = 'Event title is required';
    } else if (eventData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    
    if (!eventData.start_datetime) {
      errors.start_datetime = 'Start date and time is required';
    }
    
    if (!eventData.end_datetime) {
      errors.end_datetime = 'End date and time is required';
    }
    
    // Date validation
    if (eventData.start_datetime && eventData.end_datetime) {
      const startDate = new Date(eventData.start_datetime);
      const endDate = new Date(eventData.end_datetime);
      
      if (isNaN(startDate.getTime())) {
        errors.start_datetime = 'Invalid start date format';
      }
      
      if (isNaN(endDate.getTime())) {
        errors.end_datetime = 'Invalid end date format';
      }
      
      if (startDate >= endDate) {
        errors.end_datetime = 'End time must be after start time';
      }
    }
    
    // Registration deadline validation
    if (eventData.registration_deadline && eventData.start_datetime) {
      const deadlineDate = new Date(eventData.registration_deadline);
      const startDate = new Date(eventData.start_datetime);
      
      if (isNaN(deadlineDate.getTime())) {
        errors.registration_deadline = 'Invalid registration deadline format';
      } else if (deadlineDate > startDate) {
        errors.registration_deadline = 'Registration deadline cannot be after event start time';
      }
    }
    
    // Numeric validations
    if (eventData.age_min !== undefined && eventData.age_min !== null && eventData.age_min !== '') {
      const minAge = parseInt(eventData.age_min);
      if (isNaN(minAge) || minAge < 0 || minAge > 120) {
        errors.age_min = 'Minimum age must be between 0 and 120';
      }
    }
    
    if (eventData.age_max !== undefined && eventData.age_max !== null && eventData.age_max !== '') {
      const maxAge = parseInt(eventData.age_max);
      if (isNaN(maxAge) || maxAge < 0 || maxAge > 120) {
        errors.age_max = 'Maximum age must be between 0 and 120';
      }
    }
    
    if (eventData.age_min && eventData.age_max) {
      const minAge = parseInt(eventData.age_min);
      const maxAge = parseInt(eventData.age_max);
      
      if (minAge > maxAge) {
        errors.age_max = 'Maximum age cannot be less than minimum age';
      }
    }
    
    if (eventData.max_capacity !== undefined && eventData.max_capacity !== null && eventData.max_capacity !== '') {
      const capacity = parseInt(eventData.max_capacity);
      if (isNaN(capacity) || capacity < 1) {
        errors.max_capacity = 'Maximum capacity must be at least 1';
      }
    }
    
    if (eventData.registration_fee !== undefined && eventData.registration_fee !== null && eventData.registration_fee !== '') {
      const fee = parseFloat(eventData.registration_fee);
      if (isNaN(fee) || fee < 0) {
        errors.registration_fee = 'Registration fee cannot be negative';
      }
    }
    
    // Email validation
    if (eventData.contact_email && !this.isValidEmail(eventData.contact_email)) {
      errors.contact_email = 'Please enter a valid email address';
    }
    
    // URL validation
    if (eventData.image_url && !this.isValidUrl(eventData.image_url)) {
      errors.image_url = 'Please enter a valid URL';
    }
    
    if (eventData.external_registration_url && !this.isValidUrl(eventData.external_registration_url)) {
      errors.external_registration_url = 'Please enter a valid URL';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  // Helper validation functions
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Enhanced error handling
  enhanceError(error, defaultMessage = 'An error occurred') {
    const enhancedError = new Error();
    
    if (error.response) {
      // Server responded with error status
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      
      if (error.response.status === 404) {
        enhancedError.message = 'Events API endpoint not found. Check your backend routes.';
      } else if (error.response.status === 401) {
        enhancedError.message = 'Authentication required. Please log in again.';
      } else if (error.response.status === 403) {
        enhancedError.message = 'You do not have permission to perform this action.';
      } else if (error.response.status >= 500) {
        enhancedError.message = 'Server error. Please try again later.';
      } else if (error.response.data?.detail) {
        enhancedError.message = error.response.data.detail;
      } else if (error.response.data?.error) {
        enhancedError.message = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        enhancedError.message = error.response.data;
      } else {
        enhancedError.message = `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      // Network error
      enhancedError.message = 'Network error. Please check your connection and ensure the backend is running.';
      enhancedError.isNetworkError = true;
    } else {
      // Other error
      enhancedError.message = error.message || defaultMessage;
    }
    
    enhancedError.originalError = error;
    return enhancedError;
  }

  // Subscribe method for real-time updates (placeholder)
  subscribe(eventType, callback) {
    // This would be implemented with WebSocket or similar
    console.log(`[EventsService] Subscribe to ${eventType} events`);
    
    // Return unsubscribe function
    return () => {
      console.log(`[EventsService] Unsubscribed from ${eventType} events`);
    };
  }
}

// Create singleton instance
const eventsService = new EventsService();

export { eventsService };
export default eventsService;