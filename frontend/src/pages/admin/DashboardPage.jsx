import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  BellIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  Cog6ToothIcon,
  HomeIcon,
  BuildingOffice2Icon,
  GiftIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useFamilies } from '../../hooks/useFamilies';
import dashboardService from '../../services/dashboardService';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import apiMethods from '../../services/api';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const { getFamilyStatistics } = useFamilies();
  const navigate = useNavigate();
  
  // State management
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    memberStats: null,
    pledgeStats: null,
    groupStats: null,
    familyStats: null,
    eventStats: null,
    recentMembers: [],
    recentPledges: [],
    recentEvents: [],
    recentFamilies: [],
    systemHealth: null,
    alerts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(null);
  const [familyStats, setFamilyStats] = useState(null);
  const dataLoadedRef = useRef(false); // ✅ ADD THIS LINE

  const isDark = settings?.theme === 'dark';

  // Enhanced navigation handlers for better integration
  const handleNavigateToEvents = useCallback((params = {}) => {
    const searchParams = new URLSearchParams(params);
    navigate(`/admin/events?${searchParams.toString()}`);
  }, [navigate]);

  const handleNavigateToGroups = useCallback((params = {}) => {
    const searchParams = new URLSearchParams(params);
    navigate(`/admin/groups?${searchParams.toString()}`);
  }, [navigate]);

  const handleNavigateToMembers = useCallback((params = {}) => {
    const searchParams = new URLSearchParams(params);
    navigate(`/admin/members?${searchParams.toString()}`);
  }, [navigate]);

  // Load family statistics using the useFamilies hook
  useEffect(() => {
    const loadFamilyStats = async () => {
      try {
        const stats = await getFamilyStatistics();
        setFamilyStats(stats);
      } catch (error) {
        console.error('Error loading family statistics:', error);
      }
    };
    
    if (isAuthenticated) {
      loadFamilyStats();
    }
  }, [getFamilyStatistics, isAuthenticated]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);

      // Fetch all dashboard data concurrently
      const [
        systemStats,
        memberStats,
        pledgeStats,
        groupStats,
        familyStatsFromService,
        eventStats,
        recentMembers,
        recentPledges,
        recentEvents,
        recentFamilies,
        systemHealth,
        alerts
      ] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getMemberStats('30d'),
        dashboardService.getPledgeStats('30d'),
        dashboardService.getGroupStats(),
        dashboardService.getFamilyStats(),
        dashboardService.getEventStats(),
        dashboardService.getRecentMembers(5),
        dashboardService.getRecentPledges(5),
        dashboardService.getRecentEvents(5),
        dashboardService.getRecentFamilies(5),
        dashboardService.getSystemHealth(),
        dashboardService.getAlerts()
      ]);

      // Process results safely
      const processResult = (result, fallback = null) => {
        if (result.status === 'fulfilled') {
          return result.value?.data || result.value || fallback;
        } else {
          console.warn('Dashboard API call failed:', result.reason);
          return fallback;
        }
      };

      // Merge family stats from both sources
      const serviceFamilyStats = processResult(familyStatsFromService, { 
        total_families: 0, 
        new_families: 0, 
        growth_rate: 0 
      });
      
      const mergedFamilyStats = familyStats ? {
        ...serviceFamilyStats,
        ...familyStats,
        // Prefer hook data where available, fall back to service data
        total_families: familyStats.total_families || serviceFamilyStats.total_families,
        new_families: familyStats.new_families || serviceFamilyStats.new_families,
        growth_rate: familyStats.growth_rate || serviceFamilyStats.growth_rate
      } : serviceFamilyStats;

      const newDashboardData = {
        stats: processResult(systemStats, { 
          total_members: 0, 
          total_groups: 0, 
          total_pledges: 0,
          total_families: 0,
          total_events: 0,
          monthly_revenue: 0 
        }),
        memberStats: processResult(memberStats, { 
          total_members: 0, 
          active_members: 0,
          inactive_members: 0,
          new_members: 0, 
          growth_rate: 0,
          summary: {} 
        }),
        pledgeStats: processResult(pledgeStats, { 
          total_amount: 0, 
          active_pledges: 0, 
          growth_rate: 0,
          monthly_total: 0 
        }),
        groupStats: processResult(groupStats, { 
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0 
        }),
        familyStats: mergedFamilyStats,
        eventStats: processResult(eventStats, { 
          total_events: 0, 
          upcoming_events: 0, 
          this_month_events: 0 
        }),
        recentMembers: processResult(recentMembers, { results: [] }).results || [],
        recentPledges: processResult(recentPledges, { results: [] }).results || [],
        recentEvents: processResult(recentEvents, { results: [] }).results || [],
        recentFamilies: processResult(recentFamilies, { results: [] }).results || [],
        systemHealth: processResult(systemHealth, { status: 'unknown' }),
        alerts: processResult(alerts, { results: [] }).results || []
      };

      setDashboardData(newDashboardData);
      setLastRefresh(new Date());
      
      if (!showLoadingSpinner) {
        showToast('Dashboard data refreshed successfully', 'success');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  // Initial data fetch - only once on mount
  useEffect(() => {
    if (isAuthenticated && !dataLoadedRef.current) {
      dataLoadedRef.current = true; // ✅ Mark as loaded
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both data sources
      await Promise.all([
        fetchDashboardData(false),
        (async () => {
          try {
            const stats = await getFamilyStatistics();
            setFamilyStats(stats);
          } catch (error) {
            console.error('Error refreshing family statistics:', error);
          }
        })()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Reusable components with inline styles
  const Card = ({ children, className = '', hover = true, style = {}, ...props }) => {
      const [isHovered, setIsHovered] = useState(false);
      
      return (
        <div 
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: isHovered && hover
              ? '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            transform: isHovered && hover ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: hover ? 'pointer' : 'default',
            ...style
          }}
          className={className}
          onMouseEnter={() => hover && setIsHovered(true)}
          onMouseLeave={() => hover && setIsHovered(false)}
          {...props}
        >
          {children}
        </div>
      );
  };

  const Button = ({ 
      children, 
      variant = 'primary', 
      size = 'md', 
      to, 
      onClick, 
      style = {}, 
      icon: Icon,
      iconPosition = 'left',
      disabled = false,
      ...props 
    }) => {
      const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '8px',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'all 0.2s',
        border: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      };

      const variants = {
        primary: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px',
          fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
        },
        secondary: {
          background: 'white',
          color: '#374151',
          border: '1px solid #d1d5db',
          padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px',
          fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
        },
        ghost: {
          background: 'transparent',
          color: '#6b7280',
          padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
          fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px'
        },
        danger: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px',
          fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
        }
      };

      // ✅ Apply styles in the correct order
      const finalStyle = { 
        ...baseStyle, 
        ...variants[variant],
        ...style,  // Custom styles from props
        // ✅ These MUST be last to ensure they're never overridden
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto'
      };

      const content = (
        <>
          {Icon && iconPosition === 'left' && <Icon style={{ width: '16px', height: '16px' }} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon style={{ width: '16px', height: '16px' }} />}
        </>
      );
      
      const handleClick = (e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        if (onClick) {
          onClick(e);
        }
      };

      if (to && !disabled && !onClick) {
        return (
          <Link 
            to={to} 
            style={finalStyle}
            onClick={handleClick} 
            {...props}
          >
            {content}
          </Link>
        );
      }

      return (
        <button 
          type="button"
          style={finalStyle} 
          onClick={handleClick} 
          disabled={disabled}
          {...props}
        >
          {content}
        </button>
      );
  };

  const Badge = ({ children, variant = 'default', style = {} }) => {
    const variants = {
      default: { background: '#f3f4f6', color: '#374151' },
      success: { background: '#d1fae5', color: '#065f46' },
      warning: { background: '#fef3c7', color: '#92400e' },
      danger: { background: '#fee2e2', color: '#991b1b' },
      info: { background: '#dbeafe', color: '#1e40af' },
      light: { background: 'rgba(255, 255, 255, 0.9)', color: '#374151' }
    };

    return (
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        borderRadius: '6px',
        ...variants[variant],
        ...style
      }}>
        {children}
      </span>
    );
  };

  const Avatar = ({ name, size = 'md', status, style = {} }) => {
    const sizes = {
      sm: { width: '32px', height: '32px', fontSize: '12px' },
      md: { width: '40px', height: '40px', fontSize: '16px' },
      lg: { width: '56px', height: '56px', fontSize: '20px' }
    };

    const getInitials = (fullName) => {
      if (!fullName) return 'U';
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div style={{
        ...sizes[size],
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: 'white',
        position: 'relative',
        ...style
      }}>
        <span>{getInitials(name)}</span>
        {status && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: status === 'online' ? '#22c55e' : '#ef4444',
            border: '2px solid white'
          }} />
        )}
      </div>
    );
  };

  // Enhanced stat card click handler
  const StatCard = ({ stat, index }) => {
    const Icon = stat.icon;
    const [showQuickActions, setShowQuickActions] = useState(false);

    return (
      <Card 
        key={stat.name}
        style={{
          animationDelay: `${index * 0.1}s`,
          animation: 'fadeInUp 0.5s ease-out forwards',
          opacity: 0,
          transform: 'translateY(20px)',
          position: 'relative',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setShowQuickActions(true)}
        onMouseLeave={() => setShowQuickActions(false)}
        onClick={(e) => {  // ✅ FIX: Proper event handling
          e.preventDefault();
          e.stopPropagation();
          stat.onClick();
        }}
      >
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stat.onClick();
              }}
              icon={EyeIcon}
              iconPosition="right"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
              {stat.name}
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {stat.value}
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge 
                variant={stat.changeType === 'positive' ? 'success' : stat.changeType === 'negative' ? 'danger' : 'default'}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {stat.changeType === 'positive' ? (
                  <ArrowUpIcon style={{ width: '12px', height: '12px' }} />
                ) : stat.changeType === 'negative' ? (
                  <ArrowDownIcon style={{ width: '12px', height: '12px' }} />
                ) : null}
                <span>{stat.changeType !== 'neutral' ? `${Math.abs(stat.change).toFixed(1)}%` : '—'}</span>
              </Badge>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                {stat.description}
              </span>
            </div>
          </div>

          {/* Quick Actions Dropdown */}
          {showQuickActions && stat.quickActions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              zIndex: 10,
              padding: '8px',
              marginTop: '8px'
            }}>
              {stat.quickActions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    action.action();
                    setShowQuickActions(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';  // ✅ CHANGED target to currentTarget
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';  // ✅ CHANGED target to currentTarget
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Enhanced Recent Families Card with proper navigation
  const RecentFamiliesCard = () => (
    <Card>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 24px 0',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HomeIcon style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            Recent Families
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/families')}
          icon={ArrowTopRightOnSquareIcon}
          iconPosition="right"
        >
          View all ({dashboardData?.familyStats?.total_families || 0})
        </Button>
      </div>
      
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dashboardData?.recentFamilies?.length > 0 ? (
            dashboardData.recentFamilies.slice(0, 4).map((family, index) => (
              <Card 
                key={family.id}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/admin/families/${family.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HomeIcon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                        {family.family_name}
                      </p>
                      <Badge variant="success">
                        {family.member_count || 0} members
                      </Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Primary: {family.primary_contact_name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#9ca3af' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarDaysIcon style={{ width: '12px', height: '12px' }} />
                        <span>Added {new Date(family.created_at).toLocaleDateString()}</span>
                      </div>
                      {family.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPinIcon style={{ width: '12px', height: '12px' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {family.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/families/${family.id}`);
                    }}
                    icon={EyeIcon}
                  />
                </div>
              </Card>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              <HomeIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#d1d5db' }} />
              <p style={{ marginBottom: '8px' }}>No recent families added</p>
              <Button 
                variant="ghost"
                onClick={() => navigate('/admin/families?action=create')}
                icon={PlusIcon}
              >
                Add First Family
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  // Enhanced Quick Actions Grid Implementation
  const QuickActionsGrid = () => {
    const quickActionsConfig = [
      { 
        name: 'Add Member', 
        onClick: () => handleNavigateToMembers({ action: 'create' }), 
        icon: UsersIcon, 
        color: '#3b82f6',
        description: 'Register a new church member'
      },
      { 
        name: 'Add Family', 
        onClick: () => navigate('/admin/families?action=create'), 
        icon: HomeIcon, 
        color: '#10b981',
        description: 'Register a new family unit'
      },
      { 
        name: 'Create Group', 
        onClick: () => handleNavigateToGroups({ action: 'create' }), 
        icon: UserGroupIcon, 
        color: '#8b5cf6',
        description: 'Start a new ministry or group'
      },
      { 
        name: 'Create Event', 
        onClick: () => handleNavigateToEvents({ action: 'create' }), 
        icon: CalendarDaysIcon, 
        color: '#f59e0b',
        description: 'Schedule a church event or activity'
      },
      { 
        name: 'Record Pledge', 
        onClick: () => navigate('/admin/pledges?action=create'), 
        icon: CurrencyDollarIcon, 
        color: '#ef4444',
        description: 'Record a new financial pledge'
      },
      { 
        name: 'Generate Report', 
        onClick: () => navigate('/admin/reports'), 
        icon: DocumentChartBarIcon, 
        color: '#6366f1',
        description: 'View analytics and reports'
      },
      { 
        name: 'Public Register', 
        onClick: () => window.open('/register', '_blank'), 
        icon: UserIcon, 
        color: '#14b8a6',
        description: 'Open public registration page'
      },
      { 
        name: 'Settings', 
        onClick: () => navigate('/admin/settings'), 
        icon: Cog6ToothIcon, 
        color: '#64748b',
        description: 'Configure system settings'
      }
    ];

    return (
      <Card hover={false}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '24px 24px 0',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SparklesIcon style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            Quick Actions
          </h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {quickActionsConfig.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.name}
                  style={{ background: '#fafafa', border: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={(e) => {  // ✅ FIX: Proper event handling
                    e.preventDefault();
                    e.stopPropagation();
                    action.onClick();
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: `${action.color}20`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}>
                      <Icon style={{ width: '24px', height: '24px', color: action.color }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                      {action.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                      {action.description}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  // Loading state with sidebar colors
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: isDark 
          ? 'linear-gradient(180deg, #111827 0%, #030712 100%)'
          : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px'
        }}>
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              border: '2px solid rgba(59, 130, 246, 0.2)'
            }}>
              CC
            </div>
            
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  animation: `pulse 2s infinite ${i * 0.5}s`,
                  transform: `scale(${1 + i * 0.2})`
                }}
              />
            ))}
          </div>
          
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ChurchConnect
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              marginBottom: '16px'
            }}>
              Loading Dashboard
            </p>
            
            <div style={{
              width: '200px',
              height: '4px',
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '2px',
                animation: 'progress 2s infinite'
              }} />
            </div>
            
            <span style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              Fetching real-time church community data...
            </span>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData.stats) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #fef2f2, #fce7f3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Card style={{ textAlign: 'center', maxWidth: '500px', padding: '48px' }} hover={false}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px'
          }}>
            ⚠️
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', marginBottom: '16px' }}>
              Connection Error
            </h2>
            <p style={{ color: '#dc2626', marginBottom: '32px', fontSize: '16px' }}>
              {error}
            </p>
            <Button 
              variant="danger"
              onClick={() => fetchDashboardData()}
              icon={ArrowPathIcon}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Enhanced stats with real data and quick actions
  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.memberStats?.total_members?.toLocaleString() || '0',
      icon: UsersIcon,
      change: dashboardData?.memberStats?.growth_rate || 0,
      changeType: (dashboardData?.memberStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.memberStats?.new_members || 0} new this month`,
      color: 'from-blue-500 to-cyan-500',
      onClick: () => handleNavigateToMembers(),
      quickActions: [
        {
          label: 'Add Member',
          action: () => handleNavigateToMembers({ action: 'create' })
        },
        {
          label: 'View Active',
          action: () => handleNavigateToMembers({ status: 'active' })
        },
        {
          label: 'Search Members',
          action: () => handleNavigateToMembers({ focus: 'search' })
        }
      ]
    },
    {
      name: 'Total Families',
      value: dashboardData?.familyStats?.total_families?.toLocaleString() || '0',
      icon: HomeIcon,
      change: dashboardData?.familyStats?.growth_rate || 0,
      changeType: (dashboardData?.familyStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.familyStats?.new_families || 0} new families`,
      color: 'from-green-500 to-teal-500',
      onClick: () => navigate('/admin/families'),
      quickActions: [
        {
          label: 'Add Family',
          action: () => navigate('/admin/families?action=create')
        },
        {
          label: 'View Recent',
          action: () => navigate('/admin/families?sort=created&order=desc')
        }
      ]
    },
    {
      name: 'Active Groups',
      value: dashboardData?.groupStats?.active_groups?.toLocaleString() || '0',
      icon: UserGroupIcon,
      change: dashboardData?.groupStats?.growth_rate || 0,
      changeType: (dashboardData?.groupStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.groupStats?.total_groups || 0} total groups`,
      color: 'from-emerald-500 to-green-500',
      onClick: () => handleNavigateToGroups({ status: 'active' }),
      quickActions: [
        {
          label: 'Create Group',
          action: () => handleNavigateToGroups({ action: 'create' })
        },
        {
          label: 'Need Leaders',
          action: () => handleNavigateToGroups({ leader: 'no' })
        },
        {
          label: 'View All',
          action: () => handleNavigateToGroups()
        },
        {
          label: 'Analytics',
          action: () => handleNavigateToGroups({ view: 'analytics' })
        }
      ]
    },
    {
      name: 'Upcoming Events',
      value: dashboardData?.eventStats?.upcoming_events?.toLocaleString() || '0',
      icon: CalendarDaysIcon,
      change: 0,
      changeType: 'neutral',
      description: `${dashboardData?.eventStats?.this_month_events || 0} this month`,
      color: 'from-orange-500 to-red-500',
      onClick: () => handleNavigateToEvents({ upcoming: 'true', view: 'calendar' }),
      quickActions: [
        {
          label: 'Create Event',
          action: () => handleNavigateToEvents({ action: 'create' })
        },
        {
          label: 'Calendar View',
          action: () => handleNavigateToEvents({ view: 'calendar' })
        },
        {
          label: 'This Week',
          action: () => handleNavigateToEvents({ upcoming: 'this_week' })
        },
        {
          label: 'Event List',
          action: () => handleNavigateToEvents({ view: 'list' })
        }
      ]
    },
    {
      name: 'Total Pledges',
      value: formatCurrency(dashboardData?.pledgeStats?.total_pledged || 0),  // ✅ CORRECT FIELD
      icon: CurrencyDollarIcon,
      change: dashboardData?.pledgeStats?.growth_rate || 0,
      changeType: (dashboardData?.pledgeStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.pledgeStats?.active_pledges || 0} active pledges`,
      color: 'from-yellow-500 to-orange-500',
      onClick: () => navigate('/admin/pledges'),
      quickActions: [
        {
          label: 'Record Pledge',
          action: () => navigate('/admin/pledges?action=create')
        },
        {
          label: 'View Active',
          action: () => navigate('/admin/pledges?status=active')
        }
      ]
    },
    {
      name: 'System Health',
      value: dashboardData?.systemHealth?.status === 'healthy' ? 'Excellent' : 'Attention',
      icon: ChartBarIcon,
      change: 0,
      changeType: 'neutral',
      description: dashboardData?.systemHealth?.uptime || 'System monitoring',
      color: 'from-purple-500 to-indigo-500',
      onClick: () => navigate('/admin/reports'),
      quickActions: [
        {
          label: 'View Reports',
          action: () => navigate('/admin/reports')
        },
        {
          label: 'System Status',
          action: () => navigate('/admin/system')
        }
      ]
    }
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Enhanced Welcome Header with Sidebar Colors */}
        <Card style={{
          background: isDark 
            ? 'linear-gradient(180deg, #111827 0%, #030712 100%)'
            : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)'
        }} hover={false}>
          <div style={{ padding: '32px', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar 
                    name={user ? `${user.first_name} ${user.last_name}` : 'Admin'} 
                    size="lg" 
                    status="online" 
                  />
                  <div>
                    <h1 style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Welcome back, {user?.first_name || 'Admin'}!
                    </h1>
                    <p style={{
                      fontSize: '18px',
                      color: '#94a3b8'
                    }}>
                      Your church community dashboard - Real-time data
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  <Badge variant="light" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                    <span>{formatDate(currentTime)}</span>
                  </Badge>
                  <Badge variant="light" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClockIcon style={{ width: '16px', height: '16px' }} />
                    <span>{formatTime(currentTime)}</span>
                  </Badge>
                  <Badge 
                    variant={dashboardData?.systemHealth?.status === 'healthy' ? 'success' : 'warning'}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dashboardData?.systemHealth?.status === 'healthy' ? '#22c55e' : '#f59e0b',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span>
                      {dashboardData?.systemHealth?.status === 'healthy' ? 'All Systems Online' : 'System Status: Checking'}
                    </span>
                  </Badge>
                  {lastRefresh && (
                    <Badge variant="light" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
                      <span>Updated {getRelativeTime(lastRefresh)}</span>
                    </Badge>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <Button 
                  variant="secondary"
                  onClick={handleRefresh}  // ✅ This one already works
                  disabled={refreshing}
                  icon={ArrowPathIcon}
                  style={{ opacity: refreshing ? 0.7 : 1 }}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/admin/members?action=create')}  // ✅ CHANGE THIS
                  icon={PlusIcon}
                >
                  Add Member
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => navigate('/admin/reports')}  // ✅ CHANGE THIS
                  icon={DocumentChartBarIcon}
                >
                  Reports
                </Button>
              </div>
            </div>
            
            {/* Background decoration with sidebar colors */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 1
            }} />
          </div>
        </Card>

        {/* Enhanced Stats Grid with Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {stats.map((stat, index) => <StatCard key={stat.name} stat={stat} index={index} />)}
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr',
          gap: '24px'
        }}>
          
          {/* Enhanced Recent Families Card */}
          <RecentFamiliesCard />

          {/* Alerts/Notifications Card */}
          <Card>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 24px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BellIcon style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  System Alerts
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                to="/admin/notifications"
                icon={ArrowTopRightOnSquareIcon}
                iconPosition="right"
              >
                View all
              </Button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dashboardData?.alerts?.length > 0 ? (
                  dashboardData.alerts.slice(0, 5).map((alert) => (
                    <Card 
                      key={alert.id}
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #dbeafe',
                        borderLeft: '4px solid #3b82f6'
                      }}
                      hover={false}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: 'white',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                          <BellIcon style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                              {alert.title}
                            </p>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              {getRelativeTime(alert.created_at)}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    <CheckCircleIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#22c55e' }} />
                    <p style={{ marginBottom: '4px' }}>All systems running smoothly</p>
                    <p style={{ fontSize: '12px' }}>No alerts or notifications</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <QuickActionsGrid />

        {/* Footer */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          padding: '24px 0',
          borderTop: '1px solid #e5e7eb',
          gap: '16px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            © 2024 ChurchConnect DBMS. Serving your community with real-time data.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Link to="/admin/privacy" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link to="/admin/terms" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link to="/admin/support" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>
              Support
            </Link>
            <Button
              variant="ghost"
              size="sm"
              to="/admin/settings"
              icon={Cog6ToothIcon}
            >
              Settings
            </Button>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              v1.2.0 | {user?.role || 'Admin'} Access
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;