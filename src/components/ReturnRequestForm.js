import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

const ReturnRequestForm = ({ order, orderItems, onClose, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modified to store order_item_id instead of product_id
  const handleItemToggle = (orderItemId, maxQuantity) => {
    setSelectedItems(prev => {
      if (prev[orderItemId]) {
        const { [orderItemId]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [orderItemId]: 1
      };
    });
  };

  const handleQuantityChange = (orderItemId, quantity, maxQuantity) => {
    const validQuantity = Math.min(Math.max(1, parseInt(quantity) || 0), maxQuantity);
    setSelectedItems(prev => ({
      ...prev,
      [orderItemId]: validQuantity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(selectedItems).length === 0) {
      setError('Please select at least one item to return');
      return;
    }
  
    setLoading(true);
    try {
      // Format the request according to the API requirements
      const requestData = {
        order_id: parseInt(order.order_id),  // Ensure this is a number
        items: Object.entries(selectedItems).map(([order_item_id, quantity]) => ({
          order_item_id: parseInt(order_item_id),  // Ensure this is a number
          quantity: parseInt(quantity)  // Ensure this is a number
        }))
      };
  
      console.log('Submitting return request:', requestData); // Debug log
  
      const response = await api.post('/customer/returns', requestData);
      console.log('Return response:', response.data); // Debug log
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Return request error:', error.response?.data || error);
      setError(error.response?.data?.error || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Return Request - Order #{order.order_id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Select Items to Return</h3>
              {orderItems.map((item) => (
                <div key={item.order_item_id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={!!selectedItems[item.order_item_id]} // Use order_item_id instead of product_id
                      onChange={() => handleItemToggle(item.order_item_id, item.quantity)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Original Quantity: {item.quantity} | Price: ${parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {selectedItems[item.order_item_id] && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Quantity to Return:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={selectedItems[item.order_item_id]}
                        onChange={(e) => handleQuantityChange(item.order_item_id, e.target.value, item.quantity)}
                        className="w-16 p-1 border rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(selectedItems).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestForm;