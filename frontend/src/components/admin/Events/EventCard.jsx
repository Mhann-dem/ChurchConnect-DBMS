// frontend/src/components/admin/Events/EventCard.jsx
import React from 'react';
import { Calendar, MapPin, Users, Clock, Edit, Trash2, Eye } from 'lucide-react';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

const EventCard = ({ event, onEdit, onDelete, onView }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'cancelled': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      service: 'Church Service',
      workshop: 'Workshop',
      meeting: 'Meeting',
      social: 'Social Event',
      outreach: 'Outreach',
      conference: 'Conference',
      retreat: 'Retreat',
      fundraiser: 'Fundraiser',
      youth: 'Youth Event',
      kids: 'Kids Event',
      seniors: 'Seniors Event',
      other: 'Other'
    };
    return types[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
              {event.title}
            </h3>
            <div className="flex gap-2 mb-2">
              <Badge color={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              <Badge color="blue" variant="outline">
                {getTypeLabel(event.event_type)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {event.requires_registration && (
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>
                {event.registration_count}
                {event.max_capacity ? ` / ${event.max_capacity}` : ''} registered
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(event)}
            className="flex items-center gap-1"
          >
            <Eye size={16} />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(event)}
            className="flex items-center gap-1"
          >
            <Edit size={16} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(event.id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;