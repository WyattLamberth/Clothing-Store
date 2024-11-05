import React from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ProductCard = ({ product }) => {
  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  const addItemToCart = async () => {
    // Update cart items in localStorage
    const savedCart = localStorage.getItem('cart');
    const cartItems = savedCart ? JSON.parse(savedCart) : [];
    const existingItem = cartItems.find(item => item.product_id === product.product_id);

    let updatedCart;
    if (existingItem) {
      updatedCart = cartItems.map(item =>
        item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }

    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Make API request to add item to cart in the database
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link to={`/product/${product.product_id}`} className="w-full h-64 block"> 
        {product.image_path ? (
          <img
            src={require(`../images/${product.image_path}`)}
            alt={product.product_name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600">No Image Available</span>
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.product_id}`} style={{ color: 'black' }} className="text-lg font-semibold hover:underline">
          {product.product_name}
        </Link>
        <p className="text-gray-600">${price}</p>
        <button
          onClick={addItemToCart}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
