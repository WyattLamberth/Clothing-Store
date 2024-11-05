import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Get cartItems without the setter since we only need it for checking isInCart
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

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

  const handleProductAdded = (product) => {
    console.log('Product added to cart:', product);
    setSelectedProduct(product);
    setShowOverlay(true);
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
            onProductAdded={handleProductAdded}
            isInCart={!!cartItems.find(item => item.product_id === product.product_id)}
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