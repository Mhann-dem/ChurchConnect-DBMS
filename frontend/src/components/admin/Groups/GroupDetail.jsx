// src/components/admin/Groups/GroupDetail.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../../utils/formatters';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import { Button, Card, Badge, Avatar } from '../../ui';
import styles from './Groups.module.css';

const GroupDetail = ({ group, onClose, onUpdate }) => {
  const { members, loading, error } = useMembers();
  const { showToast } = useToast();

  // Filter members belonging to this group
  const groupMembers = members.filter(member => 
    member.groups?.some(g => g.id === group.id)
  );

  const handleRemoveMember = async (memberId) => {
    try {
      // API call to remove member from group would go here
      showToast('Member removed from group', 'success');
      onUpdate(); // Refresh group data
    } catch (err) {
      showToast('Failed to remove member', 'error');
    }
  };

  if (error) {
    return (
      <Card>
        <div className={styles.errorState}>
          Error loading group members: {error.message}
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.groupDetail}>
      <div className={styles.groupHeader}>
        <div>
          <h2>{group.name}</h2>
          <p className={styles.groupMeta}>
            <Badge variant={group.active ? 'success' : 'neutral'}>
              {group.active ? 'Active' : 'Inactive'}
            </Badge>
            <span>Created: {formatDate(group.created_at)}</span>
            <span>{groupMembers.length} members</span>
          </p>
          {group.description && (
            <p className={styles.groupDescription}>{group.description}</p>
          )}
        </div>
        <Button onClick={onClose} variant="ghost">
          Close
        </Button>
      </div>

      <div className={styles.groupContent}>
        <section className={styles.groupInfo}>
          <h3>Group Information</h3>
          <div className={styles.infoGrid}>
            <div>
              <label>Leader</label>
              <p>{group.leader_name || 'Not specified'}</p>
            </div>
            <div>
              <label>Meeting Schedule</label>
              <p>{group.meeting_schedule || 'Not specified'}</p>
            </div>
            <div>
              <label>Contact Email</label>
              <p>{group.contact_email || 'Not specified'}</p>
            </div>
          </div>
        </section>

        <section className={styles.memberSection}>
          <div className={styles.sectionHeader}>
            <h3>Group Members</h3>
          </div>
          
          {loading ? (
            <div className={styles.loadingState}>
              Loading members...
            </div>
          ) : groupMembers.length === 0 ? (
            <div className={styles.emptyState}>
              No members in this group
            </div>
          ) : (
            <div className={styles.memberListContainer}>
              <div className={styles.memberListHeader}>
                <span>Name</span>
                <span>Join Date</span>
                <span>Role</span>
                <span>Actions</span>
              </div>
              {groupMembers.map(member => (
                <div key={member.id} className={styles.memberListItem}>
                  <div className={styles.memberCell}>
                    <Avatar 
                      src={member.photo_url} 
                      name={member.name} 
                      size="sm"
                    />
                    <span>{member.name}</span>
                  </div>
                  <div>{formatDate(member.join_date)}</div>
                  <div>{member.role || 'Member'}</div>
                  <div>
                    <Button 
                      size="sm" 
                      variant="danger-outline"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

GroupDetail.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    active: PropTypes.bool,
    created_at: PropTypes.string,
    leader_name: PropTypes.string,
    meeting_schedule: PropTypes.string,
    contact_email: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default GroupDetail;