import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const WomenPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/categories/sex/F/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const addItemToCart = (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      let updatedCart;

      if (existingItem) {
        // Increase quantity if the item is already in the cart
        updatedCart = prevCart.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item to cart
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }

      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Searching For Women</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={addItemToCart}
            isInCart={!!cartItems.find(item => item.product_id === product.product_id)} // Pass if product is in cart
          />
        ))}
      </div>
    </div>
  );
};

export default WomenPage;