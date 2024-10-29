import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {product.image_path ? ( // Conditional rendering based on image_path
        <img
          src={require(`../images/${product.image_path}`)}
          alt={product.product_name}
          onError={(e) => { e.target.src = require('../images/summer_dress.jpg'); }} // Fallback image
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center"> {/* Placeholder */}
          <span className="text-gray-600">No Image Available</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.product_name}</h3>
        <p className="text-gray-600">${price}</p>
        <button
          onClick={() => onAddToCart(product)} // Call onAddToCart with the product details
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
