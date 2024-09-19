// src/pages/CartPage.js
import React, { useState } from 'react';
import ShoppingCart from '../components/ShoppingCart';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);

  const handleRemoveItem = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  return (
    <ShoppingCart cartItems={cartItems} onRemoveItem={handleRemoveItem} />
  );
};

export default CartPage;