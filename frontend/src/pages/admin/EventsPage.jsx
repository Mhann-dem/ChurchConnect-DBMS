// frontend/src/pages/admin/EventsPage.jsx - BACKEND COMPATIBLE VERSION
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
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Get initial state from URL params (dashboard integration)
  const initialTab = searchParams.get('view') || 'list';
  const initialAction = searchParams.get('action');
  const initialSearch = searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialType = searchParams.get('type') || '';
  const initialUpcoming = searchParams.get('upcoming') || '';
  
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [showEventForm, setShowEventForm] = useState(initialAction === 'create');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // FIXED: Fetch events with proper backend compatibility
  const fetchEvents = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
        ...customFilters
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
      
      // FIXED: Handle your backend response structure
      if (response && response.data) {
        let eventsData = [];
        let totalCount = 0;
        
        if (response.data.results && Array.isArray(response.data.results)) {
          // DRF pagination response
          eventsData = response.data.results;
          totalCount = response.data.count || eventsData.length;
        } else if (Array.isArray(response.data)) {
          // Simple array response
          eventsData = response.data;
          totalCount = eventsData.length;
        } else {
          // Unknown format
          console.warn('[EventsPage] Unexpected response format:', response.data);
          eventsData = [];
          totalCount = 0;
        }
        
        setEvents(eventsData);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          total: totalCount,
          totalPages: Math.ceil(totalCount / prev.limit)
        }));
        
        // Calculate stats
        calculateStats(eventsData);
        
        // Clear error if successful
        setError(null);
      } else {
        console.warn('[EventsPage] No data in response:', response);
        setEvents([]);
        setError('No events data received from server');
      }
      
    } catch (err) {
      console.error('[EventsPage] Error fetching events:', err);
      
      // More specific error handling
      let errorMessage = 'Failed to fetch events';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 404) {
        errorMessage = 'Events API endpoint not found. Please check your backend configuration.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      setEvents([]);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters, showToast]);

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
        return new Date(event.start_datetime) > now;
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
      event.is_featured === true
    );
    
    // FIXED: Handle different registration count field names
    const totalRegistrations = eventsList.reduce((sum, event) => {
      const count = event.registration_count || event.registrations_count || 0;
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

  const handleSearch = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchEvents({ search: term });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [fetchEvents]);

  const handleFilterChange = useCallback((key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
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

  const handleDeleteEvent = useCallback(async (event) => {
    if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }
    
    try {
      await eventsService.deleteEvent(event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      showToast('Event deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Failed to delete event', 'error');
    }
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  }, [fetchEvents]);

  const handleExport = useCallback(async () => {
    try {
      const response = await eventsService.exportEvents(filters);
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `events_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
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
      featured: ''
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    fetchEvents(clearedFilters);
  }, [fetchEvents]);

  // FIXED: Utility functions to handle your backend data structure
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

  // Tab configuration
  const tabs = [
    {
      id: 'list',
      label: 'Events List',
      icon: List,
      badge: eventStats.total
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: Calendar,
      badge: eventStats.upcoming
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: eventStats.thisMonth
    }
  ];

  // FIXED: Better error handling for the blank page issue
  if (error && !events.length) {
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
          <p style={{ color: '#dc2626', marginBottom: '8px', fontSize: '16px', maxWidth: '500px' }}>
            {error}
          </p>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px' }}>
            Please check your backend connection and try again.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
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
              onClick={() => navigate('/admin/dashboard')}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading events...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
      {/* Rest of the component remains the same as the previous version */}
      {/* Just showing the key differences here - the rest of the JSX is identical */}
      
      {/* Enhanced Header */}
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
              {events.length > 0 && ` (${events.length} events loaded)`}
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
              onClick={() => setShowFilters(!showFilters)}
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
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Filter size={16} />
              Filters
            </button>
            
            <button
              onClick={handleExport}
              disabled={events.length === 0}
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
                cursor: events.length === 0 ? 'not-allowed' : 'pointer',
                opacity: events.length === 0 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <Download size={16} />
              Export
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
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard - Continue with rest of component */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Stats cards with proper event counts */}
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            background: eventStats.upcoming > 0 ? '#d1fae5' : '#fef3c7',
            color: eventStats.upcoming > 0 ? '#065f46' : '#92400e',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {eventStats.upcoming} upcoming
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
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>This Month</h3>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{eventStats.thisMonth}</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Events scheduled</span>
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', margin: 0 }}>Registrations</h3>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{eventStats.totalRegistrations}</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Avg {eventStats.avgAttendance} per event</span>
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            background: eventStats.featured > 0 ? '#dbeafe' : '#f3f4f6',
            color: eventStats.featured > 0 ? '#1e40af' : '#374151',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {eventStats.featured > 0 ? 'Active promotions' : 'None featured'}
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: showFilters ? '24px' : '0' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search events by title, description, or organizer..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Filters</h3>
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#6b7280',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Event Type
                </label>
                <select
                  value={filters.event_type}
                  onChange={(e) => handleFilterChange('event_type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Time Frame
                </label>
                <select
                  value={filters.upcoming}
                  onChange={(e) => handleFilterChange('upcoming', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Events</option>
                  <option value="true">Upcoming Only</option>
                  <option value="past">Past Events</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Featured
                </label>
                <select
                  value={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Events</option>
                  <option value="true">Featured Only</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events List - Simplified version showing data is loading */}
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
                        {(event.registration_count || event.registrations_count) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} />
                            <span style={{ fontSize: '12px' }}>
                              {event.registration_count || event.registrations_count} registered
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
                          fontSize: '12px'
                        }}
                      >
                        <Edit size={14} />
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
                          fontSize: '12px'
                        }}
                      >
                        <Trash2 size={14} />
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
              {searchTerm || Object.values(filters).some(f => f) ? 
                'Try adjusting your search or filters.' :
                'Create your first event to get started.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;