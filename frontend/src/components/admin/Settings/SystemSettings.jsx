import React, { useState, useEffect } from 'react';
import  useToast  from '../../../hooks/useToast';
import  Button  from '../../ui/Button';
import  Card  from '../../ui/Card';
import  LoadingSpinner  from '../../shared/LoadingSpinner';
import  Modal from '../../shared/Modal';
import ConfirmDialog  from '../../shared/ConfirmDialog';
import styles from './Settings.module.css';

const SystemSettings = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalMembers: 0,
    totalGroups: 0,
    totalPledges: 0,
    databaseSize: '0 MB',
    lastBackup: null,
    uptime: '0 days',
    version: '1.0.0'
  });

  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: false,
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    maxFileSize: 10,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requirePasswordComplexity: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableAuditLog: true,
    logRetentionDays: 90,
    enableNotifications: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseTLS: true,
    smsProvider: 'none',
    smsApiKey: '',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12-hour',
    currency: 'USD',
    language: 'en'
  });

  const [backupHistory, setBackupHistory] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState({
    scheduledDate: '',
    scheduledTime: '',
    duration: 30,
    reason: '',
    notifyUsers: true
  });

  useEffect(() => {
    fetchSystemStats();
    fetchSystemConfig();
    fetchBackupHistory();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setSystemStats({
          totalMembers: 1247,
          totalGroups: 23,
          totalPledges: 456,
          databaseSize: '156.7 MB',
          lastBackup: '2025-01-15T08:30:00Z',
          uptime: '45 days',
          version: '1.0.0'
        });
      }, 1000);
    } catch (error) {
      showToast('Failed to fetch system statistics', 'error');
    }
  };

  const fetchSystemConfig = async () => {
    try {
      // Simulate API call
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      showToast('Failed to fetch system configuration', 'error');
      setLoading(false);
    }
  };

  const fetchBackupHistory = async () => {
    try {
      // Simulate API call
      setBackupHistory([
        { id: 1, date: '2025-01-15T08:30:00Z', size: '156.7 MB', status: 'success' },
        { id: 2, date: '2025-01-14T08:30:00Z', size: '155.2 MB', status: 'success' },
        { id: 3, date: '2025-01-13T08:30:00Z', size: '154.8 MB', status: 'success' },
        { id: 4, date: '2025-01-12T08:30:00Z', size: '153.1 MB', status: 'failed' },
        { id: 5, date: '2025-01-11T08:30:00Z', size: '152.9 MB', status: 'success' }
      ]);
    } catch (error) {
      showToast('Failed to fetch backup history', 'error');
    }
  };

  const handleConfigChange = (key, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        showToast('System configuration updated successfully', 'success');
      }, 1000);
    } catch (error) {
      showToast('Failed to update system configuration', 'error');
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setLoading(true);
      // Simulate backup process
      setTimeout(() => {
        setLoading(false);
        showToast('Backup completed successfully', 'success');
        fetchBackupHistory();
        setShowBackupModal(false);
      }, 3000);
    } catch (error) {
      showToast('Backup failed', 'error');
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        showToast('Maintenance scheduled successfully', 'success');
        setShowMaintenanceModal(false);
        setMaintenanceSchedule({
          scheduledDate: '',
          scheduledTime: '',
          duration: 30,
          reason: '',
          notifyUsers: true
        });
      }, 1000);
    } catch (error) {
      showToast('Failed to schedule maintenance', 'error');
      setLoading(false);
    }
  };

  const handleSystemAction = (action) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const executeSystemAction = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        showToast(`${confirmAction} completed successfully`, 'success');
        setShowConfirmDialog(false);
        setConfirmAction(null);
      }, 2000);
    } catch (error) {
      showToast(`Failed to ${confirmAction.toLowerCase()}`, 'error');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'success' ? styles.statusSuccess : styles.statusError;
    return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
  };

  if (loading && !systemStats.totalMembers) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.systemSettings}>
      <div className={styles.header}>
        <h2>System Settings</h2>
        <p>Configure system-wide settings and monitor system health</p>
      </div>

      {/* System Statistics */}
      <Card className={styles.card}>
        <h3>System Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Members</span>
            <span className={styles.statValue}>{systemStats.totalMembers}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Groups</span>
            <span className={styles.statValue}>{systemStats.totalGroups}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Pledges</span>
            <span className={styles.statValue}>{systemStats.totalPledges}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Database Size</span>
            <span className={styles.statValue}>{systemStats.databaseSize}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>System Uptime</span>
            <span className={styles.statValue}>{systemStats.uptime}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Version</span>
            <span className={styles.statValue}>{systemStats.version}</span>
          </div>
        </div>
      </Card>

      {/* System Configuration */}
      <Card className={styles.card}>
        <h3>System Configuration</h3>
        
        {/* General Settings */}
        <div className={styles.section}>
          <h4>General Settings</h4>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={systemConfig.maintenanceMode}
                onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                className={styles.checkbox}
              />
              Maintenance Mode
            </label>
            <small>When enabled, only administrators can access the system</small>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={systemConfig.allowRegistrations}
                onChange={(e) => handleConfigChange('allowRegistrations', e.target.checked)}
                className={styles.checkbox}
              />
              Allow New Registrations
            </label>
            <small>Allow new members to register through the public form</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={systemConfig.requireEmailVerification}
                onChange={(e) => handleConfigChange('requireEmailVerification', e.target.checked)}
                className={styles.checkbox}
              />
              Require Email Verification
            </label>
            <small>Require email verification for new registrations</small>
          </div>
        </div>

        {/* Security Settings */}
        <div className={styles.section}>
          <h4>Security Settings</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={systemConfig.sessionTimeout}
                onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                className={styles.input}
                min="5"
                max="120"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password Min Length</label>
              <input
                type="number"
                value={systemConfig.passwordMinLength}
                onChange={(e) => handleConfigChange('passwordMinLength', parseInt(e.target.value))}
                className={styles.input}
                min="6"
                max="20"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Max Login Attempts</label>
              <input
                type="number"
                value={systemConfig.maxLoginAttempts}
                onChange={(e) => handleConfigChange('maxLoginAttempts', parseInt(e.target.value))}
                className={styles.input}
                min="3"
                max="10"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Lockout Duration (minutes)</label>
              <input
                type="number"
                value={systemConfig.lockoutDuration}
                onChange={(e) => handleConfigChange('lockoutDuration', parseInt(e.target.value))}
                className={styles.input}
                min="5"
                max="60"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={systemConfig.requirePasswordComplexity}
                onChange={(e) => handleConfigChange('requirePasswordComplexity', e.target.checked)}
                className={styles.checkbox}
              />
              Require Password Complexity
            </label>
            <small>Require uppercase, lowercase, numbers, and special characters</small>
          </div>
        </div>

        {/* Backup Settings */}
        <div className={styles.section}>
          <h4>Backup Settings</h4>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={systemConfig.autoBackupEnabled}
                onChange={(e) => handleConfigChange('autoBackupEnabled', e.target.checked)}
                className={styles.checkbox}
              />
              Enable Automatic Backups
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Backup Frequency</label>
            <select
              value={systemConfig.backupFrequency}
              onChange={(e) => handleConfigChange('backupFrequency', e.target.value)}
              className={styles.select}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Localization Settings */}
        <div className={styles.section}>
          <h4>Localization Settings</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Timezone</label>
              <select
                value={systemConfig.timezone}
                onChange={(e) => handleConfigChange('timezone', e.target.value)}
                className={styles.select}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Date Format</label>
              <select
                value={systemConfig.dateFormat}
                onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                className={styles.select}
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Time Format</label>
              <select
                value={systemConfig.timeFormat}
                onChange={(e) => handleConfigChange('timeFormat', e.target.value)}
                className={styles.select}
              >
                <option value="12-hour">12-hour</option>
                <option value="24-hour">24-hour</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <select
                value={systemConfig.currency}
                onChange={(e) => handleConfigChange('currency', e.target.value)}
                className={styles.select}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button onClick={handleSaveConfig} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </Card>

      {/* Backup Management */}
      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Backup Management</h3>
          <Button onClick={() => setShowBackupModal(true)} variant="outline">
            Create Backup
          </Button>
        </div>
        
        <div className={styles.backupInfo}>
          <p>Last backup: {systemStats.lastBackup ? formatDate(systemStats.lastBackup) : 'Never'}</p>
          <p>Next scheduled backup: {systemConfig.autoBackupEnabled ? 'Today at 2:00 AM' : 'Not scheduled'}</p>
        </div>

        <div className={styles.backupHistory}>
          <h4>Recent Backups</h4>
          <div className={styles.backupList}>
            {backupHistory.map(backup => (
              <div key={backup.id} className={styles.backupItem}>
                <div className={styles.backupInfo}>
                  <span className={styles.backupDate}>{formatDate(backup.date)}</span>
                  <span className={styles.backupSize}>{backup.size}</span>
                </div>
                <div className={styles.backupActions}>
                  {getStatusBadge(backup.status)}
                  {backup.status === 'success' && (
                    <Button variant="outline" size="sm">Download</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* System Actions */}
      <Card className={styles.card}>
        <h3>System Actions</h3>
        <div className={styles.actionGrid}>
          <div className={styles.actionItem}>
            <h4>Maintenance Mode</h4>
            <p>Schedule system maintenance window</p>
            <Button onClick={() => setShowMaintenanceModal(true)} variant="outline">
              Schedule Maintenance
            </Button>
          </div>
          
          <div className={styles.actionItem}>
            <h4>Clear Cache</h4>
            <p>Clear system cache to improve performance</p>
            <Button onClick={() => handleSystemAction('Clear Cache')} variant="outline">
              Clear Cache
            </Button>
          </div>
          
          <div className={styles.actionItem}>
            <h4>Optimize Database</h4>
            <p>Optimize database performance</p>
            <Button onClick={() => handleSystemAction('Optimize Database')} variant="outline">
              Optimize Database
            </Button>
          </div>
          
          <div className={styles.actionItem}>
            <h4>Export System Data</h4>
            <p>Export all system data for backup</p>
            <Button onClick={() => handleSystemAction('Export Data')} variant="outline">
              Export Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create System Backup"
      >
        <div className={styles.modalContent}>
          <p>This will create a complete backup of your system data including:</p>
          <ul>
            <li>All member records</li>
            <li>Groups and ministry information</li>
            <li>Pledge data</li>
            <li>System configuration</li>
            <li>User accounts</li>
          </ul>
          <p>The backup process may take a few minutes to complete.</p>
          
          <div className={styles.modalActions}>
            <Button onClick={() => setShowBackupModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleBackupNow} disabled={loading}>
              {loading ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Schedule Maintenance"
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Maintenance Date</label>
            <input
              type="date"
              value={maintenanceSchedule.scheduledDate}
              onChange={(e) => setMaintenanceSchedule(prev => ({
                ...prev,
                scheduledDate: e.target.value
              }))}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Maintenance Time</label>
            <input
              type="time"
              value={maintenanceSchedule.scheduledTime}
              onChange={(e) => setMaintenanceSchedule(prev => ({
                ...prev,
                scheduledTime: e.target.value
              }))}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={maintenanceSchedule.duration}
              onChange={(e) => setMaintenanceSchedule(prev => ({
                ...prev,
                duration: parseInt(e.target.value)
              }))}
              className={styles.input}
              min="15"
              max="240"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Reason</label>
            <textarea
              value={maintenanceSchedule.reason}
              onChange={(e) => setMaintenanceSchedule(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              className={styles.textarea}
              placeholder="Brief description of maintenance activities"
              rows="3"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={maintenanceSchedule.notifyUsers}
                onChange={(e) => setMaintenanceSchedule(prev => ({
                  ...prev,
                  notifyUsers: e.target.checked
                }))}
                className={styles.checkbox}
              />
              Notify users about scheduled maintenance
            </label>
          </div>
          
          <div className={styles.modalActions}>
            <Button onClick={() => setShowMaintenanceModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleScheduleMaintenance} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Maintenance'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={executeSystemAction}
        title={`${confirmAction}?`}
        message={`Are you sure you want to ${confirmAction?.toLowerCase()}? This action cannot be undone.`}
        confirmText="Continue"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default SystemSettings;