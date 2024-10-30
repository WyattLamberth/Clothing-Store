import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CartOverlay = ({ product, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically close the overlay after 5 seconds
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-80">
        <h2 className="text-xl font-semibold mb-4">Added to Your Cart</h2>
        <img src={product.image} alt={product.name} className="w-full h-40 object-cover mb-4" />
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-md text-gray-600">Price: ${product.price.toFixed(2)}</p>
        <div className="flex justify-between mt-4">
          <button className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700" onClick={onClose}>
            Continue Shopping
          </button>
          <button
            className="mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-100"
            onClick={() => {
              onClose(); // Close the overlay
              navigate('/cart'); // Navigate to the cart page
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



