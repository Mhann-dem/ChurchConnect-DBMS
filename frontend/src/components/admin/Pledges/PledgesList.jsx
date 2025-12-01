// PledgesList.jsx - REDESIGNED with Unified Layout
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useToast';
import { LoadingSpinner, EmptyState, Pagination } from '../../shared';
import { Button, Card } from '../../ui';
import PledgeCard from './PledgeCard';
import { ChevronDown, ChevronUp, User, DollarSign, Mail, Phone, TrendingUp, CheckCircle } from 'lucide-react';
import styles from './Pledges.module.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

const getMemberDisplayName = (pledge) => {
  if (!pledge) return 'Unknown Member';
  if (pledge.member_details?.full_name) return pledge.member_details.full_name;
  if (pledge.member_details?.name) return pledge.member_details.name;
  if (pledge.member?.full_name) return pledge.member.full_name;
  if (pledge.member?.name) return pledge.member.name;
  if (pledge.member?.first_name || pledge.member?.last_name) {
    return `${pledge.member.first_name || ''} ${pledge.member.last_name || ''}`.trim();
  }
  if (pledge.member_details?.first_name || pledge.member_details?.last_name) {
    return `${pledge.member_details.first_name || ''} ${pledge.member_details.last_name || ''}`.trim();
  }
  if (pledge.member_name) return pledge.member_name;
  return 'Unknown Member';
};

const getMemberId = (pledge) => {
  return pledge.member_id || pledge.member?.id || pledge.member_details?.id || 'unknown';
};

const getMemberEmail = (pledge) => {
  return pledge.member?.email || pledge.member_details?.email || '';
};

const getMemberPhone = (pledge) => {
  return pledge.member?.phone || pledge.member_details?.phone || '';
};

