// frontend/src/hooks/usePerformanceMonitoring.js - SIMPLIFIED VERSION
import { useCallback } from 'react';

export const usePerformanceMonitoring = () => {
  // Simple tracking that just logs to console
  const trackApiCall = useCallback(async (apiCallFn, operationName, metadata = {}) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCallFn();
      const duration = performance.now() - startTime;
      
      if (duration > 2000) { // Log slow operations
        console.warn(`Slow API call: ${operationName} took ${Math.round(duration)}ms`, metadata);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API call failed: ${operationName} (${Math.round(duration)}ms)`, error);
      throw error;
    }
  }, []);

  const trackInteraction = useCallback((interactionName, interactionFn) => {
    // For interactions, just return the function with simple timing
    return (...args) => {
      const startTime = performance.now();
      
      try {
        const result = interactionFn(...args);
        const duration = performance.now() - startTime;
        
        if (duration > 500) { // Log slow interactions
          console.warn(`Slow interaction: ${interactionName} took ${Math.round(duration)}ms`);
        }
        
        return result;
      } catch (error) {
        console.error(`Interaction failed: ${interactionName}`, error);
        throw error;
      }
    };
  }, []);

  // Simplified methods that don't cause React import issues
  return {
    trackApiCall,
    trackInteraction,
    // Stub methods for compatibility
    startMeasure: () => performance.now(),
    endMeasure: () => ({ duration: 0 }),
    getPerformanceSummary: () => ({ totalMeasures: 0 }),
    clearMetrics: () => {},
    cleanup: () => {}
  };
};

export default usePerformanceMonitoring;