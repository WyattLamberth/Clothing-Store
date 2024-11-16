import React, { useState } from 'react';
import api from '../utils/api';

const categoryMapping = {
  Men: { Pants: 1, Shirts: 4, Belts: 7, Jackets: 10, Shoes: 13, Dresses: 16, Skirts: 19, Hats: 22, T_shirts: 25, Sweaters: 28, Socks: 31, Shorts: 34 },
  Women: { Pants: 2, Shirts: 5, Belts: 8, Jackets: 11, Shoes: 14, Dresses: 17, Skirts: 20, Hats: 23, T_shirts: 26, Sweaters: 29, Socks: 32, Shorts: 35 },
  Kids: { Pants: 3, Shirts: 6, Belts: 9, Jackets: 12, Shoes: 15, Dresses: 18, Skirts: 21, Hats: 24, T_shirts: 27, Sweaters: 30, Socks: 33, Shorts: 36 },
};

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
    gender: '',
    type: '',
    image: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      image: e.target.files[0], // Update with selected file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Determine category_id from gender and type
      const { gender, type } = formData;
      const category_id = categoryMapping[gender]?.[type];
      if (!category_id) {
        alert('Invalid gender or type selection.');
        return;
      }

      // Validate required fields
      const requiredFields = [
        'product_name',
        'description',
        'price',
        'stock_quantity',
        'reorder_threshold',
        'size',
        'color',
        'brand',
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        alert(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Create FormData object
      const data = new FormData();
      data.append('product_name', formData.product_name);
      data.append('category_id', category_id);
      data.append('description', formData.description);
      data.append('price', parseFloat(formData.price));
      data.append('stock_quantity', parseInt(formData.stock_quantity));
      data.append('reorder_threshold', parseInt(formData.reorder_threshold));
      data.append('size', formData.size);
      data.append('color', formData.color);
      data.append('brand', formData.brand);

      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await api.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        onProductAdded(response.data);
        // Reset form
        setFormData({
          product_name: '',
          description: '',
          price: '',
          stock_quantity: '',
          reorder_threshold: '',
          size: '',
          color: '',
          brand: '',
          gender: '',
          type: '',
          image: null,
        });
      }
    } catch (error) {
      console.error('Error adding product:', error.response?.data || error);
      alert(error.response?.data?.error || 'Failed to add product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Name */}
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

      {/* Description */}
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

      {/* Price and Stock Quantity */}
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

      {/* Reorder Threshold and Size */}
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

      {/* Color and Brand */}
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

      {/* Gender and Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          required
        >
          <option value="">Select Gender</option>
          {Object.keys(categoryMapping).map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
          required
          disabled={!formData.gender} // Disable until gender is selected
        >
          <option value="">Select Type</option>
          {formData.gender &&
            Object.keys(categoryMapping[formData.gender]).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Image: .JPG or .PNG</label>
        <input
          type="file"
          name="image"
          onChange={handleFileChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
        />
      </div>

      {/* Submit Button */}
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
