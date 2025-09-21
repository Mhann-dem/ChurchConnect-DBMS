// frontend/src/services/events.js - Enhanced with real-time synchronization
import api from './api';

// Event listeners for real-time updates
const eventListeners = new Map();
const eventCache = new Map();

class EventsService {
  constructor() {
    this.baseEndpoint = '/events/';
    this.cache = new Map();
    this.pendingRequests = new Map();
    
    // Initialize WebSocket connection for real-time updates
    this.initializeRealTimeUpdates();
  }

  // Initialize WebSocket for real-time event updates
  initializeRealTimeUpdates() {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.REACT_APP_WS_HOST || window.location.host;
      this.websocket = new WebSocket(`${wsProtocol}//${wsHost}/ws/events/`);
      
      this.websocket.onopen = () => {
        console.log('[EventsService] WebSocket connected for real-time updates');
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (err) {
          console.warn('[EventsService] Invalid WebSocket message:', err);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('[EventsService] WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeRealTimeUpdates(), 5000);
      };
      
      this.websocket.onerror = (error) => {
        console.error('[EventsService] WebSocket error:', error);
      };
    } catch (err) {
      console.warn('[EventsService] WebSocket not available:', err);
    }
  }

  // Handle real-time updates from WebSocket
  handleRealtimeUpdate(data) {
    const { type, event_id, event_data } = data;
    
    console.log('[EventsService] Real-time update:', type, event_id);
    
    switch (type) {
      case 'event_created':
        this.cache.delete('events_list'); // Invalidate cache
        this.notifyListeners('event_created', event_data);
        break;
        
      case 'event_updated':
        this.cache.delete(`event_${event_id}`);
        this.cache.delete('events_list');
        this.notifyListeners('event_updated', event_data);
        break;
        
      case 'event_deleted':
        this.cache.delete(`event_${event_id}`);
        this.cache.delete('events_list');
        this.notifyListeners('event_deleted', { id: event_id });
        break;
        
      case 'registration_updated':
        this.cache.delete(`event_${event_id}`);
        this.notifyListeners('registration_updated', event_data);
        break;
    }
  }

  // Subscribe to real-time updates
  subscribe(eventType, callback) {
    if (!eventListeners.has(eventType)) {
      eventListeners.set(eventType, new Set());
    }
    eventListeners.get(eventType).add(callback);
    
    return () => {
      eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Notify all listeners of an event
  notifyListeners(eventType, data) {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('[EventsService] Listener error:', err);
        }
      });
    }
  }

  // Enhanced cache management
  getCacheKey(endpoint, params = {}) {
    const paramString = new URLSearchParams(params).toString();
    return `${endpoint}_${paramString}`;
  }

  setCache(key, data, ttl = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Request deduplication
  async makeRequest(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Enhanced getEvents with caching and real-time updates
  async getEvents(params = {}) {
    try {
      const cacheKey = this.getCacheKey('events', params);
      
      // Check cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('[EventsService] Returning cached events');
        return cached;
      }
      
      console.log('[EventsService] Fetching events from server:', params);
      
      const response = await this.makeRequest(cacheKey, async () => {
        return await api.get(`${this.baseEndpoint}events/`, { params });
      });
      
      console.log('[EventsService] Events response:', response);
      
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
        }
      }
      
      // Cache the response
      this.setCache(cacheKey, eventsData, 180000); // 3 minutes for list data
      
      return eventsData;
      
    } catch (error) {
      console.error('[EventsService] Error getting events:', error);
      
      // Enhanced error handling with retry logic
      if (error.response?.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getEvents(params);
      }
      
      throw this.enhanceError(error, 'Failed to fetch events');
    }
  }

  // Get single event with caching
  async getEvent(id) {
    try {
      const cacheKey = `event_${id}`;
      
      // Check cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('[EventsService] Returning cached event:', id);
        return { data: cached, success: true };
      }
      
      console.log('[EventsService] Fetching event from server:', id);
      
      const response = await this.makeRequest(cacheKey, async () => {
        return await api.get(`${this.baseEndpoint}events/${id}/`);
      });
      
      // Cache the event
      this.setCache(cacheKey, response.data, 300000); // 5 minutes for individual events
      
      return { data: response.data, success: true };
      
    } catch (error) {
      console.error('[EventsService] Error getting event:', error);
      throw this.enhanceError(error, 'Failed to fetch event details');
    }
  }

  // Create event with optimistic updates and real-time sync
  async createEvent(data) {
    try {
      console.log('[EventsService] Creating event:', data);
      
      // Validate data before sending
      const validationResult = this.validateEventData(data);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${Object.values(validationResult.errors).join(', ')}`);
      }
      
      // Optimistic update - notify listeners immediately
      const tempEvent = {
        ...data,
        id: `temp_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        registration_count: 0,
        _isOptimistic: true
      };
      
      this.notifyListeners('event_created_optimistic', tempEvent);
      
      const response = await api.post(`${this.baseEndpoint}events/`, data);
      console.log('[EventsService] Event created:', response.data);
      
      // Clear relevant caches
      this.clearCache('events');
      
      // Notify successful creation
      this.notifyListeners('event_created_confirmed', {
        tempId: tempEvent.id,
        event: response.data
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error creating event:', error);
      
      // Notify creation failure
      this.notifyListeners('event_created_failed', { error });
      
      throw this.enhanceError(error, 'Failed to create event');
    }
  }

  // Update event with optimistic updates
  async updateEvent(id, data) {
    try {
      console.log('[EventsService] Updating event:', id, data);
      
      // Validate data
      const validationResult = this.validateEventData(data);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${Object.values(validationResult.errors).join(', ')}`);
      }
      
      // Get current event for optimistic update
      const currentEventResponse = await this.getEvent(id);
      const optimisticEvent = {
        ...currentEventResponse.data,
        ...data,
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      };
      
      this.notifyListeners('event_updated_optimistic', optimisticEvent);
      
      const response = await api.put(`${this.baseEndpoint}events/${id}/`, data);
      console.log('[EventsService] Event updated:', response.data);
      
      // Clear caches
      this.cache.delete(`event_${id}`);
      this.clearCache('events');
      
      // Notify successful update
      this.notifyListeners('event_updated_confirmed', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Error updating event:', error);
      
      // Notify update failure
      this.notifyListeners('event_updated_failed', { id, error });
      
      throw this.enhanceError(error, 'Failed to update event');
    }
  }

  // Delete event with confirmation
  async deleteEvent(id) {
    try {
      console.log('[EventsService] Deleting event:', id);
      
      // Optimistic delete
      this.notifyListeners('event_deleted_optimistic', { id });
      
      const response = await api.delete(`${this.baseEndpoint}events/${id}/`);
      console.log('[EventsService] Event deleted:', response);
      
      // Clear caches
      this.cache.delete(`event_${id}`);
      this.clearCache('events');
      
      // Notify successful deletion
      this.notifyListeners('event_deleted_confirmed', { id });
      
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('[EventsService] Error deleting event:', error);
      
      // Notify deletion failure - allow UI to restore
      this.notifyListeners('event_deleted_failed', { id, error });
      
      throw this.enhanceError(error, 'Failed to delete event');
    }
  }

  // Enhanced event registration with real-time updates
  async registerForEvent(eventId, registrationData) {
    try {
      console.log('[EventsService] Registering for event:', eventId, registrationData);
      
      const response = await api.post(`${this.baseEndpoint}events/${eventId}/register/`, registrationData);
      console.log('[EventsService] Registration successful:', response.data);
      
      // Clear event cache to get updated registration count
      this.cache.delete(`event_${eventId}`);
      this.clearCache('events');
      
      // Notify registration success
      this.notifyListeners('registration_created', {
        eventId,
        registration: response.data
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Registration error:', error);
      throw this.enhanceError(error, 'Failed to register for event');
    }
  }

  // Get calendar events with enhanced caching
  async getCalendarEvents(params = {}) {
    try {
      const cacheKey = this.getCacheKey('calendar', params);
      
      // Check cache
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      console.log('[EventsService] Fetching calendar events:', params);
      
      const response = await api.get(`${this.baseEndpoint}events/calendar/`, { params });
      
      const calendarData = {
        results: response.data.results || response.data || [],
        count: response.data.count || (response.data?.length || 0)
      };
      
      // Cache calendar data for shorter time (1 minute)
      this.setCache(cacheKey, calendarData, 60000);
      
      return calendarData;
      
    } catch (error) {
      console.error('[EventsService] Error getting calendar events:', error);
      throw this.enhanceError(error, 'Failed to fetch calendar events');
    }
  }

  // Get upcoming events with caching
  async getUpcomingEvents(days = 30, limit = 50) {
    try {
      const cacheKey = `upcoming_${days}_${limit}`;
      
      // Check cache
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const response = await api.get(`${this.baseEndpoint}events/upcoming/`, { 
        params: { days, limit } 
      });
      
      const upcomingData = {
        results: response.data.results || response.data || [],
        count: response.data.count || (response.data?.length || 0),
        days_ahead: days
      };
      
      // Cache for 5 minutes
      this.setCache(cacheKey, upcomingData, 300000);
      
      return upcomingData;
      
    } catch (error) {
      console.error('[EventsService] Error getting upcoming events:', error);
      throw this.enhanceError(error, 'Failed to fetch upcoming events');
    }
  }

  // Enhanced statistics with caching
  async getEventStatistics() {
    try {
      const cacheKey = 'event_statistics';
      
      // Check cache
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const response = await api.get(`${this.baseEndpoint}events/statistics/`);
      const stats = response.data;
      
      // Cache statistics for 10 minutes
      this.setCache(cacheKey, stats, 600000);
      
      return stats;
      
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

  // Bulk operations with progress tracking
  async bulkAction(actionData) {
    try {
      console.log('[EventsService] Performing bulk action:', actionData);
      
      const { event_ids, action } = actionData;
      
      // Notify start of bulk operation
      this.notifyListeners('bulk_action_started', { action, count: event_ids.length });
      
      const response = await api.post(`${this.baseEndpoint}events/bulk_action/`, actionData);
      
      // Clear all relevant caches
      this.clearCache('events');
      this.clearCache('calendar');
      this.clearCache('upcoming');
      this.clearCache('statistics');
      
      // Clear individual event caches
      event_ids.forEach(id => {
        this.cache.delete(`event_${id}`);
      });
      
      // Notify completion
      this.notifyListeners('bulk_action_completed', {
        action,
        result: response.data,
        affected_ids: event_ids
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Bulk action error:', error);
      
      // Notify failure
      this.notifyListeners('bulk_action_failed', {
        action: actionData.action,
        error
      });
      
      throw this.enhanceError(error, 'Bulk action failed');
    }
  }

  // Enhanced export with progress
  async exportEvents(params = {}) {
    try {
      console.log('[EventsService] Exporting events:', params);
      
      const response = await api.get(`${this.baseEndpoint}events/export/`, { 
        params, 
        responseType: 'blob' 
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[EventsService] Export error:', error);
      throw this.enhanceError(error, 'Failed to export events');
    }
  }

  // Bulk import with progress tracking
  async bulkImportEvents(events, onProgress = null) {
    try {
      console.log('[EventsService] Starting bulk import:', events.length, 'events');
      
      const results = {
        total: events.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      // Process in batches to avoid overwhelming server
      const batchSize = 5;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (eventData, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          try {
            // Validate before sending
            const validation = this.validateEventData(eventData);
            if (!validation.isValid) {
              throw new Error(`Validation: ${Object.values(validation.errors).join(', ')}`);
            }
            
            await this.createEvent(eventData);
            results.successful++;
            return { success: true, index: globalIndex };
            
          } catch (err) {
            results.failed++;
            results.errors.push({
              row: globalIndex + 2, // +2 for CSV header and 0-based index
              error: err.message || 'Unknown error'
            });
            return { success: false, index: globalIndex, error: err };
          }
        });
        
        await Promise.allSettled(batchPromises);
        
        // Report progress
        if (onProgress) {
          const progress = ((i + batchSize) / events.length) * 100;
          onProgress(Math.min(progress, 100), `Processed ${Math.min(i + batchSize, events.length)} of ${events.length} events`);
        }
        
        // Small delay between batches
        if (i + batchSize < events.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Clear caches after import
      this.clearCache();
      
      console.log('[EventsService] Bulk import completed:', results);
      return results;
      
    } catch (error) {
      console.error('[EventsService] Bulk import error:', error);
      throw this.enhanceError(error, 'Bulk import failed');
    }
  }

  // Enhanced data validation
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
      
      if (error.response.data?.detail) {
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
      enhancedError.message = 'Network error. Please check your connection.';
      enhancedError.isNetworkError = true;
    } else {
      // Other error
      enhancedError.message = error.message || defaultMessage;
    }
    
    enhancedError.originalError = error;
    return enhancedError;
  }
  
  // Utility methods for formatting
  formatEventForCalendar(events) {
    if (!Array.isArray(events)) return [];
    
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      backgroundColor: this.getEventTypeColor(event.event_type),
      borderColor: this.getEventTypeColor(event.event_type),
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
  }

  getEventStatusColor(status) {
    const colors = {
      draft: '#6b7280',
      published: '#3b82f6',
      cancelled: '#ef4444',
      completed: '#10b981',
      postponed: '#f59e0b'
    };
    return colors[status] || colors.draft;
  }

  getEventTypeColor(eventType) {
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
  }

  // Cleanup method for component unmounting
  cleanup() {
    if (this.websocket) {
      this.websocket.close();
    }
    this.cache.clear();
    this.pendingRequests.clear();
    eventListeners.clear();
  }
}

// Create singleton instance
const eventsService = new EventsService();

// Export both the service and individual methods for backward compatibility
export { eventsService };
export default eventsService;