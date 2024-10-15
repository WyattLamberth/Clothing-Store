// src/pages/SalesReports.js
import React from 'react';

const SalesReports = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sales Reports</h1>
      <ul>
        <li>Sales by Product</li>
        <li>Sales by Category</li>
        <li>Refund and Return Report</li>
        <li>Inventory Status Report</li>
        <li>Top Customers by Sales</li>
      </ul>
    </div>
  );
};

export default SalesReports;
