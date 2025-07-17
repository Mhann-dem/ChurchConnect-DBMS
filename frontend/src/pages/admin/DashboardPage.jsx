// ============================================================================
// PAGES/ADMIN/DASHBOARDPAGE.JSX
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout';
import { Dashboard } from '../../components/admin/Dashboard';
import { LoadingSpinner, ErrorBoundary } from '../../components/shared';
import {  useAuth } from '../../hooks';
import { dashboardService } from '../../services';
import styles from './AdminPages.module.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardStats();
        setDashboardData(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ErrorBoundary>
        <div className={styles.dashboardPage}>
          <div className={styles.pageHeader}>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
          
          <Dashboard data={dashboardData} />
        </div>
      </ErrorBoundary>
    </AdminLayout>
  );
};

export default DashboardPage;
