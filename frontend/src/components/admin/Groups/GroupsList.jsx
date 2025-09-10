// Enhanced GroupsList.jsx
import React, { useState, useMemo } from 'react';
import { 
  Users, Calendar, MapPin, Mail, Phone, Edit, Trash2, Eye, MoreVertical,
  Grid, List, ChevronLeft, ChevronRight, Filter, AlertCircle, Crown,
  Clock, Globe, Lock, UserCheck, TrendingUp, Activity
} from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import LoadingSpinner from '../../shared/LoadingSpinner';
import Pagination from '../../shared/Pagination';
import EmptyState from '../../shared/EmptyState';
import styles from './Groups.module.css';

const GroupsList = ({ 
  groups = [], 
  loading = false, 
  viewMode = 'grid', 
  onEdit, 
  onView, 
  onDelete,
  pagination,
  onPageChange,
  emptyMessage = 'No groups found',
  emptyAction = null
}) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle group selection
  const handleGroupSelect = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map(group => group.id));
    }
  };

  // Get status badge
  const getStatusBadge = (group) => {
    if (!group.active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const now = new Date();
    const endDate = group.end_date ? new Date(group.end_date) : null;
    
    if (endDate && endDate < now) {
      return <Badge variant="warning">Ended</Badge>;
    }
    
    return <Badge variant="success">Active</Badge>;
  };

  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'ministry': 'primary',
      'small-group': 'secondary',
      'committee': 'warning',
      'service': 'info',
      'youth': 'success',
      'seniors': 'purple',
      'worship': 'pink',
      'outreach': 'orange',
      'prayer': 'blue',
      'study': 'green',
      'support': 'red',
      'sports': 'yellow',
      'arts': 'indigo',
      'other': 'gray'
    };
    return colors[category] || 'gray';
  };

  // Format member count
  const formatMemberCount = (count, maxMembers) => {
    const memberCount = count || 0;
    if (maxMembers) {
      return `${memberCount}/${maxMembers} members`;
    }
    return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if group needs attention
  const needsAttention = (group) => {
    return !group.leader_name || !group.active || (group.member_count || 0) === 0;
  };

  if (loading && groups.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading groups...</p>
      </div>
    );
  }

  if (!loading && groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Groups Found"
        description={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={styles.groupsListContainer}>
      {/* Selection Header */}
      {groups.length > 0 && (
        <div className={styles.selectionHeader}>
          <div className={styles.selectionControls}>
            <label className={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={selectedGroups.length === groups.length && groups.length > 0}
                onChange={handleSelectAll}
                className={styles.selectAllCheckbox}
              />
              Select All ({groups.length})
            </label>
            
            {selectedGroups.length > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectedCount}>
                  {selectedGroups.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  Actions
                </Button>
              </div>
            )}
          </div>

          {showBulkActions && selectedGroups.length > 0 && (
            <div className={styles.bulkActionButtons}>
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="outline" size="sm">
                Deactivate
              </Button>
              <Button variant="danger" size="sm">
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Groups Grid/List */}
      {viewMode === 'grid' ? (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              selected={selectedGroups.includes(group.id)}
              onSelect={handleGroupSelect}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              needsAttention={needsAttention(group)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.groupsList}>
          <div className={styles.listHeader}>
            <div className={styles.listHeaderCell}>Group</div>
            <div className={styles.listHeaderCell}>Category</div>
            <div className={styles.listHeaderCell}>Leader</div>
            <div className={styles.listHeaderCell}>Members</div>
            <div className={styles.listHeaderCell}>Status</div>
            <div className={styles.listHeaderCell}>Actions</div>
          </div>
          
          {groups.map((group) => (
            <GroupListItem
              key={group.id}
              group={group}
              selected={selectedGroups.includes(group.id)}
              onSelect={handleGroupSelect}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              needsAttention={needsAttention(group)}
            />
          ))}
        </div>
      )}

      {/* Loading overlay for refresh */}
      {loading && groups.length > 0 && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.count}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
          className={styles.pagination}
        />
      )}
    </div>
  );
};

// Group Card Component
const GroupCard = ({ 
  group, 
  selected, 
  onSelect, 
  onView, 
  onEdit, 
  onDelete, 
  needsAttention = false 
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleCardClick = (e) => {
    if (e.target.type === 'checkbox' || e.target.closest('.actions')) return;
    onView?.(group);
  };

  return (
    <Card 
      className={`${styles.groupCard} ${selected ? styles.selected : ''} ${needsAttention ? styles.needsAttention : ''}`}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(group.id)}
            className={styles.cardCheckbox}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className={styles.groupTitleSection}>
            <h3 className={styles.groupName}>
              {group.name}
              {needsAttention && (
                <AlertCircle size={16} className={styles.attentionIcon} />
              )}
            </h3>
            <div className={styles.cardBadges}>
              {getStatusBadge(group)}
              {group.category && (
                <Badge variant={getCategoryColor(group.category)}>
                  {group.category.replace('-', ' ')}
                </Badge>
              )}
              {!group.is_public && (
                <Badge variant="secondary">
                  <Lock size={12} />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div 
          className={`${styles.cardActions} actions`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(group);
            }}
          >
            <Eye size={16} />
          </Button>
          
          <div className={styles.dropdownContainer}>
            <Button
              variant="ghost"
              size="sm"
              className={styles.dropdownTrigger}
            >
              <MoreVertical size={16} />
            </Button>
            
            {showActions && (
              <div className={styles.dropdownMenu}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(group);
                  }}
                  className={styles.dropdownItem}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(group.id, group.name);
                  }}
                  className={`${styles.dropdownItem} ${styles.danger}`}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        {group.description && (
          <p className={styles.groupDescription}>
            {group.description.length > 150 
              ? `${group.description.substring(0, 150)}...`
              : group.description
            }
          </p>
        )}

        <div className={styles.groupDetails}>
          {/* Leader */}
          <div className={styles.detailRow}>
            <Crown size={16} className={styles.detailIcon} />
            <span className={styles.detailText}>
              {group.leader_name || (
                <span className={styles.missingInfo}>No leader assigned</span>
              )}
            </span>
          </div>

          {/* Members */}
          <div className={styles.detailRow}>
            <Users size={16} className={styles.detailIcon} />
            <span className={styles.detailText}>
              {formatMemberCount(group.member_count, group.max_members)}
            </span>
          </div>

          {/* Schedule */}
          {group.meeting_schedule && (
            <div className={styles.detailRow}>
              <Clock size={16} className={styles.detailIcon} />
              <span className={styles.detailText}>{group.meeting_schedule}</span>
            </div>
          )}

          {/* Location */}
          {group.meeting_location && (
            <div className={styles.detailRow}>
              <MapPin size={16} className={styles.detailIcon} />
              <span className={styles.detailText}>{group.meeting_location}</span>
            </div>
          )}

          {/* Contact */}
          {(group.contact_email || group.contact_phone) && (
            <div className={styles.contactInfo}>
              {group.contact_email && (
                <div className={styles.detailRow}>
                  <Mail size={16} className={styles.detailIcon} />
                  <span className={styles.detailText}>{group.contact_email}</span>
                </div>
              )}
              {group.contact_phone && (
                <div className={styles.detailRow}>
                  <Phone size={16} className={styles.detailIcon} />
                  <span className={styles.detailText}>{group.contact_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.footerLeft}>
          {group.tags && group.tags.length > 0 && (
            <div className={styles.tagList}>
              {group.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge variant="outline" size="sm">
                  +{group.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.footerRight}>
          <span className={styles.createdDate}>
            Created {formatDate(group.created_at)}
          </span>
        </div>
      </div>
    </Card>
  );
};

// Group List Item Component
const GroupListItem = ({ 
  group, 
  selected, 
  onSelect, 
  onView, 
  onEdit, 
  onDelete, 
  needsAttention = false 
}) => {
  return (
    <div 
      className={`${styles.listItem} ${selected ? styles.selected : ''} ${needsAttention ? styles.needsAttention : ''}`}
      onClick={() => onView?.(group)}
    >
      <div className={styles.listCell}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(group.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className={styles.groupInfo}>
          <strong className={styles.groupName}>
            {group.name}
            {needsAttention && (
              <AlertCircle size={16} className={styles.attentionIcon} />
            )}
          </strong>
          {group.description && (
            <p className={styles.groupDescription}>
              {group.description.length > 100 
                ? `${group.description.substring(0, 100)}...`
                : group.description
              }
            </p>
          )}
        </div>
      </div>
      
      <div className={styles.listCell}>
        {group.category && (
          <Badge variant={getCategoryColor(group.category)}>
            {group.category.replace('-', ' ')}
          </Badge>
        )}
      </div>
      
      <div className={styles.listCell}>
        {group.leader_name || (
          <span className={styles.missingInfo}>No leader</span>
        )}
      </div>
      
      <div className={styles.listCell}>
        {formatMemberCount(group.member_count, group.max_members)}
      </div>
      
      <div className={styles.listCell}>
        {getStatusBadge(group)}
      </div>
      
      <div className={styles.listCell}>
        <div className={styles.listActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(group);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(group.id, group.name);
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function moved outside component
const getStatusBadge = (group) => {
  if (!group.active) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  
  const now = new Date();
  const endDate = group.end_date ? new Date(group.end_date) : null;
  
  if (endDate && endDate < now) {
    return <Badge variant="warning">Ended</Badge>;
  }
  
  return <Badge variant="success">Active</Badge>;
};

const getCategoryColor = (category) => {
  const colors = {
    'ministry': 'primary',
    'small-group': 'secondary',
    'committee': 'warning',
    'service': 'info',
    'youth': 'success',
    'seniors': 'purple',
    'worship': 'pink',
    'outreach': 'orange',
    'prayer': 'blue',
    'study': 'green',
    'support': 'red',
    'sports': 'yellow',
    'arts': 'indigo',
    'other': 'gray'
  };
  return colors[category] || 'gray';
};

export default GroupsList;