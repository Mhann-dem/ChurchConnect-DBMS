// ===============================
// FIXED src/components/admin/Members/MemberCard.jsx
// ===============================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Avatar } from '../../ui';
import { Mail, Phone, Calendar, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { formatPhoneNumber } from '../../../utils/formatters';
import styles from './Members.module.css';

// Add this function at the top of the file or import it from formatters
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MemberCard = ({ 
  member, 
  isSelected, 
  onSelect, 
  onDelete, 
  onStatusChange 
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest(`.${styles.cardActions}`)) {
      return;
    }
    navigate(`/admin/members/${member.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`${styles.memberCard} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.memberInfo} onClick={handleCardClick}>
          <Avatar
            src={member.photo_url}
            alt={`${member.first_name} ${member.last_name}`}
            size="md"
            className={styles.avatar}
          />
          <div className={styles.memberDetails}>
            <h3 className={styles.memberName}>
              {member.first_name} {member.last_name}
            </h3>
            {member.preferred_name && (
              <p className={styles.preferredName}>
                "{member.preferred_name}"
              </p>
            )}
            <Badge 
              variant={getStatusColor(member.status)}
              className={styles.statusBadge}
            >
              {member.status}
            </Badge>
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className={styles.checkbox}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/members/${member.id}/edit`)}
            className={styles.actionButton}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className={styles.actionButton}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className={styles.cardBody} onClick={handleCardClick}>
        <div className={styles.contactInfo}>
          <div className={styles.contactItem}>
            <Mail size={14} />
            <span>{member.email}</span>
          </div>
          <div className={styles.contactItem}>
            <Phone size={14} />
            <span>{formatPhoneNumber(member.phone)}</span>
          </div>
          <div className={styles.contactItem}>
            <Calendar size={14} />
            <span>Joined {formatDate(member.registration_date)}</span>
          </div>
        </div>

        {member.groups && member.groups.length > 0 && (
          <div className={styles.groupInfo}>
            <Users size={14} />
            <div className={styles.groupList}>
              {member.groups.slice(0, 2).map(group => (
                <Badge key={group.id} variant="secondary" size="sm">
                  {group.name}
                </Badge>
              ))}
              {member.groups.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{member.groups.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {member.pledge_amount && (
          <div className={styles.pledgeInfo}>
            <span className={styles.pledgeAmount}>
              ${member.pledge_amount}/{member.pledge_frequency}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MemberCard;