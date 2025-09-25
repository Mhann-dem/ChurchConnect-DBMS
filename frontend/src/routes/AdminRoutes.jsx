// frontend/src/routes/AdminRoutes.jsx - FIXED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../hooks/useAuth';

// Import pages
import DashboardPage from '../pages/admin/DashboardPage';
import EventsPage from '../pages/admin/EventsPage';
import EventDetailPage from '../pages/admin/EventsDetailPage';
import MembersPage from '../pages/admin/MembersPage';
import GroupsPage from '../pages/admin/GroupsPage';
import PledgesPage from '../pages/admin/PledgesPage';
import SettingsPage from '../pages/admin/SettingsPage';

const AdminRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* FIXED: Events routing */}
        <Route path="events">
          <Route index element={<EventsPage />} />
          <Route path=":id" element={<EventDetailPage />} />
          <Route path="edit/:id" element={<EventsPage />} />
          <Route path="create" element={<EventsPage />} />
        </Route>
        
        {/* Members */}
        <Route path="members">
          <Route index element={<MembersPage />} />
          <Route path=":id" element={<MembersPage />} />
        </Route>
        
        {/* Groups */}
        <Route path="groups">
          <Route index element={<GroupsPage />} />
          <Route path=":id" element={<GroupsPage />} />
        </Route>
        
        {/* Pledges */}
        <Route path="pledges">
          <Route index element={<PledgesPage />} />
          <Route path=":id" element={<PledgesPage />} />
        </Route>
        
        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;