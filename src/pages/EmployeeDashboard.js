import React, { useState } from 'react';
import { Package2, ShoppingCart, Tag, RotateCcw } from 'lucide-react';
// In src/pages/EmployeeDashboard.js
import InventoryManagement from '../components/InventoryManagement';  // Updated path
import OrdersManagement from '../components/OrdersManagement';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("inventory");

  const sections = [
    { id: "inventory", label: "Inventory", icon: Package2 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
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
        {activeTab === "inventory" && <InventoryManagement />}
        {activeTab === "orders" && <OrdersManagement />}
        {activeTab === "discounts" && <div>Discounts content goes here</div>}
        {activeTab === "returns" && <div>Returns content goes here</div>}
      </div>
    </div>
  );
};

export default EmployeeDashboard;