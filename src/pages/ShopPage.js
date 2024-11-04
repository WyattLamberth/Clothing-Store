import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
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

  const addItemToCart = async (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      let updatedCart;

      if (existingItem) {
        updatedCart = prevCart.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });

    // Show overlay for the added product
    setOverlayProduct(product);
    setShowOverlay(true);

    try {
      await api.post('/cart-items/add', {
        product_id: product.product_id,
        quantity: 1,
      });
      console.log('Item added to cart in database');
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Recommended For You</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={addItemToCart}
            isInCart={!!cartItems.find(item => item.product_id === product.product_id)}
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




