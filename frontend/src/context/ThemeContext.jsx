// context/ThemeContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ThemeContext = createContext();

const initialState = {
  theme: 'light', // 'light', 'dark', 'system'
  primaryColor: '#3b82f6',
  fontSize: 'medium', // 'small', 'medium', 'large'
  highContrast: false,
  reducedMotion: false,
  compactMode: false
};

const themeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
    
    case 'SET_PRIMARY_COLOR':
      return {
        ...state,
        primaryColor: action.payload
      };
    
    case 'SET_FONT_SIZE':
      return {
        ...state,
        fontSize: action.payload
      };
    
    case 'TOGGLE_HIGH_CONTRAST':
      return {
        ...state,
        highContrast: !state.highContrast
      };
    
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        reducedMotion: !state.reducedMotion
      };
    
    case 'TOGGLE_COMPACT_MODE':
      return {
        ...state,
        compactMode: !state.compactMode
      };
    
    case 'RESET_THEME':
      return initialState;
    
    case 'LOAD_THEME':
      return {
        ...state,
        ...action.payload
      };
    
    default:
      return state;
  }
};

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('churchconnect_theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        dispatch({ type: 'LOAD_THEME', payload: parsedTheme });
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('churchconnect_theme', JSON.stringify(state));
  }, [state]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.classList.remove('light', 'dark');
    if (state.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(state.theme);
    }
    
    // Apply primary color
    root.style.setProperty('--primary-color', state.primaryColor);
    
    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${state.fontSize}`);
    
    // Apply accessibility options
    root.classList.toggle('high-contrast', state.highContrast);
    root.classList.toggle('reduced-motion', state.reducedMotion);
    root.classList.toggle('compact-mode', state.compactMode);
  }, [state]);

  // Listen for system theme changes
  useEffect(() => {
    if (state.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [state.theme]);

  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setPrimaryColor = (color) => {
    dispatch({ type: 'SET_PRIMARY_COLOR', payload: color });
  };

  const setFontSize = (size) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
  };

  const toggleHighContrast = () => {
    dispatch({ type: 'TOGGLE_HIGH_CONTRAST' });
  };

  const toggleReducedMotion = () => {
    dispatch({ type: 'TOGGLE_REDUCED_MOTION' });
  };

  const toggleCompactMode = () => {
    dispatch({ type: 'TOGGLE_COMPACT_MODE' });
  };

  const resetTheme = () => {
    dispatch({ type: 'RESET_THEME' });
  };

  const getEffectiveTheme = () => {
    if (state.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  };

  const value = {
    ...state,
    setTheme,
    setPrimaryColor,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleCompactMode,
    resetTheme,
    getEffectiveTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};