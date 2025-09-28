import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Filter, Calendar, Users, MapPin, 
  Clock, DollarSign, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, Star
} from 'lucide-react';

// Mock events service - replace with your actual service
const mockEventsService = {
  getEvents: async (params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data - replace with actual API call
    return {
      results: [
        {
          id: 1,
          title: 'Sunday Morning Service',
          event_type: 'service',
          event_type_display: 'Church Service',
          status: 'published',
          status_display: 'Published',
          start_datetime: '2024-12-29T09:00:00',
          end_datetime: '2024-12-29T11:00:00',
          location: 'Main Sanctuary',
          organizer: 'Pastor John',
          registration_count: 45,
          max_capacity: 100,
          requires_registration: false,
          registration_fee: 0,
          is_featured: true,
          is_public: true
        },
        {
          id: 2,
          title: 'Youth Bible Study',
          event_type: 'youth',
          event_type_display: 'Youth Event',
          status: 'published',
          status_display: 'Published',
          start_datetime: '2024-12-30T18:00:00',
          end_datetime: '2024-12-30T20:00:00',
          location: 'Youth Room',
          organizer: 'Pastor Mike',
          registration_count: 12,
          max_capacity: 25,
          requires_registration: true,
          registration_fee: 0,
          is_featured: false,
          is_public: true
        }
      ],
      count: 2
    };
  },
  
  deleteEvent: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};

