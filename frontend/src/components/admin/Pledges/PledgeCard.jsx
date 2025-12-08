// PledgeCard.jsx - FIXED STATUS DROPDOWN with Real-time Updates

import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { Card, Badge, Button, Avatar, Tooltip } from '../../ui';
import { formatCurrency, formatDate, formatPercentage } from '../../../utils/formatters';
import { Loader, CheckCircle, AlertCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import styles from './Pledges.module.css';

const PledgeCard = ({ 
  pledge, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onAddPayment, 
  showPaymentHistory,
  hideHeader = false,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(pledge?.status || 'active');
  const [statusError, setStatusError] = useState(null);
  const [calculationTrigger, setCalculationTrigger] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // ✅ Sync status when pledge changes
  useEffect(() => {
    if (pledge?.status && pledge.status !== currentStatus) {
      console.log('[PledgeCard] 🔄 Status synced:', pledge.status);
      setCurrentStatus(pledge.status);
      setStatusError(null);
      setCalculationTrigger(prev => prev + 1);
    }
  }, [pledge?.status]);

  // ✅ Listen for updates
  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.detail?.pledgeId === pledge?.id || !event.detail?.pledgeId) {
        console.log('[PledgeCard] 🔔 Update received, recalculating');
        setCalculationTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('pledgeUpdated', handleUpdate);
    window.addEventListener('pledgeStatsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('pledgeUpdated', handleUpdate);
      window.removeEventListener('pledgeStatsUpdated', handleUpdate);
    };
  }, [pledge?.id]);

  // ✅ Force recalc when key fields change
  useEffect(() => {
    setCalculationTrigger(prev => prev + 1);
  }, [
    pledge?.total_pledged,
    pledge?.total_received,
    pledge?.amount,
    pledge?.status,
    pledge?.payments_count
  ]);

  const {
    id,
    member,
    member_details,
    member_name,
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
    payments_count = 0,
    is_overdue = false
  } = pledge || {};

  // ✅ Calculate progress with status-aware logic
  const progressData = useMemo(() => {
    console.log('[PledgeCard] 🔢 Calculating progress:', {
      id,
      status: currentStatus,
      total_pledged,
      total_received,
      amount
    });

    let totalPledgedAmount = parseFloat(total_pledged) || 0;
    
    if (totalPledgedAmount === 0) {
      if (frequency === 'one-time' || !start_date || !end_date) {
        totalPledgedAmount = parseFloat(amount) || 0;
      } else {
        try {
          const start = new Date(start_date);
          const end = new Date(end_date);
          const monthsDiff = ((end.getFullYear() - start.getFullYear()) * 12) + 
                            (end.getMonth() - start.getMonth());
          const amountNum = parseFloat(amount) || 0;
          
          switch (frequency?.toLowerCase()) {
            case 'weekly':
              totalPledgedAmount = amountNum * Math.ceil(monthsDiff * 4.33);
              break;
            case 'monthly':
              totalPledgedAmount = amountNum * Math.max(1, monthsDiff);
              break;
            case 'quarterly':
              totalPledgedAmount = amountNum * Math.ceil(monthsDiff / 3);
              break;
            case 'annually':
              totalPledgedAmount = amountNum * Math.ceil(monthsDiff / 12);
              break;
            default:
              totalPledgedAmount = amountNum;
          }
        } catch (error) {
          totalPledgedAmount = parseFloat(amount) || 0;
        }
      }
    }

    const totalReceivedAmount = parseFloat(total_received) || 0;
    const remainingAmount = Math.max(0, totalPledgedAmount - totalReceivedAmount);
    const rawPercentage = totalPledgedAmount > 0 
      ? (totalReceivedAmount / totalPledgedAmount) * 100 
      : 0;
    
    // ✅ Status-based completion
    let completionPercentage = rawPercentage;
    let progressStatus = 'active';
    let progressColor = 'blue';
    let statusIcon = Clock;
    let statusLabel = 'In Progress';

    switch (currentStatus?.toLowerCase()) {
      case 'completed':
        completionPercentage = 100;
        progressStatus = 'completed';
        progressColor = 'green';
        statusIcon = CheckCircle;
        statusLabel = 'Completed';
        break;
      case 'cancelled':
        progressStatus = 'cancelled';
        progressColor = 'red';
        statusIcon = XCircle;
        statusLabel = 'Cancelled';
        break;
      case 'suspended':
      case 'paused':
        progressStatus = 'paused';
        progressColor = 'orange';
        statusIcon = AlertCircle;
        statusLabel = 'Paused';
        break;
      default:
        if (is_overdue) {
          progressStatus = 'overdue';
          progressColor = 'red';
          statusIcon = AlertCircle;
          statusLabel = 'Overdue';
        } else if (completionPercentage >= 80) {
          progressColor = 'green';
          statusLabel = 'On Track';
        } else if (completionPercentage >= 50) {
          progressColor = 'yellow';
          statusLabel = 'In Progress';
        }
    }

    console.log('[PledgeCard] ✅ Progress calculated:', {
      completionPercentage: Math.round(completionPercentage),
      progressStatus,
      progressColor,
      statusLabel
    });

    return {
      totalPledgedAmount,
      totalReceivedAmount,
      remainingAmount,
      completionPercentage: Math.min(100, completionPercentage),
      rawPercentage,
      progressStatus,
      progressColor,
      statusIcon,
      statusLabel
    };
  }, [
    id,
    amount,
    frequency,
    start_date,
    end_date,
    total_pledged,
    total_received,
    currentStatus,
    is_overdue,
    calculationTrigger
  ]);

  // ✅ IMPROVED: Status change handler with immediate feedback
  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || !onUpdateStatus) return;
    
    console.log('[PledgeCard] 🔵 Changing status:', currentStatus, '->', newStatus);
    
    const previousStatus = currentStatus;
    
    // ✅ Optimistic update
    setCurrentStatus(newStatus);
    setIsUpdatingStatus(true);
    setStatusError(null);
    setShowStatusDropdown(false);
    
    try {
      // ✅ Call parent handler
      await onUpdateStatus(id, newStatus);
      
      console.log('[PledgeCard] ✅ Status updated successfully');
      
      // ✅ Force recalculation
      setTimeout(() => {
        setCalculationTrigger(prev => prev + 1);
        setIsUpdatingStatus(false);
        
        // ✅ Dispatch local event
        window.dispatchEvent(new CustomEvent('pledgeStatusChanged', {
          detail: { pledgeId: id, oldStatus: previousStatus, newStatus }
        }));
      }, 300);
      
    } catch (error) {
      console.error('[PledgeCard] ❌ Status update failed:', error);
      
      // ✅ Rollback on failure
      setCurrentStatus(previousStatus);
      setStatusError(error.message || 'Failed to update status');
      
      setTimeout(() => setStatusError(null), 3000);
      setIsUpdatingStatus(false);
    }
  };

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

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      case 'suspended': return 'warning';
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getFrequencyBadgeColor = (freq) => {
    switch (freq?.toLowerCase()) {
      case 'one-time': return 'secondary';
      case 'weekly': return 'primary';
      case 'monthly': return 'info';
      case 'quarterly': return 'warning';
      case 'annually': return 'success';
      default: return 'default';
    }
  };

  const getFrequencyDisplayText = (freq) => {
    const map = {
      'one-time': 'One-time',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annually': 'Annually'
    };
    return map[freq?.toLowerCase()] || freq;
  };

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'info' },
    { value: 'suspended', label: 'Suspended', color: 'warning' },
    { value: 'cancelled', label: 'Cancelled', color: 'danger' }
  ];

  const memberDisplayName = getMemberDisplayName();
  const memberEmail = member?.email || member_details?.email || '';
  const memberPhoto = member?.photo_url || member_details?.photo_url || '';

  const { 
    totalPledgedAmount, 
    totalReceivedAmount, 
    remainingAmount, 
    completionPercentage,
    progressStatus,
    progressColor,
    statusIcon: StatusIcon,
    statusLabel
  } = progressData;

  // ✅ COMPACT VIEW (for grouped display)
  if (compact) {
    return (
      <div 
        className={`${styles.pledgeCardCompact} ${styles[`status-${currentStatus}`]}`}
        key={`compact-${id}-${calculationTrigger}`}
      >
        <div className={styles.compactHeader}>
          <div className={styles.compactAmount}>
            <span className={styles.amountValue}>{formatCurrency(amount)}</span>
            <Badge color={getFrequencyBadgeColor(frequency)} size="sm">
              {getFrequencyDisplayText(frequency)}
            </Badge>
          </div>
          
          {/* ✅ NEW: Status Dropdown */}
          <div className={styles.compactStatus}>
            {isUpdatingStatus ? (
              <div className={styles.statusUpdating}>
                <Loader size={14} className={styles.spinner} />
                <span>Updating...</span>
              </div>
            ) : statusError ? (
              <div className={styles.statusError}>
                <AlertCircle size={12} />
                <span>{statusError}</span>
              </div>
            ) : (
              <div className={styles.statusDropdownContainer}>
                <button
                  className={`${styles.statusDropdownButton} ${styles[`status-${currentStatus}`]}`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdatingStatus}
                  type="button"
                >
                  <Badge color={getStatusBadgeColor(currentStatus)} size="sm">
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </Badge>
                  <ChevronDown size={12} />
                </button>
                
                {showStatusDropdown && (
                  <div className={styles.statusDropdownMenu}>
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        className={`${styles.statusDropdownOption} ${
                          option.value === currentStatus ? styles.active : ''
                        }`}
                        onClick={() => handleStatusChange(option.value)}
                        type="button"
                      >
                        <Badge color={option.color} size="sm">
                          {option.label}
                        </Badge>
                        {option.value === currentStatus && (
                          <CheckCircle size={12} className={styles.checkIcon} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Status-colored Progress Bar */}
        <div className={styles.compactProgress} key={`progress-${calculationTrigger}`}>
          <div className={styles.progressHeader}>
            <div className={styles.progressLabel}>
              <StatusIcon size={14} className={styles[`icon-${progressColor}`]} />
              <span>{statusLabel}</span>
            </div>
            <span className={styles.progressPercentage}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <div className={styles.progressBarContainer}>
            <div 
              className={`${styles.progressBarFill} ${styles[`fill-${progressColor}`]}`}
              style={{ 
                width: `${completionPercentage}%`,
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>
          <div className={styles.progressDetails}>
            <span className={styles.progressDetail}>
              {formatCurrency(totalReceivedAmount)} received
            </span>
            {remainingAmount > 0 && currentStatus !== 'completed' && (
              <span className={styles.progressDetail}>
                {formatCurrency(remainingAmount)} remaining
              </span>
            )}
          </div>
        </div>

        <div className={styles.compactFooter}>
          <div className={styles.compactDates}>
            {start_date && (
              <span className={styles.dateText}>
                Start: {formatDate(start_date)}
              </span>
            )}
            {end_date && (
              <span className={styles.dateText}>
                End: {formatDate(end_date)}
              </span>
            )}
          </div>
          <div className={styles.compactActions}>
            {currentStatus === 'active' && onAddPayment && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onAddPayment(pledge)}
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
          </div>
        </div>
      </div>
    );
  }

  // ✅ FULL VIEW - Similar status dropdown integration
  return (
    <Card 
      className={`${styles.pledgeCard} ${styles[`status-${currentStatus}`]}`}
      key={`card-${id}-${calculationTrigger}`}
    >
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
              <h3 className={styles.memberName}>{memberDisplayName}</h3>
              {memberEmail && <p className={styles.memberEmail}>{memberEmail}</p>}
              {payments_count > 0 && (
                <p className={styles.paymentCount}>
                  {payments_count} payment{payments_count !== 1 ? 's' : ''} made
                </p>
              )}
            </div>
          </div>
          
          <div className={styles.statusSection}>
            <div className={styles.badgeContainer}>
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
                <>
                  <Badge color={getStatusBadgeColor(currentStatus)}>
                    {currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1)}
                  </Badge>
                  {is_overdue && currentStatus === 'active' && (
                    <Badge color="danger">Overdue</Badge>
                  )}
                </>
              )}
            </div>
            
            {/* ✅ Status Dropdown for Full View */}
            {onUpdateStatus && (
              <div className={styles.statusDropdownContainer}>
                <button
                  className={styles.statusChangeButton}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdatingStatus}
                  type="button"
                  title="Change status"
                >
                  Change Status <ChevronDown size={14} />
                </button>
                
                {showStatusDropdown && (
                  <div className={styles.statusDropdownMenu}>
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        className={`${styles.statusDropdownOption} ${
                          option.value === currentStatus ? styles.active : ''
                        }`}
                        onClick={() => handleStatusChange(option.value)}
                        type="button"
                      >
                        <Badge color={option.color} size="sm">
                          {option.label}
                        </Badge>
                        {option.value === currentStatus && (
                          <CheckCircle size={14} className={styles.checkIcon} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rest of the full card remains the same... */}
      <div className={styles.pledgeDetails}>
        <div className={styles.amountSection}>
          <div className={styles.amountInfo}>
            <span className={styles.amount}>{formatCurrency(amount)}</span>
            <Badge color={getFrequencyBadgeColor(frequency)}>
              {getFrequencyDisplayText(frequency)}
            </Badge>
          </div>
          {frequency !== 'one-time' && totalPledgedAmount !== amount && (
            <div className={styles.totalPledged}>
              <span className={styles.totalAmount}>
                Total: {formatCurrency(totalPledgedAmount)}
              </span>
            </div>
          )}
        </div>

        {/* ✅ Status-colored Progress */}
        <div className={styles.paymentProgress} key={`progress-${calculationTrigger}`}>
          <div className={styles.progressHeader}>
            <div className={styles.progressLabel}>
              <StatusIcon size={16} className={styles[`icon-${progressColor}`]} />
              <span>{statusLabel}</span>
            </div>
            <span className={styles.progressPercentage}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <div className={styles.progressBarContainer}>
            <div 
              className={`${styles.progressBarFill} ${styles[`fill-${progressColor}`]}`}
              style={{ 
                width: `${completionPercentage}%`,
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>
          <div className={styles.progressDetails}>
            <span className={styles.progressDetail}>
              Received: {formatCurrency(totalReceivedAmount)}
            </span>
            {remainingAmount > 0 && currentStatus !== 'completed' && (
              <span className={styles.progressDetail}>
                Remaining: {formatCurrency(remainingAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className={styles.dateSection}>
          <div className={styles.dateInfo}>
            <span className={styles.dateLabel}>Start:</span>
            <span className={styles.dateValue}>{start_date ? formatDate(start_date) : 'Not set'}</span>
          </div>
          {end_date && frequency !== 'one-time' && (
            <div className={styles.dateInfo}>
              <span className={styles.dateLabel}>End:</span>
              <span className={styles.dateValue}>{formatDate(end_date)}</span>
            </div>
          )}
          {last_payment_date && (
            <div className={styles.dateInfo}>
              <span className={styles.dateLabel}>Last Payment:</span>
              <span className={styles.dateValue}>{formatDate(last_payment_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className={styles.notesSection}>
          <p className={styles.notes}>
            {isExpanded ? notes : `${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`}
          </p>
          {notes.length > 100 && (
            <Button variant="link" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className={styles.pledgeFooter}>
        <div className={styles.timestampInfo}>
          <span className={styles.timestamp}>
            Created {created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : 'Unknown'}
          </span>
        </div>
        <div className={styles.actions}>
          {currentStatus === 'active' && onAddPayment && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onAddPayment(pledge)}
              disabled={isUpdatingStatus}
            >
              Add Payment
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit && onEdit(pledge)} disabled={isUpdatingStatus}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete && onDelete(id)} disabled={isUpdatingStatus}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PledgeCard;