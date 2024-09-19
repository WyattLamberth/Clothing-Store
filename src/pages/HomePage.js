import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, RefreshCw } from 'lucide-react';

// Mock product data (replace with actual API call in a real application)
const productsData = [
  { id: 1, name: 'Classic T-Shirt', price: 19.99, image: '/api/placeholder/300/400' },
  { id: 2, name: 'Slim Fit Jeans', price: 49.99, image: '/api/placeholder/300/400' },
  { id: 3, name: 'Summer Dress', price: 39.99, image: '/api/placeholder/300/400' },
  { id: 4, name: 'Casual Sneakers', price: 59.99, image: '/api/placeholder/300/400' },
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

const FeaturedProducts = () => (
  <section className="container mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {productsData.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);

const HeroSection = () => (
  <div className="bg-gray-100 py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Discover Your Style with StyleHub</h1>
        <p className="text-xl mb-8">Trendy and affordable fashion for every occasion. Shop our latest collection and express yourself.</p>
        <Link to="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold inline-flex items-center hover:bg-blue-700 transition duration-300">
          Shop Now <ArrowRight className="ml-2" />
        </Link>
      </div>
    </div>
  </div>
);

const FeatureHighlight = ({ icon: Icon, title, description }) => (
  <div className="text-center">
    <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
      <Icon size={24} className="text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HomePage = () => (
  <div>
    <HeroSection />
    <FeaturedProducts />
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose StyleHub?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureHighlight 
            icon={Star} 
            title="Quality Products" 
            description="We source only the best materials for our clothing, ensuring comfort and durability."
          />
          <FeatureHighlight 
            icon={Truck} 
            title="Fast Shipping" 
            description="Get your order quickly with our efficient shipping process. Free shipping on orders over $50."
          />
          <FeatureHighlight 
            icon={RefreshCw} 
            title="Easy Returns" 
            description="Not satisfied? Return or exchange your items hassle-free within 30 days."
          />
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;