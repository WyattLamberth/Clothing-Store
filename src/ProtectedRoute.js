// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  const adminRoleId = 3; // Update this ID to match your admin role ID if different
  if (requiredRole === "admin" && role !== adminRoleId) {
    return <Navigate to="/" />;
  }

  return element; // Render `element` directly as it's already JSX
};

export default ProtectedRoute;
