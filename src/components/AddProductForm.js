import React, { useState } from 'react';

const AddProductForm = ({ onProductAdded }) => {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [demographic, setDemographic] = useState('');
  const [clothingType, setClothingType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newProduct = {
      name: productName,
      description,
      price: parseFloat(price),
      stock: parseInt(stockQuantity, 10),
      size,
      color,
      brand,
      categories: [demographic, clothingType]
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        const addedProduct = await response.json();
        onProductAdded(addedProduct);
        // Reset form fields
        setProductName('');
        setDescription('');
        setPrice('');
        setStockQuantity('');
        setSize('');
        setColor('');
        setBrand('');
        setDemographic('');
        setClothingType('');
      } else {
        console.error('Failed to add product');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
        <input
          type="number"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Size</label>
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Brand</label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Demographic</label>
        <select
          value={demographic}
          onChange={(e) => setDemographic(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        >
          <option value="">Select Demographic</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Kids">Kids</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Clothing Type</label>
        <select
          value={clothingType}
          onChange={(e) => setClothingType(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          required
        >
          <option value="">Select Clothing Type</option>
          <option value="Shirts">Shirts</option>
          <option value="T-Shirts">T-Shirts</option>
          <option value="Blouses">Blouses</option>
          <option value="Pants">Pants</option>
          <option value="Jeans">Jeans</option>
          <option value="Shorts">Shorts</option>
          <option value="Dresses">Dresses</option>
          <option value="Skirts">Skirts</option>
          <option value="Suits">Suits</option>
          <option value="Jackets">Jackets</option>
          <option value="Coats">Coats</option>
          <option value="Sweaters">Sweaters</option>
          <option value="Hoodies">Hoodies</option>
          <option value="Underwear">Underwear</option>
          <option value="Socks">Socks</option>
          <option value="Swimwear">Swimwear</option>
        </select>
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Add Product
      </button>
    </form>
  );
};

export default AddProductForm;