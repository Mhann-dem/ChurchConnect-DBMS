// frontend/src/components/reports/ReportGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Checkbox, Alert, Spinner } from '../ui';
import { apiClient } from '../../config/axiosClient';
import './ReportGenerator.css';

const REPORT_TYPES = [
  { value: 'members', label: 'Members Report' },
  { value: 'pledges', label: 'Pledges Report' },
  { value: 'groups', label: 'Groups Report' },
  { value: 'families', label: 'Families Report' },
  { value: 'statistics', label: 'Statistics Report' },
];

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
  { value: 'json', label: 'JSON' },
];

const MEMBER_COLUMNS = [
  'id', 'first_name', 'last_name', 'email', 'phone', 'date_joined',
  'status', 'role', 'family_name', 'group_name'
];

const PLEDGE_COLUMNS = [
  'id', 'member_name', 'amount', 'date', 'status', 'frequency', 'category'
];

const GROUP_COLUMNS = [
  'id', 'name', 'description', 'leader', 'member_count', 'created_date'
];

const FAMILY_COLUMNS = [
  'id', 'name', 'head_member', 'member_count', 'created_date'
];

const STATISTICS_COLUMNS = [
  'total_members', 'active_members', 'inactive_members',
  'total_families', 'total_groups', 'total_pledges', 'total_pledge_amount'
];

const COLUMN_MAP = {
  members: MEMBER_COLUMNS,
  pledges: PLEDGE_COLUMNS,
  groups: GROUP_COLUMNS,
  families: FAMILY_COLUMNS,
  statistics: STATISTICS_COLUMNS,
};

function ReportGenerator({ onReportGenerated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'members',
    format: 'csv',
    columns: [],
    filters: {},
  });

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Update available columns when report type changes
    const availableColumns = COLUMN_MAP[formData.report_type] || [];
    setFormData(prev => ({
      ...prev,
      columns: availableColumns.slice(0, 5), // Default first 5 columns
    }));
  }, [formData.report_type]);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/api/v1/reports/templates/');
      setTemplates(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColumnToggle = (column) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column],
    }));
  };

  const handleFilterChange = (filterKey, filterValue) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: filterValue,
      },
    }));
  };

  const handleApplyTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: `Based on template: ${template.name}`,
      report_type: template.report_type,
      format: template.default_format,
      columns: template.default_columns || [],
      filters: template.default_filters || {},
    });
    setSuccess(`Template "${template.name}" applied!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Report name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post('/api/v1/reports/generate/', {
        report_type: formData.report_type,
        format: formData.format,
        columns: formData.columns,
        filters: formData.filters,
        save_as_report: true,
        report_name: formData.name,
        report_description: formData.description,
      });

      if (response.data.success) {
        setSuccess(`Report generated successfully! Download: ${response.data.file_size} bytes`);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          report_type: 'members',
          format: 'csv',
          columns: [],
          filters: {},
        });

        // Notify parent component
        if (onReportGenerated) {
          onReportGenerated(response.data);
        }

        // Trigger download
        if (response.data.download_url) {
          window.open(response.data.download_url, '_blank');
        }
      } else {
        setError(response.data.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const availableColumns = COLUMN_MAP[formData.report_type] || [];

  return (
    <div className="report-generator">
      <Card className="report-generator-card">
        <div className="card-header">
          <h2>Generate New Report</h2>
          <p className="card-subtitle">Create custom reports with your preferred filters and format</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleGenerateReport}>
          {/* Templates Section */}
          {templates.length > 0 && (
            <div className="form-section">
              <h3>Quick Templates</h3>
              <div className="templates-grid">
                {templates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    className="template-btn"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <div className="template-name">{template.name}</div>
                    <div className="template-type">{template.report_type_display}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="form-section">
            <h3>Report Information</h3>
            <div className="form-row">
              <Input
                label="Report Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Monthly Member Report"
                required
                className="form-input-full"
              />
            </div>
            <div className="form-row">
              <Input
                label="Description (optional)"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add notes about this report"
                className="form-input-full"
              />
            </div>
          </div>

          {/* Report Configuration */}
          <div className="form-section">
            <h3>Report Configuration</h3>
            <div className="form-row two-cols">
              <Select
                label="Report Type"
                name="report_type"
                value={formData.report_type}
                onChange={handleInputChange}
                options={REPORT_TYPES}
              />
              <Select
                label="Export Format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                options={FORMATS}
              />
            </div>
          </div>

          {/* Columns Selection */}
          <div className="form-section">
            <h3>Select Columns</h3>
            <div className="columns-grid">
              {availableColumns.map(column => (
                <Checkbox
                  key={column}
                  label={column.replace(/_/g, ' ').toUpperCase()}
                  checked={formData.columns.includes(column)}
                  onChange={() => handleColumnToggle(column)}
                />
              ))}
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="form-section">
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Filters
            </button>
            
            {showAdvanced && (
              <div className="advanced-filters">
                <p className="filter-hint">Add custom filters to narrow down your report data</p>
                <Input
                  label="Filter (JSON format)"
                  type="textarea"
                  placeholder='{"status": "active", "group": "id-123"}'
                  rows={4}
                  onChange={(e) => {
                    try {
                      const filters = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, filters }));
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <Button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Spinner size="small" /> Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
            <Button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({
                  name: '',
                  description: '',
                  report_type: 'members',
                  format: 'csv',
                  columns: [],
                  filters: {},
                });
                setError(null);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ReportGenerator;
