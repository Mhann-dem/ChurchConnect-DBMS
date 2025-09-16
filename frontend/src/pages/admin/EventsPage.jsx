// frontend/src/pages/admin/EventsPage.jsx - Enhanced with Dashboard Integration
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
  Star
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { useEvents } from '../../hooks/useEvents'; // ADD THIS IMPORT
import EventsList from '../../components/admin/Events/EventsList';
import EventCalendar from '../../components/admin/Events/EventCalendar';
import EventForm from '../../components/admin/Events/EventForm';
import SearchBar from '../../components/shared/SearchBar';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { eventsService } from '../../services/events';
import styles from './AdminPages.module.css';

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Get initial state from URL params (dashboard integration)
  const initialTab = searchParams.get('view') || 'list';
  const initialAction = searchParams.get('action');
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialType = searchParams.get('type') || '';
  const initialUpcoming = searchParams.get('upcoming') || '';
  
  // Use the events hook for proper state management
  const { 
    events, 
    loading, 
    error, 
    fetchEvents, 
    createEvent, 
    updateEvent, 
    deleteEvent,
    pagination,
    setPage,
    setLimit
  } = useEvents({
    search: initialSearch,
    status: initialStatus,
    event_type: initialType,
    upcoming: initialUpcoming
  });

  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [showEventForm, setShowEventForm] = useState(initialAction === 'create');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: initialStatus,
    event_type: initialType,
    upcoming: initialUpcoming,
    featured: searchParams.get('featured') || ''
  });
  
  // Stats and data
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    thisMonth: 0,
    featured: 0,
    totalRegistrations: 0,
    avgAttendance: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  // Real-time updates
  useRealTimeUpdates('events', {
    onUpdate: (updatedEvent) => {
      showToast(`Event "${updatedEvent.title}" was updated`, 'info');
      fetchEvents();
    },
    onDelete: (deletedEventId) => {
      showToast('An event was deleted', 'info');
      fetchEvents();
    },
    onCreate: (newEvent) => {
      showToast(`New event "${newEvent.title}" was created`, 'success');
      fetchEvents();
    }
  });

  // Calculate event statistics
  const calculateStats = useCallback((eventsList) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const upcomingEvents = eventsList.filter(event => 
      new Date(event.start_datetime) > now
    );
    
    const thisMonthEvents = eventsList.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate >= thisMonth && eventDate < nextMonth;
    });
    
    const featuredEvents = eventsList.filter(event => 
      event.is_featured
    );
    
    const totalRegistrations = eventsList.reduce((sum, event) => 
      sum + (event.registration_count || 0), 0
    );

    setEventStats({
      total: eventsList.length,
      upcoming: upcomingEvents.length,
      thisMonth: thisMonthEvents.length,
      featured: featuredEvents.length,
      totalRegistrations,
      avgAttendance: Math.round(totalRegistrations / Math.max(eventsList.length, 1))
    });
  }, []);

  // Update stats when events change
  useEffect(() => {
    if (events.length > 0) {
      calculateStats(events);
    }
  }, [events, calculateStats]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'list') params.set('view', activeTab);
    if (searchTerm) params.set('search', searchTerm);
    if (filters.status) params.set('status', filters.status);
    if (filters.event_type) params.set('type', filters.event_type);
    if (filters.upcoming) params.set('upcoming', filters.upcoming);
    if (filters.featured) params.set('featured', filters.featured);
    
    setSearchParams(params);
  }, [activeTab, searchTerm, filters, setSearchParams]);

  // Event handlers
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    // Update filters and trigger fetch
    const newFilters = { ...filters, search: term };
    fetchEvents(newFilters);
  }, [filters, fetchEvents]);

  const handleFilterChange = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchEvents(updatedFilters);
  }, [filters, fetchEvents]);

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setShowEventForm(true);
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleSaveEvent = useCallback(async (eventData) => {
    try {
      let savedEvent;
      if (editingEvent) {
        savedEvent = await updateEvent(editingEvent.id, eventData);
        showToast('Event updated successfully', 'success');
      } else {
        savedEvent = await createEvent(eventData);
        showToast('Event created successfully', 'success');
      }
      
      setShowEventForm(false);
      setEditingEvent(null);
      return savedEvent;
    } catch (error) {
      showToast(error.message || 'Failed to save event', 'error');
      throw error;
    }
  }, [editingEvent, updateEvent, createEvent, showToast]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(filters).finally(() => setRefreshing(false));
  }, [fetchEvents, filters]);

  const handleExport = useCallback(async () => {
    try {
      await eventsService.exportEvents(filters);
      showToast('Events exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export events', 'error');
    }
  }, [filters, showToast]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      status: '',
      event_type: '',
      upcoming: '',
      featured: '',
      search: ''
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    fetchEvents(clearedFilters);
  }, [fetchEvents]);

  // Tab configuration
  const tabs = [
    {
      id: 'list',
      label: 'Events List',
      icon: List,
      component: EventsList,
      badge: eventStats.total
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: Calendar,
      component: EventCalendar,
      badge: eventStats.upcoming
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: null,
      badge: eventStats.thisMonth
    }
  ];

  // Loading state
  if (loading && !events.length) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Enhanced Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Events & Activities</h1>
            <p className={styles.pageDescription}>
              Manage church events, services, and community activities
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              onClick={handleRefresh}
              icon={RefreshCw}
              disabled={refreshing || loading}
              className={refreshing ? styles.rotating : ''}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              icon={Download}
              disabled={events.length === 0}
            >
              Export
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEvent}
              icon={Plus}
            >
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <Calendar size={24} />
            </div>
            <div>
              <h3>Total Events</h3>
              <span className={styles.statValue}>{eventStats.total}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <Badge variant={eventStats.upcoming > 0 ? 'success' : 'warning'}>
              {eventStats.upcoming} upcoming
            </Badge>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3>This Month</h3>
              <span className={styles.statValue}>{eventStats.thisMonth}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubtext}>
              Events scheduled
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <Users size={24} />
            </div>
            <div>
              <h3>Registrations</h3>
              <span className={styles.statValue}>{eventStats.totalRegistrations}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubtext}>
              Avg {eventStats.avgAttendance} per event
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <Star size={24} />
            </div>
            <div>
              <h3>Featured Events</h3>
              <span className={styles.statValue}>{eventStats.featured}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <Badge variant={eventStats.featured > 0 ? 'info' : 'default'}>
              {eventStats.featured > 0 ? 'Active promotions' : 'None featured'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className={styles.searchSection}>
        <div className={styles.searchControls}>
          <SearchBar
            onSearch={handleSearch}
            value={searchTerm}
            placeholder="Search events by title, description, or organizer..."
            className={styles.searchBar}
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className={styles.filtersCard}>
            <div className={styles.filtersHeader}>
              <h3>Filters</h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Event Type</label>
                <select
                  value={filters.event_type}
                  onChange={(e) => handleFilterChange({ event_type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="service">Church Service</option>
                  <option value="meeting">Meeting</option>
                  <option value="social">Social Event</option>
                  <option value="youth">Youth Event</option>
                  <option value="workshop">Workshop</option>
                  <option value="outreach">Outreach</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="kids">Kids Event</option>
                  <option value="seniors">Seniors Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Time Frame</label>
                <select
                  value={filters.upcoming}
                  onChange={(e) => handleFilterChange({ upcoming: e.target.value })}
                >
                  <option value="">All Events</option>
                  <option value="true">Upcoming Only</option>
                  <option value="past">Past Events</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Featured</label>
                <select
                  value={filters.featured}
                  onChange={(e) => handleFilterChange({ featured: e.target.value })}
                >
                  <option value="">All Events</option>
                  <option value="true">Featured Only</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <Badge variant="primary" className={styles.tabBadge}>
                  {tab.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'list' && (
          <EventsList
            events={events}
            loading={loading || refreshing}
            onEdit={handleEditEvent}
            onRefresh={handleRefresh}
            searchTerm={searchTerm}
            filters={filters}
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
        
        {activeTab === 'calendar' && (
          <EventCalendar
            events={events}
            loading={loading || refreshing}
            onEdit={handleEditEvent}
            onCreate={handleCreateEvent}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsView}>
            <div className={styles.analyticsGrid}>
              <Card className={styles.analyticsCard}>
                <h3>Event Performance</h3>
                <div className={styles.performanceMetrics}>
                  <div className={styles.metric}>
                    <Clock size={20} />
                    <div>
                      <span className={styles.metricValue}>
                        {Math.round(eventStats.totalRegistrations / Math.max(eventStats.total, 1))}
                      </span>
                      <span className={styles.metricLabel}>Avg Registrations</span>
                    </div>
                  </div>
                  <div className={styles.metric}>
                    <MapPin size={20} />
                    <div>
                      <span className={styles.metricValue}>
                        {Math.round((eventStats.featured / Math.max(eventStats.total, 1)) * 100)}%
                      </span>
                      <span className={styles.metricLabel}>Featured Rate</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={styles.analyticsCard}>
                <h3>Upcoming Events</h3>
                <div className={styles.upcomingList}>
                  {events
                    .filter(event => new Date(event.start_datetime) > new Date())
                    .slice(0, 5)
                    .map(event => (
                      <div key={event.id} className={styles.upcomingEvent}>
                        <div>
                          <h4>{event.title}</h4>
                          <p>{new Date(event.start_datetime).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="info">
                          {event.registration_count || 0} registered
                        </Badge>
                      </div>
                    ))}
                  {eventStats.upcoming === 0 && (
                    <p className={styles.emptyText}>No upcoming events</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <Modal
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Edit Event' : 'Create New Event'}
        size="large"
      >
        <EventForm
          event={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          loading={refreshing}
        />
      </Modal>
    </div>
  );
};

export default EventsPage;