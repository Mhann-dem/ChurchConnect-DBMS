import React from 'react';
import styles from '../../pages/public/PublicPages.module.css';

const EventSkeleton = () => {
  return (
    <div className={styles.eventCardSkeleton}>
      <div className={styles.skeletonImage}></div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonMeta}>
          <div className={styles.skeletonMetaItem}></div>
          <div className={styles.skeletonMetaItem}></div>
        </div>
        <div className={styles.skeletonLocation}></div>
        <div className={styles.skeletonDescription}>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine}></div>
          <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default EventSkeleton;