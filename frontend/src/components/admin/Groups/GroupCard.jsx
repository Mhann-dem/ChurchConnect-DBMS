import React, { useState } from 'react';
import { Users, Calendar, MapPin, Edit, Trash2, MoreHorizontal, Eye, Clock } from 'lucide-react';
import styles from './Groups.module.css';

const GroupCard = ({ group, onView, onEdit, onDelete, viewMode = 'cards' }) => {
  const [showActions, setShowActions] = useState(false);

  const handleActionClick = (action, e) => {
    e.stopPropagation();
    setShowActions(false);
    
    switch (action) {
      case 'view':
        onView(group);
        break;
      case 'edit':
        onEdit(group);
        break;
      case 'delete':
        onDelete(group);
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (active) => {
    return active ? styles.statusActive : styles.statusInactive;
  };

  const getStatusText = (active) => {
    return active ? 'Active' : 'Inactive';
  };

  if (viewMode === 'list') {
    return (
      <div className={styles.groupListItem} onClick={() => onView(group)}>
        <div className={styles.groupMainInfo}>
          <div className={styles.groupHeader}>
            <h3 className={styles.groupName}>{group.name}</h3>
            <span className={`${styles.status} ${getStatusColor(group.active)}`}>
              {getStatusText(group.active)}
            </span>
          </div>
          <p className={styles.groupDescription}>{group.description}</p>
        </div>
        
        <div className={styles.groupDetails}>
          <div className={styles.groupDetail}>
            <Users size={14} />
            <span>{group.member_count || 0} members</span>
          </div>
          {group.leader_name && (
            <div className={styles.groupDetail}>
              <span className={styles.leader}>Leader: {group.leader_name}</span>
            </div>
          )}
          {group.meeting_schedule && (
            <div className={styles.groupDetail}>
              <Calendar size={14} />
              <span>{group.meeting_schedule}</span>
            </div>
          )}
        </div>
        
        <div className={styles.groupActions}>
          <button
            className={styles.actionButton}
            onClick={(e) => handleActionClick('view', e)}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className={styles.actionButton}
            onClick={(e) => handleActionClick('edit', e)}
            title="Edit Group"
          >
            <Edit size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={(e) => handleActionClick('delete', e)}
            title="Delete Group"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.groupCard} onClick={() => onView(group)}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h3 className={styles.groupName}>{group.name}</h3>
          <span className={`${styles.status} ${getStatusColor(group.active)}`}>
            {getStatusText(group.active)}
          </span>
        </div>
        
        <div className={styles.cardActions}>
          <button
            className={styles.moreButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          
          {showActions && (
            <div className={styles.actionsDropdown}>
              <button
                className={styles.dropdownItem}
                onClick={(e) => handleActionClick('view', e)}
              >
                <Eye size={14} />
                View Details
              </button>
              <button
                className={styles.dropdownItem}
                onClick={(e) => handleActionClick('edit', e)}
              >
                <Edit size={14} />
                Edit Group
              </button>
              <button
                className={`${styles.dropdownItem} ${styles.deleteItem}`}
                onClick={(e) => handleActionClick('delete', e)}
              >
                <Trash2 size={14} />
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <p className={styles.groupDescription}>
          {group.description || 'No description available'}
        </p>
        
        <div className={styles.groupMeta}>
          <div className={styles.metaItem}>
            <Users size={16} />
            <span>{group.member_count || 0} members</span>
          </div>
          
          {group.leader_name && (
            <div className={styles.metaItem}>
              <span className={styles.leader}>
                Leader: {group.leader_name}
              </span>
            </div>
          )}
          
          {group.meeting_schedule && (
            <div className={styles.metaItem}>
              <Calendar size={16} />
              <span>{group.meeting_schedule}</span>
            </div>
          )}
          
          <div className={styles.metaItem}>
            <Clock size={16} />
            <span>Created {formatDate(group.created_at)}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.cardFooter}>
        <button
          className={styles.viewButton}
          onClick={(e) => handleActionClick('view', e)}
        >
          View Details
        </button>
        
        <div className={styles.quickActions}>
          <button
            className={styles.quickAction}
            onClick={(e) => handleActionClick('edit', e)}
            title="Edit Group"
          >
            <Edit size={14} />
          </button>
          <button
            className={`${styles.quickAction} ${styles.deleteAction}`}
            onClick={(e) => handleActionClick('delete', e)}
            title="Delete Group"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;