// frontend/src/pages/admin/EventsPage.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  List, 
  Plus, 
  Filter, 
  RefreshCw, 
  Download, 
  TrendingUp,
  Users,
  AlertCircle,
  Eye,
  BarChart3,
  Clock,
  MapPin,
  Star,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { eventsService } from '../../services/events';
import { useToast } from '../../hooks/useToast';
import EventForm from '../../components/admin/Events/EventForm';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Enhanced Modal component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth: size === 'lg' ? '900px' : '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    upcoming: '',
    featured: ''
  });
  
  // Stats
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    thisMonth: 0,
    featured: 0,
    totalRegistrations: 0,
    avgAttendance: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Proper event fetching
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: searchTerm,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('[EventsPage] Fetching events with params:', params);
      
      const response = await eventsService.getEvents(params);
      console.log('[EventsPage] Events response:', response);
      
      // Handle different response structures
      let eventsData = [];
      if (response.results && Array.isArray(response.results)) {
        eventsData = response.results;
      } else if (Array.isArray(response.data)) {
        eventsData = response.data;
      } else if (Array.isArray(response)) {
        eventsData = response;
      }

      setEvents(eventsData);
      calculateStats(eventsData);
      
    } catch (err) {
      console.error('[EventsPage] Error fetching events:', err);
      const errorMessage = err.response?.status === 404 
        ? 'Events API not found. Please check backend configuration.'
        : err.message || 'Failed to fetch events';
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, showToast]);

  // Calculate event statistics
  const calculateStats = useCallback((eventsList) => {
    if (!Array.isArray(eventsList)) {
      setEventStats({
        total: 0,
        upcoming: 0,
        thisMonth: 0,
        featured: 0,
        totalRegistrations: 0,
        avgAttendance: 0
      });
      return;
    }
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const upcomingEvents = eventsList.filter(event => {
      try {
        return event.start_datetime && new Date(event.start_datetime) > now;
      } catch (e) {
        return false;
      }
    });
    
    const thisMonthEvents = eventsList.filter(event => {
      try {
        const eventDate = new Date(event.start_datetime);
        return eventDate >= thisMonth && eventDate < nextMonth;
      } catch (e) {
        return false;
      }
    });
    
    const featuredEvents = eventsList.filter(event => 
      event.is_featured === true || event.featured === true
    );
    
    const totalRegistrations = eventsList.reduce((sum, event) => {
      const count = event.registration_count || 0;
      return sum + (typeof count === 'number' ? count : 0);
    }, 0);

    setEventStats({
      total: eventsList.length,
      upcoming: upcomingEvents.length,
      thisMonth: thisMonthEvents.length,
      featured: featuredEvents.length,
      totalRegistrations,
      avgAttendance: eventsList.length > 0 ? Math.round(totalRegistrations / eventsList.length) : 0
    });
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Event handlers
  const handleCreateEvent = useCallback(() => {
    console.log('[EventsPage] Create event clicked');
    setEditingEvent(null);
    setShowEventForm(true);
  }, []);

  const handleEditEvent = useCallback((event) => {
    console.log('[EventsPage] Edit event clicked:', event);
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleDeleteEvent = useCallback((event) => {
    console.log('[EventsPage] Delete event clicked:', event);
    setDeleteEvent(event);
  }, []);

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteEvent) return;
    
    try {
      console.log('[EventsPage] Confirming delete for:', deleteEvent.id);
      await eventsService.deleteEvent(deleteEvent.id);
      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id));
      showToast('Event deleted successfully', 'success');
      setDeleteEvent(null);
      
      // Refresh stats
      const updatedEvents = events.filter(e => e.id !== deleteEvent.id);
      calculateStats(updatedEvents);
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast(err.message || 'Failed to delete event', 'error');
    }
  }, [deleteEvent, showToast, events, calculateStats]);

  const handleRefresh = useCallback(() => {
    console.log('[EventsPage] Refresh clicked');
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  }, [fetchEvents]);

  // FIXED: Form submission handler
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      console.log('[EventsPage] Form submit:', formData);
      
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
      
      // Refresh stats
      fetchEvents();
      
    } catch (error) {
      console.error('Form submit error:', error);
      showToast(error.message || 'Failed to save event', 'error');
    }
  }, [editingEvent, showToast, fetchEvents]);

  const handleFormCancel = useCallback(() => {
    console.log('[EventsPage] Form cancelled');
    setShowEventForm(false);
    setEditingEvent(null);
  }, []);

  // Utility functions
  const getEventStatusIcon = (event) => {
    if (event.status === 'published') {
      if (event.end_datetime && isPast(parseISO(event.end_datetime))) {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    if (event.status === 'cancelled') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getEventStatusText = (event) => {
    if (event.status === 'published') {
      if (event.end_datetime && isPast(parseISO(event.end_datetime))) {
        return 'Completed';
      }
      if (event.start_datetime && isToday(parseISO(event.start_datetime))) {
        return 'Today';
      }
      if (event.start_datetime && isFuture(parseISO(event.start_datetime))) {
        return 'Upcoming';
      }
      return 'Active';
    }
    return event.status_display || event.status || 'Unknown';
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
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading events...</p>
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
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '32px'
          }}>
            ⚠️
          </div>
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
          marginBottom: '16px'
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
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Upcoming Events</h3>
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
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Featured Events</h3>
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
              Events ({events.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event, index) => (
                <div key={event.id || index} style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        {event.is_featured && <Star size={16} style={{ color: '#f59e0b', marginRight: '8px' }} />}
                        {event.title || 'Untitled Event'}
                      </h4>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                        {event.start_datetime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} />
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                              {format(parseISO(event.start_datetime), 'MMM dd, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} />
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                          {event.description.length > 150 ? 
                            `${event.description.substring(0, 150)}...` : 
                            event.description
                          }
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {getEventStatusIcon(event)}
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>
                          {getEventStatusText(event)}
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
                        {(event.registration_count) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} />
                            <span style={{ fontSize: '12px' }}>
                              {event.registration_count} registered
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                          gap: '4px'
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
                          gap: '4px'
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

      {/* Event Form Modal */}
      {showEventForm && (
        <Modal
          isOpen={showEventForm}
          onClose={handleFormCancel}
          title={editingEvent ? 'Edit Event' : 'Create New Event'}
          size="lg"
        >
          <EventForm
            event={editingEvent}
            onSave={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </Modal>
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
    </div>
  );
};

export default EventsPage;