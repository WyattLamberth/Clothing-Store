// src/pages/AdminPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <ul className="space-y-4">
        <li>
          <Link to="/admin/users" className="text-blue-600 hover:underline">User and Role Management</Link>
        </li>
        <li>
          <Link to="/admin/products" className="text-blue-600 hover:underline">Product Management</Link>
        </li>
        <li>
          <Link to="/admin/reports" className="text-blue-600 hover:underline">Sales Reports</Link>
        </li>
        <li>
          <Link to="/admin/system-maintenance" className="text-blue-600 hover:underline">System Maintenance</Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminPage;
