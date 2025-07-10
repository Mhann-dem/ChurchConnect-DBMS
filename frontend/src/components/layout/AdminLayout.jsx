// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import styles from './Layout.module.css';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className={styles.adminLayout}>
      <Header isAdmin={true} />
      <div className={styles.adminContent}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <Breadcrumbs />
          </div>
          <div className={styles.contentBody}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
