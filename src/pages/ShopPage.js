import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard'; // Ensure this path is correct

const ShopPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products'); // Adjust the endpoint if necessary
        console.log(response.data); // Log the product data
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;

/*
const PromotionBanner = ({ currentPromo, handlePrev, handleNext }) => (
  <div className="w-full overflow-hidden bg-slate-300 flex items-center justify-center py-2">
    <button onClick={handlePrev} className="text-black px-4">◀</button>
    <div className="whitespace-nowrap text-center text-lg text-black font-semibold px-4">{currentPromo}</div>
    <button onClick={handleNext} className="text-black px-4">▶</button>
  </div>
);
*/

/*
const CategoryDropdown = ({ categories, activeCategory, setActiveCategory }) => (
  <div className="flex justify-center w-full space-x-6 py-4 bg-gray-50">
    {Object.keys(categories).map((category) => (
      <div
        key={category}
        onMouseEnter={() => setActiveCategory(category)}
        onMouseLeave={() => setActiveCategory(null)}
        className="relative"
      >
        <button className="text-lg font-semibold">{category}</button>
        {activeCategory === category && (
          <div className="absolute top-full mt-2 w-48 bg-white shadow-lg rounded-md">
            {categories[category].map((subCategory) => (
              <a
                key={subCategory}
                href={`/shop/${category.toLowerCase()}/${subCategory.toLowerCase()}`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                {subCategory}
              </a>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
);

const FeaturedProducts = () => (
  <section className="container mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-center mb-12">Shop Products</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {productsData.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);
*/


/*const ShopPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};*/














