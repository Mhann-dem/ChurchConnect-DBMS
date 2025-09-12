import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Download, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Filter, 
  RefreshCw, 
  Clock,
  FileText,
  BarChart3,
  PieChart,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/form/FormControls/Select';
import Checkbox from '../../components/form/FormControls/Checkbox';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { useToast } from '../../hooks/useToast';
import { useReports } from '../../hooks/useReports';
import reportsService from '../../services/reports';
import MemberGrowthChart from '../../components/admin/Reports/Charts/MemberGrowthChart';
import PledgeChart from '../../components/admin/Reports/Charts/PledgeChart';
import AgeDistributionChart from '../../components/admin/Reports/Charts/AgeDistributionChart';
import MinistryChart from '../../components/admin/Reports/Charts/MinistryChart';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { validateDateRange, validateReportFilters } from '../../utils/validation';
import styles from './AdminPages.module.css';

const ReportsPage = () => {
  const { showToast } = useToast();
  
  // State management
  const [loadingStates, setLoadingStates] = useState({
    charts: false,
    export: {},
    schedule: {}
  });
  
  const [filters, setFilters] = useState({
    dateRange: '30',
    reportType: 'overview',
    includeInactive: false,
    groupBy: 'month'
  });

  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeCharts: true,
    includeDetails: true,
    dateRange: filters.dateRange
  });

  // Reports hook for data management
  const reportsHook = useReports(filters);
  const {
    reportData = {},
    isLoading = false,
    error = null,
    refetch = () => Promise.resolve(),
    lastUpdated = null
  } = reportsHook || {};

  // Safe data extraction with fallbacks
  const {
    memberGrowth = [],
    pledgeStats = [],
    ageDistribution = [],
    ministryDistribution = [],
    summary = {}
  } = reportData;

  // Quick reports configuration
  const quickReports = useMemo(() => [
    { 
      id: 'member-list', 
      name: 'Complete Member Directory', 
      description: 'Full member list with contact information',
      icon: Users,
      estimatedSize: 'Small',
      category: 'Member Reports'
    },
    { 
      id: 'pledge-summary', 
      name: 'Financial Pledges Overview', 
      description: 'Comprehensive financial commitments report',
      icon: DollarSign,
      estimatedSize: 'Medium',
      category: 'Financial Reports'
    },
    { 
      id: 'group-membership', 
      name: 'Ministry Participation', 
      description: 'Members grouped by ministry and involvement',
      icon: Users,
      estimatedSize: 'Medium',
      category: 'Ministry Reports'
    },
    { 
      id: 'attendance-report', 
      name: 'Event Attendance Analysis', 
      description: 'Recent attendance trends and patterns',
      icon: Calendar,
      estimatedSize: 'Large',
      category: 'Activity Reports'
    },
    { 
      id: 'birthday-list', 
      name: 'Upcoming Birthdays', 
      description: 'Members with birthdays in the next 90 days',
      icon: Calendar,
      estimatedSize: 'Small',
      category: 'Member Reports'
    },
    { 
      id: 'contact-report', 
      name: 'Communication Directory', 
      description: 'Member contact preferences and information',
      icon: FileText,
      estimatedSize: 'Medium',
      category: 'Member Reports'
    }
  ], []);

  // Filter options
  const filterOptions = useMemo(() => ({
    dateRange: [
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '90', label: 'Last 3 months' },
      { value: '180', label: 'Last 6 months' },
      { value: '365', label: 'Last year' },
      { value: 'all', label: 'All time' }
    ],
    reportType: [
      { value: 'overview', label: 'Overview' },
      { value: 'detailed', label: 'Detailed Analysis' },
      { value: 'summary', label: 'Executive Summary' }
    ],
    groupBy: [
      { value: 'day', label: 'Daily' },
      { value: 'week', label: 'Weekly' },
      { value: 'month', label: 'Monthly' },
      { value: 'quarter', label: 'Quarterly' },
      { value: 'year', label: 'Yearly' }
    ],
    exportFormat: [
      { value: 'csv', label: 'CSV (Excel Compatible)' },
      { value: 'pdf', label: 'PDF Report' },
      { value: 'excel', label: 'Excel Workbook' },
      { value: 'json', label: 'JSON Data' }
    ]
  }), []);

  // Handle filter changes with validation
  const handleFilterChange = useCallback((key, value) => {
    try {
      const newFilters = { ...filters, [key]: value };
      const validatedFilters = validateReportFilters(newFilters);
      setFilters(validatedFilters);
    } catch (error) {
      console.error('Filter validation error:', error);
      showToast('Invalid filter value', 'error');
    }
  }, [filters, showToast]);

  // Handle export with progress tracking
  const handleExport = useCallback(async (reportId) => {
    const exportKey = `${reportId}-${Date.now()}`;
    
    try {
      setLoadingStates(prev => ({
        ...prev,
        export: { ...prev.export, [exportKey]: true }
      }));

      // Validate export options
      if (!exportOptions.format || !reportId) {
        throw new Error('Invalid export parameters');
      }

      const exportData = {
        ...exportOptions,
        filters: filters,
        reportId: reportId,
        timestamp: new Date().toISOString()
      };

      const response = await reportsService.exportReport(reportId, exportData);
      
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }

      // Determine file extension and MIME type
      const mimeTypes = {
        csv: 'text/csv',
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json'
      };

      const extensions = {
        csv: 'csv',
        pdf: 'pdf',
        excel: 'xlsx',
        json: 'json'
      };

      const mimeType = mimeTypes[exportOptions.format] || 'application/octet-stream';
      const extension = extensions[exportOptions.format] || 'txt';

      // Create and trigger download
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}-${formatDate(new Date(), 'YYYY-MM-DD')}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`${quickReports.find(r => r.id === reportId)?.name || 'Report'} exported successfully`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast(error.message || 'Failed to export report', 'error');
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        export: { ...prev.export, [exportKey]: false }
      }));
    }
  }, [exportOptions, filters, quickReports, showToast]);

  // Handle report scheduling (placeholder for future implementation)
  const handleScheduleReport = useCallback((reportId) => {
    // TODO: Implement report scheduling functionality
    showToast('Report scheduling will be available in a future update', 'info');
  }, [showToast]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      showToast('Reports data refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh data', 'error');
    }
  }, [refetch, showToast]);

  // Group quick reports by category
  const groupedReports = useMemo(() => {
    return quickReports.reduce((groups, report) => {
      const category = report.category || 'Other Reports';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(report);
      return groups;
    }, {});
  }, [quickReports]);

  // Chart error fallback component
  const ChartErrorFallback = useCallback(({ chartName, onRetry }) => (
    <div className={styles.chartError}>
      <AlertCircle size={32} className={styles.errorIcon} />
      <h4>Failed to load {chartName}</h4>
      <Button size="sm" onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  ), []);

  return (
    <ErrorBoundary>
      <div className={styles.reportsPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>Reports & Analytics</h1>
              <p className={styles.pageSubtitle}>
                Generate insights and export data about church members and activities
              </p>
              {lastUpdated && (
                <p className={styles.lastUpdated}>
                  <Clock size={14} />
                  Last updated: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
            
            <div className={styles.headerActions}>
              <Button 
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                icon={<RefreshCw size={16} className={isLoading ? styles.spinning : ''} />}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                icon={<Calendar size={16} />}
                onClick={() => handleScheduleReport('all')}
              >
                Schedule Reports
              </Button>
              <Button 
                variant="primary"
                icon={<Download size={16} />}
                onClick={() => handleExport('dashboard-summary')}
              >
                Export Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.pageContent}>
          {/* Filters Section */}
          <Card className={styles.filtersCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Filter size={18} />
                Report Configuration
              </h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.filtersGrid}>
                <Select
                  label="Time Period"
                  value={filters.dateRange}
                  onChange={(value) => handleFilterChange('dateRange', value)}
                  options={filterOptions.dateRange}
                  disabled={isLoading}
                />
                <Select
                  label="Report Detail Level"
                  value={filters.reportType}
                  onChange={(value) => handleFilterChange('reportType', value)}
                  options={filterOptions.reportType}
                  disabled={isLoading}
                />
                <Select
                  label="Data Grouping"
                  value={filters.groupBy}
                  onChange={(value) => handleFilterChange('groupBy', value)}
                  options={filterOptions.groupBy}
                  disabled={isLoading}
                />
                <div className={styles.checkboxGroup}>
                  <Checkbox
                    label="Include Inactive Members"
                    checked={filters.includeInactive}
                    onChange={(checked) => handleFilterChange('includeInactive', checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Statistics */}
          {summary && Object.keys(summary).length > 0 && (
            <div className={styles.summaryGrid}>
              <Card className={styles.statCard}>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <Users className={styles.primaryIcon} />
                  </div>
                  <div className={styles.statData}>
                    <span className={styles.statValue}>{summary.totalMembers || 0}</span>
                    <span className={styles.statLabel}>Total Members</span>
                  </div>
                </div>
              </Card>
              
              <Card className={styles.statCard}>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <TrendingUp className={styles.successIcon} />
                  </div>
                  <div className={styles.statData}>
                    <span className={styles.statValue}>{summary.newThisPeriod || 0}</span>
                    <span className={styles.statLabel}>New This Period</span>
                  </div>
                </div>
              </Card>
              
              <Card className={styles.statCard}>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <DollarSign className={styles.warningIcon} />
                  </div>
                  <div className={styles.statData}>
                    <span className={styles.statValue}>
                      {formatCurrency(summary.totalPledges || 0)}
                    </span>
                    <span className={styles.statLabel}>Total Pledges</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quick Reports */}
          <Card className={styles.quickReportsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quick Reports</h2>
              <p className={styles.cardSubtitle}>
                Generate commonly used reports with one click
              </p>
            </div>
            <div className={styles.cardBody}>
              {Object.entries(groupedReports).map(([category, reports]) => (
                <div key={category} className={styles.reportCategory}>
                  <h3 className={styles.categoryTitle}>{category}</h3>
                  <div className={styles.reportsGrid}>
                    {reports.map((report) => (
                      <div key={report.id} className={styles.reportCard}>
                        <div className={styles.reportIcon}>
                          <report.icon size={24} />
                        </div>
                        <div className={styles.reportInfo}>
                          <h4 className={styles.reportName}>{report.name}</h4>
                          <p className={styles.reportDescription}>{report.description}</p>
                          <div className={styles.reportMeta}>
                            <Badge variant="secondary" size="sm">
                              {report.estimatedSize}
                            </Badge>
                          </div>
                        </div>
                        <div className={styles.reportActions}>
                          <Button
                            size="sm"
                            onClick={() => handleExport(report.id)}
                            disabled={loadingStates.export[report.id] || isLoading}
                            icon={loadingStates.export[report.id] ? <LoadingSpinner size="sm" /> : <Download size={16} />}
                          >
                            {loadingStates.export[report.id] ? 'Exporting...' : 'Export'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleReport(report.id)}
                            disabled={loadingStates.schedule[report.id] || isLoading}
                            icon={<Clock size={16} />}
                          >
                            Schedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Charts and Analytics */}
          {isLoading && !memberGrowth.length ? (
            <div className={styles.chartsLoading}>
              <LoadingSpinner size="large" />
              <p>Loading analytics data...</p>
            </div>
          ) : error ? (
            <Card className={styles.errorCard}>
              <div className={styles.errorContent}>
                <AlertCircle size={32} className={styles.errorIcon} />
                <h3>Failed to Load Analytics</h3>
                <p>{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </div>
            </Card>
          ) : (
            <div className={styles.chartsGrid}>
              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <TrendingUp className={styles.chartIcon} />
                    Member Growth Trend
                  </h2>
                </div>
                <div className={styles.chartContainer}>
                  <ErrorBoundary 
                    fallback={<ChartErrorFallback 
                      chartName="Member Growth Chart" 
                      onRetry={handleRefresh} 
                    />}
                  >
                    <MemberGrowthChart 
                      data={memberGrowth} 
                      groupBy={filters.groupBy}
                      dateRange={filters.dateRange}
                    />
                  </ErrorBoundary>
                </div>
              </Card>

              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <DollarSign className={styles.chartIcon} />
                    Financial Overview
                  </h2>
                </div>
                <div className={styles.chartContainer}>
                  <ErrorBoundary 
                    fallback={<ChartErrorFallback 
                      chartName="Pledge Statistics" 
                      onRetry={handleRefresh} 
                    />}
                  >
                    <PledgeChart 
                      data={pledgeStats} 
                      groupBy={filters.groupBy}
                      includeInactive={filters.includeInactive}
                    />
                  </ErrorBoundary>
                </div>
              </Card>

              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <BarChart3 className={styles.chartIcon} />
                    Age Demographics
                  </h2>
                </div>
                <div className={styles.chartContainer}>
                  <ErrorBoundary 
                    fallback={<ChartErrorFallback 
                      chartName="Age Distribution" 
                      onRetry={handleRefresh} 
                    />}
                  >
                    <AgeDistributionChart 
                      data={ageDistribution}
                      includeInactive={filters.includeInactive}
                    />
                  </ErrorBoundary>
                </div>
              </Card>

              <Card className={styles.chartCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <PieChart className={styles.chartIcon} />
                    Ministry Participation
                  </h2>
                </div>
                <div className={styles.chartContainer}>
                  <ErrorBoundary 
                    fallback={<ChartErrorFallback 
                      chartName="Ministry Distribution" 
                      onRetry={handleRefresh} 
                    />}
                  >
                    <MinistryChart 
                      data={ministryDistribution}
                      includeInactive={filters.includeInactive}
                    />
                  </ErrorBoundary>
                </div>
              </Card>
            </div>
          )}

          {/* Export Configuration */}
          <Card className={styles.exportCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Export Configuration</h2>
              <p className={styles.cardSubtitle}>
                Customize how reports are exported and delivered
              </p>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.exportGrid}>
                <Select
                  label="Export Format"
                  value={exportOptions.format}
                  onChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}
                  options={filterOptions.exportFormat}
                  disabled={isLoading}
                />
                <div className={styles.exportOptions}>
                  <Checkbox
                    label="Include Chart Images"
                    checked={exportOptions.includeCharts}
                    onChange={(checked) => setExportOptions(prev => ({ ...prev, includeCharts: checked }))}
                    disabled={isLoading || exportOptions.format === 'csv'}
                  />
                  <Checkbox
                    label="Include Detailed Data"
                    checked={exportOptions.includeDetails}
                    onChange={(checked) => setExportOptions(prev => ({ ...prev, includeDetails: checked }))}
                    disabled={isLoading}
                  />
                  <Checkbox
                    label="Apply Current Filters"
                    checked={true}
                    onChange={() => {}} // Always apply current filters
                    disabled={true}
                  />
                </div>
                <div className={styles.exportActions}>
                  <Button
                    variant="outline"
                    onClick={() => setExportOptions({
                      format: 'csv',
                      includeCharts: true,
                      includeDetails: true,
                      dateRange: filters.dateRange
                    })}
                    disabled={isLoading}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReportsPage;