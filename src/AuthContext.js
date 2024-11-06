import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');

  // Add the new mergeGuestCart helper function
  const mergeGuestCart = async () => {
    try {
      const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');

      if (guestCart.length > 0) {
        console.log('Merging guest cart:', guestCart);

        try {
          await api.post('/shopping_cart/create');
        } catch (error) {
          console.log('Cart already exists or creation failed:', error);
        }

        for (const item of guestCart) {
          try {
            await api.post('/cart-items/add', {
              product_id: item.product_id,
              quantity: item.quantity,
            });
          } catch (error) {
            console.error('Error adding item to database cart:', error);
          }
        }

        console.log('Guest cart merged successfully');
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
    }
  };

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

      // Add cart merging after successful login
      await mergeGuestCart();

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
          role_id: userData.role_id || 1,
          line_1: userData.line_1,
          line_2: userData.line_2 || null,
          city: userData.city,
          state: userData.state,
          zip: userData.zip
        }),
      });

      if (response.ok) {
        // Add automatic login and cart merging after successful registration
        const loginSuccess = await login(userData.email, userData.password);
        if (loginSuccess) {
          return true;
        }
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
    console.log('Checking auth - before:', {
      isAuthenticated,
      role,
      token,
      userId,
      localStorage: {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId')
      }
    });

    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');

    if (storedToken && !isAuthenticated) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setRole(localStorage.getItem('role') || '');
      setUserId(storedUserId || '');
    }

    console.log('Checking auth - after:', {
      isAuthenticated,
      role,
      token,
      userId,
      localStorage: {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId')
      }
    });
  };

  // Check auth status when component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      userId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);