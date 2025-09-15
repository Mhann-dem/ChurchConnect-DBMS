import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import useAuth from '../../hooks/useAuth';
import logoLight from '../../assets/images/logo-dark.png';

const PublicLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
      {/* Enhanced Public Header with proper logo */}
      <Header 
        isPublic={true} 
        user={user} 
        isAdmin={false}
        logoSrc={logoLight}
      />

      {/* Main Content with better spacing and design */}
      <main className="flex-grow relative">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px] opacity-30 pointer-events-none" />
        
        <div className="relative min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* Enhanced Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;