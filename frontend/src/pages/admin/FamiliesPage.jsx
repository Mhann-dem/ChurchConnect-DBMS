// frontend/src/pages/admin/FamiliesPage.jsx - CORRECTED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FamiliesList, FamilyForm, FamilyDetail } from '../../components/admin/Families';

const FamiliesPage = () => {
  return (
    <div className="families-page">
      <Routes>
        {/* Default route - redirect to list */}
        <Route index element={<FamiliesList />} />
        
        {/* Create new family */}
        <Route path="new" element={<FamilyForm />} />
        
        {/* View family details */}
        <Route path=":id" element={<FamilyDetail />} />
        
        {/* Edit family */}
        <Route path=":id/edit" element={<FamilyForm />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
};

export default FamiliesPage;