// Dashboard/RecentMembers.jsx
import React, { useState, useMemo } from 'react'; // Added useMemo import
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarDaysIcon, 
  UserIcon, 
  MapPinIcon,
  ClockIcon,
  EyeIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../shared/LoadingSpinner';

const RecentMembers = ({ 
  members = [], 
  loading = false, 
  onMemberClick,
  maxItems = 5 
}) => {
  const [viewMode, setViewMode] = useState('list');

  const membersList = useMemo(() => {
    if (Array.isArray(members)) {
      return members;
    }
    if (members?.results && Array.isArray(members.results)) {
      return members.results;
    }
    return [];
  }, [members]);

  // Format member name with preferred name handling
  const formatMemberName = (member) => {
    if (member.preferred_name) {
      return `${member.preferred_name} ${member.last_name}`;
    }
    return `${member.first_name} ${member.last_name}`;
  };

  // Format registration date
  const formatRegistrationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  // Get member initials for avatar
  const getInitials = (member) => {
    const firstInitial = member.first_name?.charAt(0) || '';
    const lastInitial = member.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Get contact method info
  const getContactMethod = (member) => {
    const method = member.preferred_contact_method;
    if (method === 'email') {
      return { icon: EnvelopeIcon, label: 'Email preferred', color: 'text-blue-600' };
    }
    if (method === 'phone') {
      return { icon: PhoneIcon, label: 'Phone preferred', color: 'text-green-600' };
    }
    return { icon: UserIcon, label: 'No preference', color: 'text-gray-500' };
  };

  // Handle member click
  const handleMemberClick = (member) => {
    if (onMemberClick) {
      onMemberClick(member.id);
    }
  };

  // Render individual member card - FIXED: Removed incorrect map function
  const renderMemberCard = (member, index) => {
    const contactMethod = getContactMethod(member);
    const ContactIcon = contactMethod.icon;

    return (
      <div 
        key={member.id || index}
        className="group cursor-pointer"
        onClick={() => handleMemberClick(member)}
      >
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200">
          {/* Member Header */}
          <div className="flex items-start space-x-3 mb-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.photo_url ? (
                <img 
                  src={member.photo_url} 
                  alt={formatMemberName(member)}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(member)}
                </div>
              )}
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {formatMemberName(member)}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMemberClick(member);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>{formatRegistrationDate(member.registration_date)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2 mb-3">
            {member.email && (
              <div className="flex items-center text-xs text-gray-600">
                <EnvelopeIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center text-xs text-gray-600">
                <PhoneIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center text-xs text-gray-600">
                <MapPinIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {member.address.length > 25 
                    ? `${member.address.substring(0, 25)}...`
                    : member.address
                  }
                </span>
              </div>
            )}
          </div>

          {/* Tags and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {member.groups && member.groups.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {member.groups.length} group{member.groups.length !== 1 ? 's' : ''}
                </span>
              )}
              {member.has_pledge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pledged
                </span>
              )}
            </div>
            
            {/* Contact Preference Indicator */}
            <div className={`flex items-center ${contactMethod.color}`} title={contactMethod.label}>
              <ContactIcon className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list view - FIXED: Use membersList instead of members
  const renderListView = () => {
    return (
      <div className="space-y-3">
        {membersList.slice(0, maxItems).map((member, index) => (
          <div 
            key={member.id || index}
            className="group cursor-pointer"
            onClick={() => handleMemberClick(member)}
          >
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.photo_url ? (
                  <img 
                    src={member.photo_url} 
                    alt={formatMemberName(member)}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(member)}
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatMemberName(member)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {formatRegistrationDate(member.registration_date)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {member.groups && member.groups.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {member.groups.length} group{member.groups.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {member.has_pledge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Pledged
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMemberClick(member);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render grid view - FIXED: Use membersList instead of members
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {membersList.slice(0, maxItems).map((member, index) => renderMemberCard(member, index))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="md" />
        <p className="mt-4 text-sm text-gray-600">Loading recent members...</p>
      </div>
    );
  }

  // Empty state - FIXED: Use membersList.length instead of members.length
  if (!membersList || membersList.length === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent members</h3>
        <p className="mt-1 text-sm text-gray-500">
          New member registrations will appear here
        </p>
        <div className="mt-6">
          <a
            href="/register"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add First Member
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with view controls */}
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="text-sm text-gray-600">
          Showing {Math.min(membersList.length, maxItems)} of {membersList.length} recent members
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md text-sm ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="List view"
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-sm ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        {viewMode === 'list' ? renderListView() : renderGridView()}
      </div>

      {/* Footer with view all button - FIXED: Use membersList.length instead of members.length */}
      {membersList.length > maxItems && (
        <div className="px-6 py-4 border-t border-gray-200">
          <a
            href="/admin/members"
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View All {membersList.length} Members
          </a>
        </div>
      )}
    </div>
  );
};

export default RecentMembers;