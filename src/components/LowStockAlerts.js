import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import api from '../utils/api';

const LowStockAlerts = ({ onRestock, refreshTrigger }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');

  useEffect(() => {
    fetchLowStockItems();
  }, [refreshTrigger]);

  const fetchLowStockItems = async () => {
    try {
      const response = await api.get('/products');
      const products = response.data;
      const lowStock = products.filter(product => 
        product.stock_quantity <= product.reorder_threshold
      );
      setLowStockItems(lowStock);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      setLoading(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${selectedProduct.product_id}/restock`, {
        quantity: parseInt(restockAmount)
      });
      
      // Refresh the list
      fetchLowStockItems();
      setShowRestockModal(false);
      setRestockAmount('');
      setSelectedProduct(null);
      if (onRestock) onRestock();
    } catch (error) {
      console.error('Error restocking product:', error);
      alert('Failed to restock product');
    }
  };

  const RestockModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Restock {selectedProduct?.product_name}
            </h3>
            <button 
              onClick={() => setShowRestockModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleRestock}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock: {selectedProduct?.stock_quantity}
              </label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter amount to add"
                min="1"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Restock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-4">
        Loading low stock alerts...
      </div>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        All products are well-stocked
      </div>
    );
  }

  return (
    <div>
      {/* Alert Count */}
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">{lowStockItems.length} items need attention</span>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div 
            key={item.product_id}
            className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between"
          >
            <div>
              <h4 className="font-medium">{item.product_name}</h4>
              <p className="text-sm text-gray-500">
                Stock: {item.stock_quantity} / Threshold: {item.reorder_threshold}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedProduct(item);
                setShowRestockModal(true);
              }}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              <span>Restock</span>
            </button>
          </div>
        ))}
      </div>

      {/* Restock Modal */}
      {showRestockModal && <RestockModal />}
    </div>
  );
};

export default LowStockAlerts;