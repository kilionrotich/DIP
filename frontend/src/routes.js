// frontend/src/routes.js
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import InvestorDashboard from './pages/InvestorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DealDetails from './pages/DealDetails';




function ProtectedRoute({ children, role }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) return <div style={{ color: 'white' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role) {
    const userRole = user?.role || user?.type;
    if (userRole !== role) return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="investor">
            <InvestorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute role="super_admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/deal/:id"
        element={
          <ProtectedRoute>
            <DealDetails />
          </ProtectedRoute>
        }
      />

      {/* Default → force login page */}
      <Route path="/" element={<Login />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}