import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';
import { useAuth } from '../AuthContext';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const { isAuthenticated, userId } = useAuth();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch or initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        // Fetch user's cart from database
        try {
          const response = await api.get('/shopping_cart');
          if (response.data.cartItems) {
            setCart(response.data.cartItems);
            // Also update localStorage to keep them in sync
            localStorage.setItem('cart', JSON.stringify(response.data.cartItems));
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // If no cart exists, create one
            try {
              await api.post('/shopping_cart/create');
            } catch (createError) {
              console.error('Error creating cart:', createError);
            }
          }
        }
      } else {
        // For guest users, get cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      }
    };

    initializeCart();
  }, [isAuthenticated]);

  const addToCart = async (product) => {
    try {
      let updatedCart = [...cart];
      const existingItem = updatedCart.find(item => item.product_id === product.product_id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }

      // Update local state
      setCart(updatedCart);
      
      // Always update localStorage as a backup
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated) {
        // Update database if user is logged in
        await api.post('/cart-items/add', {
          product_id: product.product_id,
          quantity: 1,
        });
      }

      // Show overlay
      setSelectedProduct(product);
      setShowOverlay(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedProduct(null);
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Shop All Products</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={() => addToCart(product)}
            isInCart={!!cart.find(item => item.product_id === product.product_id)}
          />
        ))}
      </div>

      {showOverlay && selectedProduct && (
        <CartOverlay
          product={selectedProduct}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
};

export default ShopPage;