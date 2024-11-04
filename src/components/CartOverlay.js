import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CartOverlay = ({ product = {}, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  console.log('Product data in CartOverlay:', product); // Log product data

  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-80">
        <h2 className="text-xl font-semibold mb-4">Added to Your Cart</h2>
        
        {/* Product Card within CartOverlay */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="w-full h-64 block">
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
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold hover:underline">
              {product.product_name || 'Unknown Product'}
            </h3>
            <p className="text-gray-600">${price}</p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            onClick={onClose}
          >
            Continue Shopping
          </button>
          <button
            className="mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100"
            onClick={() => {
              onClose();
              navigate('/cart');
            }}
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartOverlay;





