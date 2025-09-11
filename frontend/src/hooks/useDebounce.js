// hooks/useDebounce.js - Production Ready with advanced features
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Basic debounce hook for values with configurable options
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Configuration options
 * @returns {*} The debounced value
 */
export const useDebounce = (value, delay, options = {}) => {
  const {
    leading = false,    // Execute immediately on first call
    trailing = true,    // Execute after delay
    maxWait = null      // Maximum time to wait before execution
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);
  const hasCalledRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    
    // Handle leading edge execution
    if (leading && !hasCalledRef.current) {
      setDebouncedValue(value);
      hasCalledRef.current = true;
      lastCallTimeRef.current = now;
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Set up maxWait timeout if specified
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = now;
        hasCalledRef.current = true;
      }, maxWait);
    }

    // Set up trailing edge timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTimeRef.current = now;
        hasCalledRef.current = true;
        
        // Clear maxWait timeout since we're executing
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  // Reset when delay changes
  useEffect(() => {
    hasCalledRef.current = false;
    lastCallTimeRef.current = 0;
  }, [delay]);

  return debouncedValue;
};

/**
 * Advanced debounce hook for functions with additional features
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependencies for callback
 * @param {Object} options - Configuration options
 * @returns {Array} [debouncedCallback, cancel, flush, isPending]
 */
export const useDebounceCallback = (callback, delay, dependencies = [], options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options;

  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const argsRef = useRef(null);
  const [isPending, setIsPending] = useState(false);

  const debouncedCallback = useCallback((...args) => {
    argsRef.current = args;
    setIsPending(true);

    // Handle leading execution
    if (leading && !timeoutRef.current) {
      callback(...args);
      setIsPending(false);
      return;
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up maxWait timeout
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        if (argsRef.current) {
          callback(...argsRef.current);
        }
        setIsPending(false);
        timeoutRef.current = null;
        maxTimeoutRef.current = null;
      }, maxWait);
    }

    // Set up main debounce timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (argsRef.current) {
          callback(...argsRef.current);
        }
        setIsPending(false);
        timeoutRef.current = null;
        
        // Clear maxWait timeout
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, delay);
    } else if (!leading) {
      // Neither leading nor trailing - just cancel
      setIsPending(false);
    }
  }, [callback, delay, leading, trailing, maxWait, ...dependencies]);

  // Cancel any pending execution
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    setIsPending(false);
    argsRef.current = null;
  }, []);

  // Immediately execute with last arguments
  const flush = useCallback(() => {
    if (argsRef.current) {
      callback(...argsRef.current);
    }
    cancel();
  }, [callback, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedCallback, cancel, flush, isPending];
};

/**
 * Enhanced search debounce hook with loading states and history
 * @param {string} searchTerm - The search term to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @param {Object} options - Configuration options
 * @returns {Object} Search utilities
 */
export const useDebounceSearch = (searchTerm, delay = 300, options = {}) => {
  const {
    minLength = 0,        // Minimum search term length
    maxHistory = 10,      // Maximum search history entries
    clearOnEmpty = true   // Clear results when search is empty
  } = options;

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const timeoutRef = useRef(null);

  // Debounce the search term
  useEffect(() => {
    setIsSearching(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const handler = setTimeout(() => {
      const trimmedTerm = searchTerm.trim();
      
      // Check minimum length requirement
      if (trimmedTerm.length >= minLength) {
        setDebouncedSearchTerm(trimmedTerm);
        
        // Add to search history if not empty and not already in history
        if (trimmedTerm && !searchHistory.includes(trimmedTerm)) {
          setSearchHistory(prev => {
            const newHistory = [trimmedTerm, ...prev];
            return newHistory.slice(0, maxHistory);
          });
        }
      } else if (clearOnEmpty && trimmedTerm.length === 0) {
        setDebouncedSearchTerm('');
      }
      
      setIsSearching(false);
    }, delay);

    timeoutRef.current = handler;

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, minLength, maxHistory, clearOnEmpty, searchHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Remove item from search history
  const removeFromHistory = useCallback((term) => {
    setSearchHistory(prev => prev.filter(item => item !== term));
  }, []);

  return {
    debouncedSearchTerm,
    isSearching,
    searchHistory,
    clearHistory,
    removeFromHistory,
    hasMinLength: searchTerm.trim().length >= minLength
  };
};

/**
 * Throttle hook for limiting function execution rate
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Array} dependencies - Dependencies for callback
 * @returns {Function} Throttled function
 */
export const useThrottle = (callback, limit, dependencies = []) => {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit) {
      // Execute immediately
      callback(...args);
      lastRunRef.current = now;
    } else {
      // Schedule execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRunRef.current = Date.now();
      }, limit - timeSinceLastRun);
    }
  }, [callback, limit, ...dependencies]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Combined debounce and throttle hook
 * @param {Function} callback - Function to debounce/throttle
 * @param {number} debounceDelay - Debounce delay
 * @param {number} throttleLimit - Throttle limit
 * @param {Array} dependencies - Dependencies for callback
 * @returns {Function} Combined debounced/throttled function
 */
export const useDebounceThrottle = (callback, debounceDelay, throttleLimit, dependencies = []) => {
  const throttledCallback = useThrottle(callback, throttleLimit, dependencies);
  const [debouncedCallback] = useDebounceCallback(throttledCallback, debounceDelay, dependencies);
  
  return debouncedCallback;
};

export default useDebounce;