import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CheckCircle, X } from 'lucide-react';

const CartOverlay = ({ product = {}, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const price = !isNaN(product.price) ? parseFloat(product.price).toFixed(2) : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out animate-slideIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Added to Cart</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-6">
          <div className="flex items-center space-x-4">
            {/* Product Image */}
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {product.image_path ? (
                <img
                  src={require(`../images/${product.image_path}`)}
                  alt={product.product_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {product.product_name || 'Unknown Product'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Price: ${price}</p>
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Added Successfully
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 rounded-b-xl space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate('/cart');
            }}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent 
                     text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                     transition-colors duration-200"
          >
            View Cart
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 
                     text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white 
                     hover:bg-gray-50 transition-colors duration-200"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CartOverlay;