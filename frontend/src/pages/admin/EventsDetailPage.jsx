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
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Tabs from '../../components/ui/Tabs';
import eventsService from '../../services/events';
import { validateId } from '../../utils/validation';
import { formatDate, formatPhoneNumber } from '../../utils/formatters';
import styles from './AdminPages.module.css';

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
        return <CheckCircle size={16} className={styles.statusCompleted} />;
      }
      if (event.start_datetime && isToday(parseISO(event.start_datetime))) {
        return <Clock size={16} className={styles.statusToday} />;
      }
      if (event.start_datetime && isFuture(parseISO(event.start_datetime))) {
        return <Calendar size={16} className={styles.statusUpcoming} />;
      }
      return <CheckCircle size={16} className={styles.statusActive} />;
    }
    if (event.status === 'cancelled') {
      return <XCircle size={16} className={styles.statusCancelled} />;
    }
    return <AlertCircle size={16} className={styles.statusDraft} />;
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
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading event details...</p>
      </div>
    );
  }

  // Error state
  if (errors.event && !event) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Event</h2>
        <p>{errors.event}</p>
        <div className={styles.errorActions}>
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
      <div className={styles.errorContainer}>
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
    <div className={styles.eventOverview}>
      {/* Event Header */}
      <div className={styles.eventHeader}>
        <div className={styles.eventInfo}>
          <div className={styles.eventTitle}>
            <h2>
              {event.is_featured && <Star size={20} className={styles.featuredIcon} />}
              {event.title}
            </h2>
            <div className={styles.eventMeta}>
              {getEventStatusIcon(event)}
              <span className={styles.statusText}>
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
        </div>
      </div>

      {/* Event Information Cards */}
      <div className={styles.eventGrid}>
        <Card className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <h3><Calendar size={18} /> Event Details</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Start Date & Time:</span>
              <span className={styles.value}>
                {formatEventDate(event.start_datetime)}
              </span>
            </div>
            
            {event.end_datetime && (
              <div className={styles.infoRow}>
                <span className={styles.label}>End Date & Time:</span>
                <span className={styles.value}>
                  {formatEventDate(event.end_datetime)}
                </span>
              </div>
            )}
            
            {event.start_datetime && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Time Until Event:</span>
                <span className={styles.value}>
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
              <div className={styles.infoRow}>
                <span className={styles.label}>Location:</span>
                <span className={styles.value}>
                  <MapPin size={14} />
                  {event.location}
                </span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.label}>Event Type:</span>
              <span className={styles.value}>
                {event.event_type_display || event.event_type || 'Not specified'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Status:</span>
              <span className={styles.value}>
                {getEventStatusIcon(event)}
                {getEventStatusText(event)}
              </span>
            </div>
          </div>
        </Card>

        {event.description && (
          <Card className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3>Description</h3>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.description}>{event.description}</p>
            </div>
          </Card>
        )}

        <Card className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <h3>Registration & Attendance</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Registration Required:</span>
              <span className={styles.value}>
                {event.registration_required ? 'Yes' : 'No'}
              </span>
            </div>
            
            {event.registration_required && (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Registration Deadline:</span>
                  <span className={styles.value}>
                    {event.registration_deadline 
                      ? formatEventDate(event.registration_deadline)
                      : 'No deadline set'
                    }
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.label}>Max Attendees:</span>
                  <span className={styles.value}>
                    {event.max_attendees || 'No limit'}
                  </span>
                </div>
              </>
            )}

            <div className={styles.infoRow}>
              <span className={styles.label}>Current Registrations:</span>
              <span className={styles.value}>
                {event.registration_count || event.registrations_count || 0}
              </span>
            </div>

            {event.max_attendees && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Available Spots:</span>
                <span className={styles.value}>
                  {Math.max(0, event.max_attendees - (event.registration_count || 0))}
                </span>
              </div>
            )}
          </div>
        </Card>

        {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
          <Card className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <h3>Organizer Information</h3>
            </div>
            <div className={styles.cardBody}>
              {event.organizer_name && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Organizer:</span>
                  <span className={styles.value}>{event.organizer_name}</span>
                </div>
              )}

              {event.organizer_email && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>
                    <a href={`mailto:${event.organizer_email}`} className={styles.emailLink}>
                      {event.organizer_email}
                    </a>
                  </span>
                </div>
              )}

              {event.organizer_phone && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Phone:</span>
                  <span className={styles.value}>
                    <a href={`tel:${event.organizer_phone}`} className={styles.phoneLink}>
                      {formatPhoneNumber(event.organizer_phone)}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <h3>Event Statistics</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>
                {formatEventDate(event.created_at, false)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Last Updated:</span>
              <span className={styles.value}>
                {formatEventDate(event.updated_at, false)}
              </span>
            </div>

            {event.created_by && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Created By:</span>
                <span className={styles.value}>{event.created_by}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // Registrations tab content
  const RegistrationsTab = () => (
    <div className={styles.eventRegistrations}>
      <div className={styles.tabHeader}>
        <h3>Event Registrations</h3>
        {event.registration_required && (
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
          >
            Export Registrations
          </Button>
        )}
      </div>
      
      {errors.registrations && (
        <div className={styles.errorMessage}>
          <p>Error loading registrations: {errors.registrations}</p>
        </div>
      )}
      
      {loadingStates.registrations ? (
        <div className={styles.loadingState}>
          <LoadingSpinner size="md" />
          <p>Loading registrations...</p>
        </div>
      ) : eventRegistrations.length === 0 ? (
        <Card className={styles.emptyState}>
          <UserPlus size={48} className={styles.emptyIcon} />
          <h3>No Registrations Yet</h3>
          <p>
            {event.registration_required 
              ? 'No one has registered for this event yet.'
              : 'Registration is not required for this event.'
            }
          </p>
        </Card>
      ) : (
        <div className={styles.registrationsList}>
          {eventRegistrations.map((registration, index) => (
            <Card key={registration.id || index} className={styles.registrationCard}>
              <div className={styles.registrationInfo}>
                <Avatar 
                  src={registration.avatar} 
                  name={registration.name}
                  size="md"
                />
                <div className={styles.registrationDetails}>
                  <h4>{registration.name}</h4>
                  <p>{registration.email}</p>
                  {registration.phone && (
                    <p>{formatPhoneNumber(registration.phone)}</p>
                  )}
                  <small>
                    Registered: {formatEventDate(registration.registered_at, false)}
                  </small>
                </div>
              </div>
              <div className={styles.registrationStatus}>
                <Badge variant={registration.status === 'confirmed' ? 'success' : 'warning'}>
                  {registration.status || 'Pending'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Attendees tab content
  const AttendeesTab = () => (
    <div className={styles.eventAttendees}>
      <div className={styles.tabHeader}>
        <h3>Event Attendees</h3>
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={16} />}
        >
          Export Attendees
        </Button>
      </div>
      
      {errors.attendees && (
        <div className={styles.errorMessage}>
          <p>Error loading attendees: {errors.attendees}</p>
        </div>
      )}
      
      {loadingStates.attendees ? (
        <div className={styles.loadingState}>
          <LoadingSpinner size="md" />
          <p>Loading attendees...</p>
        </div>
      ) : eventAttendees.length === 0 ? (
        <Card className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3>No Attendees Recorded</h3>
          <p>Attendance has not been recorded for this event yet.</p>
        </Card>
      ) : (
        <div className={styles.attendeesList}>
          {eventAttendees.map((attendee, index) => (
            <Card key={attendee.id || index} className={styles.attendeeCard}>
              <div className={styles.attendeeInfo}>
                <Avatar 
                  src={attendee.avatar} 
                  name={attendee.name}
                  size="md"
                />
                <div className={styles.attendeeDetails}>
                  <h4>{attendee.name}</h4>
                  <p>{attendee.email}</p>
                  <small>
                    Attended: {formatEventDate(attendee.attended_at)}
                  </small>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Activity tab content
  const ActivityTab = () => (
    <div className={styles.eventActivity}>
      <Card>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <Calendar size={16} />
            <div>
              <p>Event created</p>
              <span className={styles.activityDate}>
                {formatEventDate(event.created_at)}
              </span>
            </div>
          </div>
          {event.updated_at && event.updated_at !== event.created_at && (
            <div className={styles.activityItem}>
              <Edit size={16} />
              <div>
                <p>Event updated</p>
                <span className={styles.activityDate}>
                  {formatEventDate(event.updated_at)}
                </span>
              </div>
            </div>
          )}
          {event.is_featured && (
            <div className={styles.activityItem}>
              <Star size={16} />
              <div>
                <p>Event featured</p>
                <span className={styles.activityDate}>
                  Promoted event
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <div className={styles.errorActions}>
            <Button onClick={resetError}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/admin/events')}>
              Back to Events
            </Button>
          </div>
        </div>
      )}
    >
      <div className={styles.pageContainer}>
        {/* Tabs */}
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className={styles.tabContent}>
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
                <p className={styles.warningText}>
                  This event has {event.registration_count} registration(s). Deleting will remove all associated data.
                </p>
              )}
              <p>This action cannot be undone.</p>
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