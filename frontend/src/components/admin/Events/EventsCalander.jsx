// frontend/src/components/admin/Events/EventCalendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users,
  Plus,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { eventsService } from '../../../services/events';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EventForm from './EventForm';
import styles from './Events.module.css';

const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'list'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filters, setFilters] = useState({
    event_type: '',
    status: 'published'
  });

  const { showToast } = useToast();

  // Get calendar range based on view mode
  const getDateRange = useCallback(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return { start: calendarStart, end: calendarEnd };
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return { start: weekStart, end: weekEnd };
    } else {
      // List view - show current month
      return { 
        start: startOfMonth(currentDate), 
        end: endOfMonth(currentDate) 
      };
    }
  }, [currentDate, viewMode]);

  // Fetch events for the current date range
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[PublicEventsPage] Fetching public events from Django');
      
      // Calculate date range for the current month view
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Format dates as YYYY-MM-DD for Django
      const formatYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const params = {
        is_public: 'true',           // MUST be string 'true', not boolean
        status: 'published',         // Only published events
        start_date: formatYYYYMMDD(startOfMonth),
        end_date: formatYYYYMMDD(endOfMonth),
        ordering: 'start_datetime'
      };
      
      // Add category filter if selected
      if (selectedCategory !== 'all') {
        params.event_type = selectedCategory;
      }
      
      // Add search term if provided
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      console.log('[PublicEventsPage] Request params:', params);
      
      const response = await eventsService.getEvents(params);
      console.log('[PublicEventsPage] Django response:', response);
      
      const eventsList = response.results || response.data || [];
      
      // CRITICAL: Double-check filtering on client side
      const publicEvents = eventsList.filter(event => {
        const isPublic = event.is_public === true || event.is_public === 'true';
        const isPublished = event.status === 'published';
        
        console.log('[PublicEventsPage] Event filter check:', {
          id: event.id,
          title: event.title,
          is_public: event.is_public,
          status: event.status,
          passed: isPublic && isPublished
        });
        
        return isPublic && isPublished;
      });
      
      console.log('[PublicEventsPage] Filtered public events:', publicEvents.length);
      setEvents(publicEvents);
      
    } catch (err) {
      console.error('[PublicEventsPage] Error:', err);
      setError('Unable to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, currentMonth, currentYear]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.start_datetime), date)
    );
  };

  // Event handlers
  const handleCreateEvent = (date = null) => {
    setEditingEvent(null);
    setShowEventForm(true);
    
    // If a date is provided, pre-fill the form with that date
    if (date) {
      // This would need to be passed to EventForm
      setSelectedEvent({ selectedDate: date });
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Render calendar header
  const renderCalendarHeader = () => {
    const title = viewMode === 'month' 
      ? format(currentDate, 'MMMM yyyy')
      : viewMode === 'week'
      ? `Week of ${format(startOfWeek(currentDate), 'MMM dd, yyyy')}`
      : format(currentDate, 'MMMM yyyy');

    return (
      <div className={styles.calendarHeader}>
        <div className={styles.calendarTitle}>
          <h2>{title}</h2>
          <div className={styles.calendarNav}>
            <button 
              onClick={handlePrevious}
              className={styles.navButton}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className={styles.todayButton}
            >
              Today
            </button>
            <button 
              onClick={handleNext}
              className={styles.navButton}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={styles.calendarControls}>
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode('month')}
              className={`${styles.viewButton} ${viewMode === 'month' ? styles.active : ''}`}
            >
              <Grid className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`${styles.viewButton} ${viewMode === 'week' ? styles.active : ''}`}
            >
              <CalendarIcon className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          <button 
            onClick={() => handleCreateEvent()}
            className={styles.createButton}
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className={styles.monthView}>
        {/* Week day headers */}
        <div className={styles.weekDayHeaders}>
          {weekDays.map(day => (
            <div key={day} className={styles.weekDayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={styles.calendarGrid}>
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div 
                key={day.toISOString()} 
                className={`${styles.calendarDay} ${
                  !isCurrentMonth ? styles.otherMonth : ''
                } ${isDayToday ? styles.today : ''}`}
                onClick={() => handleCreateEvent(day)}
              >
                <div className={styles.dayNumber}>
                  {format(day, 'd')}
                </div>
                <div className={styles.dayEvents}>
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className={styles.eventItem}
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      title={event.title}
                    >
                      <span className={styles.eventTime}>
                        {format(parseISO(event.start_datetime), 'h:mm a')}
                      </span>
                      <span className={styles.eventTitle}>
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className={styles.moreEvents}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const timeSlots = [];
    for (let hour = 6; hour < 24; hour++) {
      timeSlots.push(hour);
    }

    return (
      <div className={styles.weekView}>
        {/* Week day headers */}
        <div className={styles.weekHeader}>
          <div className={styles.timeColumn}></div>
          {days.map(day => (
            <div key={day.toISOString()} className={styles.weekDayColumn}>
              <div className={styles.weekDayName}>
                {format(day, 'EEE')}
              </div>
              <div className={`${styles.weekDayDate} ${isToday(day) ? styles.today : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className={styles.weekGrid}>
          {timeSlots.map(hour => (
            <div key={hour} className={styles.timeSlot}>
              <div className={styles.timeLabel}>
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              {days.map(day => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  const eventHour = parseISO(event.start_datetime).getHours();
                  return eventHour === hour;
                });

                return (
                  <div 
                    key={`${day.toISOString()}-${hour}`} 
                    className={styles.weekTimeSlot}
                    onClick={() => handleCreateEvent(new Date(day.getTime() + hour * 60 * 60 * 1000))}
                  >
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        className={styles.weekEvent}
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <div className={styles.eventTitle}>{event.title}</div>
                        <div className={styles.eventTime}>
                          {format(parseISO(event.start_datetime), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start_datetime) - new Date(b.start_datetime)
    );

    if (sortedEvents.length === 0) {
      return (
        <div className={styles.emptyState}>
          <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className={styles.emptyTitle}>No events this month</h3>
          <p className={styles.emptyText}>Create your first event to get started.</p>
          <button 
            onClick={() => handleCreateEvent()}
            className={styles.createButton}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>
      );
    }

    return (
      <div className={styles.listView}>
        {sortedEvents.map(event => (
          <div 
            key={event.id} 
            className={styles.listEvent}
            onClick={() => handleEventClick(event)}
          >
            <div className={styles.eventDate}>
              <div className={styles.eventMonth}>
                {format(parseISO(event.start_datetime), 'MMM')}
              </div>
              <div className={styles.eventDay}>
                {format(parseISO(event.start_datetime), 'd')}
              </div>
            </div>

            <div className={styles.eventDetails}>
              <div className={styles.eventHeader}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <span 
                  className={styles.eventType}
                  style={{ backgroundColor: event.color }}
                >
                  {event.event_type_display}
                </span>
              </div>

              <div className={styles.eventMeta}>
                <div className={styles.eventTime}>
                  <Clock className="w-4 h-4" />
                  {format(parseISO(event.start_datetime), 'h:mm a')} - 
                  {format(parseISO(event.end_datetime), 'h:mm a')}
                </div>
                {event.location && (
                  <div className={styles.eventLocation}>
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.eventActions}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }}
                className={styles.editButton}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.calendarContainer}>
      {renderCalendarHeader()}

      {/* Filters */}
      <div className={styles.calendarFilters}>
        <div className={styles.filterGroup}>
          <Filter className="w-4 h-4" />
          <select
            value={filters.event_type}
            onChange={(e) => setFilters(prev => ({ ...prev, event_type: e.target.value }))}
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
        </div>
      </div>

      {/* Calendar Content */}
      <div className={styles.calendarContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
            <p>Loading events...</p>
          </div>
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'list' && renderListView()}
          </>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && !showEventForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>

            <div className={styles.eventDetailContent}>
              <div className={styles.eventDetailMeta}>
                <div className={styles.eventDetailTime}>
                  <Clock className="w-5 h-5" />
                  <div>
                    <div className={styles.eventDetailDate}>
                      {format(parseISO(selectedEvent.start_datetime), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className={styles.eventDetailTimeRange}>
                      {format(parseISO(selectedEvent.start_datetime), 'h:mm a')} - 
                      {format(parseISO(selectedEvent.end_datetime), 'h:mm a')}
                    </div>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className={styles.eventDetailLocation}>
                    <MapPin className="w-5 h-5" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                <div className={styles.eventDetailType}>
                  <span 
                    className={styles.eventTypeBadge}
                    style={{ backgroundColor: selectedEvent.color }}
                  >
                    {selectedEvent.event_type_display}
                  </span>
                </div>
              </div>

              <div className={styles.eventDetailActions}>
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className={styles.editButton}
                >
                  Edit Event
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className={styles.closeButton}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          initialDate={selectedEvent?.selectedDate}
          onSave={(event) => {
            if (editingEvent) {
              setEvents(prev => prev.map(e => e.id === event.id ? { ...event, color: e.color } : e));
              showToast('Event updated successfully', 'success');
            } else {
              // Add color for new event
              const eventWithColor = {
                ...event,
                color: getEventTypeColor(event.event_type)
              };
              setEvents(prev => [...prev, eventWithColor]);
              showToast('Event created successfully', 'success');
            }
            setShowEventForm(false);
            setEditingEvent(null);
            setSelectedEvent(null);
          }}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Helper function to get event type colors
const getEventTypeColor = (eventType) => {
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
};

export default EventCalendar;