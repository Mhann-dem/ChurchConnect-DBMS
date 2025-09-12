import React, { useEffect } from 'react';

const KeyboardShortcuts = ({ shortcuts = [] }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      shortcuts.forEach(({ key, ctrlKey, altKey, shiftKey, action }) => {
        if (
          event.key === key &&
          event.ctrlKey === !!ctrlKey &&
          event.altKey === !!altKey &&
          event.shiftKey === !!shiftKey
        ) {
          event.preventDefault();
          action();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;