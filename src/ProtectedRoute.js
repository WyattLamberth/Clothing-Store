import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // First check authentication
  if (!isAuthenticated) {
    // Save the attempted location for potential redirect after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Role-based access control
  const checkRole = () => {
    // Convert role to number for comparison since it might be stored as string
    const userRole = Number(role);
    
    switch (requiredRole) {
      case 'admin':
        return userRole === 3;
      case 'employee':
        // Employee routes accessible by both employees and admins
        return userRole === 2 || userRole === 3;
      case 'customer':
        // Customer routes accessible by all authenticated users
        return userRole >= 1;
      default:
        return true;
    }
  };

  // Check if user has required role
  if (!checkRole()) {
    console.log('Access denied. Required role:', requiredRole, 'User role:', role);
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;