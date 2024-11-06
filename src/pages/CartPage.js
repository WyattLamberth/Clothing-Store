import React, { useState, useEffect } from 'react';
import ShoppingCart from '../components/ShoppingCart';
import api from '../utils/api';
import { useAuth } from '../AuthContext';

const CartPage = () => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (isAuthenticated) {
          // Fetch cart from API if user is logged in
          const response = await api.get('/shopping_cart');
          setCartItems(response.data.cartItems);
        } else {
          // Get cart from localStorage for guest users
          const savedCart = localStorage.getItem('cart');
          setCartItems(savedCart ? JSON.parse(savedCart) : []);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // If API fails, fallback to localStorage
        const savedCart = localStorage.getItem('cart');
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

  const handleRemoveItem = async (productId) => {
    try {
      // Update local state first for immediate feedback
      const updatedItems = cartItems.filter(item => item.product_id !== productId);
      setCartItems(updatedItems);
      
      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(updatedItems));

      // If authenticated, also update the database
      if (isAuthenticated) {
        await api.delete('/cart-items', {
          data: { product_id: productId }
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item from cart");
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      // Don't allow quantity less than 1
      if (newQuantity < 1) return;

      // Update local state first
      const updatedItems = cartItems.map(item =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      
      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(updatedItems));

      // If authenticated, also update the database
      if (isAuthenticated) {
        await api.put('/cart-items/update', {
          product_id: productId,
          quantity: newQuantity
        });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError("Failed to update item quantity");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <ShoppingCart
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        isAuthenticated={isAuthenticated}
      />

      {!isAuthenticated && cartItems.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Sign in to save your cart and access it from any device!
          </p>
        </div>
      )}
    </div>
  );
};

export default CartPage;