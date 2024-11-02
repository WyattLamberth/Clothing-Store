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
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);

      setToken(data.token);
      setRole(data.role);
      setUserId(data.userId);
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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    setToken(null);
    setRole(null);
    setUserId(null);
    setIsAuthenticated(false);

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
      setUserId(storedUserId);
      setRole(storedRole || '');

      console.log("Token and userId set from local storage on load:", {
        token: storedToken,
        userId: storedUserId
      });
    }
  };

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
      userId 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
