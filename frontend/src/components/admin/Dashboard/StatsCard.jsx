// Dashboard/StatsCard.jsx
import React from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon 
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
  loading = false 
}) => {

  // Format the display value based on type
  const formatValue = (val) => {
    if (loading) return '...';
    
    if (typeof val !== 'number') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  // Get trend icon based on change type
  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return TrendingUpIcon;
      case 'negative':
        return TrendingDownIcon;
      default:
        return MinusIcon;
    }
  };

  // Get trend color classes
  const getTrendColorClasses = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  // Get change text with proper formatting
  const getChangeText = () => {
    if (change === null || change === undefined) return '';
    
    const prefix = change > 0 ? '+' : '';
    
    if (format === 'percentage') {
      return `${prefix}${change}%`;
    }
    if (format === 'currency') {
      return `${prefix}$${Math.abs(change).toLocaleString()}`;
    }
    
    return `${prefix}${change}`;
  };

  // Color scheme classes
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-200'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      border: 'border-gray-200'
    }
  };

  const currentColorScheme = colorClasses[color] || colorClasses.blue;
  const TrendIcon = getTrendIcon();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="p-6">
        {/* Header section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
          </div>
          
          {/* Icon */}
          <div className={`p-3 rounded-lg ${currentColorScheme.bg} ${currentColorScheme.border} border`}>
            <Icon className={`h-6 w-6 ${currentColorScheme.icon}`} />
          </div>
        </div>

        {/* Change indicator */}
        {(change !== null && change !== undefined) && (
          <div className="flex items-center">
            <div className="flex items-center space-x-1">
              <TrendIcon className={`h-4 w-4 ${getTrendColorClasses()}`} />
              <span className={`text-sm font-medium ${getTrendColorClasses()}`}>
                {getChangeText()}
              </span>
            </div>
            <span className="text-sm text-gray-500 ml-1">
              {description}
            </span>
          </div>
        )}

        {/* No change indicator when change is not provided */}
        {(change === null || change === undefined) && (
          <div className="flex items-center">
            <div className="flex items-center space-x-1">
              <MinusIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                No change data
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle accent border */}
      <div className={`h-1 ${currentColorScheme.bg}`} />
    </div>
  );
};

export default StatsCard;