// frontend/src/components/admin/Events/EventsList.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, MapPin, Clock, Filter } from 'lucide-react';
import { useEvents } from '../../../hooks/useEvents';
import EventCard from './EventCard';
import EventForm from './EventForm';
import Modal from '../../shared/Modal';
import Button from '../../ui/Button';
import SearchBar from '../../shared/SearchBar';

const EventsList = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    event_type: 'all',
    timeframe: 'upcoming'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { events, loading, error, fetchEvents, deleteEvent } = useEvents();

  useEffect(() => {
    fetchEvents(filters);
  }, [filters, fetchEvents]);

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedEvent(null);
    fetchEvents(filters);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage church events and registrations</p>
        </div>
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <Plus size={20} />
          Create Event
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search events..."
        />
        
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.event_type}
            onChange={(e) => setFilters(prev => ({ ...prev, event_type: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="service">Church Service</option>
            <option value="workshop">Workshop</option>
            <option value="meeting">Meeting</option>
            <option value="social">Social Event</option>
            <option value="outreach">Outreach</option>
            <option value="conference">Conference</option>
            <option value="retreat">Retreat</option>
            <option value="fundraiser">Fundraiser</option>
            <option value="youth">Youth Event</option>
            <option value="kids">Kids Event</option>
            <option value="seniors">Seniors Event</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filters.timeframe}
            onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Events</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">Create your first event to get started</p>
          <Button onClick={handleCreateEvent}>Create Event</Button>
        </div>
      )}

      {/* Event Form Modal */}
      <Modal isOpen={showForm} onClose={handleFormClose} title={selectedEvent ? 'Edit Event' : 'Create Event'}>
        <EventForm event={selectedEvent} onClose={handleFormClose} />
      </Modal>
    </div>
  );
};

export default EventsList;