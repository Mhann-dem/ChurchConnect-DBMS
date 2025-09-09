import React from 'react';
import { Users, Calendar, MapPin, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import styles from './Groups.module.css';

const GroupCard = ({ group, onView, onEdit, onDelete, viewMode = 'cards' }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (active) => {
    return active ? '#10b981' : '#ef4444';
  };

  // Get member count display
  const getMemberCountDisplay = (count) => {
    if (count === 0) return '0 members';
    if (count === 1) return '1 member';
    return `${count || 0} members`;
  };

  // Handle action clicks
  const handleView = (e) => {
    e.stopPropagation();
    onView?.(group);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(group);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(group);
  };

  const handleCardClick = () => {
    onView?.(group);
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={`${styles.groupListItem} ${!group.active ? styles.inactive : ''}`}
        onClick={handleCardClick}
      >
        <div className={styles.groupInfo}>
          <div className={styles.groupHeader}>
            <h3 className={styles.groupName}>{group.name}</h3>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(group.active) }}
            >
              {group.active ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div className={styles.groupMeta}>
            {group.description && (
              <p className={styles.groupDescription}>
                {group.description.length > 150 
                  ? `${group.description.substring(0, 150)}...`
                  : group.description
                }
              </p>
            )}
            
            <div className={styles.groupDetails}>
              <div className={styles.detailItem}>
                <Users size={14} />
                <span>{getMemberCountDisplay(group.member_count)}</span>
              </div>
              
              {group.leader_name && (
                <div className={styles.detailItem}>
                  <span className={styles.leader}>Leader: {group.leader_name}</span>
                </div>
              )}
              
              {group.meeting_schedule && (
                <div className={styles.detailItem}>
                  <Calendar size={14} />
                  <span>{group.meeting_schedule}</span>
                </div>
              )}
              
              <div className={styles.detailItem}>
                <span className={styles.created}>
                  Created: {formatDate(group.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.groupActions}>
          <button
            className={styles.actionButton}
            onClick={handleView}
            title="View details"
          >
            <Eye size={16} />
          </button>
          <button
            className={styles.actionButton}
            onClick={handleEdit}
            title="Edit group"
          >
            <Edit size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={handleDelete}
            title="Delete group"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Card view (default)
  return (
    <div 
      className={`${styles.groupCard} ${!group.active ? styles.inactive : ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h3>{group.name}</h3>
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(group.active) }}
          >
            {group.active ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <button
            className={styles.actionButton}
            onClick={handleEdit}
            title="Edit group"
          >
            <Edit size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={handleDelete}
            title="Delete group"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className={styles.cardBody}>
        {group.description && (
          <p className={styles.description}>
            {group.description.length > 100 
              ? `${group.description.substring(0, 100)}...`
              : group.description
            }
          </p>
        )}
        
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <Users size={16} />
            <span>{getMemberCountDisplay(group.member_count)}</span>
          </div>
          
          {group.leader_name && (
            <div className={styles.statItem}>
              <span className={styles.leader}>
                <strong>Leader:</strong> {group.leader_name}
              </span>
            </div>
          )}
        </div>
        
        {group.meeting_schedule && (
          <div className={styles.cardDetail}>
            <Calendar size={14} />
            <span>{group.meeting_schedule}</span>
          </div>
        )}
        
        <div className={styles.cardFooter}>
          <span className={styles.createdDate}>
            Created: {formatDate(group.created_at)}
          </span>
          
          {group.category && (
            <span className={styles.category}>
              {group.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;