const EventsList = ({ onCreateEvent, onEditEvent }) => {
  // FIXED: Use refs to persist state across re-renders
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    upcoming: '',
    featured: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Use refs to prevent unnecessary re-fetches
  const fetchedRef = useRef(false);
  const lastFetchParams = useRef(null);

  // FIXED: Stable fetch function that caches results
  const fetchEvents = useCallback(async (forceRefresh = false) => {
    const currentParams = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
      ...filters
    };

    // Remove empty filters
    Object.keys(currentParams).forEach(key => {
      if (currentParams[key] === '' || currentParams[key] === null || currentParams[key] === undefined) {
        delete currentParams[key];
      }
    });

    // Check if we need to fetch (avoid duplicate requests)
    const paramsChanged = JSON.stringify(currentParams) !== JSON.stringify(lastFetchParams.current);
    
    if (!forceRefresh && !paramsChanged && fetchedRef.current) {
      console.log('[EventsList] Skipping fetch - no changes detected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[EventsList] Fetching events with params:', currentParams);
      
      const response = await mockEventsService.getEvents(currentParams);
      
      setEvents(response.results || []);
      setPagination(prev => ({
        ...prev,
        total: response.count || 0,
        totalPages: Math.ceil((response.count || 0) / prev.limit)
      }));

      lastFetchParams.current = currentParams;
      fetchedRef.current = true;
      
      console.log('[EventsList] Events loaded:', response.results?.length || 0);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchEvents();
    }
  }, [fetchEvents]);

  // FIXED: Debounced search to prevent excessive API calls
  const searchTimeoutRef = useRef(null);
  
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchedRef.current = false; // Force refetch
    }, 500);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchedRef.current = false; // Force refetch
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
    fetchedRef.current = false; // Force refetch
  }, []);

  const handleCreateEvent = () => {
    if (onCreateEvent) {
      onCreateEvent();
    }
  };

  const handleEditEvent = (event) => {
    if (onEditEvent) {
      onEditEvent(event);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setDeleteConfirm(eventId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await mockEventsService.deleteEvent(deleteConfirm);
      
      // Remove from local state instead of refetching
      setEvents(prev => prev.filter(e => e.id !== deleteConfirm));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
      }));
      
      console.log('Event deleted successfully');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    }
  };

  const handleEventSelect = (eventId, checked) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, eventId]);
    } else {
      setSelectedEvents(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(events.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (event) => {
    if (event.status === 'published') {
      const now = new Date();
      const endDate = new Date(event.end_datetime);
      
      if (endDate < now) {
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      }
      return <CheckCircle size={16} style={{ color: '#3b82f6' }} />;
    }
    if (event.status === 'cancelled') {
      return <XCircle size={16} style={{ color: '#ef4444' }} />;
    }
    return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      service: { backgroundColor: '#dbeafe', color: '#1e40af' },
      meeting: { backgroundColor: '#fecaca', color: '#dc2626' },
      social: { backgroundColor: '#d1fae5', color: '#059669' },
      youth: { backgroundColor: '#fed7aa', color: '#ea580c' },
      workshop: { backgroundColor: '#e9d5ff', color: '#7c3aed' },
      outreach: { backgroundColor: '#a7f3d0', color: '#047857' },
      other: { backgroundColor: '#f3f4f6', color: '#374151' }
    };
    return colors[eventType] || colors.other;
  };

  // Styles
  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '100%',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0
    },
    subtitle: {
      color: '#6b7280',
      margin: '0.5rem 0 0 0'
    },
    createButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    filtersContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    searchContainer: {
      position: 'relative',
      flex: 1,
      minWidth: '300px'
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.9rem',
      boxSizing: 'border-box'
    },
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: '#6b7280'
    },
    filterSelect: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.9rem',
      backgroundColor: 'white',
      minWidth: '140px',
      cursor: 'pointer'
    },
    eventsGrid: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      backgroundColor: 'white'
    },
    gridHeader: {
      display: 'grid',
      gridTemplateColumns: '50px 2fr 200px 200px 120px 120px 100px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#6b7280'
    },
    gridHeaderCell: {
      padding: '1rem 0.75rem',
      display: 'flex',
      alignItems: 'center'
    },
    gridRow: {
      display: 'grid',
      gridTemplateColumns: '50px 2fr 200px 200px 120px 120px 100px',
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s',
      cursor: 'pointer'
    },
    gridCell: {
      padding: '1rem 0.75rem',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.9rem'
    },
    eventInfo: {
      minWidth: 0
    },
    eventTitle: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.3
    },
    eventMeta: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      fontSize: '0.8rem'
    },
    eventType: {
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    actions: {
      display: 'flex',
      gap: '0.5rem'
    },
    actionButton: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    emptyState: {
      padding: '4rem 2rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '4rem',
      flexDirection: 'column',
      gap: '1rem'
    },
    error: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      color: '#ef4444'
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #f3f4f6', 
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
        <button 
          onClick={() => {
            fetchedRef.current = false;
            fetchEvents(true);
          }}
          style={styles.createButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Events</h1>
          <p style={styles.subtitle}>
            Manage church events and activities
          </p>
        </div>
        <button 
          onClick={handleCreateEvent}
          style={styles.createButton}
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {/* Filters and Search */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchContainer}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.event_type}
          onChange={(e) => handleFilterChange('event_type', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="service">Church Service</option>
          <option value="meeting">Meeting</option>
          <option value="social">Social Event</option>
          <option value="youth">Youth Event</option>
          <option value="workshop">Workshop</option>
          <option value="outreach">Outreach</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Events Grid */}
      <div style={styles.eventsGrid}>
        {/* Header Row */}
        <div style={styles.gridHeader}>
          <div style={styles.gridHeaderCell}>Registrations</div>
          <div style={styles.gridHeaderCell}>Actions</div>
        </div>

        {/* Event Rows */}
        {events.map((event) => (
          <div 
            key={event.id} 
            style={{
              ...styles.gridRow,
              ':hover': { backgroundColor: '#f9fafb' }
            }}
          >
            <div style={styles.gridCell}>
              <input
                type="checkbox"
                checked={selectedEvents.includes(event.id)}
                onChange={(e) => handleEventSelect(event.id, e.target.checked)}
              />
            </div>

            <div style={styles.gridCell}>
              <div style={styles.eventInfo}>
                <div style={styles.eventTitle}>
                  {event.is_featured && (
                    <Star size={16} style={{ color: '#f59e0b', marginRight: '4px' }} />
                  )}
                  {event.title}
                </div>
                <div style={styles.eventMeta}>
                  <span 
                    style={{
                      ...styles.eventType,
                      ...getEventTypeColor(event.event_type)
                    }}
                  >
                    {event.event_type_display}
                  </span>
                  {event.organizer && (
                    <span style={{ color: '#6b7280' }}>
                      by {event.organizer}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                  <Calendar size={16} />
                  {formatDate(event.start_datetime)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                  <Clock size={16} />
                  {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                </div>
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <MapPin size={16} />
                {event.location || 'No location'}
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(event)}
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  {event.status_display}
                </span>
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                  <Users size={16} />
                  {event.registration_count}
                  {event.max_capacity && ` / ${event.max_capacity}`}
                </div>
                {event.requires_registration && event.registration_fee > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem', 
                    fontSize: '0.75rem', 
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    <DollarSign size={12} />
                    {event.registration_fee}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={styles.actions}>
                <button
                  onClick={() => window.open(`/events/${event.id}`, '_blank')}
                  style={styles.actionButton}
                  title="View Event"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEditEvent(event)}
                  style={styles.actionButton}
                  title="Edit Event"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  style={{
                    ...styles.actionButton,
                    ':hover': { 
                      backgroundColor: '#fef2f2',
                      borderColor: '#ef4444',
                      color: '#ef4444'
                    }
                  }}
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div style={styles.emptyState}>
            <Calendar size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '0.5rem' 
            }}>
              No events found
            </h3>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '2rem', 
              maxWidth: '400px' 
            }}>
              {searchTerm || Object.values(filters).some(f => f) ? 
                'Try adjusting your search or filters.' :
                'Create your first event to get started.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <button 
                onClick={handleCreateEvent}
                style={styles.createButton}
              >
                <Plus size={16} />
                Create Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Delete Event
            </h3>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '2rem' 
            }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EventsList;