import React, { useState } from 'react';
import { Package2, ShoppingCart, Tag, RotateCcw, AlertCircle } from 'lucide-react';
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';
import LowStockAlerts from '../components/LowStockAlerts';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("inventory");
  const [alerts, setAlerts] = useState([]);

  const sections = [
    { id: "inventory", label: "Inventory", icon: Package2 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        
        {/* Alerts Section */}
        <div className="flex gap-4">
          {alerts.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <p>You have {alerts.length} items requiring attention</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Inventory Management */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Product List Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Product Inventory</h2>
                <ProductList />
              </div>
            </div>

            {/* Add Product and Low Stock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
                  <AddProductForm onProductAdded={() => {
                    // Refresh product list after adding
                    // We'll implement this later
                  }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
                  <LowStockAlerts />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Management */}
        {activeTab === "orders" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              {/* Add OrdersList component here */}
            </div>
          </div>
        )}

        {/* Discounts Management */}
        {activeTab === "discounts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Create Discount</h2>
              {/* Add CreateDiscountForm component here */}
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Active Discounts</h2>
              {/* Add ActiveDiscountsList component here */}
            </div>
          </div>
        )}

        {/* Returns Management */}
        {activeTab === "returns" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Process Returns</h2>
              {/* Add ReturnsProcessor component here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;