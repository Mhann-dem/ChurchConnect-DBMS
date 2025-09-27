// frontend/src/pages/admin/FamiliesPage.jsx - ROUTER NAVIGATION FIX
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FamiliesList, FamilyForm, FamilyDetail } from '../../components/admin/Families';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const FamiliesPageContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Debug navigation issues
  useEffect(() => {
    console.log('FamiliesPage: Current location:', location.pathname);
    console.log('FamiliesPage: Location state:', location.state);
  }, [location]);

  // Handle navigation errors
  const handleNavigationError = (error, errorInfo) => {
    console.error('FamiliesPage Navigation Error:', error, errorInfo);
    
    // Attempt to recover by navigating to families list
    try {
      navigate('/admin/families', { replace: true });
    } catch (navError) {
      console.error('Failed to recover from navigation error:', navError);
      // Last resort - force reload
      window.location.href = '/admin/families';
    }
  };

  return (
    <div className="families-page" style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <ErrorBoundary 
        fallbackMessage="There was an error with family page navigation. Redirecting..."
        onError={handleNavigationError}
      >
        <Routes>
          {/* Default route - families list */}
          <Route 
            index 
            element={
              <ErrorBoundary fallbackMessage="Error loading families list">
                <FamiliesList />
              </ErrorBoundary>
            } 
          />
          
          {/* Create new family - FIXED ROUTE */}
          <Route 
            path="new" 
            element={
              <ErrorBoundary fallbackMessage="Error loading family creation form">
                <React.Suspense fallback={<LoadingSpinner message="Loading family form..." />}>
                  <FamilyForm />
                </React.Suspense>
              </ErrorBoundary>
            } 
          />
          
          {/* View family details */}
          <Route 
            path=":id" 
            element={
              <ErrorBoundary fallbackMessage="Error loading family details">
                <React.Suspense fallback={<LoadingSpinner message="Loading family details..." />}>
                  <FamilyDetail />
                </React.Suspense>
              </ErrorBoundary>
            } 
          />
          
          {/* Edit family */}
          <Route 
            path=":id/edit" 
            element={
              <ErrorBoundary fallbackMessage="Error loading family edit form">
                <React.Suspense fallback={<LoadingSpinner message="Loading family editor..." />}>
                  <FamilyForm />
                </React.Suspense>
              </ErrorBoundary>
            } 
          />
          
          {/* Catch-all for invalid routes */}
          <Route 
            path="*" 
            element={
              <Navigate 
                to="/admin/families" 
                replace 
                state={{ from: location.pathname }}
              />
            } 
          />
        </Routes>
      </ErrorBoundary>
    </div>
  );
};

const FamiliesPage = () => {
  return (
    <ErrorBoundary 
      fallbackMessage="Critical error in Families module. Please refresh the page."
    >
      <FamiliesPageContent />
    </ErrorBoundary>
  );
};

export default FamiliesPage;