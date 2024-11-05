import React, { useState } from 'react';
import api from '../utils/api';

const AddProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    stock_quantity: '',
    reorder_threshold: '',
    size: '',
    color: '',
    brand: '',
    category_id: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Log the form data before sending
      console.log('Submitting form data:', formData);
  
      // Validate required fields
      const requiredFields = [
        'product_name',
        'category_id',
        'description',
        'price',
        'stock_quantity',
        'reorder_threshold',
        'size',
        'color',
        'brand'
      ];
  
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        alert(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
  
      const response = await api.post('/products', {
        product_name: formData.product_name,
        category_id: parseInt(formData.category_id),
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_threshold: parseInt(formData.reorder_threshold),
        size: formData.size,
        color: formData.color,
        brand: formData.brand
      });
  
      if (response.data) {
        onProductAdded(response.data);
        // Reset form
        setFormData({
          product_name: '',
          category_id: '',
          description: '',
          price: '',
          stock_quantity: '',
          reorder_threshold: '',
          size: '',
          color: '',
          brand: ''
        });
      }
    } catch (error) {
      console.error('Error adding product:', error.response?.data || error);
      alert(error.response?.data?.error || 'Failed to add product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          name="product_name"
          value={formData.product_name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          rows="3"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
          <input
            type="number"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Reorder Threshold</label>
          <input
            type="number"
            name="reorder_threshold"
            value={formData.reorder_threshold}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category ID</label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          required
        >
          <option value="">Select Category</option>
          <option value="1">Men's Clothing</option>
          <option value="2">Women's Clothing</option>
          <option value="3">Kid's Clothing</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Add Product
      </button>
    </form>
  );
};

export default AddProductForm;