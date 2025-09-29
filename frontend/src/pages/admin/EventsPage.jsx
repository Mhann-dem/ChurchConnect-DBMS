// frontend/src/pages/admin/EventsPage.jsx - UPDATED: Proper EventForm integration
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Plus, RefreshCw, TrendingUp, Users, Star,
  Edit, Trash2, CheckCircle, XCircle, AlertCircle, MapPin, Clock
} from 'lucide-react';
import { eventsService } from '../../services/events';
import { useToast } from '../../hooks/useToast';
import EventForm from '../../components/admin/Events/EventForm';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { showToast } = useToast();
  
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    thisMonth: 0,
    featured: 0
  });

  // Fetch events from Django backend
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[AdminEventsPage] Fetching events from Django');
      
      const response = await eventsService.getEvents({
        ordering: '-created_at'
      });
      
      console.log('[AdminEventsPage] Events response:', response);
      
      const eventsData = response.results || response.data || [];
      setEvents(eventsData);
      
      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      setEventStats({
        total: eventsData.length,
        upcoming: eventsData.filter(e => new Date(e.start_datetime) > now).length,
        thisMonth: eventsData.filter(e => {
          const eventDate = new Date(e.start_datetime);
          return eventDate >= thisMonth && eventDate < nextMonth;
        }).length,
        featured: eventsData.filter(e => e.is_featured).length
      });
      
    } catch (err) {
      console.error('[AdminEventsPage] Error fetching events:', err);
      setError('Failed to load events. Please check your backend connection.');
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = useCallback(() => {
    console.log('[AdminEventsPage] Create event clicked');
    setEditingEvent(null);
    setShowEventForm(true);
  }, []);

  const handleEditEvent = useCallback((event) => {
    console.log('[AdminEventsPage] Edit event clicked:', event);
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleDeleteEvent = useCallback((event) => {
    console.log('[AdminEventsPage] Delete event clicked:', event);
    setDeleteEvent(event);
  }, []);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteEvent) return;
    
    try {
      console.log('[AdminEventsPage] Confirming delete for:', deleteEvent.id);
      await eventsService.deleteEvent(deleteEvent.id);
      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id));
      showToast('Event deleted successfully', 'success');
      setDeleteEvent(null);
      
      // Update stats
      const updatedEvents = events.filter(e => e.id !== deleteEvent.id);
      const now = new Date();
      setEventStats({
        total: updatedEvents.length,
        upcoming: updatedEvents.filter(e => new Date(e.start_datetime) > now).length,
        thisMonth: eventStats.thisMonth - 1,
        featured: updatedEvents.filter(e => e.is_featured).length
      });
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast(err.message || 'Failed to delete event', 'error');
    }
  }, [deleteEvent, showToast, events, eventStats.thisMonth]);

  const handleRefresh = useCallback(() => {
    console.log('[AdminEventsPage] Refresh clicked');
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  }, [fetchEvents]);

  // FIXED: Form submission handler
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      console.log('[AdminEventsPage] Form submit:', formData);
      
      let savedEvent;
      if (editingEvent) {
        savedEvent = await eventsService.updateEvent(editingEvent.id, formData);
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? savedEvent : e));
        showToast('Event updated successfully', 'success');
      } else {
        savedEvent = await eventsService.createEvent(formData);
        setEvents(prev => [savedEvent, ...prev]);
        showToast('Event created successfully', 'success');
      }
      
      setShowEventForm(false);
      setEditingEvent(null);
      
      // Refresh to get updated stats
      fetchEvents();
      
    } catch (error) {
      console.error('Form submit error:', error);
      showToast(error.message || 'Failed to save event', 'error');
      throw error; // Re-throw so form can handle it
    }
  }, [editingEvent, showToast, fetchEvents]);

  const handleFormCancel = useCallback(() => {
    console.log('[AdminEventsPage] Form cancelled');
    setShowEventForm(false);
    setEditingEvent(null);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return 'Invalid time';
    }
  };

  const getEventStatusIcon = (event) => {
    if (event.status === 'published') {
      if (event.end_datetime && new Date(event.end_datetime) < new Date()) {
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      }
      return <CheckCircle size={16} style={{ color: '#3b82f6' }} />;
    }
    if (event.status === 'cancelled') {
      return <XCircle size={16} style={{ color: '#ef4444' }} />;
    }
    return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
  };

  // Loading state
  if (loading && events.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px'
      }}>
        <LoadingSpinner size="lg" />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading events from server...</p>
      </div>
    );
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <div style={{
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginBottom: '16px' }}>
            Events Loading Error
          </h2>
          <p style={{ color: '#dc2626', marginBottom: '24px', fontSize: '16px', maxWidth: '500px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleRefresh}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button 
              onClick={handleCreateEvent}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              Create First Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              Events & Activities
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '16px' 
            }}>
              Manage church events, services, and community activities
              {events.length > 0 && ` (${events.length} events)`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                opacity: refreshing || loading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} style={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none' 
              }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={handleCreateEvent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Total Events</h3>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{eventStats.total}</span>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Upcoming</h3>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{eventStats.upcoming}</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Featured</h3>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{eventStats.featured}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        minHeight: '400px'
      }}>
        {events.length > 0 ? (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              All Events ({events.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event) => (
                <div key={event.id} style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {event.is_featured && <Star size={16} style={{ color: '#f59e0b' }} />}
                        {event.title || 'Untitled Event'}
                      </h4>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {event.start_datetime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
                            <Calendar size={14} />
                            <span>{formatDate(event.start_datetime)} at {formatTime(event.start_datetime)}</span>
                          </div>
                        )}
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
                          {event.description.length > 150 ? 
                            `${event.description.substring(0, 150)}...` : 
                            event.description
                          }
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {getEventStatusIcon(event)}
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>
                          {event.status_display || event.status}
                        </span>
                        {event.event_type && (
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f3f4f6',
                            color: '#374151'
                          }}>
                            {event.event_type_display || event.event_type}
                          </span>
                        )}
                        {event.registration_count > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                            <Users size={12} />
                            <span>{event.registration_count} registered</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleEditEvent(event)}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#f3f4f6';
                        }}
                        title="Edit Event"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        style={{
                          padding: '6px 12px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#fef2f2';
                        }}
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <Calendar size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              No events found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              Create your first event to get started.
            </p>
            <button 
              onClick={handleCreateEvent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        )}
      </div>

      {/* Event Form Modal - FIXED INTEGRATION */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          onSave={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
              Delete Event
            </h3>
            <div style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              <p>Are you sure you want to delete "<strong>{deleteEvent.title}</strong>"?</p>
              {(deleteEvent.registration_count || 0) > 0 && (
                <p style={{ color: '#dc2626', marginTop: '8px' }}>
                  This event has {deleteEvent.registration_count} registration(s). 
                  All registration data will be permanently deleted.
                </p>
              )}
              <p style={{ marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={() => setDeleteEvent(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={confirmDeleteEvent}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminEventsPage;