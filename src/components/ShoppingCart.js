import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const ShoppingCart = ({ cartItems = [], onRemoveItem, onUpdateQuantity }) => {
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => {
    const price = !isNaN(item.price) ? parseFloat(item.price) : 0;
    return sum + price * item.quantity;
  }, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId); // Remove item if quantity is less than 1
    } else {
      onUpdateQuantity(itemId, newQuantity); // Update quantity if valid
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartItems } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => {
              const price = !isNaN(item.price) ? parseFloat(item.price).toFixed(2) : 'N/A';
              return (
                <div key={item.product_id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                  {item.image_path ? ( // Conditional rendering based on image_path
                    <img
                      src={require(`../images/${item.image_path}`)}
                      alt={item.product_name}
                      onError={(e) => { e.target.src = require('../images/summer_dress.jpg'); }} // Fallback image
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center"> {/* Placeholder */}
                      <span className="text-gray-600">No Image Available</span>
                    </div>
                  )}
                    <div>
                      <h3 className="text-lg font-semibold">{item.product_name}</h3>
                      <p className="text-gray-600">Price: ${price}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          disabled={item.quantity <= 1} // Disable if quantity is 1
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onRemoveItem(item.product_id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;