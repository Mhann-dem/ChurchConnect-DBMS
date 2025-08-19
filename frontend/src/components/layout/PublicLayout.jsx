import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import useAuth from '../../hooks/useAuth';

const PublicLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      {/* Enhanced Public Header */}
      <Header 
        isPublic={true} 
        user={user} 
        isAdmin={false}
      />

      {/* Main Content with better spacing and design */}
      <main className="flex-grow">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* Enhanced Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;