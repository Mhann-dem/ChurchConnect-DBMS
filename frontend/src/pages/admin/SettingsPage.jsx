// SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/form/FormControls/Input';
import { Select } from '../../components/form/FormControls/Select';
import { Checkbox } from '../../components/form/FormControls/Checkbox';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Tabs } from '../../components/ui/Tabs';
import { settingsService } from '../../services/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      churchName: '',
      address: '',
      phone: '',
      email: '',
      timezone: 'UTC',
      language: 'en'
    },
    system: {
      emailNotifications: true,
      smsNotifications: false,
      autoBackup: true,
      backupFrequency: 'daily',
      sessionTimeout: 30,
      maxLoginAttempts: 5
    },
    privacy: {
      dataRetentionDays: 2555, // 7 years
      allowDataExport: true,
      requireConsent: true,
      showMemberPhotos: true
    }
  });

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'readonly'
  });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      setSettings(response.data);
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await settingsService.getUsers();
      setUsers(response.data);
    } catch (error) {
      showToast('Failed to load users', 'error');
    }
  };

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await settingsService.updateSettings(settings);
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await settingsService.createUser(newUser);
      setNewUser({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'readonly'
      });
      fetchUsers();
      showToast('User created successfully', 'success');
    } catch (error) {
      showToast('Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await settingsService.deleteUser(userId);
        fetchUsers();
        showToast('User deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete user', 'error');
      }
    }
  };

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Africa/Accra', label: 'Ghana Time' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'tw', label: 'Twi' }
  ];

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'readonly', label: 'Read Only' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and manage users</p>
      </div>

      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="system">System</Tabs.Trigger>
          <Tabs.Trigger value="privacy">Privacy</Tabs.Trigger>
          {user.role === 'super_admin' && (
            <Tabs.Trigger value="users">User Management</Tabs.Trigger>
          )}
        </Tabs.List>

        <Tabs.Content value="general">
          <Card>
            <Card.Header>
              <Card.Title>General Settings</Card.Title>
              <Card.Description>
                Basic church information and preferences
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Church Name"
                  value={settings.general.churchName}
                  onChange={(e) => handleSettingsChange('general', 'churchName', e.target.value)}
                />
                <Input
                  label="Phone Number"
                  value={settings.general.phone}
                  onChange={(e) => handleSettingsChange('general', 'phone', e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={settings.general.email}
                  onChange={(e) => handleSettingsChange('general', 'email', e.target.value)}
                />
                <Select
                  label="Timezone"
                  value={settings.general.timezone}
                  onChange={(value) => handleSettingsChange('general', 'timezone', value)}
                  options={timezones}
                />
                <Select
                  label="Default Language"
                  value={settings.general.language}
                  onChange={(value) => handleSettingsChange('general', 'language', value)}
                  options={languages}
                />
              </div>
              <div className="mt-6">
                <Input
                  label="Church Address"
                  value={settings.general.address}
                  onChange={(e) => handleSettingsChange('general', 'address', e.target.value)}
                  multiline
                  rows={3}
                />
              </div>
            </Card.Content>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="system">
          <Card>
            <Card.Header>
              <Card.Title>System Settings</Card.Title>
              <Card.Description>
                Configure system behavior and security settings
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={settings.system.sessionTimeout}
                      onChange={(e) => handleSettingsChange('system', 'sessionTimeout', parseInt(e.target.value))}
                      min="15"
                      max="480"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                    <Input
                      type="number"
                      value={settings.system.maxLoginAttempts}
                      onChange={(e) => handleSettingsChange('system', 'maxLoginAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Checkbox
                    label="Enable Email Notifications"
                    checked={settings.system.emailNotifications}
                    onChange={(checked) => handleSettingsChange('system', 'emailNotifications', checked)}
                  />
                  <Checkbox
                    label="Enable SMS Notifications"
                    checked={settings.system.smsNotifications}
                    onChange={(checked) => handleSettingsChange('system', 'smsNotifications', checked)}
                  />
                  <Checkbox
                    label="Enable Automatic Backup"
                    checked={settings.system.autoBackup}
                    onChange={(checked) => handleSettingsChange('system', 'autoBackup', checked)}
                  />
                </div>

                {settings.system.autoBackup && (
                  <Select
                    label="Backup Frequency"
                    value={settings.system.backupFrequency}
                    onChange={(value) => handleSettingsChange('system', 'backupFrequency', value)}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' }
                    ]}
                  />
                )}
              </div>
            </Card.Content>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="privacy">
          <Card>
            <Card.Header>
              <Card.Title>Privacy Settings</Card.Title>
              <Card.Description>
                Configure data privacy and retention policies
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Retention Period (days)</label>
                  <Input
                    type="number"
                    value={settings.privacy.dataRetentionDays}
                    onChange={(e) => handleSettingsChange('privacy', 'dataRetentionDays', parseInt(e.target.value))}
                    min="365"
                    max="3650"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How long to keep member data after they become inactive
                  </p>
                </div>

                <div className="space-y-4">
                  <Checkbox
                    label="Allow Data Export"
                    checked={settings.privacy.allowDataExport}
                    onChange={(checked) => handleSettingsChange('privacy', 'allowDataExport', checked)}
                  />
                  <Checkbox
                    label="Require Consent for Data Collection"
                    checked={settings.privacy.requireConsent}
                    onChange={(checked) => handleSettingsChange('privacy', 'requireConsent', checked)}
                  />
                  <Checkbox
                    label="Show Member Photos"
                    checked={settings.privacy.showMemberPhotos}
                    onChange={(checked) => handleSettingsChange('privacy', 'showMemberPhotos', checked)}
                  />
                </div>
              </div>
            </Card.Content>
          </Card>
        </Tabs.Content>

        {user.role === 'super_admin' && (
          <Tabs.Content value="users">
            <div className="space-y-6">
              <Card>
                <Card.Header>
                  <Card.Title>Add New User</Card.Title>
                  <Card.Description>
                    Create a new admin user account
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                      <Input
                        label="First Name"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                      <Input
                        label="Last Name"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                      <Select
                        label="Role"
                        value={newUser.role}
                        onChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                        options={roles}
                      />
                    </div>
                    <Button type="submit" className="w-full md:w-auto">
                      Create User
                    </Button>
                  </form>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Existing Users</Card.Title>
                  <Card.Description>
                    Manage existing admin users
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Username</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Last Login</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2">{user.firstName} {user.lastName}</td>
                            <td className="p-2">{user.username}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'super_admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : user.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="p-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </Tabs.Content>
        )}
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;