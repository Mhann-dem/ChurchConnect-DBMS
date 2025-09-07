import React from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  RefreshCcwIcon
} from '@heroicons/react/24/outline';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue', 
  changeType = 'neutral',
  description = 'from last period',
  format = 'number',
  loading = false,
  error = null,
  onClick,
  href,
  subtitle,
  secondaryValue,
  actionButton = true,
  showTrend = true,
  animate = true
}) => {

  // Format the display value based on type
  const formatValue = (val) => {
    if (loading) return '...';
    if (error) return 'Error';
    
    if (typeof val !== 'number' && isNaN(val)) return val || '0';
    
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: 'GHS',
          minimumFractionDigits: 0,
          maximumFractionDigits: numVal >= 1000 ? 0 : 2
        }).format(numVal);
      case 'percentage':
        return `${numVal}%`;
      case 'compact':
        if (numVal >= 1000000) return `${(numVal / 1000000).toFixed(1)}M`;
        if (numVal >= 1000) return `${(numVal / 1000).toFixed(1)}K`;
        return new Intl.NumberFormat().format(numVal);
      default:
        return new Intl.NumberFormat().format(numVal);
    }
  };

  // Get trend icon based on change type
  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return ArrowUpIcon;
      case 'negative':
        return ArrowDownIcon;
      default:
        return MinusIcon;
    }
  };

  // Get trend color classes
  const getTrendColorClasses = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // Get change text with proper formatting
  const getChangeText = () => {
    if (change === null || change === undefined) return '';
    
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    if (isNaN(numChange)) return '';
    
    const prefix = numChange > 0 ? '+' : '';
    
    if (format === 'percentage') {
      return `${prefix}${numChange}%`;
    }
    if (format === 'currency') {
      return `${prefix}${formatCurrency(Math.abs(numChange))}`;
    }
    
    return `${prefix}${numChange}${changeType !== 'neutral' ? '%' : ''}`;
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Color scheme classes
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/25'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      shadow: 'shadow-green-500/25'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      shadow: 'shadow-yellow-500/25'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      shadow: 'shadow-purple-500/25'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      shadow: 'shadow-indigo-500/25'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      shadow: 'shadow-red-500/25'
    },
    gray: {
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      shadow: 'shadow-gray-500/25'
    }
  };

  const currentColorScheme = colorClasses[color] || colorClasses.blue;
  const TrendIcon = getTrendIcon();

  // Handle click
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group
        ${(onClick || href) ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''}
        ${animate ? 'transition-all duration-300' : ''}
        ${loading ? 'animate-pulse' : ''}
      `}
      onClick={handleClick}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className={`w-full h-full bg-gradient-to-br ${currentColorScheme.gradient} rounded-full transform translate-x-8 -translate-y-8`}></div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-${color}-600`}></div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center">
            <RefreshCcwIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs text-red-600">Failed to load</p>
          </div>
        </div>
      )}

      <div className="p-6 relative z-5">
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {title}
              </h3>
              {actionButton && (onClick || href) && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  title={`View ${title.toLowerCase()}`}
                >
                  <EyeIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
            )}
            
            <div className="flex items-baseline space-x-2">
              <p className={`text-3xl font-bold ${loading ? 'text-gray-400' : 'text-gray-900'} ${animate && (onClick || href) ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
                {formatValue(value)}
              </p>
              {secondaryValue && (
                <p className="text-sm text-gray-500">
                  / {formatValue(secondaryValue)}
                </p>
              )}
            </div>
          </div>
          
          {/* Icon */}
          <div className={`p-3 rounded-xl bg-gradient-to-r ${currentColorScheme.gradient} shadow-lg ${currentColorScheme.shadow} ${animate ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Change indicator */}
        {showTrend && (change !== null && change !== undefined) && !loading && !error && (
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColorClasses()}`}>
              <TrendIcon className="h-3 w-3" />
              <span>
                {getChangeText()}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {description}
            </span>
          </div>
        )}

        {/* No change indicator when change is not provided */}
        {showTrend && (change === null || change === undefined) && !loading && !error && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs text-gray-500 bg-gray-50">
              <MinusIcon className="h-3 w-3" />
              <span>No change</span>
            </div>
            <span className="text-xs text-gray-500">
              {description}
            </span>
          </div>
        )}

        {/* Custom content area */}
        {!showTrend && !loading && !error && description && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        )}
      </div>

      {/* Hover effect indicator */}
      {(onClick || href) && (
        <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${currentColorScheme.gradient} ${animate ? 'group-hover:w-full transition-all duration-300' : ''}`} />
      )}
    </div>
  );
};

// Specialized variants of StatsCard
export const CompactStatsCard = (props) => (
  <StatsCard
    {...props}
    format="compact"
    className="p-4"
  />
);

export const CurrencyStatsCard = (props) => (
  <StatsCard
    {...props}
    format="currency"
  />
);

export const PercentageStatsCard = (props) => (
  <StatsCard
    {...props}
    format="percentage"
  />
);

export const SimpleStatsCard = (props) => (
  <StatsCard
    {...props}
    showTrend={false}
    actionButton={false}
    animate={false}
  />
);

export default StatsCard;