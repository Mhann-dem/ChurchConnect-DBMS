// frontend/src/components/reports/ReportStats.jsx
import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner } from '../ui';
import { apiClient } from '../../config/axiosClient';
import './ReportStats.css';

function ReportStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/reports/stats/');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Error loading statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Card className="stats-card">
        <div className="loading-container">
          <Spinner size="medium" />
          <p>Loading statistics...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="report-stats">
      {error && <Alert type="error">{error}</Alert>}

      {stats && (
        <>
          {/* Main Stats Grid */}
          <div className="stats-grid">
            <Card className="stat-card">
              <div className="stat-value">{stats.total_reports || 0}</div>
              <div className="stat-label">Total Reports</div>
            </Card>

            <Card className="stat-card">
              <div className="stat-value stat-success">{stats.active_reports || 0}</div>
              <div className="stat-label">Active Reports</div>
            </Card>

            <Card className="stat-card">
              <div className="stat-value stat-warning">{stats.scheduled_reports || 0}</div>
              <div className="stat-label">Scheduled Reports</div>
            </Card>

            <Card className="stat-card">
              <div className="stat-value">{stats.total_runs || 0}</div>
              <div className="stat-label">Total Executions</div>
            </Card>

            <Card className="stat-card">
              <div className="stat-value stat-success">{stats.successful_runs || 0}</div>
              <div className="stat-label">Successful</div>
            </Card>

            <Card className="stat-card">
              <div className="stat-value stat-danger">{stats.failed_runs || 0}</div>
              <div className="stat-label">Failed</div>
            </Card>
          </div>

          {/* Reports by Type */}
          {stats.reports_by_type && Object.keys(stats.reports_by_type).length > 0 && (
            <Card className="breakdown-card">
              <h3>Reports by Type</h3>
              <div className="type-breakdown">
                {Object.entries(stats.reports_by_type).map(([type, count]) => (
                  <div key={type} className="breakdown-item">
                    <span className="type-name">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <div className="type-bar">
                      <div
                        className="type-bar-fill"
                        style={{
                          width: `${(count / (stats.total_reports || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="type-count">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Storage Info */}
          {stats.total_file_size !== undefined && (
            <Card className="storage-card">
              <h3>Storage Usage</h3>
              <div className="storage-info">
                <div className="storage-item">
                  <span className="storage-label">Total Size:</span>
                  <span className="storage-value">
                    {formatBytes(stats.total_file_size)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Most Used Templates */}
          {stats.most_used_templates && stats.most_used_templates.length > 0 && (
            <Card className="templates-card">
              <h3>Most Used Templates</h3>
              <div className="templates-list">
                {stats.most_used_templates.map(template => (
                  <div key={template.id} className="template-item">
                    <div className="template-info">
                      <strong>{template.name}</strong>
                      <span className="template-type">{template.report_type_display}</span>
                    </div>
                    <div className="template-usage">
                      Used {template.usage_count} times
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Runs */}
          {stats.recent_runs && stats.recent_runs.length > 0 && (
            <Card className="recent-runs-card">
              <h3>Recent Report Executions</h3>
              <div className="recent-runs-list">
                {stats.recent_runs.map(run => (
                  <div key={run.id} className="run-item">
                    <div className="run-left">
                      <div className="run-name">{run.report_name}</div>
                      <div className="run-time">
                        {new Date(run.started_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="run-right">
                      <span
                        className={`run-status status-${run.status}`}
                      >
                        {run.status_display}
                      </span>
                      {run.record_count !== null && (
                        <span className="run-records">{run.record_count} records</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default ReportStats;
