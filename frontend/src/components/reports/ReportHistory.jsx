// frontend/src/components/reports/ReportHistory.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Table } from '../ui';
import { apiClient } from '../../config/axiosClient';
import './ReportHistory.css';

function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [runHistory, setRunHistory] = useState([]);
  const [showRunHistory, setShowRunHistory] = useState(false);

  useEffect(() => {
    fetchReports();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = '/api/v1/reports/';
      const params = new URLSearchParams();

      if (filter !== 'all') {
        if (filter === 'scheduled') {
          params.append('scheduled', 'true');
        } else if (filter === 'active') {
          params.append('active', 'true');
        } else if (filter === 'inactive') {
          params.append('active', 'false');
        }
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiClient.get(url, { params });
      setReports(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunHistory = async (reportId) => {
    try {
      const response = await apiClient.get(`/api/v1/reports/runs/`, {
        params: { report: reportId },
      });
      setRunHistory(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching run history:', err);
    }
  };

  const handleRunReport = async (reportId) => {
    try {
      const response = await apiClient.post(`/api/v1/reports/${reportId}/run/`);
      if (response.data.success) {
        // Trigger download
        if (response.data.download_url) {
          window.open(response.data.download_url, '_blank');
        }
        fetchReports();
      }
    } catch (err) {
      setError('Error running report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await apiClient.delete(`/api/v1/reports/${reportId}/`);
        fetchReports();
        setSelectedReportId(null);
      } catch (err) {
        setError('Error deleting report');
      }
    }
  };

  const handleViewRunHistory = async (reportId) => {
    setSelectedReportId(reportId);
    await fetchRunHistory(reportId);
    setShowRunHistory(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { color: 'success', label: 'Completed' },
      failed: { color: 'danger', label: 'Failed' },
      running: { color: 'warning', label: 'Running' },
      pending: { color: 'info', label: 'Pending' },
    };
    const config = statusMap[status] || { color: 'secondary', label: status };
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getReportTypeBadge = (type) => {
    const typeMap = {
      members: 'primary',
      pledges: 'success',
      groups: 'info',
      families: 'warning',
      statistics: 'secondary',
    };
    return <Badge color={typeMap[type] || 'secondary'}>{type}</Badge>;
  };

  if (loading && reports.length === 0) {
    return (
      <Card className="report-history-card">
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading reports...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="report-history">
      <Card className="report-history-card">
        <div className="card-header">
          <h2>Report History</h2>
          <p className="card-subtitle">View and manage all your generated reports</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            {['all', 'active', 'inactive', 'scheduled'].map(option => (
              <button
                key={option}
                className={`filter-btn ${filter === option ? 'active' : ''}`}
                onClick={() => setFilter(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={() => fetchReports()}
          />
        </div>

        {/* Reports Table */}
        {reports.length > 0 ? (
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Runs</th>
                  <th>Last Run</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} className="report-row">
                    <td className="report-name">
                      <strong>{report.name}</strong>
                      {report.description && (
                        <p className="description">{report.description}</p>
                      )}
                    </td>
                    <td>{getReportTypeBadge(report.report_type)}</td>
                    <td>
                      <code>{report.format}</code>
                    </td>
                    <td>
                      <Badge color={report.is_active ? 'success' : 'secondary'}>
                        {report.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {report.is_scheduled && (
                        <Badge color="info" className="ml-2">Scheduled</Badge>
                      )}
                    </td>
                    <td>
                      <strong>{report.total_runs}</strong>
                      <span className="text-muted"> ({report.successful_runs} success)</span>
                    </td>
                    <td className="last-run">
                      {report.last_run ? (
                        new Date(report.last_run).toLocaleDateString()
                      ) : (
                        <span className="text-muted">Never</span>
                      )}
                    </td>
                    <td className="created-date">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions">
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleRunReport(report.id)}
                        title="Run this report"
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleViewRunHistory(report.id)}
                        title="View execution history"
                      >
                        History
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDeleteReport(report.id)}
                        title="Delete this report"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No reports found. Create your first report using the Report Generator!</p>
          </div>
        )}
      </Card>

      {/* Run History Modal */}
      {showRunHistory && (
        <div className="modal-overlay" onClick={() => setShowRunHistory(false)}>
          <Card className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3>Report Execution History</h3>
              <button
                className="close-btn"
                onClick={() => setShowRunHistory(false)}
              >
                ✕
              </button>
            </div>

            {runHistory.length > 0 ? (
              <div className="run-history-list">
                {runHistory.map(run => (
                  <div key={run.id} className="run-item">
                    <div className="run-header">
                      <div className="run-info">
                        <strong>{new Date(run.started_at).toLocaleString()}</strong>
                        <span className="ml-2">{getStatusBadge(run.status)}</span>
                      </div>
                      <div className="run-details">
                        <span className="detail-item">
                          <strong>Duration:</strong> {run.duration_display}
                        </span>
                        <span className="detail-item">
                          <strong>Records:</strong> {run.record_count || 0}
                        </span>
                        <span className="detail-item">
                          <strong>Size:</strong> {run.file_size_display}
                        </span>
                      </div>
                    </div>
                    {run.status === 'completed' && run.file_path && (
                      <a
                        href={`/api/v1/reports/download/${run.id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-link"
                      >
                        Download Report
                      </a>
                    )}
                    {run.status === 'failed' && run.error_message && (
                      <div className="error-message">
                        <strong>Error:</strong> {run.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No execution history available</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportHistory;
