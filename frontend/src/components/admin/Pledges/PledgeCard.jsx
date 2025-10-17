// PledgeCard.jsx - COMPLETE FIX for status updates
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { Card, Badge, Button, Dropdown, Avatar, Tooltip } from '../../ui';
import { formatCurrency, formatDate, formatPercentage } from '../../../utils/formatters';
import { Loader, CheckCircle } from 'lucide-react';
import styles from './Pledges.module.css';

const PledgeCard = ({ 
  pledge, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onAddPayment, 
  showPaymentHistory,
  hideHeader = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(pledge?.status || 'active');
  const [statusError, setStatusError] = useState(null);
  
  // ✅ CRITICAL FIX: Sync status when pledge prop changes
  useEffect(() => {
    if (pledge?.status && pledge.status !== currentStatus) {
      console.log('[PledgeCard] 🔄 Status synced from props:', pledge.status);
      setCurrentStatus(pledge.status);
      setStatusError(null);
    }
  }, [pledge?.status]);

  // Extract pledge data safely
  const {
    id,
    member,
    member_details,
    member_name,
    member_id,
    amount = 0,
    frequency = 'monthly',
    start_date,
    end_date,
    notes = '',
    created_at,
    updated_at,
    total_pledged = 0,
    total_received = 0,
    last_payment_date,
    next_payment_date,
    payments_count = 0,
    is_overdue = false,
    days_until_next_payment = null,
    payment_history = []
  } = pledge || {};

  // ✅ COMPLETE FIX: Status update with error handling and rollback
  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || !onUpdateStatus) return;
    
    console.log('[PledgeCard] 🔵 Changing status:', currentStatus, '->', newStatus);
    
    // Save previous status for rollback
    const previousStatus = currentStatus;
    
    // Optimistic update
    setCurrentStatus(newStatus);
    setIsUpdatingStatus(true);
    setStatusError(null);
    
    try {
      // ✅ Call the update function
      await onUpdateStatus(id, newStatus);
      console.log('[PledgeCard] ✅ Status updated successfully');
      
      // ✅ Show success feedback
      setTimeout(() => {
        setIsUpdatingStatus(false);
      }, 500);
      
    } catch (error) {
      console.error('[PledgeCard] ❌ Status update failed:', error);
      
      // ✅ Rollback on error
      setCurrentStatus(previousStatus);
      setStatusError(error.message || 'Failed to update status');
      
      // Show error briefly then clear
      setTimeout(() => {
        setStatusError(null);
      }, 3000);
      
      setIsUpdatingStatus(false);
    }
  };

  // Calculate derived values
  const totalPledgedAmount = total_pledged || (frequency === 'one-time' ? amount : calculateTotalPledged());
  const totalReceivedAmount = total_received || 0;
  const remainingAmount = totalPledgedAmount - totalReceivedAmount;
  const completionPercentage = totalPledgedAmount > 0 ? (totalReceivedAmount / totalPledgedAmount) * 100 : 0;
  
  // Get member display name
  const getMemberDisplayName = () => {
    if (member_details?.full_name) return member_details.full_name;
    if (member_details?.name) return member_details.name;
    if (member?.full_name) return member.full_name;
    if (member?.name) return member.name;
    
    if (member?.first_name || member?.last_name) {
      return `${member.first_name || ''} ${member.last_name || ''}`.trim();
    }
    if (member_details?.first_name || member_details?.last_name) {
      return `${member_details.first_name || ''} ${member_details.last_name || ''}`.trim();
    }
    
    if (member_name) return member_name;
    
    return 'Unknown Member';
  };

  // Status badge color
  const getStatusBadgeColor = (statusValue) => {
    switch (statusValue?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Frequency badge color
  const getFrequencyBadgeColor = (frequency) => {
    switch (frequency?.toLowerCase()) {
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

  // Status icon
  const getStatusIcon = (statusValue) => {
    switch (statusValue?.toLowerCase()) {
      case 'active':
        return '✓';
      case 'completed':
        return '✓✓';
      case 'cancelled':
        return '✗';
      case 'overdue':
        return '⚠';
      default:
        return '?';
    }
  };

  // Frequency display
  const getFrequencyDisplayText = (frequency) => {
    const frequencyMap = {
      'one-time': 'One-time',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annually': 'Annually'
    };
    return frequencyMap[frequency?.toLowerCase()] || frequency;
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!start_date || !end_date || frequency === 'one-time') {
      return completionPercentage;
    }
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // Calculate total pledged
  function calculateTotalPledged() {
    if (frequency === 'one-time' || !start_date || !end_date) {
      return amount;
    }
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    const monthsDiff = ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
    
    switch (frequency?.toLowerCase()) {
      case 'weekly':
        return amount * Math.ceil(monthsDiff * 4.33);
      case 'monthly':
        return amount * Math.max(1, monthsDiff);
      case 'quarterly':
        return amount * Math.ceil(monthsDiff / 3);
      case 'annually':
        return amount * Math.ceil(monthsDiff / 12);
      default:
        return amount;
    }
  }

  // Next payment info
  const getNextPaymentInfo = () => {
    if (frequency === 'one-time' || currentStatus !== 'active') return null;
    
    if (next_payment_date) {
      const daysUntil = differenceInDays(new Date(next_payment_date), new Date());
      return {
        date: next_payment_date,
        daysUntil,
        isOverdue: daysUntil < 0
      };
    }
    
    return null;
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const nextPayment = getNextPaymentInfo();
  const timeProgress = calculateProgress();
  const memberDisplayName = getMemberDisplayName();
  const memberEmail = member?.email || member_details?.email || '';
  const memberPhoto = member?.photo_url || member_details?.photo_url || '';

  return (
    <Card className={`${styles.pledgeCard} ${currentStatus === 'cancelled' ? styles.cancelled : ''} ${is_overdue ? styles.overdue : ''}`}>
      {/* Header Section */}
      {!hideHeader && (
        <div className={styles.pledgeHeader}>
          <div className={styles.memberInfo}>
            <Avatar 
              src={memberPhoto} 
              name={memberDisplayName}
              size="md"
              className={styles.memberAvatar}
            />
            <div className={styles.memberDetails}>
              <h3 className={styles.memberName}>
                {memberDisplayName}
              </h3>
              {memberEmail && (
                <p className={styles.memberEmail}>
                  {memberEmail}
                </p>
              )}
              {payments_count > 0 && (
                <p className={styles.paymentCount}>
                  {payments_count} payment{payments_count !== 1 ? 's' : ''} made
                </p>
              )}
            </div>
          </div>
          
          <div className={styles.statusSection}>
            <div className={styles.badgeContainer}>
              {/* ✅ FIX: Show loading, success, or error state */}
              {isUpdatingStatus ? (
                <div className={styles.statusUpdating}>
                  <Loader size={14} className={styles.spinner} />
                  <span>Updating...</span>
                </div>
              ) : statusError ? (
                <div className={styles.statusError}>
                  <span>❌ {statusError}</span>
                </div>
              ) : (
                <Badge 
                  color={getStatusBadgeColor(currentStatus)}
                  className={styles.statusBadge}
                >
                  {getStatusIcon(currentStatus)} {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}
                </Badge>
              )}
              
              {is_overdue && currentStatus === 'active' && !statusError && (
                <Badge color="danger" className={styles.overdueBadge}>
                  Overdue
                </Badge>
              )}
            </div>
            
            {/* ✅ FIX: Dropdown with proper disabled state */}
            {onUpdateStatus && (
              <Dropdown
                value={currentStatus}
                onChange={handleStatusChange}
                options={statusOptions}
                variant="minimal"
                className={styles.statusDropdown}
                disabled={isUpdatingStatus}
              />
            )}
          </div>
        </div>
      )}

      {/* Amount and Frequency Section */}
      <div className={styles.pledgeDetails}>
        <div className={styles.amountSection}>
          <div className={styles.amountInfo}>
            <span className={styles.amount}>
              {formatCurrency(amount)}
            </span>
            <Badge 
              color={getFrequencyBadgeColor(frequency)}
              className={styles.frequencyBadge}
            >
              {getFrequencyDisplayText(frequency)}
            </Badge>
            {hideHeader && (
              <Badge 
                color={getStatusBadgeColor(currentStatus)}
                className={styles.statusBadge}
              >
                {isUpdatingStatus ? (
                  <Loader size={12} className={styles.spinner} />
                ) : (
                  <>{getStatusIcon(currentStatus)} {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}</>
                )}
              </Badge>
            )}
          </div>
          
          {frequency !== 'one-time' && totalPledgedAmount !== amount && (
            <div className={styles.totalPledged}>
              <Tooltip content="Total pledged amount over the entire period">
                <span className={styles.totalAmount}>
                  Total: {formatCurrency(totalPledgedAmount)}
                </span>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Payment Progress Section */}
        <div className={styles.paymentProgress}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Payment Progress</span>
            <span className={styles.progressPercentage}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
          <div className={styles.progressDetails}>
            <span className={styles.progressDetail}>
              Received: {formatCurrency(totalReceivedAmount)}
            </span>
            {remainingAmount > 0 && (
              <span className={styles.progressDetail}>
                Remaining: {formatCurrency(remainingAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Date Information */}
        <div className={styles.dateSection}>
          <div className={styles.dateInfo}>
            <span className={styles.dateLabel}>Start:</span>
            <span className={styles.dateValue}>
              {start_date ? formatDate(start_date) : 'Not set'}
            </span>
          </div>
          
          {end_date && frequency !== 'one-time' && (
            <div className={styles.dateInfo}>
              <span className={styles.dateLabel}>End:</span>
              <span className={styles.dateValue}>
                {formatDate(end_date)}
              </span>
            </div>
          )}

          {last_payment_date && (
            <div className={styles.dateInfo}>
              <span className={styles.dateLabel}>Last Payment:</span>
              <span className={styles.dateValue}>
                {formatDate(last_payment_date)}
              </span>
            </div>
          )}
        </div>

        {/* Next Payment Information */}
        {nextPayment && (
          <div className={`${styles.nextPaymentSection} ${nextPayment.isOverdue ? styles.overdue : ''}`}>
            <div className={styles.nextPaymentInfo}>
              <span className={styles.nextPaymentLabel}>
                {nextPayment.isOverdue ? 'Overdue Payment:' : 'Next Payment:'}
              </span>
              <span className={styles.nextPaymentDate}>
                {formatDate(nextPayment.date)}
              </span>
            </div>
            <div className={styles.nextPaymentDays}>
              {nextPayment.isOverdue 
                ? `${Math.abs(nextPayment.daysUntil)} days overdue`
                : `${nextPayment.daysUntil} days remaining`
              }
            </div>
          </div>
        )}

        {/* Time Progress for Recurring Pledges */}
        {frequency !== 'one-time' && start_date && end_date && (
          <div className={styles.timeProgressSection}>
            <div className={styles.timeProgressLabel}>
              <span>Time Progress</span>
              <span>{timeProgress}%</span>
            </div>
            <div className={styles.timeProgressBar}>
              <div 
                className={styles.timeProgressFill}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {notes && (
        <div className={styles.notesSection}>
          <p className={styles.notes}>
            {isExpanded ? notes : `${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`}
          </p>
          {notes.length > 100 && (
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

      {/* Payment History Preview */}
      {Array.isArray(payment_history) && payment_history.length > 0 && (
        <div className={styles.paymentHistoryPreview}>
          <div className={styles.paymentHistoryHeader}>
            <span className={styles.paymentHistoryTitle}>Recent Payments</span>
            {showPaymentHistory && (
              <Button
                variant="link"
                size="sm"
                onClick={() => showPaymentHistory(id)}
                className={styles.viewAllButton}
              >
                View All
              </Button>
            )}
          </div>
          <div className={styles.recentPayments}>
            {payment_history.slice(0, 3).map((payment, index) => (
              <div key={payment.id || index} className={styles.recentPayment}>
                <span className={styles.paymentAmount}>
                  {formatCurrency(payment.amount)}
                </span>
                <span className={styles.paymentDate}>
                  {payment.date ? format(new Date(payment.date), 'MMM dd') : 'Unknown date'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Actions */}
      <div className={styles.pledgeFooter}>
        <div className={styles.timestampInfo}>
          <span className={styles.timestamp}>
            Created {created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : 'Unknown'}
          </span>
          {updated_at && updated_at !== created_at && (
            <span className={styles.timestamp}>
              Updated {formatDistanceToNow(new Date(updated_at), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <div className={styles.actions}>
          {currentStatus === 'active' && onAddPayment && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onAddPayment(pledge)}
              className={styles.addPaymentButton}
              disabled={isUpdatingStatus}
            >
              Add Payment
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit && onEdit(pledge)}
            disabled={isUpdatingStatus}
          >
            Edit
          </Button>
          
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete && onDelete(id)}
            disabled={isUpdatingStatus}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Actions for Overdue Pledges */}
      {is_overdue && currentStatus === 'active' && (
        <div className={styles.overdueActions}>
          <div className={styles.overdueWarning}>
            <span className={styles.overdueIcon}>⚠️</span>
            <span className={styles.overdueText}>This pledge is overdue</span>
          </div>
          <div className={styles.overdueButtons}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddPayment && onAddPayment(pledge)}
              disabled={isUpdatingStatus}
            >
              Record Payment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Send reminder functionality */}}
              disabled={isUpdatingStatus}
            >
              Send Reminder
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PledgeCard;