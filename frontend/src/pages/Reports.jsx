// frontend/src/pages/Reports.jsx
import React, { useState } from 'react';
import { ReportGenerator, ReportHistory, ReportStats } from '../components/reports';
import './Reports.css';

function Reports() {
  const [activeTab, setActiveTab] = useState('generator');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportGenerated = () => {
    // Trigger refresh of history and stats
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports Manager</h1>
        <p className="page-description">
          Generate, schedule, and manage church reports with custom filters and formats
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          ➕ Generate Report
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Report History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'stats' && (
          <div className="tab-panel">
            <ReportStats key={`stats-${refreshTrigger}`} />
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="tab-panel">
            <div className="generator-container">
              <ReportGenerator 
                onReportGenerated={handleReportGenerated}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-panel">
            <ReportHistory 
              key={`history-${refreshTrigger}`}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-card">
          <h3>📊 Available Report Types</h3>
          <ul>
            <li><strong>Members Report</strong> - Active members, contact info, and group assignments</li>
            <li><strong>Pledges Report</strong> - Donation history, amounts, and frequencies</li>
            <li><strong>Groups Report</strong> - Group details, leaders, and membership counts</li>
            <li><strong>Families Report</strong> - Family information and member associations</li>
            <li><strong>Statistics Report</strong> - Summary statistics and metrics</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📁 Export Formats</h3>
          <ul>
            <li><strong>CSV</strong> - Open in Excel or other spreadsheet applications</li>
            <li><strong>Excel</strong> - Formatted spreadsheets with multiple sheets</li>
            <li><strong>PDF</strong> - Professional formatted documents for printing</li>
            <li><strong>JSON</strong> - Raw data format for integrations</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>⚙️ Features</h3>
          <ul>
            <li>✅ Custom column selection</li>
            <li>✅ Advanced filtering options</li>
            <li>✅ Report templates for quick generation</li>
            <li>✅ Automatic scheduling with email delivery</li>
            <li>✅ Execution history and performance tracking</li>
            <li>✅ Role-based access control</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Reports;
