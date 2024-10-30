// src/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user_id, setUserId] = useState(() => localStorage.getItem('user_id') || '');

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const data = response.data;
      
      // Store token, role, and user_id in localStorage and state
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', data.user_id);
      
      setToken(data.token);
      setRole(data.role);
      setUserId(data.user_id);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          email: userData.email,
          phone_number: userData.phone_number,
          password: userData.password,
          role_id: userData.role_id || 1,  // Default role_id for new users is customer
          line_1: userData.line_1,
          line_2: userData.line_2 || null,
          city: userData.city,
          state: userData.state,
          zip: userData.zip
        }),
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        console.error('Registration error:', errorData.message || 'Unknown error');
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    
    // Clear state
    setToken(null);
    setRole(null);
    setUserId(null);
    setIsAuthenticated(false);
    
    // Optional: Redirect to login page
    window.location.href = '/signin';
  };

  const checkAuth = () => {
    console.log('Checking auth - before:', {
      isAuthenticated,
      role,
      token,
      user_id,
      localStorage: {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        user_id: localStorage.getItem('user_id')
      }
    });
  
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isAuthenticated) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setRole(localStorage.getItem('role') || '');
      setUserId(localStorage.getItem('user_id') || '');
    }
  
    console.log('Checking auth - after:', {
      isAuthenticated,
      role,
      token,
      user_id,
      localStorage: {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        user_id: localStorage.getItem('user_id')
      }
    });
  };

  // Check auth status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      role, 
      token,
      user_id // Provide user_id here
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
