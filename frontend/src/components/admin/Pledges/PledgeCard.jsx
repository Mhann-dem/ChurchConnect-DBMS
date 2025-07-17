// frontend/src/components/admin/Pledges/PledgeCard.jsx

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Badge, Button, Dropdown, Avatar, Tooltip } from '../../ui';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import styles from './Pledges.module.css';

const PledgeCard = ({ pledge, onEdit, onDelete, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getFrequencyBadgeColor = (frequency) => {
    switch (frequency) {
      case 'one-time':
        return 'secondary';
      case 'weekly':
        return 'primary';
      case 'monthly':
        return 'info';
      case 'quarterly':
        return 'warning';
      case 'annually':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '✓';
      case 'completed':
        return '✓✓';
      case 'cancelled':
        return '✗';
      default:
        return '?';
    }
  };

  const calculateProgress = () => {
    if (!pledge.start_date || !pledge.end_date) return 0;
    
    const start = new Date(pledge.start_date);
    const end = new Date(pledge.end_date);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const calculateTotalPledged = () => {
    if (pledge.frequency === 'one-time') {
      return pledge.amount;
    }
    
    if (!pledge.start_date || !pledge.end_date) {
      return pledge.amount;
    }
    
    const start = new Date(pledge.start_date);
    const end = new Date(pledge.end_date);
    const monthsDiff = ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
    
    switch (pledge.frequency) {
      case 'weekly':
        return pledge.amount * Math.ceil(monthsDiff * 4.33);
      case 'monthly':
        return pledge.amount * monthsDiff;
      case 'quarterly':
        return pledge.amount * Math.ceil(monthsDiff / 3);
      case 'annually':
        return pledge.amount * Math.ceil(monthsDiff / 12);
      default:
        return pledge.amount;
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <Card className={`${styles.pledgeCard} ${pledge.status === 'cancelled' ? styles.cancelled : ''}`}>
      <div className={styles.pledgeHeader}>
        <div className={styles.memberInfo}>
          <Avatar 
            src={pledge.member?.photo_url} 
            name={pledge.member?.name || pledge.member_name}
            size="md"
          />
          <div className={styles.memberDetails}>
            <h3 className={styles.memberName}>
              {pledge.member?.name || pledge.member_name}
            </h3>
            <p className={styles.memberEmail}>
              {pledge.member?.email}
            </p>
          </div>
        </div>
        
        <div className={styles.statusSection}>
          <Badge 
            color={getStatusBadgeColor(pledge.status)}
            className={styles.statusBadge}
          >
            {getStatusIcon(pledge.status)} {pledge.status}
          </Badge>
          
          <Dropdown
            value={pledge.status}
            onChange={(newStatus) => onUpdateStatus(pledge.id, newStatus)}
            options={statusOptions}
            variant="minimal"
            className={styles.statusDropdown}
          />
        </div>
      </div>

      <div className={styles.pledgeDetails}>
        <div className={styles.amountSection}>
          <div className={styles.amountInfo}>
            <span className={styles.amount}>
              {formatCurrency(pledge.amount)}
            </span>
            <Badge 
              color={getFrequencyBadgeColor(pledge.frequency)}
              className={styles.frequencyBadge}
            >
              {pledge.frequency}
            </Badge>
          </div>
          
          {pledge.frequency !== 'one-time' && (
            <div className={styles.totalPledged}>
              <Tooltip content="Total pledged amount over the entire period">
                <span className={styles.totalAmount}>
                  Total: {formatCurrency(calculateTotalPledged())}
                </span>
              </Tooltip>
            </div>
          )}
        </div>

        <div className={styles.dateSection}>
          <div className={styles.dateInfo}>
            <span className={styles.dateLabel}>Start:</span>
            <span className={styles.dateValue}>
              {formatDate(pledge.start_date)}
            </span>
          </div>
          
          {pledge.end_date && (
            <div className={styles.dateInfo}>
              <span className={styles.dateLabel}>End:</span>
              <span className={styles.dateValue}>
                {formatDate(pledge.end_date)}
              </span>
            </div>
          )}
        </div>

        {pledge.frequency !== 'one-time' && pledge.end_date && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <span>Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {pledge.notes && (
        <div className={styles.notesSection}>
          <p className={styles.notes}>
            {isExpanded ? pledge.notes : `${pledge.notes.substring(0, 100)}${pledge.notes.length > 100 ? '...' : ''}`}
          </p>
          {pledge.notes.length > 100 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={styles.expandButton}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      )}

      <div className={styles.pledgeFooter}>
        <div className={styles.timestampInfo}>
          <span className={styles.timestamp}>
            Created {formatDistanceToNow(new Date(pledge.created_at), { addSuffix: true })}
          </span>
        </div>
        
        <div className={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(pledge)}
          >
            Edit
          </Button>
          
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(pledge.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PledgeCard;