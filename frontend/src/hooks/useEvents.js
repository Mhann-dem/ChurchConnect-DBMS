// frontend/src/hooks/useEvents.js
import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '../services/events';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.getEvents(filters);
      setEvents(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData) => {
    try {
      const newEvent = await eventsService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (eventId, eventData) => {
    try {
      const updatedEvent = await eventsService.updateEvent(eventId, eventData);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      await eventsService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const registerForEvent = useCallback(async (eventId, registrationData) => {
    try {
      const registration = await eventsService.registerForEvent(eventId, registrationData);
      return registration;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent
  };
};