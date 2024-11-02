import React, { useState, useEffect } from 'react';
import ShoppingCart from '../components/ShoppingCart';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const CartPage = () => {
  const { token, userId } = useAuth();  // Ensure token and userId are available
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("userId in CartPage useEffect:", userId);
    if (!userId) {
      console.error("User not logged in, userId:", userId);
      setError('User not logged in');
      return;
    }

    const fetchCart = async () => {
      console.log("Fetching cart with token:", token, "and userId:", userId);
      try {
        const response = await axios.get(`http://localhost:3000/api/customer/shopping_cart`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setCartItems(response.data.cartItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setError('Error fetching cart');
      }
    };

    fetchCart();
  }, [token, userId]);

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`http://localhost:3000/api/customer/cart-items`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { product_id: productId }
      });
      setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item from cart");
    }
  };

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <ShoppingCart cartItems={cartItems} onRemoveItem={handleRemoveItem} />
      )}
    </div>
  );
};

export default CartPage;
