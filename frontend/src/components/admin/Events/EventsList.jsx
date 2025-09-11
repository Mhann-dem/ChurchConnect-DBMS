// frontend/src/components/admin/Events/EventsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { 
  Search, Plus, Filter, Calendar, Users, MapPin, 
  Clock, DollarSign, Eye, Edit, Trash2, MoreHorizontal,
  CheckCircle, XCircle, AlertCircle, Star
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { eventsService } from '../../../services/events';
import LoadingSpinner from '../../shared/LoadingSpinner';
import Pagination from '../../shared/Pagination';
import ConfirmDialog from '../../shared/ConfirmDialog';
import EventForm from './EventForm';
import styles from './Events.module.css';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  const { showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await eventsService.getEvents(params);
      
      setEvents(response.results || []);
      setPagination(prev => ({
        ...prev,
        total: response.count || 0,
        totalPages: Math.ceil((response.count || 0) / prev.limit)
      }));
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (event) => {
    setDeleteConfirm(event);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await eventsService.deleteEvent(deleteConfirm.id);
      setEvents(prev => prev.filter(e => e.id !== deleteConfirm.id));
      showToast(`Event "${deleteConfirm.title}" deleted successfully`, 'success');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Failed to delete event', 'error');
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
    if (!bulkAction || selectedEvents.length === 0) return;

    try {
      const actionData = {
        event_ids: selectedEvents,
        action: bulkAction
      };

      const response = await eventsService.bulkAction(actionData);
      
      if (bulkAction === 'export') {
        // Handle file download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `events_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        fetchEvents(); // Refresh list
      }

      showToast(response.message || 'Bulk action completed successfully', 'success');
      setSelectedEvents([]);
      setBulkAction('');
    } catch (err) {
      console.error('Error performing bulk action:', err);
      showToast('Failed to perform bulk action', 'error');
    }
  };

  const getEventStatusIcon = (event) => {
    if (event.status === 'published') {
      if (isPast(parseISO(event.end_datetime))) {
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
      if (isPast(parseISO(event.end_datetime))) {
        return 'Completed';
      }
      if (isToday(parseISO(event.start_datetime))) {
        return 'Today';
      }
      if (isFuture(parseISO(event.start_datetime))) {
        return 'Upcoming';
      }
      return 'Active';
    }
    return event.status_display;
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      service: 'bg-blue-100 text-blue-800',
      meeting: 'bg-red-100 text-red-800',
      social: 'bg-green-100 text-green-800',
      youth: 'bg-orange-100 text-orange-800',
      workshop: 'bg-purple-100 text-purple-800',
      outreach: 'bg-teal-100 text-teal-800',
      conference: 'bg-indigo-100 text-indigo-800',
      retreat: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[eventType] || colors.other;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <button 
          onClick={fetchEvents}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.eventsListContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Events</h1>
          <p className={styles.subtitle}>
            Manage church events and activities
          </p>
        </div>
        <button 
          onClick={handleCreateEvent}
          className={styles.createButton}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.event_type}
            onChange={(e) => handleFilterChange('event_type', e.target.value)}
            className={styles.filterSelect}
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

          <select
            value={filters.upcoming}
            onChange={(e) => handleFilterChange('upcoming', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Dates</option>
            <option value="true">Upcoming Only</option>
            <option value="past">Past Events</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && (
        <div className={styles.bulkActionsContainer}>
          <div className={styles.bulkActionsLeft}>
            <span className={styles.selectedCount}>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className={styles.bulkActionsRight}>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className={styles.bulkActionSelect}
            >
              <option value="">Choose Action</option>
              <option value="publish">Publish</option>
              <option value="cancel">Cancel</option>
              <option value="export">Export</option>
              <option value="delete">Delete</option>
            </select>
            <button 
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className={styles.bulkActionButton}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className={styles.eventsGrid}>
        {/* Header Row */}
        <div className={styles.gridHeader}>
          <div className={styles.gridHeaderCell}>
            <input
              type="checkbox"
              checked={selectedEvents.length === events.length && events.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className={styles.checkbox}
            />
          </div>
          <div className={styles.gridHeaderCell}>Event</div>
          <div className={styles.gridHeaderCell}>Date & Time</div>
          <div className={styles.gridHeaderCell}>Location</div>
          <div className={styles.gridHeaderCell}>Status</div>
          <div className={styles.gridHeaderCell}>Registrations</div>
          <div className={styles.gridHeaderCell}>Actions</div>
        </div>

        {/* Event Rows */}
        {events.map((event) => (
          <div key={event.id} className={styles.gridRow}>
            <div className={styles.gridCell}>
              <input
                type="checkbox"
                checked={selectedEvents.includes(event.id)}
                onChange={(e) => handleEventSelect(event.id, e.target.checked)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.gridCell}>
              <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>
                  {event.is_featured && (
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  )}
                  {event.title}
                </div>
                <div className={styles.eventMeta}>
                  <span className={`${styles.eventType} ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type_display}
                  </span>
                  {event.organizer && (
                    <span className={styles.organizer}>
                      by {event.organizer}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.gridCell}>
              <div className={styles.dateTime}>
                <div className={styles.date}>
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(parseISO(event.start_datetime), 'MMM dd, yyyy')}
                </div>
                <div className={styles.time}>
                  <Clock className="w-4 h-4 mr-1" />
                  {format(parseISO(event.start_datetime), 'h:mm a')} - 
                  {format(parseISO(event.end_datetime), 'h:mm a')}
                </div>
              </div>
            </div>

            <div className={styles.gridCell}>
              <div className={styles.location}>
                <MapPin className="w-4 h-4 mr-1" />
                {event.location || 'No location'}
              </div>
            </div>

            <div className={styles.gridCell}>
              <div className={styles.status}>
                {getEventStatusIcon(event)}
                <span className={styles.statusText}>
                  {getEventStatusText(event)}
                </span>
              </div>
            </div>

            <div className={styles.gridCell}>
              <div className={styles.registrations}>
                <Users className="w-4 h-4 mr-1" />
                {event.registration_count}
                {event.max_capacity && ` / ${event.max_capacity}`}
                {event.requires_registration && event.registration_fee > 0 && (
                  <div className={styles.fee}>
                    <DollarSign className="w-3 h-3 mr-1" />
                    {event.registration_fee}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.gridCell}>
              <div className={styles.actions}>
                <button
                  onClick={() => window.open(`/events/${event.id}`, '_blank')}
                  className={styles.actionButton}
                  title="View Event"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditEvent(event)}
                  className={styles.actionButton}
                  title="Edit Event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className={styles.emptyState}>
            <Calendar className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className={styles.emptyTitle}>No events found</h3>
            <p className={styles.emptyText}>
              {searchTerm || Object.values(filters).some(f => f) ? 
                'Try adjusting your search or filters.' :
                'Create your first event to get started.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <button 
                onClick={handleCreateEvent}
                className={styles.createButton}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          onSave={(event) => {
            if (editingEvent) {
              setEvents(prev => prev.map(e => e.id === event.id ? event : e));
              showToast('Event updated successfully', 'success');
            } else {
              setEvents(prev => [event, ...prev]);
              showToast('Event created successfully', 'success');
            }
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Event"
          message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  );
};

export default EventsList;