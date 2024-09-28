// src/pages/EmployeePage.js
import React, { useState } from 'react';
import AddProductForm from '../components/AddProductForm';

const EmployeePage = () => {
  const [products, setProducts] = useState([]);

  const handleProductAdded = (newProduct) => {
    setProducts([...products, newProduct]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>
      <p>Welcome to the employee dashboard. Here you can manage inventory, customers, and transactions.</p>
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <AddProductForm onProductAdded={handleProductAdded} />
    </div>
  );
};

export default EmployeePage;