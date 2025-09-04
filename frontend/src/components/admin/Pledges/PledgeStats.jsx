import React, { useState, useEffect } from 'react';
import { Card, ProgressBar, Badge } from '../../ui';
import styles from './Pledges.module.css'; 
import { LoadingSpinner } from '../../shared';
import usePledges from '../../../hooks/usePledges';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

const PledgeStats = ({ stats, filters = {} }) => {
  // Accept stats as a prop to avoid additional hook calls
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');
  const [selectedFrequency, setSelectedFrequency] = useState('all');

  // Only use the hook if stats aren't provided as props
  const pledgesHook = !stats ? usePledges() : null;
  
  // Use either provided stats or hook stats
  const pledgeStats = stats || (pledgesHook?.statistics) || {};
  const loading = pledgesHook?.loading || false;
  const error = pledgesHook?.error || null;
  const fetchPledgeStats = pledgesHook?.fetchStatistics || (() => {});

  useEffect(() => {
    // Only fetch if we're using the hook and don't have stats prop
    if (!stats && fetchPledgeStats && typeof fetchPledgeStats === 'function') {
      fetchPledgeStats({
        period: selectedPeriod,
        frequency: selectedFrequency,
        ...filters
      });
    }
  }, [selectedPeriod, selectedFrequency, filters, stats]); // Remove fetchPledgeStats from dependencies

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <LoadingSpinner message="Loading pledge statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Error loading pledge statistics: {error}</p>
      </div>
    );
  }

  const {
    totalPledged = 0,
    totalReceived = 0,
    activePledges = 0,
    completedPledges = 0,
    averagePledge = 0,
    pledgesByFrequency = {},
    monthlyTrends = [],
    topPledgers = [],
    fulfillmentRate = 0,
    projectedAnnual = 0
  } = pledgeStats || {};

  const completionPercentage = totalPledged > 0 ? (totalReceived / totalPledged) * 100 : 0;
  const remainingAmount = totalPledged - totalReceived;

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
    <div className={styles.statsContainer}>
      {/* Filter Controls - Only show if not using prop stats */}
      {!stats && (
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label htmlFor="period-select" className={styles.filterLabel}>
              Time Period:
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className={styles.filterSelect}
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            {formatCurrency(totalPledged)}
          </div>
          <div className={styles.statSubtext}>
            Average: {formatCurrency(averagePledge)} per pledge
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Total Received</h3>
            <Badge 
              variant={completionPercentage >= 80 ? "success" : completionPercentage >= 60 ? "warning" : "danger"}
              className={styles.statBadge}
            >
              {formatPercentage(completionPercentage)}
            </Badge>
          </div>
          <div className={styles.statValue}>
            {formatCurrency(totalReceived)}
          </div>
          <div className={styles.statSubtext}>
            Remaining: {formatCurrency(remainingAmount)}
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Fulfillment Rate</h3>
            <Badge 
              variant={fulfillmentRate >= 90 ? "success" : fulfillmentRate >= 70 ? "warning" : "danger"}
              className={styles.statBadge}
            >
              {completedPledges} Complete
            </Badge>
          </div>
          <div className={styles.statValue}>
            {formatPercentage(fulfillmentRate)}
          </div>
          <div className={styles.statSubtext}>
            On-time completion rate
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>Projected Annual</h3>
            <Badge variant="info" className={styles.statBadge}>
              Forecast
            </Badge>
          </div>
          <div className={styles.statValue}>
            {formatCurrency(projectedAnnual)}
          </div>
          <div className={styles.statSubtext}>
            Based on current trends
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className={styles.progressCard}>
        <h3 className={styles.progressTitle}>Pledge Completion Progress</h3>
        <ProgressBar
          value={completionPercentage}
          max={100}
          className={styles.progressBar}
          showLabel={true}
          label={`${formatCurrency(totalReceived)} of ${formatCurrency(totalPledged)}`}
        />
        <div className={styles.progressStats}>
          <span className={styles.progressStat}>
            <strong>Completed:</strong> {completedPledges} pledges
          </span>
          <span className={styles.progressStat}>
            <strong>Active:</strong> {activePledges} pledges
          </span>
        </div>
      </Card>

      {/* Frequency Breakdown */}
      {Object.keys(pledgesByFrequency).length > 0 && (
        <Card className={styles.frequencyCard}>
          <h3 className={styles.frequencyTitle}>Pledges by Frequency</h3>
          <div className={styles.frequencyGrid}>
            {Object.entries(pledgesByFrequency).map(([frequency, data]) => (
              <div key={frequency} className={styles.frequencyItem}>
                <div className={styles.frequencyLabel}>
                  {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                </div>
                <div className={styles.frequencyValue}>
                  {formatCurrency(data.amount)}
                </div>
                <div className={styles.frequencyCount}>
                  {data.count} pledge{data.count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Pledgers */}
      {topPledgers.length > 0 && (
        <Card className={styles.topPledgersCard}>
          <h3 className={styles.topPledgersTitle}>Top Pledgers</h3>
          <div className={styles.topPledgersList}>
            {topPledgers.map((pledger, index) => (
              <div key={pledger.id} className={styles.topPledgerItem}>
                <div className={styles.pledgerRank}>
                  #{index + 1}
                </div>
                <div className={styles.pledgerInfo}>
                  <div className={styles.pledgerName}>
                    {pledger.name}
                  </div>
                  <div className={styles.pledgerDetails}>
                    {formatCurrency(pledger.totalPledged)} pledged
                    {pledger.fulfillmentRate && (
                      <span className={styles.pledgerFulfillment}>
                        • {formatPercentage(pledger.fulfillmentRate)} fulfilled
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.pledgerAmount}>
                  {formatCurrency(pledger.totalPledged)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <Card className={styles.trendsCard}>
          <h3 className={styles.trendsTitle}>Monthly Trends</h3>
          <div className={styles.trendsChart}>
            {monthlyTrends.map((trend, index) => (
              <div key={trend.month} className={styles.trendItem}>
                <div className={styles.trendMonth}>
                  {trend.month}
                </div>
                <div className={styles.trendBar}>
                  <div
                    className={styles.trendBarFill}
                    style={{
                      height: `${(trend.amount / Math.max(...monthlyTrends.map(t => t.amount))) * 100}%`
                    }}
                  />
                </div>
                <div className={styles.trendAmount}>
                  {formatCurrency(trend.amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Actions */}
      <Card className={styles.exportCard}>
        <h3 className={styles.exportTitle}>Export Statistics</h3>
        <div className={styles.exportActions}>
          <button
            className={styles.exportButton}
            onClick={() => window.print()}
            aria-label="Print statistics"
          >
            Print Report
          </button>
          <button
            className={styles.exportButton}
            onClick={() => {
              // Export logic would be implemented here
              console.log('Export to CSV');
            }}
            aria-label="Export to CSV"
          >
            Export to CSV
          </button>
          <button
            className={styles.exportButton}
            onClick={() => {
              // Export logic would be implemented here
              console.log('Export to PDF');
            }}
            aria-label="Export to PDF"
          >
            Export to PDF
          </button>
        </div>
      </Card>
    </div>
  );
};

export default PledgeStats;