// frontend/src/pages/public/PublicEventsPage.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, MapPin, Users, Star, ChevronLeft, ChevronRight, Search, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { eventsService } from '../../services/events';

const PublicEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastSync, setLastSync] = useState(null);
  const keepAliveInterval = useRef(null);
  const retryInterval = useRef(null);

  // Local Storage Keys
  const STORAGE_KEYS = {
    EVENTS_CACHE: 'church_events_cache',
    LAST_SYNC: 'church_events_last_sync',
    BACKEND_STATUS: 'church_backend_status'
  };

  const categories = [
    { id: 'all', name: 'All Events', icon: '📅' },
    { id: 'service', name: 'Worship Services', icon: '🙏' },
    { id: 'bible_study', name: 'Bible Study', icon: '📖' },
    { id: 'youth', name: 'Youth Events', icon: '🎵' },
    { id: 'outreach', name: 'Outreach', icon: '🤝' },
    { id: 'social', name: 'Fellowship', icon: '🎉' },
    { id: 'prayer', name: 'Prayer', icon: '🕊️' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ✅ Load cached events from localStorage
  const loadCachedEvents = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.EVENTS_CACHE);
      const lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      
      if (cached) {
        const parsedEvents = JSON.parse(cached);
        console.log('[PublicEventsPage] Loaded cached events:', parsedEvents.length);
        setEvents(parsedEvents);
        setLastSync(lastSyncTime ? new Date(lastSyncTime) : null);
        return parsedEvents;
      }
    } catch (err) {
      console.error('[PublicEventsPage] Error loading cache:', err);
    }
    return null;
  }, []);

  // ✅ Save events to localStorage
  const cacheEvents = useCallback((eventsData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS_CACHE, JSON.stringify(eventsData));
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setLastSync(new Date(now));
      console.log('[PublicEventsPage] Cached events:', eventsData.length);
    } catch (err) {
      console.error('[PublicEventsPage] Error caching events:', err);
    }
  }, []);

  // ✅ Backend health check
  const checkBackendHealth = useCallback(async () => {
    try {
      // Try a lightweight request to check if backend is alive
      await eventsService.getEvents({ page_size: 1 });
      setBackendStatus('online');
      setIsOffline(false);
      return true;
    } catch (err) {
      console.warn('[PublicEventsPage] Backend appears offline:', err.message);
      setBackendStatus('offline');
      setIsOffline(true);
      return false;
    }
  }, []);

  // ✅ Keep backend alive with periodic pings
  const startKeepAlive = useCallback(() => {
    // Ping backend every 5 minutes to keep it awake
    if (keepAliveInterval.current) {
      clearInterval(keepAliveInterval.current);
    }

    keepAliveInterval.current = setInterval(async () => {
      console.log('[PublicEventsPage] Keep-alive ping...');
      const isOnline = await checkBackendHealth();
      
      if (isOnline && backendStatus === 'offline') {
        // Backend came back online, refresh events
        console.log('[PublicEventsPage] Backend back online, refreshing...');
        fetchEvents(false);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [backendStatus]);

  // ✅ Retry fetching when offline
  const startRetryMechanism = useCallback(() => {
    if (retryInterval.current) {
      clearInterval(retryInterval.current);
    }

    // When offline, retry every 30 seconds
    retryInterval.current = setInterval(async () => {
      console.log('[PublicEventsPage] Retry attempt...');
      const isOnline = await checkBackendHealth();
      
      if (isOnline) {
        console.log('[PublicEventsPage] Backend reconnected!');
        clearInterval(retryInterval.current);
        fetchEvents(false);
      }
    }, 30 * 1000); // 30 seconds
  }, []);

  // Date formatting helpers
  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    try {
      const date = new Date(dateString);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (e) {
      return 'Date unavailable';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const formatYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ FIXED: Fetch events with proper parameters and offline handling
  const fetchEvents = useCallback(async (useCache = true) => {
    // Load cache first for instant display (only if we're not already showing cached data)
    if (useCache && events.length === 0) {
      const cached = loadCachedEvents();
      if (cached && cached.length > 0) {
        setLoading(false);
      }
    }

    setError(null);

    try {
      console.log('[PublicEventsPage] Fetching public events from Django');
      
      // Calculate month date range
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // ✅ CRITICAL: Send as STRING not boolean
      const params = {
        is_public: 'true',  // ✅ String, not boolean
        status: 'published',
        start_date: formatYYYYMMDD(startOfMonth),
        end_date: formatYYYYMMDD(endOfMonth),
        ordering: 'start_datetime'
      };

      if (selectedCategory !== 'all') {
        params.event_type = selectedCategory;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('[PublicEventsPage] Request params:', params);

      const response = await eventsService.getEvents(params);
      console.log('[PublicEventsPage] Django response:', response);
      
      const eventsList = response.results || response.data || [];
      
      // Client-side double-check (safety net)
      const publicEvents = eventsList.filter(event => {
        const isPublic = event.is_public === true || event.is_public === 'true';
        const isPublished = event.status === 'published';
        
        if (!isPublic || !isPublished) {
          console.log('[PublicEventsPage] Filtered out:', {
            id: event.id,
            title: event.title,
            is_public: event.is_public,
            status: event.status
          });
        }
        
        return isPublic && isPublished;
      });
      
      console.log('[PublicEventsPage] Public events loaded:', publicEvents.length);
      setEvents(publicEvents);
      cacheEvents(publicEvents);
      setBackendStatus('online');
      setIsOffline(false);
      
    } catch (err) {
      console.error('[PublicEventsPage] Error:', err);
      setBackendStatus('offline');
      setIsOffline(true);
      
      // Try to load from cache - only show cached data, no demo events
      const cached = loadCachedEvents();
      
      if (cached && cached.length > 0) {
        setError('Unable to connect to server. Showing previously loaded events.');
      } else {
        // No cache available - show empty state
        setEvents([]);
        setError('Unable to connect to server. Please check your connection and try again.');
      }
      
      // Start retry mechanism
      startRetryMechanism();
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, currentMonth, currentYear, events.length, loadCachedEvents, cacheEvents, startRetryMechanism]);

  useEffect(() => {
    fetchEvents();
    startKeepAlive();
    
    return () => {
      // Cleanup intervals on unmount
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
      if (retryInterval.current) {
        clearInterval(retryInterval.current);
      }
    };
  }, [fetchEvents, startKeepAlive]);

  const getEventStatus = (event) => {
    try {
      const now = new Date();
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

      if (eventDay.getTime() === today.getTime()) return { text: 'Today', color: '#10b981', urgent: true };
      if (startDate > now) return { text: 'Upcoming', color: '#3b82f6', urgent: false };
      if (endDate > now && startDate <= now) return { text: 'In Progress', color: '#f59e0b', urgent: true };
      return { text: 'Completed', color: '#6b7280', urgent: false };
    } catch (e) {
      return { text: 'Unknown', color: '#6b7280', urgent: false };
    }
  };

  const getRegistrationStatus = (event) => {
    if (!event.requires_registration) return { text: 'Open', color: '#3b82f6' };
    if (!event.max_capacity) return { text: 'Registration Open', color: '#10b981' };
    
    const registered = event.registration_count || 0;
    const capacity = event.max_capacity;
    const percentage = (registered / capacity) * 100;

    if (percentage >= 100) return { text: 'Full', color: '#ef4444' };
    if (percentage >= 80) return { text: 'Almost Full', color: '#f59e0b' };
    return { text: 'Available', color: '#10b981' };
  };

  const handleMonthNavigation = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleRegistration = (event) => {
    if (event.external_registration_url) {
      window.open(event.external_registration_url, '_blank');
    } else {
      alert('Please contact the church office to register for this event.');
    }
  };

  // Styles
  const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    hero: { 
      textAlign: 'center', 
      padding: '60px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      color: 'white',
      marginBottom: '40px'
    },
    searchRow: { 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '20px', 
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '30px'
    },
    searchBox: { position: 'relative', minWidth: '300px', flex: '1' },
    input: {
      width: '100%',
      padding: '12px 40px 12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none'
    },
    monthNav: { display: 'flex', alignItems: 'center', gap: '12px' },
    navBtn: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px'
    },
    categoryFilters: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' },
    categoryBtn: (isSelected) => ({
      padding: '8px 16px',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '20px',
      backgroundColor: isSelected ? '#3b82f6' : 'white',
      color: isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s'
    }),
    eventsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px'
    },
    eventCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px'
    },
    loadingState: {
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '16px'
    },
    offlineBanner: {
      backgroundColor: '#fef3c7',
      borderLeft: '4px solid #f59e0b',
      padding: '16px',
      marginBottom: '20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    statusBadge: (status) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: status === 'online' ? '#dcfce7' : '#fee2e2',
      color: status === 'online' ? '#166534' : '#991b1b'
    })
  };

  // Loading State
  if (loading) {
    return (
      <div style={styles.loadingState}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280' }}>Loading public events...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error State
  if (error && events.length === 0) {
    return (
      <div style={{ ...styles.loadingState, textAlign: 'center', padding: '20px' }}>
        <AlertCircle size={64} style={{ color: '#ef4444' }} />
        <h2 style={{ color: '#1f2937', fontSize: '24px', marginBottom: '8px' }}>Unable to Load Events</h2>
        <p style={{ color: '#6b7280', maxWidth: '500px', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={() => fetchEvents(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Offline/Cache Banner */}
      {isOffline && (
        <div style={styles.offlineBanner}>
          <WifiOff size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
              {error || 'Unable to connect to server'}
            </div>
            <div style={{ fontSize: '14px', color: '#78350f' }}>
              {lastSync 
                ? `Last updated: ${new Date(lastSync).toLocaleString()}. Retrying connection...`
                : 'Attempting to connect to server...'}
            </div>
          </div>
          <button
            onClick={() => fetchEvents(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>
          Church Events & Activities
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '16px' }}>
          Join us in fellowship, worship, and community service
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={styles.statusBadge(backendStatus)}>
            {backendStatus === 'online' ? '🟢 Live' : backendStatus === 'offline' ? '🔴 Offline' : '🟡 Checking...'}
          </span>
          {lastSync && (
            <span style={{
              ...styles.statusBadge('info'),
              backgroundColor: '#e0e7ff',
              color: '#3730a3'
            }}>
              📅 Last sync: {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </section>

      {/* Filters Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={styles.searchRow}>
          {/* Search Bar */}
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
            <Search size={20} style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
          </div>

          {/* Month Navigation */}
          <div style={styles.monthNav}>
            <button onClick={() => handleMonthNavigation('prev')} style={styles.navBtn}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontWeight: '600', minWidth: '150px', textAlign: 'center' }}>
              {months[currentMonth]} {currentYear}
            </span>
            <button onClick={() => handleMonthNavigation('next')} style={styles.navBtn}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div style={styles.categoryFilters}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={styles.categoryBtn(selectedCategory === category.id)}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Events List */}
      <section>
        {events.length === 0 ? (
          <div style={styles.emptyState}>
            <Calendar size={64} style={{ color: '#d1d5db', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#374151' }}>No Events Found</h3>
            <p style={{ color: '#6b7280' }}>
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No public events scheduled for this month. Check back later!'}
            </p>
          </div>
        ) : (
          <div style={styles.eventsGrid}>
            {events.map(event => {
              const eventStatus = getEventStatus(event);
              const registrationStatus = getRegistrationStatus(event);
              
              return (
                <div 
                  key={event.id} 
                  style={styles.eventCard}
                  onClick={() => setSelectedEvent(event)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Event Image */}
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <img
                      src={event.image_url || 'https://via.placeholder.com/400x200/667eea/ffffff?text=Church+Event'}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200/667eea/ffffff?text=Church+Event';
                      }}
                    />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                      {event.is_featured && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Star size={12} /> Featured
                        </span>
                      )}
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: eventStatus.color,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {eventStatus.text}
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '8px',
                        lineHeight: '1.3'
                      }}>
                        {event.title}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {event.event_type_display || event.event_type}
                      </span>
                    </div>

                    <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Calendar size={16} />
                        {formatDate(event.start_datetime)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Clock size={16} />
                        {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                      </div>
                      {event.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <MapPin size={16} />
                          {event.location}
                        </div>
                      )}
                      {event.requires_registration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} />
                          {event.registration_count || 0}
                          {event.max_capacity && ` / ${event.max_capacity}`} registered
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        lineHeight: '1.5',
                        marginBottom: '16px'
                      }}>
                        {event.description.length > 120 
                          ? `${event.description.substring(0, 120)}...` 
                          : event.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        View Details
                      </button>
                      {event.requires_registration && registrationStatus.text !== 'Full' && (
                        <button 
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegistration(event);
                          }}
                        >
                          {event.registration_fee > 0 ? `Register ($${event.registration_fee})` : 'Register'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          style={{
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
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                {selectedEvent.title}
              </h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {selectedEvent.image_url && (
                <img 
                  src={selectedEvent.image_url} 
                  alt={selectedEvent.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Calendar size={20} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {formatDate(selectedEvent.start_datetime)}
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      {formatTime(selectedEvent.start_datetime)} - {formatTime(selectedEvent.end_datetime)}
                    </div>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <MapPin size={20} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{selectedEvent.location}</div>
                      {selectedEvent.location_details && (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                          {selectedEvent.location_details}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent.organizer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={20} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>Organized by:</div>
                      <div style={{ color: '#6b7280' }}>{selectedEvent.organizer}</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>About This Event</h4>
                  <p style={{ lineHeight: '1.6', color: '#374151' }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {(selectedEvent.contact_email || selectedEvent.contact_phone) && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>Contact Information</h4>
                  {selectedEvent.contact_email && (
                    <div style={{ marginBottom: '4px' }}>
                      Email: <a 
                        href={`mailto:${selectedEvent.contact_email}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {selectedEvent.contact_email}
                      </a>
                    </div>
                  )}
                  {selectedEvent.contact_phone && (
                    <div>
                      Phone: <a 
                        href={`tel:${selectedEvent.contact_phone}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {selectedEvent.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ 
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              {selectedEvent.requires_registration && getRegistrationStatus(selectedEvent).text !== 'Full' && (
                <button 
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleRegistration(selectedEvent)}
                >
                  {selectedEvent.registration_fee > 0 
                    ? `Register (${selectedEvent.registration_fee})` 
                    : 'Register Now'}
                </button>
              )}
              <button 
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicEventsPage;