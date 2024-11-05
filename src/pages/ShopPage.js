import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayProduct, setOverlayProduct] = useState(null);

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

  const handleAddToCartOverlay = (product) => {
    setOverlayProduct(product);
    setShowOverlay(true);
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Recommended For You</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
          />
        ))}
      </div>

      {showOverlay && overlayProduct && (
        <CartOverlay product={overlayProduct} onClose={() => setShowOverlay(false)} />
      )}
    </div>
  );
};

export default ShopPage;
