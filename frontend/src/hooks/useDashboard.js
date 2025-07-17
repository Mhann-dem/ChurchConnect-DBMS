import { useState, useEffect } from 'react';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    // Member statistics
    totalMembers: 0,
    activeMember: 0,
    newMembersThisMonth: 0,
    newMembersThisWeek: 0,
    
    // Group/Ministry statistics
    totalGroups: 0,
    activeGroups: 0,
    
    // Pledge statistics
    totalPledges: 0,
    totalPledgeAmount: 0,
    monthlyPledgeGoal: 0,
    pledgesByFrequency: {},
    
    // Demographics
    ageDistribution: [],
    genderDistribution: [],
    preferredContactMethods: [],
    
    // Recent activities
    recentMembers: [],
    recentPledges: [],
    upcomingBirthdays: [],
    
    // Growth metrics
    membershipGrowth: [],
    pledgeGrowth: [],
    
    // Family statistics
    totalFamilies: 0,
    averageFamilySize: 0,
    
    loading: true,
    error: null
  });

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // ChurchConnect API endpoints based on project requirements
      const [
        membersStatsRes, 
        groupsStatsRes, 
        pledgesStatsRes, 
        demographicsRes,
        recentActivitiesRes,
        growthStatsRes,
        familiesStatsRes
      ] = await Promise.all([
        fetch('/api/members/stats/'),
        fetch('/api/groups/stats/'),
        fetch('/api/pledges/stats/'),
        fetch('/api/members/demographics/'),
        fetch('/api/reports/recent-activities/'),
        fetch('/api/reports/growth-stats/'),
        fetch('/api/families/stats/')
      ]);

      const membersStats = await membersStatsRes.json();
      const groupsStats = await groupsStatsRes.json();
      const pledgesStats = await pledgesStatsRes.json();
      const demographics = await demographicsRes.json();
      const recentActivities = await recentActivitiesRes.json();
      const growthStats = await growthStatsRes.json();
      const familiesStats = await familiesStatsRes.json();

      setDashboardData({
        // Member statistics
        totalMembers: membersStats.total || 0,
        activeMember: membersStats.active || 0,
        newMembersThisMonth: membersStats.new_this_month || 0,
        newMembersThisWeek: membersStats.new_this_week || 0,
        
        // Group/Ministry statistics
        totalGroups: groupsStats.total || 0,
        activeGroups: groupsStats.active || 0,
        
        // Pledge statistics
        totalPledges: pledgesStats.total_count || 0,
        totalPledgeAmount: pledgesStats.total_amount || 0,
        monthlyPledgeGoal: pledgesStats.monthly_goal || 0,
        pledgesByFrequency: pledgesStats.by_frequency || {},
        
        // Demographics
        ageDistribution: demographics.age_distribution || [],
        genderDistribution: demographics.gender_distribution || [],
        preferredContactMethods: demographics.contact_methods || [],
        
        // Recent activities
        recentMembers: recentActivities.new_members || [],
        recentPledges: recentActivities.new_pledges || [],
        upcomingBirthdays: recentActivities.upcoming_birthdays || [],
        
        // Growth metrics
        membershipGrowth: growthStats.membership_growth || [],
        pledgeGrowth: growthStats.pledge_growth || [],
        
        // Family statistics
        totalFamilies: familiesStats.total || 0,
        averageFamilySize: familiesStats.average_size || 0,
        
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  // Utility functions for dashboard data
  const getMemberGrowthRate = () => {
    if (!dashboardData.membershipGrowth || dashboardData.membershipGrowth.length < 2) {
      return 0;
    }
    
    const current = dashboardData.membershipGrowth[dashboardData.membershipGrowth.length - 1];
    const previous = dashboardData.membershipGrowth[dashboardData.membershipGrowth.length - 2];
    
    return ((current.count - previous.count) / previous.count * 100).toFixed(1);
  };

  const getPledgeCompletionRate = () => {
    if (!dashboardData.totalPledgeAmount || !dashboardData.monthlyPledgeGoal) {
      return 0;
    }
    
    return ((dashboardData.totalPledgeAmount / dashboardData.monthlyPledgeGoal) * 100).toFixed(1);
  };

  const getTopAgeGroup = () => {
    if (!dashboardData.ageDistribution || dashboardData.ageDistribution.length === 0) {
      return 'N/A';
    }
    
    return dashboardData.ageDistribution.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    ).age_range;
  };

  const getActiveGroupsPercentage = () => {
    if (!dashboardData.totalGroups) return 0;
    return ((dashboardData.activeGroups / dashboardData.totalGroups) * 100).toFixed(1);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    ...dashboardData,
    refreshData,
    // Computed values
    getMemberGrowthRate,
    getPledgeCompletionRate,
    getTopAgeGroup,
    getActiveGroupsPercentage
  };
};