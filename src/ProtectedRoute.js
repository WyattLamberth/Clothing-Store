// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ element: Component, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" />; // Redirect to home if role doesn't match
  }

  return Component;
};

export default ProtectedRoute;