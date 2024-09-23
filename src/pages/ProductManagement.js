// src/pages/ProductManagement.js
import React, { useState } from 'react';

const ProductManagement = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Classic T-Shirt', price: 19.99, stock: 50 },
    { id: 2, name: 'Slim Fit Jeans', price: 49.99, stock: 20 }
  ]);

  const handleEditProduct = (id) => {
    // Logic for editing product
  };

  const handleDeleteProduct = (id) => {
    // Logic for deleting product
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      <ul>
        {products.map(product => (
          <li key={product.id} className="flex justify-between items-center mb-4">
            <span>{product.name} - ${product.price} - Stock: {product.stock}</span>
            <div>
              <button onClick={() => handleEditProduct(product.id)} className="mr-2 text-blue-600">Edit</button>
              <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Add New Product</button>
    </div>
  );
};

export default ProductManagement;
