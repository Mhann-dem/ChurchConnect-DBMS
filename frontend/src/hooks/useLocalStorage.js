// hooks/useLocalStorage.js - Production Ready with advanced features and error handling
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Production-ready localStorage hook with advanced features
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @param {Object} options - Configuration options
 * @returns {Array} [value, setValue, removeValue, utilities]
 */
const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = (error) => console.error(`useLocalStorage error for key "${key}":`, error),
    syncAcrossTabs = true,
    validateValue = null, // Function to validate stored value
    ttl = null, // Time to live in milliseconds
    compress = false // Whether to compress large values (requires additional library)
  } = options;

  // Refs for tracking state
  const mountedRef = useRef(true);
  const lastValueRef = useRef(null);
  const ttlTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (ttlTimeoutRef.current) {
        clearTimeout(ttlTimeoutRef.current);
      }
    };
  }, []);

  // Get stored value with error handling and validation
  const getStoredValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return initialValue;
      }

      let parsedValue;
      
      try {
        parsedValue = deserialize(item);
      } catch (deserializeError) {
        onError(new Error(`Failed to deserialize value: ${deserializeError.message}`));
        // Remove corrupted data
        window.localStorage.removeItem(key);
        return initialValue;
      }

      // Handle TTL (Time To Live)
      if (ttl && parsedValue && typeof parsedValue === 'object' && parsedValue.__ttl) {
        const now = Date.now();
        if (now > parsedValue.__ttl) {
          // Value has expired, remove it
          window.localStorage.removeItem(key);
          return initialValue;
        }
        // Return the actual value without TTL metadata
        parsedValue = parsedValue.value;
      }

      // Validate stored value if validator provided
      if (validateValue && typeof validateValue === 'function') {
        try {
          const isValid = validateValue(parsedValue);
          if (!isValid) {
            onError(new Error('Stored value failed validation'));
            window.localStorage.removeItem(key);
            return initialValue;
          }
        } catch (validationError) {
          onError(new Error(`Validation error: ${validationError.message}`));
          window.localStorage.removeItem(key);
          return initialValue;
        }
      }

      return parsedValue;
    } catch (error) {
      onError(error);
      return initialValue;
    }
  }, [key, initialValue, deserialize, onError, ttl, validateValue]);

  // Initialize state with stored value
  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Set up TTL timeout if value has TTL
  useEffect(() => {
    if (ttl && storedValue !== initialValue) {
      if (ttlTimeoutRef.current) {
        clearTimeout(ttlTimeoutRef.current);
      }
      
      ttlTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setValue(initialValue);
        }
      }, ttl);
    }

    return () => {
      if (ttlTimeoutRef.current) {
        clearTimeout(ttlTimeoutRef.current);
      }
    };
  }, [storedValue, ttl, initialValue]);

  // Set value with advanced options
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function for functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      if (!mountedRef.current) return;

      // Update state
      setStoredValue(valueToStore);
      lastValueRef.current = valueToStore;

      if (typeof window === 'undefined') {
        return;
      }

      // Handle removal case
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key);
        return;
      }

      let serializedValue;
      
      // Add TTL metadata if specified
      if (ttl) {
        const valueWithTTL = {
          value: valueToStore,
          __ttl: Date.now() + ttl
        };
        serializedValue = serialize(valueWithTTL);
      } else {
        serializedValue = serialize(valueToStore);
      }

      // Check storage quota before setting
      const storageQuota = getStorageQuota();
      if (storageQuota.usage && storageQuota.quota) {
        const estimatedSize = new Blob([serializedValue]).size;
        const remainingSpace = storageQuota.quota - storageQuota.usage;
        
        if (estimatedSize > remainingSpace) {
          throw new Error('Insufficient localStorage space');
        }
      }

      window.localStorage.setItem(key, serializedValue);
    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        onError(new Error(`localStorage quota exceeded for key "${key}"`));
        // Optionally try to clear some space
        if (options.clearOnQuotaExceeded) {
          clearOldestEntries();
        }
      } else {
        onError(error);
      }
    }
  }, [key, storedValue, serialize, ttl, onError, options.clearOnQuotaExceeded]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (!mountedRef.current) return;
      
      setStoredValue(initialValue);
      lastValueRef.current = initialValue;
      
      if (ttlTimeoutRef.current) {
        clearTimeout(ttlTimeoutRef.current);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(error);
    }
  }, [key, initialValue, onError]);

  // Check if value exists in localStorage
  const hasValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      onError(error);
      return false;
    }
  }, [key, onError]);

  // Get storage usage information
  const getStorageInfo = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;
      
      const item = window.localStorage.getItem(key);
      const size = item ? new Blob([item]).size : 0;
      const quota = getStorageQuota();
      
      return {
        key,
        size,
        exists: item !== null,
        quota: quota.quota,
        usage: quota.usage,
        remainingSpace: quota.quota ? quota.quota - quota.usage : null
      };
    } catch (error) {
      onError(error);
      return null;
    }
  }, [key, onError]);

  // Get storage quota information
  const getStorageQuota = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        return navigator.storage.estimate().then(estimate => ({
          quota: estimate.quota,
          usage: estimate.usage
        }));
      }
      
      // Fallback: estimate based on localStorage content
      let totalSize = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const value = window.localStorage.getItem(key);
        totalSize += key.length + value.length;
      }
      
      return {
        usage: totalSize,
        quota: null // Unknown without Storage API
      };
    } catch (error) {
      onError(error);
      return { usage: null, quota: null };
    }
  }, [onError]);

  // Clear oldest entries to free space (based on custom metadata)
  const clearOldestEntries = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      
      const entries = [];
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i);
        const value = window.localStorage.getItem(storageKey);
        
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.__ttl) {
            entries.push({
              key: storageKey,
              ttl: parsed.__ttl,
              size: value.length
            });
          }
        } catch {
          // Not a TTL value, skip
        }
      }
      
      // Sort by TTL (oldest first) and remove expired or oldest entries
      entries.sort((a, b) => a.ttl - b.ttl);
      
      const now = Date.now();
      let freedSpace = 0;
      const targetSpace = 1024 * 1024; // 1MB
      
      for (const entry of entries) {
        if (freedSpace >= targetSpace) break;
        
        if (entry.ttl < now || freedSpace < targetSpace) {
          window.localStorage.removeItem(entry.key);
          freedSpace += entry.size;
        }
      }
    } catch (error) {
      onError(error);
    }
  }, [onError]);

  // Sync value with other tabs/windows
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key !== key || !mountedRef.current) return;

      try {
        if (e.newValue === null) {
          // Value was removed
          setStoredValue(initialValue);
          lastValueRef.current = initialValue;
        } else {
          // Value was updated
          const newValue = deserialize(e.newValue);
          
          // Handle TTL values
          let actualValue = newValue;
          if (ttl && newValue && typeof newValue === 'object' && newValue.__ttl) {
            const now = Date.now();
            if (now > newValue.__ttl) {
              // Expired in other tab
              setStoredValue(initialValue);
              lastValueRef.current = initialValue;
              return;
            }
            actualValue = newValue.value;
          }
          
          // Validate if validator provided
          if (validateValue && !validateValue(actualValue)) {
            return; // Don't sync invalid values
          }
          
          setStoredValue(actualValue);
          lastValueRef.current = actualValue;
        }
      } catch (error) {
        onError(error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, deserialize, syncAcrossTabs, onError, ttl, validateValue]);

  // Refresh value from localStorage (useful for manual sync)
  const refresh = useCallback(() => {
    if (!mountedRef.current) return;
    
    const freshValue = getStoredValue();
    setStoredValue(freshValue);
    lastValueRef.current = freshValue;
  }, [getStoredValue]);

  // Check if current value differs from stored value
  const isDirty = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      
      const currentStored = getStoredValue();
      return JSON.stringify(currentStored) !== JSON.stringify(storedValue);
    } catch (error) {
      onError(error);
      return false;
    }
  }, [storedValue, getStoredValue, onError]);

  // Utility functions
  const utilities = {
    hasValue,
    getStorageInfo,
    getStorageQuota,
    refresh,
    isDirty,
    clearOldestEntries,
    
    // Migration helper
    migrate: (oldKey, transformer) => {
      try {
        if (typeof window === 'undefined') return;
        
        const oldValue = window.localStorage.getItem(oldKey);
        if (oldValue) {
          const transformed = transformer ? transformer(deserialize(oldValue)) : deserialize(oldValue);
          setValue(transformed);
          window.localStorage.removeItem(oldKey);
        }
      } catch (error) {
        onError(error);
      }
    },
    
    // Backup and restore
    backup: () => {
      try {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
      } catch (error) {
        onError(error);
        return null;
      }
    },
    
    restore: (backupValue) => {
      try {
        if (typeof window === 'undefined' || !backupValue) return;
        window.localStorage.setItem(key, backupValue);
        refresh();
      } catch (error) {
        onError(error);
      }
    }
  };

  return [storedValue, setValue, removeValue, utilities];
};

export default useLocalStorage;