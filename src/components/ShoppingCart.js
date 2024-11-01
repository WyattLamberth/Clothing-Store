import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => {
    const price = !isNaN(item.price) ? parseFloat(item.price) : 0;
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartItems } });
  };

  const increaseQuantity = (productId) => {
    setCartItems((prevCart) => {
      const updatedCart = prevCart.map(item =>
        item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const decreaseQuantity = (productId) => {
    setCartItems((prevCart) => {
      const updatedCart = prevCart.map(item =>
        item.product_id === productId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeItem = (productId) => {
    setCartItems((prevCart) => {
      const updatedCart = prevCart.filter(item => item.product_id !== productId);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
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
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center"> {/* No image display */}
                      <span className="text-gray-600">No Image Available</span>
                    </div>
                  )}
                    <div>
                      <h3 className="text-lg font-semibold">{item.product_name}</h3>
                      <p className="text-gray-600">Price: ${price}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => decreaseQuantity(item.product_id)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          disabled={item.quantity <= 1} // Disable if quantity is 1
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.product_id)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeItem(item.product_id)}
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