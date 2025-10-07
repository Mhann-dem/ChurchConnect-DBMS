// frontend/src/services/events.js - FIXED VERSION WITH REAL BACKEND INTEGRATION
import apiMethods from './api';

class EventsService {
  constructor() {
    this.baseEndpoint = 'events/events'; // Based on your Django URLs: /api/v1/events/events/
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // FIXED: Get events from your Django backend
  async getEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching events from Django backend:', params);
      
      // Clean up parameters - remove empty values
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          cleanParams[key] = params[key];
        }
      });
      
      // Use your Django API endpoint pattern from the server logs
      const response = await apiMethods.get(`${this.baseEndpoint}/`, { 
        params: cleanParams,
        timeout: 30000
      });
      
      console.log('[EventsService] Django API response:', response);
      
      // Handle Django REST framework pagination response
      let eventsData = {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
      
      if (response && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          // Standard DRF pagination response
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
        }
      }
      
      console.log('[EventsService] Processed events data:', eventsData);
      
      // Ensure each event has required properties with proper defaults
      eventsData.results = eventsData.results.map(event => ({
        ...event,
        id: event.id || event.pk,
        title: event.title || 'Untitled Event',
        start_datetime: event.start_datetime || event.start_date,
        end_datetime: event.end_datetime || event.end_date,
        status: event.status || 'draft',
        status_display: event.status_display || this.getStatusDisplay(event.status || 'draft'),
        event_type: event.event_type || 'other',
        event_type_display: event.event_type_display || this.getEventTypeDisplay(event.event_type || 'other'),
        registration_count: event.registration_count || event.registrations_count || 0,
        is_public: event.is_public !== undefined ? event.is_public : true,
        is_featured: event.is_featured || false,
        requires_registration: event.requires_registration || false,
        location: event.location || '',
        organizer: event.organizer || '',
        description: event.description || '',
        max_capacity: event.max_capacity || null,
        registration_fee: event.registration_fee || 0,
        created_at: event.created_at,
        updated_at: event.updated_at
      }));
      
      return eventsData;
      
    } catch (error) {
      console.error('[EventsService] Error fetching events from Django:', error);
      throw this.enhanceError(error, 'Failed to fetch events from server');
    }
  }

  // In events.js, add this method if missing:
  async getUpcomingEvents(params = {}) {
    try {
      const response = await apiMethods.get(`${this.baseEndpoint}/`, { 
        params: {
          ...params,
          status: 'published',
          is_public: true,
          upcoming: 'true',
          ordering: 'start_datetime'
        }
      });
      
      return {
        results: response.data?.results || response.data || [],
        count: response.data?.count || 0
      };
    } catch (error) {
      console.error('[EventsService] Error getting upcoming events:', error);
      return { results: [], count: 0 };
    }
  }

  // FIXED: Get single event from Django
  async getEvent(id) {
    try {
      console.log('[EventsService] Fetching event from Django:', id);
      
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await apiMethods.get(`${this.baseEndpoint}/${id}/`, {
        timeout: 15000
      });
      
      console.log('[EventsService] Django event response:', response);
      
      if (!response || !response.data) {
        throw new Error('No event data received from server');
      }
      
      // Process event data with proper defaults
      const eventData = {
        ...response.data,
        id: response.data.id || response.data.pk,
        title: response.data.title || 'Untitled Event',
        start_datetime: response.data.start_datetime || response.data.start_date,
        end_datetime: response.data.end_datetime || response.data.end_date,
        status: response.data.status || 'draft',
        status_display: response.data.status_display || this.getStatusDisplay(response.data.status || 'draft'),
        event_type: response.data.event_type || 'other',
        event_type_display: response.data.event_type_display || this.getEventTypeDisplay(response.data.event_type || 'other'),
        registration_count: response.data.registration_count || response.data.registrations_count || 0
      };
      
      return { 
        data: eventData, 
        success: true 
      };
      
    } catch (error) {
      console.error('[EventsService] Error fetching event from Django:', error);
      throw this.enhanceError(error, 'Failed to fetch event details');
    }
  }

  // FIXED: Create event in Django
  async createEvent(data) {
    try {
      console.log('[EventsService] Creating event in Django:', data);
      
      if (!data) {
        throw new Error('Event data is required');
      }
      
      // Validate required fields
      const validation = this.validateEventData(data);
      if (!validation.isValid) {
        const errorMessage = `Validation failed: ${Object.values(validation.errors).join(', ')}`;
        console.error('[EventsService] Validation errors:', validation.errors);
        throw new Error(errorMessage);
      }
      
      // Prepare data for Django API
      const submitData = this.prepareEventDataForDjango(data);
      console.log('[EventsService] Prepared data for Django:', submitData);
      
      const response = await apiMethods.post(`${this.baseEndpoint}/`, submitData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[EventsService] Django event creation response:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No response data received from server after creation');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error creating event in Django:', error);
      throw this.enhanceError(error, 'Failed to create event');
    }
  }

  // FIXED: Update event in Django
  async updateEvent(id, data) {
    try {
      console.log('[EventsService] Updating event in Django:', id, data);
      
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
      
      // Prepare data for Django API
      const submitData = this.prepareEventDataForDjango(data);
      console.log('[EventsService] Prepared data for Django update:', submitData);
      
      const response = await apiMethods.put(`${this.baseEndpoint}/${id}/`, submitData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[EventsService] Django event update response:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No response data received from server after update');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error updating event in Django:', error);
      throw this.enhanceError(error, 'Failed to update event');
    }
  }

  // FIXED: Delete event from Django
  async deleteEvent(id) {
    try {
      console.log('[EventsService] Deleting event from Django:', id);
      
      if (!id) {
        throw new Error('Event ID is required');
      }
      
      const response = await apiMethods.delete(`${this.baseEndpoint}/${id}/`, {
        timeout: 15000
      });
      
      console.log('[EventsService] Django event deletion response:', response);
      
      return { success: true, data: response.data || {} };
      
    } catch (error) {
      console.error('[EventsService] Error deleting event from Django:', error);
      throw this.enhanceError(error, 'Failed to delete event');
    }
  }

  // FIXED: Get calendar events from Django
  async getCalendarEvents(params = {}) {
    try {
      console.log('[EventsService] Fetching calendar events from Django:', params);
      
      const cleanParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          cleanParams[key] = params[key];
        }
      });
      
      // Use Django calendar endpoint from your logs
      const response = await apiMethods.get(`${this.baseEndpoint}/calendar/`, { 
        params: cleanParams,
        timeout: 30000
      });
      
      const calendarData = {
        results: response.data?.results || response.data || [],
        count: response.data?.count || (response.data?.length || 0)
      };
      
      console.log('[EventsService] Django calendar events loaded:', calendarData);
      
      return calendarData;
      
    } catch (error) {
      console.error('[EventsService] Error getting calendar events from Django:', error);
      throw this.enhanceError(error, 'Failed to fetch calendar events');
    }
  }

  // FIXED: Get event statistics from Django
  async getEventStatistics() {
    try {
      console.log('[EventsService] Fetching event statistics from Django');
      
      // Use Django statistics endpoint from your logs
      const response = await apiMethods.get(`${this.baseEndpoint}/statistics/`, {
        timeout: 15000
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error getting statistics from Django:', error);
      
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
      
      console.log('[EventsService] Returning fallback statistics due to error:', error.message);
      return fallbackStats;
    }
  }

  // FIXED: Register for event in Django
  async registerForEvent(eventId, registrationData) {
    try {
      console.log('[EventsService] Registering for event in Django:', eventId, registrationData);
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      if (!registrationData.member_id) {
        throw new Error('Member ID is required for registration');
      }
      
      // Use Django registration endpoint from your views
      const response = await apiMethods.post(`${this.baseEndpoint}/${eventId}/register/`, registrationData, {
        timeout: 30000
      });
      
      console.log('[EventsService] Django registration response:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Registration error in Django:', error);
      throw this.enhanceError(error, 'Failed to register for event');
    }
  }

  // FIXED: Bulk actions using Django endpoint
  async bulkAction(actionData) {
    try {
      console.log('[EventsService] Performing bulk action in Django:', actionData);
      
      if (!actionData || !actionData.action || !Array.isArray(actionData.event_ids)) {
        throw new Error('Invalid bulk action data');
      }
      
      if (actionData.event_ids.length === 0) {
        throw new Error('No events selected for bulk action');
      }
      
      // Use Django bulk action endpoint from your views
      const response = await apiMethods.post(`${this.baseEndpoint}/bulk_action/`, actionData, {
        timeout: 60000
      });
      
      console.log('[EventsService] Django bulk action response:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Bulk action error in Django:', error);
      throw this.enhanceError(error, 'Bulk action failed');
    }
  }

  // Helper: Prepare event data for Django API format
  prepareEventDataForDjango(eventData) {
    const prepared = { ...eventData };
    
    // Convert string numbers to proper types for Django
    if (prepared.max_capacity !== null && prepared.max_capacity !== undefined && prepared.max_capacity !== '') {
      prepared.max_capacity = parseInt(prepared.max_capacity);
      if (isNaN(prepared.max_capacity)) {
        prepared.max_capacity = null;
      }
    } else {
      prepared.max_capacity = null;
    }
    
    if (prepared.age_min !== null && prepared.age_min !== undefined && prepared.age_min !== '') {
      prepared.age_min = parseInt(prepared.age_min);
      if (isNaN(prepared.age_min)) {
        prepared.age_min = null;
      }
    } else {
      prepared.age_min = null;
    }
    
    if (prepared.age_max !== null && prepared.age_max !== undefined && prepared.age_max !== '') {
      prepared.age_max = parseInt(prepared.age_max);
      if (isNaN(prepared.age_max)) {
        prepared.age_max = null;
      }
    } else {
      prepared.age_max = null;
    }
    
    if (prepared.registration_fee !== null && prepared.registration_fee !== undefined && prepared.registration_fee !== '') {
      prepared.registration_fee = parseFloat(prepared.registration_fee);
      if (isNaN(prepared.registration_fee)) {
        prepared.registration_fee = 0;
      }
    } else {
      prepared.registration_fee = 0;
    }
    
    // Clean up empty strings - convert to null for Django optional fields
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
    
    // Ensure boolean fields are properly typed for Django
    prepared.is_public = Boolean(prepared.is_public);
    prepared.is_featured = Boolean(prepared.is_featured);
    prepared.requires_registration = Boolean(prepared.requires_registration);
    
    // Ensure required fields have defaults for Django
    if (!prepared.status) {
      prepared.status = 'draft';
    }
    
    if (!prepared.event_type) {
      prepared.event_type = 'other';
    }
    
    return prepared;
  }

  // Helper: Get display names for Django choice fields
  getStatusDisplay(status) {
    const statusDisplayMap = {
      'draft': 'Draft',
      'published': 'Published',
      'cancelled': 'Cancelled',
      'postponed': 'Postponed',
      'completed': 'Completed'
    };
    return statusDisplayMap[status] || status;
  }

  getEventTypeDisplay(eventType) {
    const typeDisplayMap = {
      'service': 'Church Service',
      'meeting': 'Meeting',
      'social': 'Social Event',
      'youth': 'Youth Event',
      'workshop': 'Workshop',
      'outreach': 'Outreach',
      'conference': 'Conference',
      'retreat': 'Retreat',
      'fundraiser': 'Fundraiser',
      'kids': 'Kids Event',
      'seniors': 'Seniors Event',
      'prayer': 'Prayer Meeting',
      'bible_study': 'Bible Study',
      'baptism': 'Baptism',
      'wedding': 'Wedding',
      'funeral': 'Memorial Service',
      'other': 'Other'
    };
    return typeDisplayMap[eventType] || eventType;
  }

  // Enhanced data validation for Django backend
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
  
  // Enhanced error handling with Django-specific error parsing
  enhanceError(error, defaultMessage = 'An error occurred') {
    const enhancedError = new Error();
    
    if (error.response) {
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      
      switch (error.response.status) {
        case 400:
          // Handle Django validation errors
          if (error.response.data?.detail) {
            enhancedError.message = error.response.data.detail;
          } else if (error.response.data?.error) {
            enhancedError.message = error.response.data.error;
          } else if (typeof error.response.data === 'object') {
            // Handle Django field validation errors
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
          enhancedError.message = 'The requested event was not found.';
          break;
          
        case 500:
          enhancedError.message = 'Server error. Please try again later.';
          break;
          
        default:
          enhancedError.message = error.response.data?.detail || 
                                   error.response.data?.error || 
                                   `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      enhancedError.message = 'Network error. Please check your connection and ensure the backend server is running.';
      enhancedError.isNetworkError = true;
    } else {
      enhancedError.message = error.message || defaultMessage;
    }
    
    enhancedError.originalError = error;
    return enhancedError;
  }

  // Format event for calendar display
  formatEventForCalendar(events) {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      backgroundColor: this.getEventTypeColor(event.event_type),
      borderColor: this.getEventTypeColor(event.event_type),
      textColor: '#ffffff',
      extendedProps: {
        ...event,
        status: event.status,
        event_type: event.event_type,
        location: event.location,
        organizer: event.organizer,
        registration_count: event.registration_count,
        max_capacity: event.max_capacity
      }
    }));
  }

  // Get color for event type
  getEventTypeColor(eventType) {
    const colors = {
      service: '#3b82f6',
      meeting: '#ef4444',
      social: '#10b981',
      youth: '#f59e0b',
      workshop: '#8b5cf6',
      outreach: '#06b6d4',
      conference: '#3b82f6',
      retreat: '#10b981',
      fundraiser: '#f59e0b',
      kids: '#f97316',
      seniors: '#6b7280',
      prayer: '#6366f1',
      bible_study: '#0ea5e9',
      baptism: '#059669',
      wedding: '#ec4899',
      funeral: '#6b7280',
      other: '#6b7280'
    };
    return colors[eventType] || colors.other;
  }
}

// Create singleton instance
const eventsService = new EventsService();

export { eventsService };
export default eventsService;