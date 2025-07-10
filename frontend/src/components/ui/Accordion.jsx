import React, { useState } from 'react';
import styles from './UI.module.css';

const Accordion = ({ 
  items = [], 
  allowMultiple = false, 
  className = '',
  variant = 'default' // 'default', 'minimal', 'bordered'
}) => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    
    if (allowMultiple) {
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
    } else {
      if (newOpenItems.has(index)) {
        newOpenItems.clear();
      } else {
        newOpenItems.clear();
        newOpenItems.add(index);
      }
    }
    
    setOpenItems(newOpenItems);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(index);
    }
  };

  return (
    <div className={`${styles.accordion} ${styles[`accordion--${variant}`]} ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        const itemId = `accordion-item-${index}`;
        const headerId = `accordion-header-${index}`;
        const contentId = `accordion-content-${index}`;

        return (
          <div 
            key={index} 
            className={`${styles.accordionItem} ${isOpen ? styles.accordionItemOpen : ''}`}
          >
            <button
              id={headerId}
              className={styles.accordionHeader}
              onClick={() => toggleItem(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-expanded={isOpen}
              aria-controls={contentId}
              type="button"
            >
              <span className={styles.accordionTitle}>
                {item.title}
              </span>
              <span 
                className={`${styles.accordionIcon} ${isOpen ? styles.accordionIconOpen : ''}`}
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M4 6L8 10L12 6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            
            <div
              id={contentId}
              className={`${styles.accordionContent} ${isOpen ? styles.accordionContentOpen : ''}`}
              aria-labelledby={headerId}
              role="region"
            >
              <div className={styles.accordionBody}>
                {typeof item.content === 'string' ? (
                  <p>{item.content}</p>
                ) : (
                  item.content
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
