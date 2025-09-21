// frontend/src/pages/admin/EventsDetailPage.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star,
  RefreshCw,
  Download,
  UserPlus,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { format, parseISO, isToday, isFuture, isPast, formatDistanceToNow } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/LoadingSpinner';
// FIXED: Import the service correctly
import { eventsService } from '../../services/events';

// Simple utility functions
const validateId = (id) => {
  if (!id || isNaN(parseInt(id))) {
    throw new Error('Invalid ID provided');
  }
  return parseInt(id);
};

const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (includeTime) {
      return format(date, 'MMM dd, yyyy h:mm a');
    }
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Simple phone formatting - you can enhance this
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EventDetailPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? 
        this.props.fallback({ error: this.state.error, resetError: () => this.setState({ hasError: false, error: null }) }) :
        <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// Simple Card component
const Card = ({ children, className = '', style = {} }) => (
  <div 
    className={className}
    style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      ...style
    }}
  >
    {children}
  </div>
);

// Simple Badge component
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { backgroundColor: '#f3f4f6', color: '#374151' },
    primary: { backgroundColor: '#dbeafe', color: '#1e40af' },
    success: { backgroundColor: '#d1fae5', color: '#065f46' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    danger: { backgroundColor: '#fee2e2', color: '#991b1b' },
    info: { backgroundColor: '#dbeafe', color: '#1e40af' },
    secondary: { backgroundColor: '#f1f5f9', color: '#475569' },
    outline: { backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db' }
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      ...variants[variant]
    }}>
      {children}
    </span>
  );
};

// Simple Button component
const Button = ({ children, onClick, variant = 'primary', size = 'md', icon, disabled = false, ...props }) => {
  const variants = {
    primary: { backgroundColor: '#3b82f6', color: 'white', border: 'none' },
    outline: { backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db' },
    danger: { backgroundColor: '#ef4444', color: 'white', border: 'none' }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '10px 20px', fontSize: '16px' }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '500',
        transition: 'all 0.2s',
        ...variants[variant],
        ...sizes[size]
      }}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
};

