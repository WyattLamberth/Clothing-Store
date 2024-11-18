import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';


const ProductCard = ({ product, onAddToCart, isInCart }) => {
  const [stock, setStock] = useState(null); // State to track stock
  const [isLoading, setIsLoading] = useState(true); // State for loading stock
  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  // Function to fetch stock information
  const fetchStock = async () => {
    try {
      const response = await api.get(`/products/${product.product_id}`);
      setStock(response.data.stock_quantity);
    } catch (error) {
      console.error(`Failed to fetch stock for product_id ${product.product_id}:`, error);
      setStock(null); // Fallback in case of error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock(); 
  }, [product.product_id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (stock > 0) {
      onAddToCart(product);
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
        <Link
          to={`/product/${product.product_id}`}
          className="text-lg font-semibold hover:underline text-gray-900"
        >
          {product.product_name}
        </Link>
        <p className="text-gray-600">${price}</p>
        <p className={`text-sm mt-2 ${stock === 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {isLoading ? 'Checking stock...' : stock === 0 ? 'Out of Stock' : `In Stock: ${stock}`}
        </p>
        <button
          onClick={handleAddToCart}
          disabled={stock === 0 || isLoading}
          className={`mt-2 w-full px-4 py-2 rounded transition-colors duration-200 ${
            stock === 0 || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : isInCart
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {stock === 0 || isLoading ? 'Out of Stock' : isInCart ? 'Add More' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
