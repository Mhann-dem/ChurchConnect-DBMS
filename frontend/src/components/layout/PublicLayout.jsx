// src/components/layout/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import styles from './Layout.module.css';

const PublicLayout = () => {
  return (
    <div className={styles.publicLayout}>
      <Header isAdmin={false} />
      <main className={styles.publicMain}>
        <Outlet />
      </main>
      <Footer isAdmin={false} />
    </div>
  );
};

export default PublicLayout;
