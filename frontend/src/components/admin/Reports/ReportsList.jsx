import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Avatar, Tooltip, Dropdown } from '../ui';
import { SearchBar, LoadingSpinner, EmptyState, Pagination } from '../shared';
import { useReports } from '../../hooks/useReports';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import styles from './Reports.module.css';

const ReportsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { user } = useAuth();
  const {
    reports,
    loading,
    error,
    totalCount,
    deleteReport,
    duplicateReport,
    generateReport,
    scheduleReport
  } = useReports({
    search: searchTerm,
    status: filterStatus,
    sortBy,
    sortOrder,
    page,
    pageSize
  });

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteReport(reportId);
    }
  };

  const handleDuplicate = async (reportId) => {
    await duplicateReport(reportId);
  };

  const handleGenerate = async (reportId) => {
    await generateReport(reportId);
  };

  const handleSchedule = async (reportId) => {
    await scheduleReport(reportId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'gray', text: 'Draft' },
      'active': { color: 'green', text: 'Active' },
      'scheduled': { color: 'blue', text: 'Scheduled' },
      'archived': { color: 'orange', text: 'Archived' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge color={config.color}>{config.text}</Badge>;
  };

  const getReportTypeIcon = (type) => {
    const icons = {
      'members': '👥',
      'pledges': '💰',
      'groups': '🏢',
      'attendance': '📊',
      'custom': '📋'
    };
    return icons[type] || icons.custom;
  };

  const reportActions = (report) => [
    {
      label: 'View',
      onClick: () => window.open(`/admin/reports/${report.id}`, '_blank'),
      icon: '👁️'
    },
    {
      label: 'Edit',
      onClick: () => window.location.href = `/admin/reports/${report.id}/edit`,
      icon: '✏️'
    },
    {
      label: 'Generate Now',
      onClick: () => handleGenerate(report.id),
      icon: '🔄'
    },
    {
      label: 'Schedule',
      onClick: () => handleSchedule(report.id),
      icon: '📅'
    },
    {
      label: 'Duplicate',
      onClick: () => handleDuplicate(report.id),
      icon: '📋'
    },
    {
      label: 'Delete',
      onClick: () => handleDelete(report.id),
      icon: '🗑️',
      className: styles.deleteAction
    }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error loading reports: {error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Reports</h1>
          <p>Create and manage your church reports</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => window.location.href = '/admin/reports/new'}
        >
          Create New Report
        </Button>
      </div>

      <div className={styles.filters}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search reports..."
        />
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="created_at">Date Created</option>
          <option value="name">Name</option>
          <option value="type">Type</option>
          <option value="last_run">Last Run</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className={styles.sortButton}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports found"
          description="Create your first report to get started"
          action={{
            label: 'Create Report',
            onClick: () => window.location.href = '/admin/reports/new'
          }}
        />
      ) : (
        <>
          <div className={styles.reportsList}>
            {reports.map(report => (
              <Card key={report.id} className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportInfo}>
                    <div className={styles.reportIcon}>
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div className={styles.reportDetails}>
                      <h3>{report.name}</h3>
                      <p className={styles.reportDescription}>
                        {report.description}
                      </p>
                      <div className={styles.reportMeta}>
                        <span>Created: {formatDate(report.created_at)}</span>
                        {report.last_run && (
                          <span>Last Run: {formatDate(report.last_run)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.reportActions}>
                    {getStatusBadge(report.status)}
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          ⋮
                        </Button>
                      }
                      items={reportActions(report)}
                    />
                  </div>
                </div>
                
                <div className={styles.reportStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Type</span>
                    <span className={styles.statValue}>{report.type}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Records</span>
                    <span className={styles.statValue}>{report.record_count || 0}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Format</span>
                    <span className={styles.statValue}>{report.format}</span>
                  </div>
                  {report.schedule && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Schedule</span>
                      <span className={styles.statValue}>{report.schedule}</span>
                    </div>
                  )}
                </div>

                {report.created_by && (
                  <div className={styles.reportCreator}>
                    <Avatar
                      src={report.created_by.avatar}
                      alt={report.created_by.name}
                      size="sm"
                    />
                    <span>Created by {report.created_by.name}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalCount={totalCount}
          />
        </>
      )}
    </div>
  );
};

export default ReportsList;