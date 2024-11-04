import React, { useState, useEffect } from 'react';
import ShoppingCart from '../components/ShoppingCart';
import api from '../utils/api';
import { useAuth } from '../AuthContext';

const CartPage = () => {
  const { userId } = useAuth(); // Fetch userId from AuthContext
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("UserId in CartPage useEffect:", userId);

    if (!userId) {
      console.error("User not logged in, userId:", userId);
      setError('User not logged in');
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await api.get('/shopping_cart');
        console.log("Fetched cart items:", response.data.cartItems); // Log fetched items
        setCartItems(response.data.cartItems); // Update cartItems with fetched data
      } catch (error) {
        console.error('Error fetching cart:', error);
        setError('Error fetching cart');

        // If cart does not exist (404 error), create a new cart
        if (error.response && error.response.status === 404) {
          console.log("Cart not found, attempting to create a new cart...");
          try {
            const createCartResponse = await api.post('/shopping_cart/create');
            console.log('Cart created:', createCartResponse.data);
            fetchCart(); // Fetch the cart again after creation
          } catch (createError) {
            console.error('Error creating cart:', createError);
            setError('Error creating cart');
          }
        }
      }
    };

    fetchCart();
  }, [userId]);

  const handleRemoveItem = async (productId) => {
    try {
      await api.delete('/cart-items', {
        data: { product_id: productId }
      });
      setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item from cart");
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await api.put('/cart-items/update', {
        product_id: productId,
        quantity: newQuantity
      });
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product_id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError("Failed to update item quantity");
    }
  };

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <ShoppingCart
          cartItems={cartItems}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity} // Pass the function here
        />
      )}
    </div>
  );
};

export default CartPage;
