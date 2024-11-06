import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart, isInCart }) => {
  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart(product);
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
        <button
          onClick={handleAddToCart}
          className={`mt-2 w-full px-4 py-2 rounded transition-colors duration-200
            ${isInCart 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
        >
          {isInCart ? 'Add More' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;