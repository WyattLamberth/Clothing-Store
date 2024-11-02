import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const data = response.data;
      
      // Store token, role, and userId in localStorage and state
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId); // Save userId to localStorage

      setToken(data.token);
      setRole(data.role);
      setUserId(data.userId); // Ensure userId is set in context
      setIsAuthenticated(true);

      console.log("Token set on login:", data.token);
      console.log("User ID set on login:", data.userId);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    // Clear state
    setToken(null);
    setRole(null);
    setUserId(null);
    setIsAuthenticated(false);

    // Optional: Redirect to login page
    window.location.href = '/signin';
  };

  const checkAuth = () => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');

    console.log('Checking auth - localStorage values:', {
      token: storedToken,
      userId: storedUserId,
      role: storedRole
    });

    if (storedToken && storedUserId) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setUserId(storedUserId); // Ensure userId is loaded
      setRole(storedRole || '');

      console.log("Token and userId set from local storage on load:", {
        token: storedToken,
        userId: storedUserId
      });
    }
  };

  // Check auth status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      role, 
      token,
      userId // Provide userId here
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
