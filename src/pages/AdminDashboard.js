import React, { useState } from 'react';
import { Package2, ShoppingCart, Tag, BarChart, Users, Shield, ActivitySquare, Settings, RotateCcw } from 'lucide-react';
import InventoryManagement from '../components/InventoryManagement';
import OrdersManagement from '../components/OrdersManagement';
import DiscountsManagement from '../components/DiscountsManagement';
import SalesAnalytics from '../components/SalesAnalytics';
import InventoryReport from '../components/InventoryReport';
import ReturnsManagement from '../components/ReturnsManagement';
import UserManagement from '../components/UserManagement';
import CustomerAnalytics from '../components/CustomerAnalytics';
import ActivityLogs from '../components/ActivityLogs';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [activeReport, setActiveReport] = useState("sales"); // Track active report


  const sections = [
    { id: "users", label: "Users & Access", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package2 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "returns", label: "Returns", icon: RotateCcw },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "reports", label: "Reports", icon: BarChart },
    { id: "activity", label: "Activity Logs", icon: ActivitySquare },
  ];

  const reports = [
    { id: "sales-analytics", label: "Sales Analytics" },
    { id: "inventory", label: "Inventory Health" },
    { id: "customer-analytics", label: "Customer Analytics" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your store, users, and system settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  if (id === "reports") {
                    setActiveReport("sales");
                  }
                }}
                className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === id
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

      {/* Reports Sub-Navigation */}
      {activeTab === "reports" && (
        <div className="mb-6">
          <div className="bg-gray-100 rounded-lg p-2 flex gap-2">
            {reports.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveReport(id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeReport === id
                    ? "bg-white text-blue-600 shadow"
                    : "text-gray-600 hover:bg-white/50"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "inventory" && <InventoryManagement />}
        {activeTab === "orders" && <OrdersManagement />}
        {activeTab === "returns" && <ReturnsManagement />}
        {activeTab === "discounts" && <DiscountsManagement />}
        {activeTab === "reports" && (
          <>
            {activeReport === "sales-analytics" && <SalesAnalytics />}
            {activeReport === "inventory" && <InventoryReport />}
            {activeReport === "customer-analytics" && <CustomerAnalytics />}
          </>
        )}
        {activeTab === "activity" && <ActivityLogs />}
        {activeTab === "settings" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <p className="text-gray-600">System configuration options will be available here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
