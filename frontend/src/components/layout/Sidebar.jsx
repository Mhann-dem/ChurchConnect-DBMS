// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Layout.module.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊',
      roles: ['super_admin', 'admin', 'readonly']
    },
    {
      path: '/admin/members',
      label: 'Members',
      icon: '👥',
      roles: ['super_admin', 'admin', 'readonly']
    },
    {
      path: '/admin/groups',
      label: 'Groups',
      icon: '🏛️',
      roles: ['super_admin', 'admin']
    },
    {
      path: '/admin/pledges',
      label: 'Pledges',
      icon: '💰',
      roles: ['super_admin', 'admin']
    },
    {
      path: '/admin/reports',
      label: 'Reports',
      icon: '📈',
      roles: ['super_admin', 'admin', 'readonly']
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: '⚙️',
      roles: ['super_admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <button 
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className={styles.sidebarNav}>
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.navItem} ${
                  location.pathname === item.path ? styles.active : ''
                }`}
                title={collapsed ? item.label : ''}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <Link to="/help" className={styles.helpLink}>
          <span className={styles.navIcon}>❓</span>
          {!collapsed && <span className={styles.navLabel}>Help</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

