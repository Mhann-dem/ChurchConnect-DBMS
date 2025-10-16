// frontend/src/components/admin/Pledges/PledgeStats.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, ProgressBar, Badge } from '../../ui';
import styles from './Pledges.module.css'; 
import { LoadingSpinner } from '../../shared';
import usePledges from '../../../hooks/usePledges';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import { ChevronDown, ChevronUp, Users, TrendingUp } from 'lucide-react';

const PledgeStats = ({ stats, filters = {}, onRefresh, updateTrigger = 0 }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ NEW: Collapsible sections state
  const [showTopPledgers, setShowTopPledgers] = useState(false);
  const [showMonthlyTrends, setShowMonthlyTrends] = useState(false);

  // Only use the hook if stats aren't provided as props
  const pledgesHook = !stats ? usePledges() : null;
  
  // Use either provided stats or hook stats
  const pledgeStats = stats || pledgesHook?.statistics || {};
  const loading = pledgesHook?.loading || isLoading;
  const error = pledgesHook?.error || null;
  const fetchPledgeStats = pledgesHook?.fetchStatistics;

  // Fetch stats when filters change (only if using hook)
  useEffect(() => {
    if (!stats && fetchPledgeStats && typeof fetchPledgeStats === 'function') {
      setIsLoading(true);
      fetchPledgeStats({
        period: selectedPeriod,
        frequency: selectedFrequency,
        ...filters
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [selectedPeriod, selectedFrequency, filters, stats, fetchPledgeStats]);

  // ✅ CRITICAL: Re-fetch stats when updateTrigger changes
  useEffect(() => {
    if (updateTrigger > 0) {
      console.log('[PledgeStats] 🔄 UpdateTrigger changed, refreshing stats...', updateTrigger);
      handleRefreshStats();
    }
  }, [updateTrigger]);

  // ✅ NEW: Listen for pledge data changes
  useEffect(() => {
    const handlePledgeDataChanged = (event) => {
      console.log('[PledgeStats] 🔔 Pledge data changed event received', event.detail);
      handleRefreshStats();
    };
    
    window.addEventListener('pledgeDataChanged', handlePledgeDataChanged);
    
    return () => {
      window.removeEventListener('pledgeDataChanged', handlePledgeDataChanged);
    };
  }, []);

  // ✅ CRITICAL: Enhanced refresh handler
  const handleRefreshStats = useCallback(async () => {
    if (onRefresh) {
      console.log('[PledgeStats] 🔄 External refresh triggered');
      try {
        await onRefresh();
      } catch (error) {
        console.error('[PledgeStats] ❌ External refresh failed:', error);
      }
    } else if (fetchPledgeStats && typeof fetchPledgeStats === 'function') {
      console.log('[PledgeStats] 🔄 Hook refresh triggered');
      setIsLoading(true);
      try {
        await fetchPledgeStats({
          period: selectedPeriod,
          frequency: selectedFrequency,
          ...filters,
          forceRefresh: true
        });
      } catch (error) {
        console.error('[PledgeStats] ❌ Hook refresh failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onRefresh, fetchPledgeStats, selectedPeriod, selectedFrequency, filters]);

  // Helper function to safely get numeric values
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  // Helper function to safely format currency
  const safeCurrency = (value) => {
    return formatCurrency(safeNumber(value));
  };

  // Helper function to safely format percentage
  const safePercentage = (value) => {
    return formatPercentage(safeNumber(value) / 100);
  };

  if (loading) {
    return (
      <div className={styles.statsContainer} key={`stats-${updateTrigger}`}>
        <LoadingSpinner message="Loading pledge statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <p className={styles.errorText}>Error loading pledge statistics: {error}</p>
          {fetchPledgeStats && (
            <button 
              onClick={() => fetchPledgeStats()} 
              className={styles.retryButton}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Extract and validate data from stats
  const {
    total_pledged = 0,
    total_received = 0,
    active_pledges = 0,
    completed_pledges = 0,
    cancelled_pledges = 0,
    average_pledge = 0,
    pledges_by_frequency = {},
    monthly_trends = [],
    top_pledgers = [],
    fulfillment_rate = 0,
    projected_annual = 0,
    overdue_amount = 0,
    upcoming_pledges = 0,
    this_month_received = 0,
    this_month_target = 0
  } = pledgeStats;

  // Calculate derived statistics
  const totalPledged = safeNumber(total_pledged);
  const totalReceived = safeNumber(total_received);
  const activePledges = safeNumber(active_pledges);
  const completedPledges = safeNumber(completed_pledges);
  const cancelledPledges = safeNumber(cancelled_pledges);
  const averagePledge = safeNumber(average_pledge);
  const fulfillmentRatePercent = safeNumber(fulfillment_rate);
  const projectedAnnualAmount = safeNumber(projected_annual);
  const overdueAmount = safeNumber(overdue_amount);
  const upcomingPledges = safeNumber(upcoming_pledges);
  const thisMonthReceived = safeNumber(this_month_received);
  const thisMonthTarget = safeNumber(this_month_target);

  const completionPercentage = totalPledged > 0 ? (totalReceived / totalPledged) * 100 : 0;
  const remainingAmount = totalPledged - totalReceived;
  const totalPledgeCount = activePledges + completedPledges + cancelledPledges;
  const thisMonthProgress = thisMonthTarget > 0 ? (thisMonthReceived / thisMonthTarget) * 100 : 0;

  const frequencyOptions = [
    { value: 'all', label: 'All Frequencies' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
    { value: 'one-time', label: 'One-time' }
  ];

  const periodOptions = [
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'ytd', label: 'Year to Date' }
  ];

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
  };

  const handleFrequencyChange = (value) => {
    setSelectedFrequency(value);
  };

  return (
    <div className={styles.statsContainer} key={`stats-${updateTrigger}`}>
      {/* Filter Controls - Only show if not using prop stats */}
      {!stats && (
        <div>
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label htmlFor="frequency-select" className={styles.filterLabel}>
                Frequency:
              </label>
              <select
                id="frequency-select"
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                className={styles.filterSelect}
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ ADD THIS NEW BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStats}
              disabled={loading}
              style={{ marginLeft: 'auto' }}
            >
              {loading ? 'Refreshing...' : 'Refresh Stats'}
            </Button>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="frequency-select" className={styles.filterLabel}>
              Frequency:
            </label>
            <select
              id="frequency-select"
              value={selectedFrequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className={styles.filterSelect}
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Statistics Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Total Pledged</h3>
            <Badge variant="info" className={styles.statBadge}>
              {activePledges} Active
            </Badge>
          </div>
          <div className={styles.statValue}>
            {safeCurrency(totalPledged)}
          </div>
          <div className={styles.statSubtext}>
            Average: {safeCurrency(averagePledge)} per pledge
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statDetail}>
              {totalPledgeCount} total pledges
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Total Received</h3>
            <Badge 
              variant={completionPercentage >= 80 ? "success" : completionPercentage >= 60 ? "warning" : "danger"}
              className={styles.statBadge}
            >
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
          <div className={styles.statValue}>
            {safeCurrency(totalReceived)}
          </div>
          <div className={styles.statSubtext}>
            Remaining: {safeCurrency(remainingAmount)}
          </div>
          {overdueAmount > 0 && (
            <div className={styles.statWarning}>
              Overdue: {safeCurrency(overdueAmount)}
            </div>
          )}
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Fulfillment Rate</h3>
            <Badge 
              variant={fulfillmentRatePercent >= 90 ? "success" : fulfillmentRatePercent >= 70 ? "warning" : "danger"}
              className={styles.statBadge}
            >
              {completedPledges} Complete
            </Badge>
          </div>
          <div className={styles.statValue}>
            {Math.round(fulfillmentRatePercent)}%
          </div>
          <div className={styles.statSubtext}>
            On-time completion rate
          </div>
          {cancelledPledges > 0 && (
            <div className={styles.statDetails}>
              <span className={styles.statDetail}>
                {cancelledPledges} cancelled
              </span>
            </div>
          )}
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>This Month</h3>
            <Badge variant="info" className={styles.statBadge}>
              {Math.round(thisMonthProgress)}%
            </Badge>
          </div>
          <div className={styles.statValue}>
            {safeCurrency(thisMonthReceived)}
          </div>
          <div className={styles.statSubtext}>
            Target: {safeCurrency(thisMonthTarget)}
          </div>
          {upcomingPledges > 0 && (
            <div className={styles.statDetails}>
              <span className={styles.statDetail}>
                {upcomingPledges} upcoming
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className={styles.progressCard}>
        <h3 className={styles.progressTitle}>Overall Pledge Completion Progress</h3>
        <ProgressBar
          value={completionPercentage}
          max={100}
          className={styles.progressBar}
          showLabel={true}
          label={`${safeCurrency(totalReceived)} of ${safeCurrency(totalPledged)}`}
        />
        <div className={styles.progressStats}>
          <span className={styles.progressStat}>
            <strong>Completed:</strong> {completedPledges} pledges
          </span>
          <span className={styles.progressStat}>
            <strong>Active:</strong> {activePledges} pledges
          </span>
          <span className={styles.progressStat}>
            <strong>Progress:</strong> {Math.round(completionPercentage)}%
          </span>
        </div>
      </Card>

      {/* This Month Progress */}
      {thisMonthTarget > 0 && (
        <Card className={styles.progressCard}>
          <h3 className={styles.progressTitle}>This Month's Target Progress</h3>
          <ProgressBar
            value={thisMonthProgress}
            max={100}
            className={styles.progressBar}
            showLabel={true}
            label={`${safeCurrency(thisMonthReceived)} of ${safeCurrency(thisMonthTarget)}`}
          />
          <div className={styles.progressStats}>
            <span className={styles.progressStat}>
              <strong>Remaining:</strong> {safeCurrency(thisMonthTarget - thisMonthReceived)}
            </span>
            <span className={styles.progressStat}>
              <strong>Progress:</strong> {Math.round(thisMonthProgress)}%
            </span>
          </div>
        </Card>
      )}

      {/* Frequency Breakdown */}
      {Object.keys(pledges_by_frequency).length > 0 && (
        <Card className={styles.frequencyCard}>
          <h3 className={styles.frequencyTitle}>Pledges by Frequency</h3>
          <div className={styles.frequencyGrid}>
            {Object.entries(pledges_by_frequency).map(([frequency, data]) => (
              <div key={frequency} className={styles.frequencyItem}>
                <div className={styles.frequencyLabel}>
                  {frequency.charAt(0).toUpperCase() + frequency.slice(1).replace('-', ' ')}
                </div>
                <div className={styles.frequencyValue}>
                  {safeCurrency(data.amount || data.total_amount || 0)}
                </div>
                <div className={styles.frequencyCount}>
                  {data.count || 0} pledge{(data.count || 0) !== 1 ? 's' : ''}
                </div>
                {data.avg_amount && (
                  <div className={styles.frequencyAvg}>
                    Avg: {safeCurrency(data.avg_amount)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Pledgers */}
      {/* ✅ ENHANCED: Collapsible Top Pledgers */}
      {Array.isArray(top_pledgers) && top_pledgers.length > 0 && (
        <Card className={styles.topPledgersCard}>
          <div 
            className={styles.collapsibleHeader}
            onClick={() => setShowTopPledgers(!showTopPledgers)}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderBottom: showTopPledgers ? '1px solid #e5e7eb' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} />
              <h3 className={styles.topPledgersTitle}>
                Top Contributors ({top_pledgers.length})
              </h3>
            </div>
            {showTopPledgers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showTopPledgers && (
            <div className={styles.topPledgersList}>
              {top_pledgers.slice(0, 10).map((pledger, index) => (
                <div key={pledger.id || index} className={styles.topPledgerItem}>
                  <div className={styles.pledgerRank}>
                    #{index + 1}
                  </div>
                  <div className={styles.pledgerInfo}>
                    <div className={styles.pledgerName}>
                      {pledger.name || pledger.member_name || 'Unknown'}
                    </div>
                    <div className={styles.pledgerDetails}>
                      {safeCurrency(pledger.total_pledged || pledger.totalPledged || 0)} pledged
                      {pledger.fulfillment_rate && (
                        <span className={styles.pledgerFulfillment}>
                          • {Math.round(pledger.fulfillment_rate)}% fulfilled
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.pledgerAmount}>
                    {safeCurrency(pledger.total_pledged || pledger.totalPledged || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Monthly Trends */}
      {/* ✅ ENHANCED: Collapsible Monthly Trends */}
      {Array.isArray(monthly_trends) && monthly_trends.length > 0 && (
        <Card className={styles.trendsCard}>
          <div 
            className={styles.collapsibleHeader}
            onClick={() => setShowMonthlyTrends(!showMonthlyTrends)}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderBottom: showMonthlyTrends ? '1px solid #e5e7eb' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} />
              <h3 className={styles.trendsTitle}>
                Monthly Trends ({monthly_trends.length} months)
              </h3>
            </div>
            {showMonthlyTrends ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showMonthlyTrends && (
            <div className={styles.trendsChart} style={{ marginTop: '1rem', padding: '1rem' }}>
              {monthly_trends.map((trend, index) => {
                const maxAmount = Math.max(...monthly_trends.map(t => safeNumber(t.amount || t.total_amount || 0)));
                const trendAmount = safeNumber(trend.amount || trend.total_amount || 0);
                const percentage = maxAmount > 0 ? (trendAmount / maxAmount) * 100 : 0;
                
                return (
                  <div key={trend.month || index} className={styles.trendItem}>
                    <div className={styles.trendMonth}>
                      {trend.month || trend.period || `Month ${index + 1}`}
                    </div>
                    <div className={styles.trendBar}>
                      <div
                        className={styles.trendBarFill}
                        style={{ height: `${percentage}%` }}
                        title={`${safeCurrency(trendAmount)} in ${trend.month}`}
                      />
                    </div>
                    <div className={styles.trendAmount}>
                      {safeCurrency(trendAmount)}
                    </div>
                    {trend.count && (
                      <div className={styles.trendCount}>
                        {trend.count} pledges
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        {projectedAnnualAmount > 0 && (
          <Card className={styles.summaryCard}>
            <h4 className={styles.summaryTitle}>Annual Projection</h4>
            <div className={styles.summaryValue}>
              {safeCurrency(projectedAnnualAmount)}
            </div>
            <div className={styles.summarySubtext}>
              Based on current trends
            </div>
          </Card>
        )}

        {overdueAmount > 0 && (
          <Card className={`${styles.summaryCard} ${styles.warningCard}`}>
            <h4 className={styles.summaryTitle}>Overdue Amount</h4>
            <div className={styles.summaryValue}>
              {safeCurrency(overdueAmount)}
            </div>
            <div className={styles.summarySubtext}>
              Requires follow-up
            </div>
          </Card>
        )}

        {upcomingPledges > 0 && (
          <Card className={styles.summaryCard}>
            <h4 className={styles.summaryTitle}>Upcoming Payments</h4>
            <div className={styles.summaryValue}>
              {upcomingPledges}
            </div>
            <div className={styles.summarySubtext}>
              Due this month
            </div>
          </Card>
        )}
      </div>

      {/* Export Actions */}
      <Card className={styles.exportCard}>
        <h3 className={styles.exportTitle}>Export Statistics</h3>
        <div className={styles.exportActions}>
          <button
            className={styles.exportButton}
            onClick={() => window.print()}
            aria-label="Print statistics report"
          >
            <svg className={styles.exportIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14H4v-3h1v3zm6 0H9v2H7v-2H5v-2h6v2z" clipRule="evenodd" />
            </svg>
            Print Report
          </button>
          <button
            className={styles.exportButton}
            onClick={() => handleExportCSV()}
            aria-label="Export statistics to CSV"
          >
            <svg className={styles.exportIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export to CSV
          </button>
          <button
            className={styles.exportButton}
            onClick={() => handleExportPDF()}
            aria-label="Export statistics to PDF"
          >
            <svg className={styles.exportIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 3a1 1 0 000 2h8a1 1 0 100-2H6zm0 3a1 1 0 100 2h8a1 1 0 100-2H6zm0 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Export to PDF
          </button>
        </div>
      </Card>
    </div>
  );

  // Export handlers
  function handleExportCSV() {
    try {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Pledged', totalPledged],
        ['Total Received', totalReceived],
        ['Completion Rate', `${Math.round(completionPercentage)}%`],
        ['Active Pledges', activePledges],
        ['Completed Pledges', completedPledges],
        ['Cancelled Pledges', cancelledPledges],
        ['Average Pledge', averagePledge],
        ['Fulfillment Rate', `${Math.round(fulfillmentRatePercent)}%`],
        ['Projected Annual', projectedAnnualAmount],
        ['This Month Received', thisMonthReceived],
        ['This Month Target', thisMonthTarget],
        ['Overdue Amount', overdueAmount],
        ['Upcoming Pledges', upcomingPledges]
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pledge_statistics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }

  function handleExportPDF() {
    // This would integrate with a PDF library like jsPDF
    console.log('PDF export functionality would be implemented here');
    alert('PDF export feature coming soon!');
  }
};

export default PledgeStats;