import React, { useState, useRef, useEffect } from 'react';
import styles from './UI.module.css';

const Tabs = ({ 
  tabs = [], 
  defaultActiveTab = 0,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default', // 'default', 'pills', 'underline', 'minimal'
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  vertical = false,
  scrollable = false
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab);
  const tabRefs = useRef([]);
  const tabListRef = useRef(null);

  // Use controlled or uncontrolled state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (index, tab) => {
    if (tab.disabled) return;
    
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(index);
    }
    
    if (onTabChange) {
      onTabChange(index, tab);
    }
  };

  const handleKeyDown = (event, index) => {
    const tabCount = tabs.length;
    let newIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : tabCount - 1;
        // Skip disabled tabs
        while (tabs[newIndex]?.disabled && newIndex !== index) {
          newIndex = newIndex > 0 ? newIndex - 1 : tabCount - 1;
        }
        tabRefs.current[newIndex]?.focus();
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = index < tabCount - 1 ? index + 1 : 0;
        // Skip disabled tabs
        while (tabs[newIndex]?.disabled && newIndex !== index) {
          newIndex = newIndex < tabCount - 1 ? newIndex + 1 : 0;
        }
        tabRefs.current[newIndex]?.focus();
        break;
        
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        while (tabs[newIndex]?.disabled && newIndex < tabCount - 1) {
          newIndex++;
        }
        tabRefs.current[newIndex]?.focus();
        break;
        
      case 'End':
        event.preventDefault();
        newIndex = tabCount - 1;
        while (tabs[newIndex]?.disabled && newIndex > 0) {
          newIndex--;
        }
        tabRefs.current[newIndex]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(index, tabs[index]);
        break;
        
      default:
        break;
    }
  };

  // Scroll active tab into view if scrollable
  useEffect(() => {
    if (scrollable && tabRefs.current[activeTab]) {
      tabRefs.current[activeTab].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [activeTab, scrollable]);

  const activeTabContent = tabs[activeTab]?.content || null;

  return (
    <div 
      className={`
        ${styles.tabs} 
        ${styles[`tabs--${variant}`]} 
        ${styles[`tabs--${size}`]}
        ${vertical ? styles.tabsVertical : ''}
        ${scrollable ? styles.tabsScrollable : ''}
        ${className}
      `}
    >
      <div 
        className={styles.tabsList}
        ref={tabListRef}
        role="tablist"
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={index}
              ref={el => tabRefs.current[index] = el}
              className={`
                ${styles.tabsTab}
                ${isActive ? styles.tabsTabActive : ''}
                ${isDisabled ? styles.tabsTabDisabled : ''}
              `}
              onClick={() => handleTabClick(index, tab)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${index}`}
              id={`tab-${index}`}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              type="button"
            >
              {tab.icon && (
                <span className={styles.tabsTabIcon} aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              
              <span className={styles.tabsTabLabel}>
                {tab.label}
              </span>
              
              {tab.badge && (
                <span className={styles.tabsTabBadge}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.tabsContent}>
        {tabs.map((tab, index) => {
          const isActive = index === activeTab;
          
          return (
            <div
              key={index}
              className={`
                ${styles.tabsPanel}
                ${isActive ? styles.tabsPanelActive : ''}
              `}
              role="tabpanel"
              id={`tabpanel-${index}`}
              aria-labelledby={`tab-${index}`}
              hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
