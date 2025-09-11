// frontend/src/pages/admin/EventsPage.jsx
import React, { useState } from 'react';
import { Calendar, List, BarChart3 } from 'lucide-react';
import EventsList from '../../components/admin/Events/EventsList';
import EventCalendar from '../../components/admin/Events/EventCalendar';
import styles from './AdminPages.module.css';

const EventsPage = () => {
  const [activeTab, setActiveTab] = useState('list');

  const tabs = [
    {
      id: 'list',
      label: 'Events List',
      icon: List,
      component: EventsList
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      component: EventCalendar
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <h1>Events Management</h1>
          <p>Manage church events, services, and activities</p>
        </div>
        
        <div className={styles.tabNavigation}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.pageContent}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default EventsPage;