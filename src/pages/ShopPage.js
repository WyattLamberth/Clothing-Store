import React, { useEffect, useState } from 'react';
//import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Mock product data
const productsData = [
  { id: 1, name: 'Cargo Shorts', price: 29.99, image: '/ShopPageImage/cargo-shorts.png' },
  { id: 2, name: 'Summer Dress', price: 39.99, image: '/ShopPageImage/dress.png' },
  { id: 3, name: 'Winter Jacket', price: 89.99, image: '/ShopPageImage/jacket.png' },
  { id: 4, name: 'Pink Skirt', price: 24.99, image: '/ShopPageImage/pink-skirt.png' },
  { id: 5, name: 'Red Shirt', price: 19.99, image: '/ShopPageImage/red-shirt.png' },
  { id: 6, name: 'White Shoes', price: 49.99, image: '/ShopPageImage/white-shoes.png' },
];

const ProductCard = ({ product }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
    <div className="p-4">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price.toFixed(2)}</p>
      <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Add to Cart
      </button>
    </div>
  </div>
);

const PromotionBanner = ({ currentPromo, handlePrev, handleNext }) => (
  <div className="w-full overflow-hidden bg-slate-300 flex items-center justify-center py-2">
    <button onClick={handlePrev} className="text-black px-4">◀</button>
    <div className="whitespace-nowrap text-center text-lg text-black font-semibold px-4">{currentPromo}</div>
    <button onClick={handleNext} className="text-black px-4">▶</button>
  </div>
);

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

const ShopPage = () => {
  const [currentPromo, setCurrentPromo] = useState("20% OFF on all products");
  const [activeCategory, setActiveCategory] = useState(null);
  const [promoIndex, setPromoIndex] = useState(0);
  const promotions = [
    "20% OFF on all products",
    "10% OFF on orders over $100",
    "Free shipping on orders over $50"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promotions.length);
      setCurrentPromo(promotions[(promoIndex + 1) % promotions.length]);
    }, 5000);

    return () => clearInterval(interval);
  }, [promoIndex]);

  const handlePrev = () => {
    setPromoIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    setCurrentPromo(promotions[(promoIndex - 1 + promotions.length) % promotions.length]);
  };

  const handleNext = () => {
    setPromoIndex((prev) => (prev + 1) % promotions.length);
    setCurrentPromo(promotions[(promoIndex + 1) % promotions.length]);
  };

  const categories = {
    New: ["Pants", "Shirt", "Jeans"],
    Men: ["Pants", "Shirt", "Jeans", "Shoes"],
    Women: ["Dress", "Blouse", "Jeans", "Shoes"],
    Kid: ["T-shirt", "Shorts", "Shoes"],
  };

  return (
    <div className="bg-gray-100">
      <PromotionBanner currentPromo={currentPromo} handlePrev={handlePrev} handleNext={handleNext} />
      <CategoryDropdown categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <FeaturedProducts />
    </div>
  );
};

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

export default ShopPage;














