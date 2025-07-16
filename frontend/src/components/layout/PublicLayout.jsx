import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Navigation } from './Navigation';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header isPublic={true} />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;