// context/SettingsContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

const initialState = {
  // Dashboard settings
  dashboardLayout: 'default',
  dashboardWidgets: [
    'member_stats',
    'recent_members',
    'pledge_stats',
    'upcoming_events'
  ],
  
  // Data display settings
  itemsPerPage: 25,
  defaultSort: 'name',
  defaultSortOrder: 'asc',
  
  // Notification preferences
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  notificationTypes: {
    new_member: true,
    pledge_update: true,
    system_alert: true,
    backup_complete: false
  },
  
  // Export settings
  defaultExportFormat: 'csv',
  includeTimestamps: true,
  
  // Language and region
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
  
  // Privacy settings
  showMemberPhotos: true,
  allowDataExport: true,
  sessionTimeout: 30, // minutes
  
  // Form settings
  autoSaveInterval: 30, // seconds
  showFormProgress: true,
  
  // System settings (admin only)
  maintenanceMode: false,
  backupFrequency: 'daily',
  dataRetentionDays: 365,
  
  // Accessibility settings
  screenReaderMode: false,
  keyboardNavigation: true,
  
  isLoading: false,
  error: null
};

const settingsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'LOAD_SETTINGS':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null
      };
    
    case 'UPDATE_SETTING':
      return {
        ...state,
        [action.payload.key]: action.payload.value
      };
    
    case 'UPDATE_NESTED_SETTING':
      return {
        ...state,
        [action.payload.parent]: {
          ...state[action.payload.parent],
          [action.payload.key]: action.payload.value
        }
      };
    
    case 'UPDATE_DASHBOARD_WIDGETS':
      return {
        ...state,
        dashboardWidgets: action.payload
      };
    
    case 'RESET_SETTINGS':
      return {
        ...initialState,
        isLoading: false
      };
    
    default:
      return state;
  }
};

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load settings when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings();
    }
  }, [isAuthenticated, user]);

  const loadSettings = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load from localStorage first for immediate response
      const localSettings = localStorage.getItem(`churchconnect_settings_${user?.id}`);
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        dispatch({ type: 'LOAD_SETTINGS', payload: parsedSettings });
      }
      
      // Then load from server (if API endpoint exists)
      // const serverSettings = await settingsService.getUserSettings();
      // dispatch({ type: 'LOAD_SETTINGS', payload: serverSettings });
      
    } catch (error) {
      console.error('Error loading settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
    }
  };

  const updateSetting = (key, value) => {
    dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    saveSettings({ ...state, [key]: value });
  };

  const updateNestedSetting = (parent, key, value) => {
    dispatch({ type: 'UPDATE_NESTED_SETTING', payload: { parent, key, value } });
    const newState = {
      ...state,
      [parent]: {
        ...state[parent],
        [key]: value
      }
    };
    saveSettings(newState);
  };

  const updateDashboardWidgets = (widgets) => {
    dispatch({ type: 'UPDATE_DASHBOARD_WIDGETS', payload: widgets });
    saveSettings({ ...state, dashboardWidgets: widgets });
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
    if (user) {
      localStorage.removeItem(`churchconnect_settings_${user.id}`);
    }
  };

  const saveSettings = (settings) => {
    if (user) {
      // Save to localStorage
      localStorage.setItem(`churchconnect_settings_${user.id}`, JSON.stringify(settings));
      
      // Save to server (if API endpoint exists)
      // settingsService.updateUserSettings(settings);
    }
  };

  const exportSettings = () => {
    const settingsData = {
      ...state,
      exportedAt: new Date().toISOString(),
      userId: user?.id,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `churchconnect-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSettings = (settingsData) => {
    try {
      const parsedSettings = typeof settingsData === 'string' 
        ? JSON.parse(settingsData) 
        : settingsData;
      
      // Validate settings structure
      if (parsedSettings && typeof parsedSettings === 'object') {
        dispatch({ type: 'LOAD_SETTINGS', payload: parsedSettings });
        saveSettings(parsedSettings);
        return true;
      }
      
      throw new Error('Invalid settings format');
    } catch (error) {
      console.error('Error importing settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import settings' });
      return false;
    }
  };

  const getNotificationPreference = (type) => {
    return state.notificationTypes[type] || false;
  };

  const setNotificationPreference = (type, enabled) => {
    updateNestedSetting('notificationTypes', type, enabled);
  };

  const value = {
    ...state,
    updateSetting,
    updateNestedSetting,
    updateDashboardWidgets,
    resetSettings,
    exportSettings,
    importSettings,
    getNotificationPreference,
    setNotificationPreference,
    loadSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};