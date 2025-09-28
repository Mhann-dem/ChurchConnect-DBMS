// frontend/src/services/events.js - COMPLETELY FIXED VERSION
import api from './api';

class EventsService {
  constructor() {
    this.baseEndpoint = '/events';
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // FIXED: Get events with comprehensive error handling
  async getEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching events with params:', params);
      
      // Clean up parameters - remove empty values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          cleanParams[key] = params[key];
        }
      });
      
      console.log('[EventsService] Clean parameters:', cleanParams);
      
      const response = await api.get(`${this.baseEndpoint}/events/`, { 
        params: cleanParams,
        timeout: 30000
      });
      
      console.log('[EventsService] Raw API response:', response);
      
      // Handle different response structures safely
      let eventsData = {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
      
      if (response && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          // DRF pagination response
          eventsData = {
            results: response.data.results,
            count: response.data.count || response.data.results.length,
            next: response.data.next || null,
            previous: response.data.previous || null
          };
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
            next: response.data.next || null,
            previous: response.data.previous || null
          };
        } else if (typeof response.data === 'object' && response.data.data) {
          // Nested data structure
          eventsData = {
            results: Array.isArray(response.data.data) ? response.data.data : [],
            count: response.data.count || response.data.total || 0,
            next: response.data.next || null,
            previous: response.data.previous || null
          };
        }
      }
      
      console.log('[EventsService] Processed events data:', eventsData);
      
      // Ensure each event has required properties
      eventsData.results = eventsData.results.map(event => ({
        ...event,
        id: event.id || event.pk,
        title: event.title || 'Untitled Event',
        start_datetime: event.start_datetime || event.start_date,
        end_datetime: event.end_datetime || event.end_date,
        status: event.status || 'draft',
        event_type: event.event_type || 'other',
        registration_count: event.registration_count || 0,
        is_public: event.is_public !== undefined ? event.is_public : true,
        is_featured: event.is_featured || false,
        requires_registration: event.requires_registration || false
      }));
      
      return eventsData;
      
    } catch (error) {
      console.error('[EventsService] Error getting events:', error);
      throw this.enhanceError(error, 'Failed to fetch events');
    }
  }

  // FIXED: Get single event with comprehensive handling
  async getEvent(id) {
    try {
      console.log('[EventsService] Fetching event:', id);
      
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await api.get(`${this.baseEndpoint}/events/${id}/`, {
        timeout: 15000
      });
      
      console.log('[EventsService] Event response:', response);
      
      if (!response || !response.data) {
        throw new Error('No event data received');
      }
      
      // Ensure event has required properties
      const eventData = {
        ...response.data,
        id: response.data.id || response.data.pk,
        title: response.data.title || 'Untitled Event',
        start_datetime: response.data.start_datetime || response.data.start_date,
        end_datetime: response.data.end_datetime || response.data.end_date,
        status: response.data.status || 'draft',
        event_type: response.data.event_type || 'other'
      };
      
      return { 
        data: eventData, 
        success: true 
      };
      
    } catch (error) {
      console.error('[EventsService] Error getting event:', error);
      throw this.enhanceError(error, 'Failed to fetch event details');
    }
  }

  // FIXED: Create event with comprehensive validation and error handling
  async createEvent(data) {
    try {
      console.log('[EventsService] Creating event with data:', data);
      
      if (!data) {
        throw new Error('Event data is required');
      }
      
      // Validate required fields before sending
      const validation = this.validateEventData(data);
      if (!validation.isValid) {
        const errorMessage = `Validation failed: ${Object.values(validation.errors).join(', ')}`;
        console.error('[EventsService] Validation errors:', validation.errors);
        throw new Error(errorMessage);
      }
      
      // Prepare data for submission
      const submitData = this.prepareEventData(data);
      console.log('[EventsService] Prepared data for submission:', submitData);
      
      const response = await api.post(`${this.baseEndpoint}/events/`, submitData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[EventsService] Event created successfully:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No response data received after creation');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error creating event:', error);
      throw this.enhanceError(error, 'Failed to create event');
    }
  }

  // FIXED: Update event with proper handling
  async updateEvent(id, data) {
    try {
      console.log('[EventsService] Updating event:', id, 'with data:', data);
      
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      if (!data) {
        throw new Error('Event data is required');
      }
      
      // Validate data
      const validation = this.validateEventData(data);
      if (!validation.isValid) {
        const errorMessage = `Validation failed: ${Object.values(validation.errors).join(', ')}`;
        console.error('[EventsService] Validation errors:', validation.errors);
        throw new Error(errorMessage);
      }
      
      // Prepare data for submission
      const submitData = this.prepareEventData(data);
      console.log('[EventsService] Prepared data for update:', submitData);
      
      const response = await api.put(`${this.baseEndpoint}/events/${id}/`, submitData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[EventsService] Event updated successfully:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No response data received after update');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error updating event:', error);
      throw this.enhanceError(error, 'Failed to update event');
    }
  }

  // FIXED: Delete event with proper confirmation
  async deleteEvent(id) {
    try {
      console.log('[EventsService] Deleting event:', id);
      
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await api.delete(`${this.baseEndpoint}/events/${id}/`, {
        timeout: 15000
      });
      
      console.log('[EventsService] Event deleted successfully:', response);
      
      return { success: true, data: response.data || {} };
      
    } catch (error) {
      console.error('[EventsService] Error deleting event:', error);
      throw this.enhanceError(error, 'Failed to delete event');
    }
  }

  // FIXED: Get calendar events with proper error handling
  async getCalendarEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching calendar events:', params);
      
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          cleanParams[key] = params[key];
        }
      });
      
      const response = await api.get(`${this.baseEndpoint}/events/calendar/`, { 
        params: cleanParams,
        timeout: 30000
      });
      
      const calendarData = {
        results: response.data?.results || response.data || [],
        count: response.data?.count || (response.data?.length || 0)
      };
      
      console.log('[EventsService] Calendar events loaded:', calendarData);
      
      return calendarData;
      
    } catch (error) {
      console.error('[EventsService] Error getting calendar events:', error);
      throw this.enhanceError(error, 'Failed to fetch calendar events');
    }
  }

  // FIXED: Get upcoming events
  async getUpcomingEvents(days = 30, limit = 50) {
    try {
      console.log('[EventsService] Fetching upcoming events:', { days, limit });
      
      const response = await api.get(`${this.baseEndpoint}/events/upcoming/`, { 
        params: { days, limit },
        timeout: 15000
      });
      
      return {
        results: response.data?.results || response.data || [],
        count: response.data?.count || (response.data?.length || 0),
        days_ahead: days
      };
      
    } catch (error) {
      console.error('[EventsService] Error getting upcoming events:', error);
      throw this.enhanceError(error, 'Failed to fetch upcoming events');
    }
  }

  // FIXED: Get statistics with comprehensive error handling
  async getEventStatistics() {
    try {
      console.log('[EventsService] Fetching event statistics');
      
      const response = await api.get(`${this.baseEndpoint}/events/statistics/`, {
        timeout: 15000
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error getting statistics:', error);
      
      // Return fallback stats instead of throwing
      const fallbackStats = {
        summary: {
          total_events: 0,
          published_events: 0,
          upcoming_events: 0,
          past_events: 0,
          total_registrations: 0,
          confirmed_registrations: 0,
          recent_events: 0,
          recent_registrations: 0
        },
        breakdown: { 
          by_status: {}, 
          by_type: {} 
        },
        monthly_stats: []
      };
      
      console.log('[EventsService] Returning fallback statistics');
      return fallbackStats;
    }
  }

  // FIXED: Register for event
  async registerForEvent(eventId, registrationData) {
    try {
      console.log('[EventsService] Registering for event:', eventId, registrationData);
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      if (!registrationData.member_id) {
        throw new Error('Member ID is required for registration');
      }
      
      const response = await api.post(`${this.baseEndpoint}/events/${eventId}/register/`, registrationData, {
        timeout: 30000
      });
      
      console.log('[EventsService] Registration successful:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Registration error:', error);
      throw this.enhanceError(error, 'Failed to register for event');
    }
  }

  // FIXED: Export events
  async exportEvents(params = {}) {
    try {
      console.log('[EventsService] Exporting events:', params);
      
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          cleanParams[key] = params[key];
        }
      });
      
      const response = await api.get(`${this.baseEndpoint}/events/export/`, { 
        params: cleanParams, 
        responseType: 'blob',
        timeout: 60000
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Export error:', error);
      throw this.enhanceError(error, 'Failed to export events');
    }
  }

  // FIXED: Bulk actions with proper validation
  async bulkAction(actionData) {
    try {
      console.log('[EventsService] Performing bulk action:', actionData);
      
      if (!actionData || !actionData.action || !Array.isArray(actionData.event_ids)) {
        throw new Error('Invalid bulk action data');
      }
      
      if (actionData.event_ids.length === 0) {
        throw new Error('No events selected for bulk action');
      }
      
      const response = await api.post(`${this.baseEndpoint}/events/bulk_action/`, actionData, {
        timeout: 60000
      });
      
      console.log('[EventsService] Bulk action completed:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Bulk action error:', error);
      throw this.enhanceError(error, 'Bulk action failed');
    }
  }

  // FIXED: Prepare event data for submission
  prepareEventData(eventData) {
    // Create a clean copy of the data
    const prepared = { ...eventData };
    
    // Convert string numbers to proper types
    if (prepared.max_capacity !== null && prepared.max_capacity !== undefined && prepared.max_capacity !== '') {
      prepared.max_capacity = parseInt(prepared.max_capacity);
      if (isNaN(prepared.max_capacity)) {
        prepared.max_capacity = null;
      }
    }
    
    if (prepared.age_min !== null && prepared.age_min !== undefined && prepared.age_min !== '') {
      prepared.age_min = parseInt(prepared.age_min);
      if (isNaN(prepared.age_min)) {
        prepared.age_min = null;
      }
    }
    
    if (prepared.age_max !== null && prepared.age_max !== undefined && prepared.age_max !== '') {
      prepared.age_max = parseInt(prepared.age_max);
      if (isNaN(prepared.age_max)) {
        prepared.age_max = null;
      }
    }
    
    if (prepared.registration_fee !== null && prepared.registration_fee !== undefined && prepared.registration_fee !== '') {
      prepared.registration_fee = parseFloat(prepared.registration_fee);
      if (isNaN(prepared.registration_fee)) {
        prepared.registration_fee = 0;
      }
    }
    
    // Clean up empty strings - convert to null for optional fields
    const optionalFields = [
      'description', 'location', 'location_details', 'organizer',
      'contact_email', 'contact_phone', 'prerequisites', 'tags',
      'image_url', 'external_registration_url', 'registration_deadline'
    ];
    
    optionalFields.forEach(field => {
      if (prepared[field] === '') {
        prepared[field] = null;
      }
    });
    
    // Ensure boolean fields are properly typed
    prepared.is_public = Boolean(prepared.is_public);
    prepared.is_featured = Boolean(prepared.is_featured);
    prepared.requires_registration = Boolean(prepared.requires_registration);
    
    // Ensure required fields have defaults
    if (!prepared.status) {
      prepared.status = 'draft';
    }
    
    if (!prepared.event_type) {
      prepared.event_type = 'other';
    }
    
    return prepared;
  }

  // FIXED: Enhanced data validation
  validateEventData(eventData) {
    const errors = {};
    
    // Required fields validation
    if (!eventData.title?.trim()) {
      errors.title = 'Event title is required';
    } else if (eventData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (eventData.title.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
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
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate >= endDate) {
        errors.end_datetime = 'End time must be after start time';
      }
    }
    
    // Registration deadline validation
    if (eventData.registration_deadline && eventData.start_datetime) {
      const deadlineDate = new Date(eventData.registration_deadline);
      const startDate = new Date(eventData.start_datetime);
      
      if (isNaN(deadlineDate.getTime())) {
        errors.registration_deadline = 'Invalid registration deadline format';
      } else if (!isNaN(startDate.getTime()) && deadlineDate > startDate) {
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
      
      if (!isNaN(minAge) && !isNaN(maxAge) && minAge > maxAge) {
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
    
    // Text length validation
    if (eventData.description && eventData.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
    
    if (eventData.location && eventData.location.length > 200) {
      errors.location = 'Location cannot exceed 200 characters';
    }
    
    if (eventData.organizer && eventData.organizer.length > 100) {
      errors.organizer = 'Organizer name cannot exceed 100 characters';
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
  
  // FIXED: Enhanced error handling with detailed context
  enhanceError(error, defaultMessage = 'An error occurred') {
    const enhancedError = new Error();
    
    if (error.response) {
      // Server responded with error status
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      
      switch (error.response.status) {
        case 400:
          if (error.response.data?.detail) {
            enhancedError.message = error.response.data.detail;
          } else if (error.response.data?.error) {
            enhancedError.message = error.response.data.error;
          } else if (typeof error.response.data === 'object') {
            // Handle validation errors
            const validationErrors = [];
            Object.entries(error.response.data).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                validationErrors.push(`${field}: ${messages.join(', ')}`);
              } else {
                validationErrors.push(`${field}: ${messages}`);
              }
            });
            enhancedError.message = validationErrors.length > 0 
              ? `Validation errors: ${validationErrors.join('; ')}`
              : 'Invalid request data';
          } else {
            enhancedError.message = 'Bad request. Please check your input.';
          }
          break;
          
        case 401:
          enhancedError.message = 'Authentication required. Please log in again.';
          break;
          
        case 403:
          enhancedError.message = 'You do not have permission to perform this action.';
          break;
          
        case 404:
          enhancedError.message = 'The requested resource was not found. Please check if the event still exists.';
          break;
          
        case 409:
          enhancedError.message = 'Conflict occurred. The resource may have been modified by another user.';
          break;
          
        case 429:
          enhancedError.message = 'Too many requests. Please wait a moment and try again.';
          break;
          
        case 500:
          enhancedError.message = 'Server error. Please try again later.';
          break;
          
        case 502:
        case 503:
        case 504:
          enhancedError.message = 'Service temporarily unavailable. Please try again later.';
          break;
          
        default:
          enhancedError.message = error.response.data?.detail || 
                                   error.response.data?.error || 
                                   `Server error: ${error.response.status}`;
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
    console.log(`[EventsService] Subscribe to ${eventType} events`);
    
    // This would be implemented with WebSocket or similar
    // For now, return a mock unsubscribe function
    return () => {
      console.log(`[EventsService] Unsubscribed from ${eventType} events`);
    };
  }
}

// Create singleton instance
const eventsService = new EventsService();

export { eventsService };
export default eventsService;