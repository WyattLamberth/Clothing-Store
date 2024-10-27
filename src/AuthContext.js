// src/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    !!localStorage.getItem('token')
  );
  const [role, setRole] = useState(() => 
    localStorage.getItem('role') || ''
  );
  const [token, setToken] = useState(() => 
    localStorage.getItem('token') || ''
  );

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Set token and role in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        setToken(data.token);
        setRole(data.role);
        setIsAuthenticated(true);
        return true;
      } else {
        // Handle response that is not JSON
        const text = await response.text();
        console.error("Error response:", text);
        return false;
      }
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
          role_id: 1,  // Default role_id for new users is customer
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
    
    // Clear state
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
    
    // Optional: Redirect to login page
    window.location.href = '/signin';
  };

  // Optional: Function to check if user is authenticated
  const checkAuth = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isAuthenticated) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setRole(localStorage.getItem('role') || '');
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
      register, 
      logout, 
      role, 
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
