// frontend/src/pages/admin/FamiliesPage.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FamiliesList from '../../components/admin/Families/FamiliesList';
import FamilyForm from '../../components/admin/Families/FamilyForm';
import FamilyDetail from '../../components/admin/Families/FamilyDetail';

const FamiliesPage = () => {
  return (
    <div className="families-page">
      <Routes>
        <Route index element={<FamiliesList />} />
        <Route path="new" element={<FamilyForm />} />
        <Route path=":id" element={<FamilyDetail />} />
        <Route path=":id/edit" element={<FamilyForm />} />
      </Routes>
    </div>
  );
};

export default FamiliesPage;