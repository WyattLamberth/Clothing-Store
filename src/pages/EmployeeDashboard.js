import React, { useState } from 'react';
import { Package2, ShoppingCart, Tag, RotateCcw } from 'lucide-react';
import InventoryManagement from '../components/InventoryManagement';
import OrdersManagement from '../components/OrdersManagement';
import DiscountsManagement from '../components/DiscountsManagement';
import ReturnsManagement from '../components/ReturnsManagement';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("inventory");
  
  const sections = [
    { id: "inventory", label: "Inventory", icon: Package2 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "returns", label: "Returns", icon: RotateCcw },
    { id: "discounts", label: "Discounts", icon: Tag },
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
        {activeTab === "returns" && <ReturnsManagement />}
        {activeTab === "discounts" && <DiscountsManagement />}
      </div>
    </div>
  );
};

export default EmployeeDashboard;