// frontend/src/hooks/usePerformanceMonitoring.js - FIXED VERSION
import { useCallback } from 'react';

export const usePerformanceMonitoring = () => {
  // Simple tracking with proper error handling
  const trackApiCall = useCallback(async (apiCallFn, operationName, metadata = {}) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCallFn();
      const duration = performance.now() - startTime;
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        if (duration > 2000) {
          console.warn(`Slow API call: ${operationName} took ${Math.round(duration)}ms`, metadata);
        } else {
          console.log(`API call: ${operationName} completed in ${Math.round(duration)}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API call failed: ${operationName} (${Math.round(duration)}ms)`, error);
      throw error;
    }
  }, []);

  const trackInteraction = useCallback((interactionName, interactionFn) => {
    // Return the function wrapped with simple timing
    return (...args) => {
      const startTime = performance.now();
      
      try {
        const result = interactionFn(...args);
        const duration = performance.now() - startTime;
        
        // Only log slow interactions in development
        if (process.env.NODE_ENV === 'development' && duration > 500) {
          console.warn(`Slow interaction: ${interactionName} took ${Math.round(duration)}ms`);
        }
        
        return result;
      } catch (error) {
        console.error(`Interaction failed: ${interactionName}`, error);
        throw error;
      }
    };
  }, []);

  // Simple stub methods for compatibility
  return {
    trackApiCall,
    trackInteraction,
    // Compatibility stubs
    startMeasure: useCallback(() => performance.now(), []),
    endMeasure: useCallback(() => ({ duration: 0 }), []),
    getPerformanceSummary: useCallback(() => ({ totalMeasures: 0 }), []),
    clearMetrics: useCallback(() => {}, []),
    cleanup: useCallback(() => {}, [])
  };
};

export default usePerformanceMonitoring;