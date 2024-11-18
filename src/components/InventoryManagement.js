import React, { useState, useEffect } from 'react';
import { Plus, Package2, ShoppingCart, Tag, RotateCcw, AlertCircle, X } from 'lucide-react';
import ProductList from './ProductList';
import AddProductForm from './AddProductForm';
import LowStockAlerts from './LowStockAlerts';
import api from '../utils/api';

const InventoryManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    categories: 0,
    totalValue: 0
  });

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data;
      setProducts(productsData);
      
      // Calculate stats
      const totalProducts = productsData.length;
      const lowStockItems = productsData.filter(p => p.stock_quantity <= p.reorder_threshold).length;
      const uniqueCategories = new Set(productsData.map(p => p.category_id)).size;
      const totalValue = productsData.reduce((sum, product) => {
        return sum + (product.price * product.stock_quantity);
      }, 0);

      setStats({
        totalProducts,
        lowStockItems,
        categories: uniqueCategories,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const handleStockUpdate = async (productId, newQuantity) => {
    try {
      await api.put(`/products/${productId}`, { 
        stock_quantity: newQuantity,
        // Include other required fields from the existing product
        ...products.find(p => p.product_id === productId)
      });
      
      // Update local state immediately
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.product_id === productId 
            ? { ...product, stock_quantity: newQuantity }
            : product
        )
      );
      
      // Update stats
      const updatedProducts = products.map(product =>
        product.product_id === productId
          ? { ...product, stock_quantity: newQuantity }
          : product
      );

      const lowStockItems = updatedProducts.filter(p => p.stock_quantity <= p.reorder_threshold).length;
      const totalValue = updatedProducts.reduce((sum, product) => {
        return sum + (product.price * product.stock_quantity);
      }, 0);

      setStats(prevStats => ({
        ...prevStats,
        lowStockItems,
        totalValue
      }));

      // Trigger refresh to ensure all components are in sync
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating stock quantity:', error);
    }
  };

  const handleProductUpdated = async (updatedProduct) => {
    try {
      // Update local state immediately
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.product_id === updatedProduct.product_id
            ? updatedProduct
            : product
        )
      );
      
      // Recalculate stats
      const lowStockItems = products.filter(p => p.stock_quantity <= p.reorder_threshold).length;
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.stock_quantity);
      }, 0);

      setStats(prevStats => ({
        ...prevStats,
        lowStockItems,
        totalValue
      }));

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error handling product update:', error);
    }
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
          <AddProductForm 
            onProductAdded={onProductAdded}
            refreshData={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>
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
            <ProductList 
              products={products}
              refreshTrigger={refreshTrigger} 
              onProductUpdated={handleProductUpdated}
              onStockUpdate={handleStockUpdate}
            />
          </div>
        </div>

        {/* Low Stock Alerts Sidebar */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
            <LowStockAlerts 
              products={products}
              refreshTrigger={refreshTrigger}
              onStockUpdate={handleStockUpdate}
            />
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onProductAdded={() => {
            setShowAddModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};

export default InventoryManagement;