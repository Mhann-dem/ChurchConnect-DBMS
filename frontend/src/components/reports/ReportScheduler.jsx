// frontend/src/components/reports/ReportScheduler.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Alert, Spinner, Checkbox } from '../ui';
import { apiClient } from '../../config/axiosClient';
import './ReportScheduler.css';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

function ReportScheduler({ reportId, reportName, onScheduled }) {
  const [formData, setFormData] = useState({
    is_scheduled: false,
    frequency: 'weekly',
    email_recipients: [],
    email_subject: `Report: ${reportName}`,
    email_body: `Please find your scheduled report attached.\n\nGenerated on: ${new Date().toLocaleString()}`,
  });

  const [recipientInput, setRecipientInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    }
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      const response = await apiClient.get(`/api/v1/reports/${reportId}/`);
      setReport(response.data);
      setFormData({
        is_scheduled: response.data.is_scheduled || false,
        frequency: response.data.frequency || 'weekly',
        email_recipients: response.data.email_recipients || [],
        email_subject: response.data.email_subject || `Report: ${response.data.name}`,
        email_body: response.data.email_body || '',
      });
    } catch (err) {
      setError('Error loading report details');
    }
  };

  const handleAddRecipient = (e) => {
    e.preventDefault();
    
    if (!recipientInput.trim()) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientInput)) {
      setError('Invalid email address');
      return;
    }

    if (formData.email_recipients.includes(recipientInput)) {
      setError('Email already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      email_recipients: [...prev.email_recipients, recipientInput],
    }));
    setRecipientInput('');
    setError(null);
  };

  const handleRemoveRecipient = (email) => {
    setFormData(prev => ({
      ...prev,
      email_recipients: prev.email_recipients.filter(e => e !== email),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();

    if (formData.is_scheduled && formData.email_recipients.length === 0) {
      setError('Please add at least one email recipient for scheduled reports');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData = {
        is_scheduled: formData.is_scheduled,
        frequency: formData.is_scheduled ? formData.frequency : null,
        email_recipients: formData.email_recipients,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
      };

      const response = await apiClient.patch(`/api/v1/reports/${reportId}/`, updateData);

      if (response.status === 200) {
        setSuccess('Schedule saved successfully!');
        if (onScheduled) {
          onScheduled(response.data);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="report-scheduler-card">
      <div className="card-header">
        <h3>Schedule Report</h3>
        <p className="card-subtitle">Set up automatic report generation and email delivery</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSaveSchedule}>
        {/* Enable Scheduling */}
        <div className="form-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_scheduled"
              checked={formData.is_scheduled}
              onChange={handleInputChange}
            />
            <span>Enable automatic report generation</span>
          </label>
        </div>

        {/* Frequency Selection */}
        {formData.is_scheduled && (
          <div className="form-section">
            <Select
              label="Frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              options={FREQUENCIES}
            />
          </div>
        )}

        {/* Email Recipients */}
        <div className="form-section">
          <h4>Email Recipients</h4>
          <div className="recipient-input-group">
            <input
              type="email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="Enter email address"
              className="email-input"
            />
            <Button
              type="button"
              className="btn-secondary"
              onClick={handleAddRecipient}
            >
              Add
            </Button>
          </div>

          {formData.email_recipients.length > 0 && (
            <div className="recipients-list">
              {formData.email_recipients.map(email => (
                <div key={email} className="recipient-item">
                  <span>{email}</span>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveRecipient(email)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Subject */}
        <div className="form-section">
          <Input
            label="Email Subject"
            type="text"
            name="email_subject"
            value={formData.email_subject}
            onChange={handleInputChange}
            placeholder="Subject line for the email"
            className="form-input-full"
          />
        </div>

        {/* Email Body */}
        <div className="form-section">
          <label>Email Body</label>
          <textarea
            name="email_body"
            value={formData.email_body}
            onChange={handleInputChange}
            placeholder="Message to include in the email"
            rows={6}
            className="form-textarea"
          />
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h5>📋 How it works:</h5>
          <ul>
            <li>Reports will be generated automatically at the selected frequency</li>
            <li>Generated reports will be sent to all email recipients</li>
            <li>All recipients will have access to view reports in the system</li>
            <li>Scheduled reports won't run if no recipients are configured</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="small" /> Saving...
              </>
            ) : (
              'Save Schedule'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ReportScheduler;
