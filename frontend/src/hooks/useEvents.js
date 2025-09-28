// frontend/src/hooks/useEvents.js
import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '../services/events';

export const useEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...initialFilters,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await eventsService.getEvents(params);
      
      setEvents(response.results || response);
      
      // Update pagination if response includes count
      if (response.count !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: response.count,
          totalPages: Math.ceil(response.count / prev.limit)
        }));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, initialFilters]);

  const createEvent = useCallback(async (eventData) => {
    try {
      const validation = eventsService.validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error('Validation failed');
      }

      const newEvent = await eventsService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));
      
      return newEvent;
    } catch (err) {
      setError(err.message || 'Failed to create event');
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (eventId, eventData) => {
    try {
      const validation = eventsService.validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error('Validation failed');
      }

      const updatedEvent = await eventsService.updateEvent(eventId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      setError(err.message || 'Failed to update event');
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await eventsService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
      }));
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete event');
      throw err;
    }
  }, []);

  const registerForEvent = useCallback(async (eventId, registrationData) => {
    try {
      const registration = await eventsService.registerForEvent(eventId, registrationData);
      
      // Update the event's registration count in the local state
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            registration_count: (event.registration_count || 0) + 1
          };
        }
        return event;
      }));
      
      return registration;
    } catch (err) {
      setError(err.message || 'Failed to register for event');
      throw err;
    }
  }, []);

  const duplicateEvent = useCallback(async (eventId, newDateData) => {
    try {
      const duplicatedEvent = await eventsService.duplicateEvent(eventId, newDateData);
      setEvents(prev => [duplicatedEvent, ...prev]);
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1,
        totalPages: Math.ceil((prev.total + 1) / prev.limit)
      }));
      
      return duplicatedEvent;
    } catch (err) {
      setError(err.message || 'Failed to duplicate event');
      throw err;
    }
  }, []);

  const performBulkAction = useCallback(async (eventIds, action, data = {}) => {
    try {
      const actionData = {
        event_ids: eventIds,
        action: action,
        data: data
      };

      const response = await eventsService.bulkAction(actionData);
      
      // Refresh events after bulk action (except for export)
      if (action !== 'export') {
        await fetchEvents();
      }
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to perform bulk action');
      throw err;
    }
  }, [fetchEvents]);

  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination(prev => ({ 
      ...prev, 
      limit, 
      page: 1, 
      totalPages: Math.ceil(prev.total / limit) 
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshEvents = useCallback(() => {
    return fetchEvents();
  }, [fetchEvents]);

  // Auto-fetch on pagination changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    // State
    events,
    loading,
    error,
    pagination,
    
    // Actions
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    duplicateEvent,
    performBulkAction,
    refreshEvents,
    
    // Pagination
    setPage,
    setLimit,
    
    // Utilities
    clearError
  };
};

// Specialized hook for calendar events
export const useCalendarEvents = (dateRange = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCalendarEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const calendarParams = {
        ...dateRange,
        ...params
      };

      const response = await eventsService.getCalendarEvents(calendarParams);
      const formattedEvents = eventsService.formatEventForCalendar(response.results || []);
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err.message || 'Failed to fetch calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  return {
    events,
    loading,
    error,
    fetchCalendarEvents,
    refreshEvents: fetchCalendarEvents
  };
};

// Hook for event registrations
export const useEventRegistrations = (eventId) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsService.getEventRegistrations(eventId);
      setRegistrations(response.results || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err.message || 'Failed to fetch registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const confirmRegistration = useCallback(async (registrationId) => {
    try {
      await eventsService.confirmRegistration(registrationId);
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'confirmed', status_display: 'Confirmed' }
          : reg
      ));
    } catch (err) {
      setError(err.message || 'Failed to confirm registration');
      throw err;
    }
  }, []);

  const cancelRegistration = useCallback(async (registrationId) => {
    try {
      await eventsService.cancelRegistration(registrationId);
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'cancelled', status_display: 'Cancelled' }
          : reg
      ));
    } catch (err) {
      setError(err.message || 'Failed to cancel registration');
      throw err;
    }
  }, []);

  const markAttended = useCallback(async (registrationId) => {
    try {
      await eventsService.markAttended(registrationId);
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'attended', status_display: 'Attended' }
          : reg
      ));
    } catch (err) {
      setError(err.message || 'Failed to mark as attended');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    confirmRegistration,
    cancelRegistration,
    markAttended
  };
};

// Hook for event statistics
export const useEventStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await eventsService.getEventStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    refreshStatistics: fetchStatistics
  };
};