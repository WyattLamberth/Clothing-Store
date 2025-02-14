import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, LogIn } from 'lucide-react';
import api from '../utils/api';

const ShoppingCart = ({ cartItems = [], onRemoveItem, onUpdateQuantity, isAuthenticated }) => {
  const navigate = useNavigate();
  const [stockInfo, setStockInfo] = useState({});

  const total = cartItems.reduce((sum, item) => {
    const price = !isNaN(item.price) ? parseFloat(item.price) : 0;
    return sum + price * item.quantity;
  }, 0);

  // Fetch stock only once when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      const fetchStock = async () => {
        const stockPromises = cartItems.map(async (item) => {
          try {
            const response = await api.get(`/products/${item.product_id}`);
            return { product_id: item.product_id, stock: response.data.stock_quantity };
          } catch (error) {
            console.error(`Failed to fetch stock for product_id ${item.product_id}:`, error);
            return { product_id: item.product_id, stock: null };
          }
        });

        const results = await Promise.all(stockPromises);
        const stockData = results.reduce((acc, curr) => {
          acc[curr.product_id] = curr.stock;
          return acc;
        }, {});

        setStockInfo(stockData);
      };

      fetchStock();
      
      // Optionally, if you really need periodic updates, use a longer interval
      // const intervalId = setInterval(fetchStock, 30000); // Every 30 seconds instead
      // return () => clearInterval(intervalId);
    }
  }, [cartItems]); // Only depend on cartItems

  // Adjust quantities once when stock info changes
  useEffect(() => {
    cartItems.forEach((item) => {
      const stock = stockInfo[item.product_id];
      if (stock !== null && item.quantity > stock) {
        onUpdateQuantity(item.product_id, stock);
      }
    });
  }, [stockInfo]); // Run only when stockInfo changes

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout', { state: { cartItems } });
    } else {
      navigate('/signin', {
        state: {
          returnTo: '/checkout',
          message: 'Please sign in to complete your purchase',
        },
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => {
              const price = !isNaN(item.price) ? parseFloat(item.price).toFixed(2) : 'N/A';
              const stock = stockInfo[item.product_id];

              return (
                <div key={item.product_id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    {item.image_path ? (
                      <img
                        src={require(`../images/${item.image_path}`)}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600">No Image</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{item.product_name}</h3>
                      <p className="text-gray-600">Price: ${price}</p>
                      <p className={`text-sm ${stock === 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {stock !== null ? `In stock: ${stock}` : 'Fetching stock...'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          disabled={stock !== null && item.quantity >= stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-medium">${(price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => onRemoveItem(item.product_id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between space-x-4">
              <button
                onClick={() => navigate('/shop')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 
                         hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                {!isAuthenticated && <LogIn className="w-5 h-5 mr-2" />}
                {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;
