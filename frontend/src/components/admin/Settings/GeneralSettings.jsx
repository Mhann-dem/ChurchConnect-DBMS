import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Toast } from '../../shared/Toast';
import { Input } from '../../form/FormControls/Input';
import { Select } from '../../form/FormControls/Select';
import { Checkbox } from '../../form/FormControls/Checkbox';
import { TextArea } from '../../form/FormControls/TextArea';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { useToast } from '../../../hooks/useToast';
import { settingsService } from '../../../services/settings';
import styles from './Settings.module.css';

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    churchName: '',
    churchAddress: '',
    churchPhone: '',
    churchEmail: '',
    churchWebsite: '',
    primaryLanguage: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    enableNotifications: true,
    allowMemberSelfRegistration: true,
    requireEmailVerification: false,
    maxPledgeAmount: 10000,
    defaultPledgeFrequency: 'monthly',
    privacyPolicyUrl: '',
    termsOfServiceUrl: '',
    aboutChurchDescription: '',
    contactInstructions: '',
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    enableDarkMode: false,
    enableMultiLanguage: false,
    supportedLanguages: ['en'],
    enableSMS: false,
    enableEmailNotifications: true,
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    dataRetentionPeriod: '7 years'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettings();
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsService.updateSettings(settings);
      showToast('Settings updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    // Apply color change immediately for preview
    if (field === 'primaryColor') {
      document.documentElement.style.setProperty('--primary-color', value);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'GMT' },
    { value: 'Europe/Paris', label: 'Central European Time' },
    { value: 'Asia/Tokyo', label: 'Japan Time' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'GHS', label: 'Ghana Cedi (₵)' },
    { value: 'NGN', label: 'Nigerian Naira (₦)' },
    { value: 'KES', label: 'Kenyan Shilling (KSh)' }
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }
  ];

  const pledgeFrequencyOptions = [
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];

  const backupFrequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' }
  ];

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1>General Settings</h1>
        <p>Configure your church's basic information and preferences</p>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabList}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.settingsForm}>
          {activeTab === 'general' && (
            <div className={styles.tabContent}>
              <Card className={styles.settingsCard}>
                <h3>Church Information</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Church Name"
                    value={settings.churchName}
                    onChange={(e) => handleInputChange('churchName', e.target.value)}
                    required
                    placeholder="Enter church name"
                  />
                  <Input
                    label="Phone Number"
                    value={settings.churchPhone}
                    onChange={(e) => handleInputChange('churchPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={settings.churchEmail}
                    onChange={(e) => handleInputChange('churchEmail', e.target.value)}
                    placeholder="info@church.com"
                  />
                  <Input
                    label="Website"
                    value={settings.churchWebsite}
                    onChange={(e) => handleInputChange('churchWebsite', e.target.value)}
                    placeholder="https://www.church.com"
                  />
                </div>
                <TextArea
                  label="Address"
                  value={settings.churchAddress}
                  onChange={(e) => handleInputChange('churchAddress', e.target.value)}
                  placeholder="Enter church address"
                  rows={3}
                />
                <TextArea
                  label="About Church"
                  value={settings.aboutChurchDescription}
                  onChange={(e) => handleInputChange('aboutChurchDescription', e.target.value)}
                  placeholder="Brief description of your church"
                  rows={4}
                />
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Localization</h3>
                <div className={styles.formGrid}>
                  <Select
                    label="Primary Language"
                    value={settings.primaryLanguage}
                    onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
                    options={languageOptions}
                  />
                  <Select
                    label="Timezone"
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    options={timezoneOptions}
                  />
                  <Select
                    label="Currency"
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    options={currencyOptions}
                  />
                  <Select
                    label="Date Format"
                    value={settings.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    options={dateFormatOptions}
                  />
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Registration Settings</h3>
                <div className={styles.checkboxGroup}>
                  <Checkbox
                    label="Allow member self-registration"
                    checked={settings.allowMemberSelfRegistration}
                    onChange={(checked) => handleInputChange('allowMemberSelfRegistration', checked)}
                  />
                  <Checkbox
                    label="Require email verification"
                    checked={settings.requireEmailVerification}
                    onChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                  />
                </div>
                <div className={styles.formGrid}>
                  <Input
                    label="Maximum Pledge Amount"
                    type="number"
                    value={settings.maxPledgeAmount}
                    onChange={(e) => handleInputChange('maxPledgeAmount', parseInt(e.target.value))}
                    min="0"
                    step="100"
                  />
                  <Select
                    label="Default Pledge Frequency"
                    value={settings.defaultPledgeFrequency}
                    onChange={(e) => handleInputChange('defaultPledgeFrequency', e.target.value)}
                    options={pledgeFrequencyOptions}
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className={styles.tabContent}>
              <Card className={styles.settingsCard}>
                <h3>Branding</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Logo URL"
                    value={settings.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <div className={styles.colorPicker}>
                    <label>Primary Color</label>
                    <div className={styles.colorInputWrapper}>
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className={styles.colorInput}
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>
                  <div className={styles.colorPicker}>
                    <label>Secondary Color</label>
                    <div className={styles.colorInputWrapper}>
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className={styles.colorInput}
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Display Options</h3>
                <div className={styles.checkboxGroup}>
                  <Checkbox
                    label="Enable dark mode"
                    checked={settings.enableDarkMode}
                    onChange={(checked) => handleInputChange('enableDarkMode', checked)}
                  />
                  <Checkbox
                    label="Enable multi-language support"
                    checked={settings.enableMultiLanguage}
                    onChange={(checked) => handleInputChange('enableMultiLanguage', checked)}
                  />
                </div>
                {settings.enableMultiLanguage && (
                  <div className={styles.languageSelection}>
                    <label>Supported Languages</label>
                    <div className={styles.languageGrid}>
                      {languageOptions.map(lang => (
                        <Checkbox
                          key={lang.value}
                          label={lang.label}
                          checked={settings.supportedLanguages.includes(lang.value)}
                          onChange={(checked) => {
                            if (checked) {
                              handleInputChange('supportedLanguages', [...settings.supportedLanguages, lang.value]);
                            } else {
                              handleInputChange('supportedLanguages', settings.supportedLanguages.filter(l => l !== lang.value));
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={styles.tabContent}>
              <Card className={styles.settingsCard}>
                <h3>Notification Settings</h3>
                <div className={styles.checkboxGroup}>
                  <Checkbox
                    label="Enable notifications"
                    checked={settings.enableNotifications}
                    onChange={(checked) => handleInputChange('enableNotifications', checked)}
                  />
                  <Checkbox
                    label="Enable email notifications"
                    checked={settings.enableEmailNotifications}
                    onChange={(checked) => handleInputChange('enableEmailNotifications', checked)}
                  />
                  <Checkbox
                    label="Enable SMS notifications"
                    checked={settings.enableSMS}
                    onChange={(checked) => handleInputChange('enableSMS', checked)}
                  />
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Communication Instructions</h3>
                <TextArea
                  label="Contact Instructions"
                  value={settings.contactInstructions}
                  onChange={(e) => handleInputChange('contactInstructions', e.target.value)}
                  placeholder="Instructions for members on how to contact the church"
                  rows={4}
                />
              </Card>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className={styles.tabContent}>
              <Card className={styles.settingsCard}>
                <h3>Privacy & Legal</h3>
                <div className={styles.formGrid}>
                  <Input
                    label="Privacy Policy URL"
                    value={settings.privacyPolicyUrl}
                    onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
                    placeholder="https://church.com/privacy"
                  />
                  <Input
                    label="Terms of Service URL"
                    value={settings.termsOfServiceUrl}
                    onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
                    placeholder="https://church.com/terms"
                  />
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Data Retention</h3>
                <Input
                  label="Data Retention Period"
                  value={settings.dataRetentionPeriod}
                  onChange={(e) => handleInputChange('dataRetentionPeriod', e.target.value)}
                  placeholder="e.g., 7 years"
                />
                <p className={styles.helpText}>
                  How long to retain member data after they leave the church
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className={styles.tabContent}>
              <Card className={styles.settingsCard}>
                <h3>Backup Settings</h3>
                <div className={styles.checkboxGroup}>
                  <Checkbox
                    label="Enable automatic backups"
                    checked={settings.autoBackupEnabled}
                    onChange={(checked) => handleInputChange('autoBackupEnabled', checked)}
                  />
                </div>
                {settings.autoBackupEnabled && (
                  <Select
                    label="Backup Frequency"
                    value={settings.backupFrequency}
                    onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                    options={backupFrequencyOptions}
                  />
                )}
              </Card>

              <Card className={styles.settingsCard}>
                <h3>Manual Backup</h3>
                <p className={styles.helpText}>
                  Create a manual backup of your church data
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    // Implement manual backup functionality
                    showToast('Backup started', 'info');
                  }}
                >
                  Create Backup Now
                </Button>
              </Card>
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={loadSettings}
              disabled={isSaving}
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettings;