import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');

  const mergeGuestCart = async () => {
    try {
      const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (guestCart.length > 0) {
        console.log('Merging guest cart:', guestCart);
  
        try {
          const existingCartResponse = await api.get('/shopping_cart');
          const existingCart = existingCartResponse.data.cartItems || [];
  
          for (const guestItem of guestCart) {
            const existingItem = existingCart.find(item => item.product_id === guestItem.product_id);
            
            if (existingItem) {
              await api.put('/cart-items/update', {
                product_id: guestItem.product_id,
                quantity: existingItem.quantity + guestItem.quantity
              });
            } else {
              await api.post('/cart-items/add', {
                product_id: guestItem.product_id,
                quantity: guestItem.quantity,
              });
            }
          }
        } catch (error) {
          if (error.response?.status === 404) {
            try {
              await api.post('/shopping_cart/create');
              for (const item of guestCart) {
                await api.post('/cart-items/add', {
                  product_id: item.product_id,
                  quantity: item.quantity,
                });
              }
            } catch (createError) {
              console.error('Error creating cart:', createError);
            }
          }
        }
  
        localStorage.setItem('cart', '[]');
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

      // If user is not active, prevent login
      if (!data.active) {
        throw new Error('This account has been deactivated. Please contact support.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);

      setToken(data.token);
      setRole(data.role);
      setUserId(data.userId);
      setIsAuthenticated(true);

      await mergeGuestCart();

      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Propagate error to login component
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
          active: true, // Default to active for new registrations
          role_id: userData.role_id || 1,
          line_1: userData.line_1,
          line_2: userData.line_2 || null,
          city: userData.city,
          state: userData.state,
          zip: userData.zip
        }),
      });

      if (response.ok) {
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
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');

    if (storedToken && !isAuthenticated) {
      setIsAuthenticated(true);
      setToken(storedToken);
      setRole(localStorage.getItem('role') || '');
      setUserId(storedUserId || '');
    }
  };

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