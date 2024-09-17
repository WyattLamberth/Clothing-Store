import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

// Mock product data (replace with actual API call in a real application)
const mockProducts = [
  { id: 1, name: 'Classic T-Shirt', price: 19.99, category: 'Tops', image: '/api/placeholder/300/400' },
  { id: 2, name: 'Slim Fit Jeans', price: 49.99, category: 'Bottoms', image: '/api/placeholder/300/400' },
  { id: 3, name: 'Summer Dress', price: 39.99, category: 'Dresses', image: '/api/placeholder/300/400' },
  { id: 4, name: 'Casual Sneakers', price: 59.99, category: 'Shoes', image: '/api/placeholder/300/400' },
  { id: 5, name: 'Hooded Sweatshirt', price: 34.99, category: 'Tops', image: '/api/placeholder/300/400' },
  { id: 6, name: 'Denim Shorts', price: 29.99, category: 'Bottoms', image: '/api/placeholder/300/400' },
  // Add more mock products as needed
];

const ProductCard = ({ product }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price.toFixed(2)}</p>
      <p className="text-sm text-gray-500">{product.category}</p>
      <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
        Add to Cart
      </button>
    </div>
  </div>
);

const ShopPage = () => {
  const [products, setProducts] = useState(mockProducts);
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', ...new Set(mockProducts.map(product => product.category))];

  useEffect(() => {
    let filteredProducts = filterCategory === 'All' 
      ? mockProducts 
      : mockProducts.filter(product => product.category === filterCategory);

    filteredProducts.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      return 0;
    });

    setProducts(filteredProducts);
  }, [sortBy, filterCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop Our Collection</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Filter className="mr-2" />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <ChevronDown className="mr-2" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="name">Name</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;