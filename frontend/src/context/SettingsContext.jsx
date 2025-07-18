// context/SettingsContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import useAuth from '../hooks/useAuth'; // Fixed import path

// Create context with default values to prevent undefined errors
const SettingsContext = createContext({
  dashboardLayout: 'default',
  dashboardWidgets: [],
  itemsPerPage: 25,
  defaultSort: 'name',
  defaultSortOrder: 'asc',
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  notificationTypes: {},
  defaultExportFormat: 'csv',
  includeTimestamps: true,
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
  showMemberPhotos: true,
  allowDataExport: true,
  sessionTimeout: 30,
  autoSaveInterval: 30,
  showFormProgress: true,
  maintenanceMode: false,
  backupFrequency: 'daily',
  dataRetentionDays: 365,
  screenReaderMode: false,
  keyboardNavigation: true,
  isLoading: false,
  error: null,
  updateSetting: () => {},
  updateNestedSetting: () => {},
  updateDashboardWidgets: () => {},
  resetSettings: () => {},
  exportSettings: () => {},
  importSettings: () => {},
  getNotificationPreference: () => false,
  setNotificationPreference: () => {},
  loadSettings: () => {}
});

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
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
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
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
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

// Safe storage helper
const storage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
    }
    return null;
  },
  
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
    }
    return false;
  },
  
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
    return false;
  }
};

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Memoized storage key
  const storageKey = useMemo(() => {
    return user?.id ? `churchconnect_settings_${user.id}` : null;
  }, [user?.id]);

  // Load settings when user logs in
  useEffect(() => {
    if (isAuthenticated && user && storageKey) {
      loadSettings();
    }
  }, [isAuthenticated, user, storageKey]);

  const loadSettings = useCallback(async () => {
    if (!storageKey) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load from localStorage first for immediate response
      const localSettings = storage.getItem(storageKey);
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        
        // Merge with initial state to ensure all properties exist
        const mergedSettings = {
          ...initialState,
          ...parsedSettings
        };
        
        dispatch({ type: 'LOAD_SETTINGS', payload: mergedSettings });
      } else {
        // No saved settings, use initial state
        dispatch({ type: 'LOAD_SETTINGS', payload: initialState });
      }
      
      // TODO: Load from server API if available
      // const serverSettings = await settingsService.getUserSettings();
      // dispatch({ type: 'LOAD_SETTINGS', payload: serverSettings });
      
    } catch (error) {
      console.error('Error loading settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load settings' });
      
      // Fall back to initial state
      dispatch({ type: 'LOAD_SETTINGS', payload: initialState });
    }
  }, [storageKey]);

  const saveSettings = useCallback((settings) => {
    if (!storageKey) return;
    
    try {
      // Remove loading and error states before saving
      const { isLoading, error, ...settingsToSave } = settings;
      
      // Save to localStorage
      storage.setItem(storageKey, JSON.stringify(settingsToSave));
      
      // TODO: Save to server API if available
      // settingsService.updateUserSettings(settingsToSave);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save settings' });
    }
  }, [storageKey]);

  const updateSetting = useCallback((key, value) => {
    dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    
    // Save updated settings
    const newState = { ...state, [key]: value };
    saveSettings(newState);
  }, [state, saveSettings]);

  const updateNestedSetting = useCallback((parent, key, value) => {
    dispatch({ type: 'UPDATE_NESTED_SETTING', payload: { parent, key, value } });
    
    const newState = {
      ...state,
      [parent]: {
        ...state[parent],
        [key]: value
      }
    };
    saveSettings(newState);
  }, [state, saveSettings]);

  const updateDashboardWidgets = useCallback((widgets) => {
    if (!Array.isArray(widgets)) {
      console.error('Dashboard widgets must be an array');
      return;
    }
    
    dispatch({ type: 'UPDATE_DASHBOARD_WIDGETS', payload: widgets });
    saveSettings({ ...state, dashboardWidgets: widgets });
  }, [state, saveSettings]);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
    if (storageKey) {
      storage.removeItem(storageKey);
    }
  }, [storageKey]);

  const exportSettings = useCallback(() => {
    try {
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
    } catch (error) {
      console.error('Error exporting settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export settings' });
    }
  }, [state, user?.id]);

  const importSettings = useCallback((settingsData) => {
    try {
      const parsedSettings = typeof settingsData === 'string' 
        ? JSON.parse(settingsData) 
        : settingsData;
      
      // Validate settings structure
      if (parsedSettings && typeof parsedSettings === 'object') {
        // Merge with initial state to ensure all properties exist
        const mergedSettings = {
          ...initialState,
          ...parsedSettings
        };
        
        dispatch({ type: 'LOAD_SETTINGS', payload: mergedSettings });
        saveSettings(mergedSettings);
        return { success: true };
      }
      
      throw new Error('Invalid settings format');
    } catch (error) {
      console.error('Error importing settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import settings' });
      return { success: false, error: error.message };
    }
  }, [saveSettings]);

  const getNotificationPreference = useCallback((type) => {
    return state.notificationTypes?.[type] || false;
  }, [state.notificationTypes]);

  const setNotificationPreference = useCallback((type, enabled) => {
    updateNestedSetting('notificationTypes', type, enabled);
  }, [updateNestedSetting]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    updateSetting,
    updateNestedSetting,
    updateDashboardWidgets,
    resetSettings,
    exportSettings,
    importSettings,
    getNotificationPreference,
    setNotificationPreference,
    loadSettings,
    clearError
  }), [
    state,
    updateSetting,
    updateNestedSetting,
    updateDashboardWidgets,
    resetSettings,
    exportSettings,
    importSettings,
    getNotificationPreference,
    setNotificationPreference,
    loadSettings,
    clearError
  ]);

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

export default SettingsContext;