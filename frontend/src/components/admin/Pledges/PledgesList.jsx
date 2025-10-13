// frontend/src/components/admin/Pledges/PledgesList.jsx - ENHANCED with real-time
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

// ✅ ENHANCED: Member group with real-time stat updates
const MemberPledgesGroup = ({ 
  memberName, 
  memberEmail, 
  memberPhone, 
  memberId,
  pledges, 
  onEdit, 
  onDelete,
  onUpdateStatus,
  onNavigateToMember,
  selectedPledges,
  onPledgeSelection
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [memberStats, setMemberStats] = useState({});

  // ✅ REAL-TIME: Recalculate stats whenever pledges change
  useEffect(() => {
    const totalPledged = pledges.reduce((sum, p) => 
      sum + (parseFloat(p.total_pledged) || parseFloat(p.amount) || 0), 0
    );
    const totalReceived = pledges.reduce((sum, p) => 
      sum + (parseFloat(p.total_received) || 0), 0
    );
    const activePledges = pledges.filter(p => p.status === 'active').length;
    const completedPledges = pledges.filter(p => p.status === 'completed').length;
    const completionRate = totalPledged > 0 ? (totalReceived / totalPledged) * 100 : 0;
    const overduePledges = pledges.filter(p => p.is_overdue).length;
    const remainingAmount = totalPledged - totalReceived;

    setMemberStats({ 
      totalPledged, 
      totalReceived, 
      activePledges, 
      completedPledges,
      completionRate, 
      overduePledges,
      remainingAmount 
    });
    
    console.log('[MemberGroup] Stats updated for:', memberName, {
      totalPledged,
      totalReceived,
      completionRate: Math.round(completionRate)
    });
  }, [pledges, memberName]);

  // ✅ REAL-TIME: Handle delete with immediate UI update
  const handleDelete = useCallback(async (pledgeId) => {
    try {
      await onDelete(pledgeId);
      console.log('[MemberGroup] Pledge deleted, stats will auto-update');
    } catch (error) {
      console.error('[MemberGroup] Delete failed:', error);
    }
  }, [onDelete]);

  // ✅ REAL-TIME: Handle status update with immediate UI update
  const handleUpdateStatus = useCallback(async (pledgeId, newStatus) => {
    try {
      await onUpdateStatus(pledgeId, newStatus);
      console.log('[MemberGroup] Status updated, stats will auto-update');
    } catch (error) {
      console.error('[MemberGroup] Status update failed:', error);
    }
  }, [onUpdateStatus]);

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

  return (
    <div className={styles.memberGroupCard}>
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
                <h3 className={styles.memberName}>
                  {memberName}
                </h3>
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

          {/* ✅ ENHANCED: Real-time updating stats */}
          <div className={styles.memberStatsSection}>
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
          <div className={styles.collapsedProgress}>
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
                style={{ width: `${Math.min(memberStats.completionRate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={styles.pledgesList}>
          {pledges.map((pledge, index) => (
            <div key={pledge.id} className={styles.pledgeItemWrapper}>
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

              <PledgeCard
                pledge={pledge}
                onEdit={onEdit}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
                hideHeader={true}
              />
            </div>
          ))}

          <div className={styles.groupFooter}>
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

// ✅ ENHANCED: Main component with real-time aggregate stats
const PledgesList = ({ 
  pledges: externalPledges, 
  selectedPledges,
  onPledgeSelection,
  onSelectAll,
  onEdit: externalOnEdit, 
  onDelete: externalOnDelete, 
  onNavigateToMember,
  onUpdateStatus: externalOnUpdateStatus,
  loading: externalLoading,
  pagination: externalPagination,
  onPageChange: externalOnPageChange,
  searchQuery,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState('grouped');
  const [aggregateStats, setAggregateStats] = useState(null);
  const { showToast } = useToast();

  const pledges = externalPledges || [];
  const loading = externalLoading || false;

  // ✅ REAL-TIME: Group pledges by member
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
  }, [pledges]);

  // ✅ REAL-TIME: Calculate aggregate statistics
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
      
      console.log('[PledgesList] ✅ Aggregate stats updated:', {
        totalMembers: stats.totalMembers,
        totalPledges: stats.totalPledges,
        overallRate: Math.round(stats.overallRate)
      });
    } else {
      setAggregateStats(null);
    }
  }, [pledges, groupedPledges]);

  const handleEditPledge = useCallback((pledge) => {
    if (externalOnEdit) {
      externalOnEdit(pledge);
    }
  }, [externalOnEdit]);

  const handleDeletePledge = useCallback(async (pledgeId) => {
    if (externalOnDelete) {
      try {
        await externalOnDelete(pledgeId);
        console.log('[PledgesList] Pledge deleted, triggering refresh');
        // ✅ Trigger refresh to update stats
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
      } catch (error) {
        console.error('[PledgesList] Delete failed:', error);
      }
    }
  }, [externalOnDelete, onRefresh]);

  const handleUpdateStatus = useCallback(async (pledgeId, newStatus) => {
    if (externalOnUpdateStatus) {
      try {
        await externalOnUpdateStatus(pledgeId, newStatus);
        console.log('[PledgesList] Status updated, triggering refresh');
        // ✅ Trigger refresh to update stats
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
      } catch (error) {
        console.error('[PledgesList] Status update failed:', error);
        showToast('Failed to update pledge status', 'error');
      }
    }
  }, [externalOnUpdateStatus, onRefresh, showToast]);

  const handlePageChange = useCallback((newPage) => {
    if (externalOnPageChange) {
      externalOnPageChange(newPage);
    }
  }, [externalOnPageChange]);

  const areAllPledgesSelected = useCallback(() => {
    if (!selectedPledges || pledges.length === 0) return false;
    
    if (selectedPledges instanceof Set) {
      return selectedPledges.size === pledges.length;
    }
    if (Array.isArray(selectedPledges)) {
      return selectedPledges.length === pledges.length;
    }
    return false;
  }, [selectedPledges, pledges.length]);

  const isPledgeSelected = useCallback((pledgeId) => {
    if (!selectedPledges) return false;
    
    if (selectedPledges instanceof Set) {
      return selectedPledges.has(pledgeId);
    }
    if (Array.isArray(selectedPledges)) {
      return selectedPledges.includes(pledgeId);
    }
    return false;
  }, [selectedPledges]);

  if (loading && pledges.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading pledges data...</p>
      </div>
    );
  }

  return (
    <div className={styles.pledgesListContainer}>
      {/* Enhanced View Mode Toggle with Real-time Stats */}
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

        {/* ✅ REAL-TIME: Summary Info */}
        <div className={styles.summaryInfo}>
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

      {/* Select All (only in list view) */}
      {viewMode === 'list' && pledges.length > 0 && (
        <Card className={styles.selectAllCard}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={areAllPledgesSelected()}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
              className={styles.selectAllCheckbox}
            />
            <span>Select All ({pledges.length})</span>
          </label>
        </Card>
      )}

      {/* Pledges Display */}
      {pledges.length === 0 ? (
        <EmptyState
          title="No pledges found"
          description={searchQuery ? 
            "No pledges match your search criteria. Try adjusting your filters." : 
            "No pledges have been recorded yet."
          }
          icon={<DollarSign size={48} />}
        />
      ) : viewMode === 'grouped' ? (
        /* Enhanced Grouped View with Real-time Updates */
        <div className={styles.groupedPledgesContainer}>
          {groupedPledges.map((group) => (
            <MemberPledgesGroup
              key={group.memberId}
              memberName={group.memberName}
              memberEmail={group.memberEmail}
              memberPhone={group.memberPhone}
              memberId={group.memberId}
              pledges={group.pledges}
              onEdit={handleEditPledge}
              onDelete={handleDeletePledge}
              onUpdateStatus={handleUpdateStatus}
              onNavigateToMember={onNavigateToMember}
              selectedPledges={selectedPledges}
              onPledgeSelection={onPledgeSelection}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className={styles.listPledgesContainer}>
          {pledges.map((pledge) => (
            <div key={pledge.id} className={styles.pledgeCardWrapper}>
              <label className={styles.selectCheckbox}>
                <input
                  type="checkbox"
                  checked={isPledgeSelected(pledge.id)}
                  onChange={(e) => onPledgeSelection && onPledgeSelection(pledge.id, e.target.checked)}
                />
              </label>
              <PledgeCard
                pledge={pledge}
                onEdit={handleEditPledge}
                onDelete={handleDeletePledge}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {externalPagination && externalPagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={externalPagination.currentPage}
            totalPages={externalPagination.totalPages}
            onPageChange={handlePageChange}
            showInfo={true}
            totalItems={externalPagination.count}
            itemsPerPage={externalPagination.itemsPerPage || 25}
          />
        </div>
      )}
    </div>
  );
};

export default PledgesList;