// Dashboard/RecentMembers.jsx
import React, { useState } from 'react';
import { Avatar, Badge, Button } from '../../ui';
import LoadingSpinner from '../../shared/LoadingSpinner';
import EmptyState from '../../shared/EmptyState';
import { 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  MapPin,
  Clock,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import styles from './Dashboard.module.css';

const RecentMembers = ({ 
  members = [], 
  loading = false, 
  onMemberClick,
  maxItems = 5 
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const formatMemberName = (member) => {
    if (member.preferred_name) {
      return `${member.preferred_name} ${member.last_name}`;
    }
    return `${member.first_name} ${member.last_name}`;
  };

  const formatRegistrationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const getInitials = (member) => {
    const firstInitial = member.first_name?.charAt(0) || '';
    const lastInitial = member.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const getContactMethod = (member) => {
    if (member.preferred_contact_method === 'email') {
      return { icon: Mail, label: 'Email preferred' };
    }
    if (member.preferred_contact_method === 'phone') {
      return { icon: Phone, label: 'Phone preferred' };
    }
    return { icon: User, label: 'No preference' };
  };

  const handleMemberClick = (member) => {
    if (onMemberClick) {
      onMemberClick(member.id);
    }
  };

  const renderMemberCard = (member, index) => {
    const contactMethod = getContactMethod(member);
    const ContactIcon = contactMethod.icon;

    return (
      <div 
        key={member.id || index}
        className={styles.memberCard}
        onClick={() => handleMemberClick(member)}
        role="button"
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleMemberClick(member);
          }
        }}
        aria-label={`View details for ${formatMemberName(member)}`}
      >
        <div className={styles.memberCardHeader}>
          <div className={styles.memberAvatar}>
            {member.photo_url ? (
              <img 
                src={member.photo_url} 
                alt={formatMemberName(member)}
                className={styles.avatarImage}
              />
            ) : (
              <Avatar 
                size="md" 
                initials={getInitials(member)}
                color="primary"
              />
            )}
          </div>
          <div className={styles.memberInfo}>
            <h4 className={styles.memberName}>
              {formatMemberName(member)}
            </h4>
            <div className={styles.memberMeta}>
              <span className={styles.registrationDate}>
                <Clock size={14} />
                {formatRegistrationDate(member.registration_date)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.memberCardBody}>
          <div className={styles.memberDetails}>
            {member.email && (
              <div className={styles.memberDetail}>
                <Mail size={14} />
                <span>{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className={styles.memberDetail}>
                <Phone size={14} />
                <span>{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className={styles.memberDetail}>
                <MapPin size={14} />
                <span className={styles.memberAddress}>
                  {member.address.length > 30 
                    ? `${member.address.substring(0, 30)}...`
                    : member.address
                  }
                </span>
              </div>
            )}
          </div>

          <div className={styles.memberTags}>
            {member.groups && member.groups.length > 0 && (
              <Badge variant="secondary" size="sm">
                {member.groups.length} group{member.groups.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {member.has_pledge && (
              <Badge variant="success" size="sm">
                Pledged
              </Badge>
            )}
            <div className={styles.contactPreference}>
              <ContactIcon size={12} />
              <span className={styles.contactLabel}>
                {contactMethod.label}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.memberCardFooter}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.viewButton}
            onClick={(e) => {
              e.stopPropagation();
              handleMemberClick(member);
            }}
          >
            <Eye size={14} />
            View Details
          </Button>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className={styles.membersList}>
        {members.slice(0, maxItems).map(renderMemberCard)}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className={styles.membersGrid}>
        {members.slice(0, maxItems).map(renderMemberCard)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.recentMembersLoading}>
        <LoadingSpinner size="md" />
        <p>Loading recent members...</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="No recent members"
        description="New member registrations will appear here"
        action={
          <Button variant="primary" size="sm">
            Add First Member
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.recentMembers}>
      <div className={styles.recentMembersHeader}>
        <div className={styles.memberCount}>
          <span>
            Showing {Math.min(members.length, maxItems)} of {members.length} recent members
          </span>
        </div>
        <div className={styles.viewControls}>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={styles.viewButton}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={styles.viewButton}
          >
            Grid
          </Button>
        </div>
      </div>

      <div className={styles.recentMembersContent}>
        {viewMode === 'list' ? renderListView() : renderGridView()}
      </div>

      {members.length > maxItems && (
        <div className={styles.recentMembersFooter}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/admin/members'}
            className={styles.viewAllButton}
          >
            View All {members.length} Members
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentMembers;