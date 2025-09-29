// frontend/src/components/admin/Events/EventsList.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Filter, Calendar, Users, MapPin, 
  Clock, DollarSign, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, Star,
  Upload, Download, RefreshCw
} from 'lucide-react';
import { useEvents } from '../../../hooks/useEvents';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EventForm from './EventForm';
import BulkImportModal from './BulkImportModal';

const EventsList = ({ onCreateEvent, onEditEvent }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    upcoming: '',
    featured: ''
  });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Use the events hook with filters
  const {
    events,
    loading,
    error,
    pagination,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    performBulkAction,
    setPage,
    clearError,
    refreshEvents
  } = useEvents({
    search: searchTerm,
    ...filters
  });

  const { showToast } = useToast();

  // Debounced search
  const searchTimeoutRef = useRef(null);
  
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset to first page when searching
    }, 500);
  }, [setPage]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, [setPage]);

  // Event handlers
  const handleCreateEvent = () => {
    if (onCreateEvent) {
      onCreateEvent();
    } else {
      setEditingEvent(null);
      setShowEventForm(true);
    }
  };

  const handleEditEvent = (event) => {
    if (onEditEvent) {
      onEditEvent(event);
    } else {
      setEditingEvent(event);
      setShowEventForm(true);
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        showToast('Event updated successfully', 'success');
      } else {
        await createEvent(eventData);
        showToast('Event created successfully', 'success');
      }
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error) {
      showToast(error.message || 'Failed to save event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setDeleteConfirm(eventId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteEvent(deleteConfirm);
      showToast('Event deleted successfully', 'success');
      setDeleteConfirm(null);
      
      // Remove from selected events if it was selected
      setSelectedEvents(prev => prev.filter(id => id !== deleteConfirm));
    } catch (error) {
      showToast(error.message || 'Failed to delete event', 'error');
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

  const handleBulkAction = async () => {
    if (!bulkAction || selectedEvents.length === 0) {
      showToast('Please select events and an action', 'warning');
      return;
    }

    try {
      const result = await performBulkAction(selectedEvents, bulkAction);
      
      if (bulkAction === 'export') {
        // Handle file download
        const url = window.URL.createObjectURL(new Blob([result]));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `events_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Events exported successfully', 'success');
      } else {
        showToast(`Bulk action completed: ${result.message || 'Success'}`, 'success');
      }
      
      setSelectedEvents([]);
      setBulkAction('');
    } catch (error) {
      showToast(error.message || 'Bulk action failed', 'error');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshEvents();
      showToast('Events refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh events', 'error');
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (event) => {
    if (!event) return null;
    
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
      conference: { backgroundColor: '#dbeafe', color: '#1e40af' },
      retreat: { backgroundColor: '#d1fae5', color: '#059669' },
      fundraiser: { backgroundColor: '#fef3c7', color: '#92400e' },
      kids: { backgroundColor: '#fed7aa', color: '#ea580c' },
      seniors: { backgroundColor: '#f1f5f9', color: '#475569' },
      prayer: { backgroundColor: '#e0e7ff', color: '#4338ca' },
      bible_study: { backgroundColor: '#f0f9ff', color: '#0369a1' },
      baptism: { backgroundColor: '#ecfdf5', color: '#059669' },
      wedding: { backgroundColor: '#fdf2f8', color: '#be185d' },
      funeral: { backgroundColor: '#f1f5f9', color: '#475569' },
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
    headerLeft: {
      flex: 1
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
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    actionButton: {
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
    secondaryButton: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db'
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
    bulkActionsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
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
    actionButtonSmall: {
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
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1rem 0'
    }
  };

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  if (loading && events.length === 0) {
    return (
      <div style={styles.loading}>
        <LoadingSpinner size="large" />
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
          onClick={handleRefresh}
          style={styles.actionButton}
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
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Events</h1>
          <p style={styles.subtitle}>
            Manage church events and activities ({pagination.total} total)
          </p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={handleRefresh}
            style={{...styles.actionButton, ...styles.secondaryButton}}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            onClick={() => setShowBulkImport(true)}
            style={{...styles.actionButton, ...styles.secondaryButton}}
          >
            <Upload size={16} />
            Import
          </button>
          <button 
            onClick={handleCreateEvent}
            style={styles.actionButton}
          >
            <Plus size={16} />
            Create Event
          </button>
        </div>
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
          <option value="postponed">Postponed</option>
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
          <option value="conference">Conference</option>
          <option value="retreat">Retreat</option>
          <option value="fundraiser">Fundraiser</option>
          <option value="kids">Kids Event</option>
          <option value="seniors">Seniors Event</option>
          <option value="prayer">Prayer Meeting</option>
          <option value="bible_study">Bible Study</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.upcoming}
          onChange={(e) => handleFilterChange('upcoming', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Events</option>
          <option value="true">Upcoming Only</option>
          <option value="false">Past Events</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && (
        <div style={styles.bulkActionsContainer}>
          <div>
            <strong>{selectedEvents.length}</strong> event{selectedEvents.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">Select Action</option>
              <option value="publish">Publish</option>
              <option value="cancel">Cancel</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              style={{
                ...styles.actionButton,
                opacity: bulkAction ? 1 : 0.5,
                cursor: bulkAction ? 'pointer' : 'not-allowed'
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div style={styles.eventsGrid}>
        {/* Header Row */}
        <div style={styles.gridHeader}>
          <div style={styles.gridHeaderCell}>
            <input
              type="checkbox"
              checked={events.length > 0 && selectedEvents.length === events.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          </div>
          <div style={styles.gridHeaderCell}>Event</div>
          <div style={styles.gridHeaderCell}>Date & Time</div>
          <div style={styles.gridHeaderCell}>Location</div>
          <div style={styles.gridHeaderCell}>Status</div>
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
                    {event.event_type_display || event.event_type}
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
                  {event.status_display || event.status}
                </span>
              </div>
            </div>

            <div style={styles.gridCell}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                  <Users size={16} />
                  {event.registration_count || 0}
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
                  style={styles.actionButtonSmall}
                  title="View Event"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEditEvent(event)}
                  style={styles.actionButtonSmall}
                  title="Edit Event"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  style={{
                    ...styles.actionButtonSmall,
                    color: '#ef4444'
                  }}
                  title="Delete Event"
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef2f2';
                    e.target.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }}
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
                style={styles.actionButton}
              >
                <Plus size={16} />
                Create Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <div>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              style={{
                ...styles.actionButtonSmall,
                opacity: pagination.page <= 1 ? 0.5 : 1,
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              style={{
                ...styles.actionButtonSmall,
                opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={(result) => {
            setShowBulkImport(false);
            showToast(`Successfully imported ${result.successful} events`, 'success');
            refreshEvents();
          }}
        />
      )}

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
    </div>
  );
};

export default EventsList;