import React, { useState, useEffect } from 'react';
import { Plus, Package2, ShoppingCart, Tag, RotateCcw, AlertCircle, X } from 'lucide-react';
import ProductList from './ProductList';
import AddProductForm from './AddProductForm';
import LowStockAlerts from './LowStockAlerts';
import api from '../utils/api';

const InventoryManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    categories: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/products');
      const products = response.data;
      
      // Calculate stats
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.stock_quantity <= p.reorder_threshold).length;
      const uniqueCategories = new Set(products.map(p => p.category_id)).size;
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.stock_quantity);
      }, 0);

      setStats({
        totalProducts,
        lowStockItems,
        categories: uniqueCategories,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const handleProductAdded = () => {
    setShowAddModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const AddProductModal = ({ onClose, onProductAdded }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Product</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <AddProductForm onProductAdded={onProductAdded} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-red-600">{stats.lowStockItems}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Categories</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.categories}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Value</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">${stats.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        </div>
      </div>

      {/* Product List and Low Stock Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6">
            <ProductList refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Low Stock Alerts Sidebar */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
            <LowStockAlerts 
              refreshTrigger={refreshTrigger}
              onRestock={() => setRefreshTrigger(prev => prev + 1)} 
            />
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
};

export default InventoryManagement;