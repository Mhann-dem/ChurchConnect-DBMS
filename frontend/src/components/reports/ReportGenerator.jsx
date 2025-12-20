// frontend/src/components/reports/ReportGenerator.jsx
import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import styles from './ReportGenerator.module.css';

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

function ReportGenerator({ onReportGenerated }) {
  const [reportType, setReportType] = useState('members');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/reports/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value,
        },
        body: JSON.stringify({
          report_type: reportType,
          format: format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Handle file download
      if (format !== 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${reportType}_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }

      setMessageType('success');
      setMessage(`Report generated successfully!`);
      onReportGenerated?.();
    } catch (error) {
      console.error('Error generating report:', error);
      setMessageType('error');
      setMessage(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleGenerateReport} className={styles.form}>
        {/* Message Alert */}
        {message && (
          <div className={`${styles.alert} ${styles[`alert_${messageType}`]}`}>
            <div className={styles.alertContent}>
              {messageType === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <div className={styles.formGrid}>
          {/* Report Type */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              {REPORT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              {FORMATS.map(fmt => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Description */}
        <div className={styles.description}>
          <p className={styles.descText}>
            Generate a {REPORT_TYPES.find(t => t.value === reportType)?.label.toLowerCase()} 
            {' '}in {FORMATS.find(f => f.value === format)?.label} format.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? (
            <>
              <Loader size={18} className={styles.spinner} />
              Generating...
            </>
          ) : (
            <>
              <Download size={18} />
              Generate Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ReportGenerator;
