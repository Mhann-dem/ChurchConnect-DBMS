// Dashboard/StatsCard.jsx
import React from 'react';
import { Card, Badge } from '../../ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './Dashboard.module.css';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'primary', 
  trend,
  format = 'number',
  loading = false 
}) => {
  const formatValue = (val) => {
    if (loading) return '...';
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return Minus;
    return trend === 'up' ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'neutral';
    return trend === 'up' ? 'success' : 'danger';
  };

  const getChangeText = () => {
    if (!change && change !== 0) return '';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}`;
  };

  return (
    <Card className={`${styles.statsCard} ${styles[color]}`}>
      <div className={styles.statsCardContent}>
        <div className={styles.statsHeader}>
          <div className={styles.statsInfo}>
            <h3 className={styles.statsTitle}>{title}</h3>
            <div className={styles.statsValue}>
              {formatValue(value)}
            </div>
          </div>
          <div className={`${styles.statsIcon} ${styles[color]}`}>
            <Icon size={24} />
          </div>
        </div>
        
        {(change !== null && change !== undefined) && (
          <div className={styles.statsFooter}>
            <div className={styles.trendContainer}>
              <div className={`${styles.trendIcon} ${styles[getTrendColor()]}`}>
                {React.createElement(getTrendIcon(), { size: 16 })}
              </div>
              <span className={`${styles.changeText} ${styles[getTrendColor()]}`}>
                {getChangeText()}
              </span>
              <span className={styles.changeLabel}>
                from last period
              </span>
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className={styles.statsCardOverlay}>
          <div className={styles.statsCardLoader}></div>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;