// ✅ Member Group Component with COMPACT cards
const MemberPledgesGroup = ({ 
  memberName, 
  memberEmail, 
  memberPhone, 
  memberId,
  pledges, 
  onEdit, 
  onDelete,
  onUpdateStatus,
  onAddPayment,
  onNavigateToMember,
  selectedPledges,
  onPledgeSelection,
  triggerUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [memberStats, setMemberStats] = useState({});
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      console.log('[MemberGroup] 🔔 Update detected');
      setRecalcTrigger(prev => prev + 1);
    };

    window.addEventListener('pledgeUpdated', handleUpdate);
    window.addEventListener('pledgeCreated', handleUpdate);
    window.addEventListener('pledgeDeleted', handleUpdate);
    window.addEventListener('pledgeStatsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('pledgeUpdated', handleUpdate);
      window.removeEventListener('pledgeCreated', handleUpdate);
      window.removeEventListener('pledgeDeleted', handleUpdate);
      window.removeEventListener('pledgeStatsUpdated', handleUpdate);
    };
  }, []);

  // Calculate stats
  useEffect(() => {
    console.log('[MemberGroup] 🔢 Recalculating stats for:', memberName);
    
    const totalPledged = pledges.reduce((sum, p) => {
      return sum + (parseFloat(p.total_pledged) || parseFloat(p.amount) || 0);
    }, 0);
    
    const totalReceived = pledges.reduce((sum, p) => {
      return sum + (parseFloat(p.total_received) || 0);
    }, 0);
    
    const activePledges = pledges.filter(p => p.status === 'active').length;
    const completedPledges = pledges.filter(p => p.status === 'completed').length;
    const completionRate = totalPledged > 0 ? (totalReceived / totalPledged) * 100 : 0;
    const overduePledges = pledges.filter(p => p.is_overdue).length;
    const remainingAmount = Math.max(0, totalPledged - totalReceived);

    setMemberStats({ 
      totalPledged, 
      totalReceived, 
      activePledges, 
      completedPledges,
      completionRate, 
      overduePledges,
      remainingAmount 
    });
    
    console.log('[MemberGroup] ✅ Stats updated:', {
      totalPledged,
      totalReceived,
      completionRate: Math.round(completionRate)
    });
  }, [pledges, memberName, triggerUpdate, recalcTrigger]);

  const handleUpdateStatus = useCallback(async (pledgeId, newStatus) => {
    try {
      await onUpdateStatus(pledgeId, newStatus);
      setRecalcTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[MemberGroup] Status update failed:', error);
      throw error;
    }
  }, [onUpdateStatus]);

  const handleDelete = useCallback(async (pledgeId) => {
    try {
      await onDelete(pledgeId);
      setRecalcTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[MemberGroup] Delete failed:', error);
      throw error;
    }
  }, [onDelete]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const isPledgeSelected = (pledgeId) => {
    if (!selectedPledges) return false;
    if (selectedPledges instanceof Set) {
      return selectedPledges.has(pledgeId);
    }
    if (Array.isArray(selectedPledges)) {
      return selectedPledges.includes(pledgeId);
    }
    return false;
  };

  const groupKey = `member-${memberId}-${recalcTrigger}`;

  return (
    <div className={styles.memberGroupCard} key={groupKey}>
      <div 
        className={styles.memberHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.memberHeaderContent}>
          <div className={styles.memberInfoSection}>
            <div className={styles.memberAvatar}>
              {getInitials(memberName)}
            </div>

            <div className={styles.memberDetails}>
              <div className={styles.memberNameRow}>
                <h3 className={styles.memberName}>{memberName}</h3>
                <span className={styles.pledgeCountBadge}>
                  {pledges.length} {pledges.length === 1 ? 'Pledge' : 'Pledges'}
                </span>
                {memberStats.completedPledges > 0 && (
                  <span className={styles.completedBadge}>
                    <CheckCircle size={12} />
                    {memberStats.completedPledges} Complete
                  </span>
                )}
                {memberStats.overduePledges > 0 && (
                  <span className={styles.overdueBadge}>
                    ⚠️ {memberStats.overduePledges} Overdue
                  </span>
                )}
              </div>
              
              {memberEmail && (
                <div className={styles.memberContactItem}>
                  <Mail size={14} />
                  <span>{memberEmail}</span>
                </div>
              )}
              {memberPhone && (
                <div className={styles.memberContactItem}>
                  <Phone size={14} />
                  <span>{memberPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.memberStatsSection} key={`stats-${recalcTrigger}`}>
            <div className={styles.statColumn}>
              <div className={styles.statLabel}>
                <DollarSign size={12} />
                Total Pledged
              </div>
              <div className={styles.statValue}>
                {formatCurrency(memberStats.totalPledged)}
              </div>
              <div className={styles.statSubtext}>
                {memberStats.activePledges} active
              </div>
            </div>
            
            <div className={styles.statColumn}>
              <div className={styles.statLabel}>
                <TrendingUp size={12} />
                Received
              </div>
              <div className={`${styles.statValue} ${styles.receivedValue}`}>
                {formatCurrency(memberStats.totalReceived)}
              </div>
              <div className={styles.statSubtext}>
                {formatCurrency(memberStats.remainingAmount)} left
              </div>
            </div>
            
            <div className={styles.statColumn}>
              <div className={styles.statLabel}>
                <CheckCircle size={12} />
                Rate
              </div>
              <div className={`${styles.statValue} ${
                memberStats.completionRate >= 80 ? styles.goodRate : 
                memberStats.completionRate >= 50 ? styles.mediumRate : 
                styles.lowRate
              }`}>
                {Math.round(memberStats.completionRate)}%
              </div>
              <div className={styles.statSubtext}>completion</div>
            </div>
            
            <button className={styles.expandButton} type="button">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {!isExpanded && (
          <div className={styles.collapsedProgress} key={`progress-${recalcTrigger}`}>
            <div className={styles.progressInfo}>
              <span className={styles.progressText}>
                {formatCurrency(memberStats.totalReceived)} of {formatCurrency(memberStats.totalPledged)}
              </span>
              <span className={styles.progressPercentageText}>
                {Math.round(memberStats.completionRate)}%
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${
                  memberStats.completionRate >= 80 ? styles.goodProgress : 
                  memberStats.completionRate >= 50 ? styles.mediumProgress : 
                  styles.lowProgress
                }`}
                style={{ 
                  width: `${Math.min(memberStats.completionRate, 100)}%`,
                  transition: 'width 0.5s ease-in-out'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={styles.pledgesList}>
          {pledges.map((pledge, index) => (
            <div key={`${pledge.id}-${recalcTrigger}`} className={styles.pledgeItemWrapper}>
              <label className={styles.pledgeCheckbox}>
                <input
                  type="checkbox"
                  checked={isPledgeSelected(pledge.id)}
                  onChange={(e) => onPledgeSelection && onPledgeSelection(pledge.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </label>

              <div className={styles.pledgeNumber}>
                <span>#{index + 1}</span>
              </div>

              {/* ✅ Use COMPACT card for grouped view */}
              <div style={{ flex: 1 }}>
                <PledgeCard
                  pledge={pledge}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onUpdateStatus={handleUpdateStatus}
                  onAddPayment={onAddPayment}
                  hideHeader={false}
                  compact={true}
                />
              </div>
            </div>
          ))}

          <div className={styles.groupFooter} key={`footer-${recalcTrigger}`}>
            <div className={styles.groupFooterStats}>
              <div className={styles.footerStat}>
                <span className={styles.footerStatLabel}>Total Pledged:</span>
                <span className={styles.footerStatValue}>
                  {formatCurrency(memberStats.totalPledged)}
                </span>
              </div>
              <div className={styles.footerStat}>
                <span className={styles.footerStatLabel}>Received:</span>
                <span className={styles.footerStatValue}>
                  {formatCurrency(memberStats.totalReceived)}
                </span>
              </div>
              <div className={styles.footerStat}>
                <span className={styles.footerStatLabel}>Remaining:</span>
                <span className={styles.footerStatValue}>
                  {formatCurrency(memberStats.remainingAmount)}
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => onNavigateToMember && onNavigateToMember(memberId)}
              icon={<User size={16} />}
            >
              View {memberName}'s Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const PledgesList = ({ 
  pledges: externalPledges, 
  selectedPledges,
  onPledgeSelection,
  onSelectAll,
  onEdit, 
  onDelete, 
  onNavigateToMember,
  onUpdateStatus,
  onAddPayment,
  loading,
  pagination,
  onPageChange,
  searchQuery,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState('grouped');
  const [aggregateStats, setAggregateStats] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const { showToast } = useToast();

  const pledges = externalPledges || [];

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('pledgeUpdated', handleUpdate);
    window.addEventListener('pledgeCreated', handleUpdate);
    window.addEventListener('pledgeDeleted', handleUpdate);
    window.addEventListener('pledgeStatsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('pledgeUpdated', handleUpdate);
      window.removeEventListener('pledgeCreated', handleUpdate);
      window.removeEventListener('pledgeDeleted', handleUpdate);
      window.removeEventListener('pledgeStatsUpdated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    setUpdateTrigger(prev => prev + 1);
  }, [pledges]);

  // Group pledges
  const groupedPledges = useMemo(() => {
    if (!Array.isArray(pledges) || pledges.length === 0) {
      return [];
    }

    const groups = {};
    
    pledges.forEach(pledge => {
      const memberId = getMemberId(pledge);
      const memberName = getMemberDisplayName(pledge);
      const memberEmail = getMemberEmail(pledge);
      const memberPhone = getMemberPhone(pledge);
      
      if (!groups[memberId]) {
        groups[memberId] = {
          memberId,
          memberName,
          memberEmail,
          memberPhone,
          pledges: [],
        };
      }
      groups[memberId].pledges.push(pledge);
    });

    return Object.values(groups).sort((a, b) => 
      a.memberName.localeCompare(b.memberName)
    );
  }, [pledges, updateTrigger]);

  // Calculate aggregate stats
  useEffect(() => {
    if (pledges.length > 0) {
      const stats = {
        totalMembers: groupedPledges.length,
        totalPledges: pledges.length,
        totalPledged: pledges.reduce((sum, p) => sum + (parseFloat(p.total_pledged) || parseFloat(p.amount) || 0), 0),
        totalReceived: pledges.reduce((sum, p) => sum + (parseFloat(p.total_received) || 0), 0),
        activeMembers: groupedPledges.filter(g => g.pledges.some(p => p.status === 'active')).length,
      };
      stats.overallRate = stats.totalPledged > 0 ? (stats.totalReceived / stats.totalPledged) * 100 : 0;
      
      setAggregateStats(stats);
    } else {
      setAggregateStats(null);
    }
  }, [pledges, groupedPledges, updateTrigger]);

  const handleEditPledge = useCallback((pledge) => {
    if (onEdit) onEdit(pledge);
  }, [onEdit]);

  const handleDeletePledge = useCallback(async (pledgeId) => {
    if (onDelete) {
      try {
        await onDelete(pledgeId);
        setUpdateTrigger(prev => prev + 1);
        if (onRefresh) setTimeout(() => onRefresh(), 300);
      } catch (error) {
        console.error('[PledgesList] Delete failed:', error);
        throw error;
      }
    }
  }, [onDelete, onRefresh]);

  const handleUpdateStatus = useCallback(async (pledgeId, newStatus) => {
    if (onUpdateStatus) {
      try {
        await onUpdateStatus(pledgeId, newStatus);
        setUpdateTrigger(prev => prev + 1);
        if (onRefresh) setTimeout(() => onRefresh(), 300);
      } catch (error) {
        console.error('[PledgesList] Status update failed:', error);
        showToast('Failed to update pledge status', 'error');
        throw error;
      }
    }
  }, [onUpdateStatus, onRefresh, showToast]);

  if (loading && pledges.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading pledges data...</p>
      </div>
    );
  }

  return (
    <div className={styles.pledgesListContainer} key={`list-${updateTrigger}`}>
      {/* View Toggle */}
      <div className={styles.viewModeToggle}>
        <div className={styles.toggleButtons}>
          <button
            className={`${styles.toggleButton} ${viewMode === 'grouped' ? styles.active : ''}`}
            onClick={() => setViewMode('grouped')}
            type="button"
          >
            <User size={16} />
            Grouped by Member
          </button>
          <button
            className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            type="button"
          >
            <DollarSign size={16} />
            All Pledges
          </button>
        </div>

        <div className={styles.summaryInfo} key={`summary-${updateTrigger}`}>
          {viewMode === 'grouped' && aggregateStats ? (
            <div className={styles.aggregateStats}>
              <span className={styles.aggregateStat}>
                <strong>{aggregateStats.totalMembers}</strong> members
              </span>
              <span className={styles.statDivider}>•</span>
              <span className={styles.aggregateStat}>
                <strong>{aggregateStats.totalPledges}</strong> pledges
              </span>
              <span className={styles.statDivider}>•</span>
              <span className={styles.aggregateStat}>
                <strong>{formatCurrency(aggregateStats.totalReceived)}</strong> / {formatCurrency(aggregateStats.totalPledged)}
              </span>
              <span className={styles.statDivider}>•</span>
              <span className={`${styles.aggregateStat} ${
                aggregateStats.overallRate >= 80 ? styles.goodRate :
                aggregateStats.overallRate >= 50 ? styles.mediumRate :
                styles.lowRate
              }`}>
                <strong>{Math.round(aggregateStats.overallRate)}%</strong> rate
              </span>
            </div>
          ) : (
            <span>{pledges.length} pledges total</span>
          )}
        </div>
      </div>

      {pledges.length === 0 ? (
        <EmptyState
          title="No pledges found"
          description={searchQuery ? 
            "No pledges match your search criteria." : 
            "No pledges have been recorded yet."
          }
          icon={<DollarSign size={48} />}
        />
      ) : viewMode === 'grouped' ? (
        <div className={styles.groupedPledgesContainer}>
          {groupedPledges.map((group) => (
            <MemberPledgesGroup
              key={`${group.memberId}-${updateTrigger}`}
              memberName={group.memberName}
              memberEmail={group.memberEmail}
              memberPhone={group.memberPhone}
              memberId={group.memberId}
              pledges={group.pledges}
              onEdit={handleEditPledge}
              onDelete={handleDeletePledge}
              onUpdateStatus={handleUpdateStatus}
              onAddPayment={onAddPayment}
              onNavigateToMember={onNavigateToMember}
              selectedPledges={selectedPledges}
              onPledgeSelection={onPledgeSelection}
              triggerUpdate={updateTrigger}
            />
          ))}
        </div>
      ) : (
        <div className={styles.listPledgesContainer}>
          {pledges.map((pledge) => (
            <div key={`${pledge.id}-${updateTrigger}`} className={styles.pledgeCardWrapper}>
              <label className={styles.selectCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedPledges?.has?.(pledge.id) || selectedPledges?.includes?.(pledge.id)}
                  onChange={(e) => onPledgeSelection && onPledgeSelection(pledge.id, e.target.checked)}
                />
              </label>
              <PledgeCard
                pledge={pledge}
                onEdit={handleEditPledge}
                onDelete={handleDeletePledge}
                onUpdateStatus={handleUpdateStatus}
                onAddPayment={onAddPayment}
                compact={false}
              />
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            showInfo={true}
            totalItems={pagination.count}
            itemsPerPage={pagination.itemsPerPage || 25}
          />
        </div>
      )}
    </div>
  );
};

export default PledgesList;