// Simple Tabs component
const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
    <div style={{ display: 'flex', gap: '24px' }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
            {tab.badge !== undefined && (
              <Badge variant={activeTab === tab.id ? 'primary' : 'outline'}>
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// Simple ConfirmDialog component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', loading = false }) => {
  if (!isOpen) return null;

  return (
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
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '450px',
        width: '100%',
        margin: '20px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{title}</h3>
        <div style={{ marginBottom: '24px', lineHeight: '1.5' }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {loading && <LoadingSpinner size="sm" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Refs for cleanup
  const abortControllerRef = useRef();
  const isMountedRef = useRef(true);

  // Enhanced ID validation
  const validatedId = useMemo(() => {
    try {
      return validateId(id);
    } catch (error) {
      console.error('Invalid event ID:', error);
      return null;
    }
  }, [id]);

  // State management
  const [event, setEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.hash?.slice(1) || 'overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    event: false,
    registrations: false,
    attendees: false
  });
  const [errors, setErrors] = useState({
    event: null,
    registrations: null,
    attendees: null
  });

  // Component cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Enhanced ID validation with navigation
  useEffect(() => {
    if (!validatedId) {
      showToast('Invalid event ID provided', 'error');
      navigate('/admin/events', { replace: true });
      return;
    }
  }, [validatedId, navigate, showToast]);

  // Update URL hash when tab changes
  useEffect(() => {
    const newHash = `#${activeTab}`;
    if (location.hash !== newHash) {
      window.history.replaceState(null, '', `${location.pathname}${newHash}`);
    }
  }, [activeTab, location]);

  // Enhanced data loading with direct service integration
  const fetchEventDetails = useCallback(async (forceRefresh = false) => {
    if (!validatedId || !isMountedRef.current) return;

    try {
      // Cancel any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      setLoadingStates(prev => ({ ...prev, event: true }));
      setErrors(prev => ({ ...prev, event: null }));

      console.log('[EventDetailPage] Loading event details for ID:', validatedId);

      // Use service directly
      const result = await eventsService.getEvent(validatedId);

      if (!isMountedRef.current) return;

      if (result && result.data) {
        setEvent(result.data);
        console.log('[EventDetailPage] Event data loaded:', result.data);

        // Load additional data in parallel
        await Promise.allSettled([
          loadEventRegistrations(validatedId),
          loadEventAttendees(validatedId)
        ]);
      } else {
        throw new Error('Event not found');
      }

    } catch (error) {
      console.error('Failed to load event details:', error);
      
      if (isMountedRef.current) {
        if (error.message === 'Event not found' || error.message?.includes('404')) {
          showToast('Event not found', 'error');
          navigate('/admin/events', { replace: true });
        } else {
          setErrors(prev => ({ ...prev, event: error.message }));
          showToast(error.message || 'Failed to load event details', 'error');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, event: false }));
      }
    }
  }, [validatedId, showToast, navigate]);

  // Load event registrations
  const loadEventRegistrations = useCallback(async (eventId) => {
    if (!eventId || !isMountedRef.current) return;

    try {
      setLoadingStates(prev => ({ ...prev, registrations: true }));
      setErrors(prev => ({ ...prev, registrations: null }));

      // This would be implemented if your backend has event registrations
      // For now, we'll use mock data or return empty array
      const registrations = [];
      
      if (isMountedRef.current) {
        setEventRegistrations(registrations);
      }
    } catch (error) {
      console.error('Failed to load event registrations:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, registrations: error.message }));
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, registrations: false }));
      }
    }
  }, []);

  // Load event attendees
  const loadEventAttendees = useCallback(async (eventId) => {
    if (!eventId || !isMountedRef.current) return;

    try {
      setLoadingStates(prev => ({ ...prev, attendees: true }));
      setErrors(prev => ({ ...prev, attendees: null }));

      // This would be implemented if your backend has event attendees
      // For now, we'll use mock data or return empty array
      const attendees = [];
      
      if (isMountedRef.current) {
        setEventAttendees(attendees);
      }
    } catch (error) {
      console.error('Failed to load event attendees:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, attendees: error.message }));
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingStates(prev => ({ ...prev, attendees: false }));
      }
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    if (validatedId && isMountedRef.current) {
      fetchEventDetails();
    }
  }, [validatedId, fetchEventDetails]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('[EventDetailPage] Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      await fetchEventDetails(true);
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('[EventDetailPage] Refresh error:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchEventDetails, showToast]);

  // Enhanced event edit handler
  const handleEditEvent = useCallback(() => {
    if (!event) return;
    
    // Navigate to edit page or open edit modal
    navigate(`/admin/events/edit/${event.id}`, {
      state: { event }
    });
  }, [event, navigate]);

  // Enhanced event deletion handler
  const handleDeleteEvent = useCallback(async () => {
    if (!validatedId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await eventsService.deleteEvent(validatedId);
      
      if (result && result.success !== false) {
        showToast('Event deleted successfully', 'success');
        navigate('/admin/events');
      } else {
        throw new Error(result?.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [validatedId, showToast, navigate, isSubmitting]);

  // Event status utilities
  const getEventStatusIcon = useCallback((event) => {
    if (!event) return null;
    
    if (event.status === 'published') {
      if (event.end_datetime && isPast(parseISO(event.end_datetime))) {
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      }
      if (event.start_datetime && isToday(parseISO(event.start_datetime))) {
        return <Clock size={16} style={{ color: '#f59e0b' }} />;
      }
      if (event.start_datetime && isFuture(parseISO(event.start_datetime))) {
        return <Calendar size={16} style={{ color: '#3b82f6' }} />;
      }
      return <CheckCircle size={16} style={{ color: '#3b82f6' }} />;
    }
    if (event.status === 'cancelled') {
      return <XCircle size={16} style={{ color: '#ef4444' }} />;
    }
    return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
  }, []);

  const getEventStatusText = useCallback((event) => {
    if (!event) return 'Unknown';
    
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
  }, []);

  const getEventTypeColor = useCallback((eventType) => {
    const colors = {
      service: 'primary',
      meeting: 'danger',
      social: 'success',
      youth: 'warning',
      workshop: 'info',
      outreach: 'secondary',
      conference: 'primary',
      retreat: 'success',
      other: 'outline'
    };
    return colors[eventType] || colors.other;
  }, []);

  // Enhanced date formatting
  const formatEventDate = useCallback((dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = parseISO(dateString);
      if (includeTime) {
        return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
      }
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  }, []);

  // Loading state
  if (loadingStates.event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px'
      }}>
        <LoadingSpinner size="large" />
        <p>Loading event details...</p>
      </div>
    );
  }

  // Error state
  if (errors.event && !event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center'
      }}>
        <h2>Error Loading Event</h2>
        <p>{errors.event}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button onClick={() => fetchEventDetails(true)}>
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/events')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center'
      }}>
        <h2>Event Not Found</h2>
        <p>The requested event could not be found.</p>
        <Button
          onClick={() => navigate('/admin/events')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'registrations', label: `Registrations (${eventRegistrations.length})`, icon: UserPlus },
    { id: 'attendees', label: `Attendees (${eventAttendees.length})`, icon: Users },
    { id: 'activity', label: 'Activity', icon: Clock }
  ];

  // Overview tab content
  const OverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Event Header */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              {event.is_featured && <Star size={20} style={{ color: '#f59e0b', marginRight: '8px' }} />}
              {event.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getEventStatusIcon(event)}
              <span style={{ fontWeight: '500' }}>
                {getEventStatusText(event)}
              </span>
              {event.event_type && (
                <Badge variant={getEventTypeColor(event.event_type)}>
                  {event.event_type_display || event.event_type}
                </Badge>
              )}
              {event.is_featured && (
                <Badge variant="warning">Featured</Badge>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              icon={<RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleEditEvent}
              variant="outline"
              size="sm"
              icon={<Edit size={16} />}
            >
              Edit
            </Button>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="danger"
              size="sm"
              icon={<Trash2 size={16} />}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Event Information Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <Card>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={18} /> Event Details
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#6b7280' }}>Start Date & Time:</span>
              <span>{formatEventDate(event.start_datetime)}</span>
            </div>
            
            {event.end_datetime && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>End Date & Time:</span>
                <span>{formatEventDate(event.end_datetime)}</span>
              </div>
            )}
            
            {event.start_datetime && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Time Until Event:</span>
                <span>
                  {isFuture(parseISO(event.start_datetime)) 
                    ? formatDistanceToNow(parseISO(event.start_datetime), { addSuffix: true })
                    : isPast(parseISO(event.start_datetime)) 
                      ? 'Event has passed'
                      : 'Event is today'
                  }
                </span>
              </div>
            )}

            {event.location && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Location:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />
                  {event.location}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#6b7280' }}>Event Type:</span>
              <span>{event.event_type_display || event.event_type || 'Not specified'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#6b7280' }}>Status:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getEventStatusIcon(event)}
                {getEventStatusText(event)}
              </span>
            </div>
          </div>
        </Card>

        {event.description && (
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#4b5563' }}>{event.description}</p>
          </Card>
        )}

        <Card>
          <h3 style={{ marginBottom: '16px' }}>Registration & Attendance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#6b7280' }}>Registration Required:</span>
              <span>{event.requires_registration ? 'Yes' : 'No'}</span>
            </div>
            
            {event.requires_registration && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Registration Deadline:</span>
                  <span>
                    {event.registration_deadline 
                      ? formatEventDate(event.registration_deadline)
                      : 'No deadline set'
                    }
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Max Attendees:</span>
                  <span>{event.max_capacity || 'No limit'}</span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#6b7280' }}>Current Registrations:</span>
              <span>{event.registration_count || event.registrations_count || 0}</span>
            </div>

            {event.max_capacity && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Available Spots:</span>
                <span>{Math.max(0, event.max_capacity - (event.registration_count || 0))}</span>
              </div>
            )}
          </div>
        </Card>

        {(event.organizer || event.contact_email || event.contact_phone) && (
          <Card>
            <h3 style={{ marginBottom: '16px' }}>Organizer Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {event.organizer && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Organizer:</span>
                  <span>{event.organizer}</span>
                </div>
              )}

              {event.contact_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Email:</span>
                  <a href={`mailto:${event.contact_email}`} style={{ color: '#3b82f6' }}>
                    {event.contact_email}
                  </a>
                </div>
              )}

              {event.contact_phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>Phone:</span>
                  <a href={`tel:${event.contact_phone}`} style={{ color: '#3b82f6' }}>
                    {formatPhoneNumber(event.contact_phone)}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  // Other tab contents would go here
  const RegistrationsTab = () => (
    <Card>
      <h3>Event Registrations</h3>
      <p>No registrations to display yet.</p>
    </Card>
  );

  const AttendeesTab = () => (
    <Card>
      <h3>Event Attendees</h3>
      <p>No attendees recorded yet.</p>
    </Card>
  );

  const ActivityTab = () => (
    <Card>
      <h3>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} />
          <div>
            <p>Event created</p>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {formatDate(event.created_at)}
            </span>
          </div>
        </div>
        {event.updated_at && event.updated_at !== event.created_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit size={16} />
            <div>
              <p>Event updated</p>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {formatDate(event.updated_at)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <h2>Something went wrong</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
            <Button onClick={resetError}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/admin/events')}>
              Back to Events
            </Button>
          </div>
        </div>
      )}
    >
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with back button */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/events')}
            icon={<ArrowLeft size={16} />}
            style={{ marginBottom: '16px' }}
          >
            Back to Events
          </Button>
        </div>

        {/* Tabs */}
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'registrations' && <RegistrationsTab />}
          {activeTab === 'attendees' && <AttendeesTab />}
          {activeTab === 'activity' && <ActivityTab />}
        </div>

        {/* Enhanced Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteEvent}
          title="Delete Event"
          message={
            <>
              <p>Are you sure you want to delete <strong>"{event.title}"</strong>?</p>
              {(event.registration_count || 0) > 0 && (
                <p style={{ color: '#dc2626', marginTop: '8px' }}>
                  This event has {event.registration_count} registration(s). Deleting will remove all associated data.
                </p>
              )}
              <p style={{ marginTop: '8px' }}>This action cannot be undone.</p>
            </>
          }
          confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
          loading={isSubmitting}
        />
      </div>
    </ErrorBoundary>
  );
};

export default EventDetailPage;