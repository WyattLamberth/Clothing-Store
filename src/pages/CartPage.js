import React, { useState, useEffect } from 'react';
import ShoppingCart from '../components/ShoppingCart';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const handleRemoveItem = (productId) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  return (
    <ShoppingCart cartItems={cartItems} onRemoveItem={handleRemoveItem} />
  );
};

export default CartPage;
