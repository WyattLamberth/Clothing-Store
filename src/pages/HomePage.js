import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, RefreshCw } from 'lucide-react';
import NotificationBar from '../components/NotificationBar';
import SearchBar from '../components/SearchBar';
import backgroundImage from '../images/shoe.gif';
import TrendingSection from '../components/TrendingSection';
import t_shirt from  '../images/basic_t_shirt.jpg';
import slim_fit_jeans from '../images/slim_fit_jeans.jpg';
import summer_dress from '../images/summer_dress.jpg';
import casual_sneaker from '../images/casual_sneaker.jpg';

// Mock product data (replace with actual API call in a real application)
const productsData = [
  { id: 1, name: 'Classic T-Shirt', price: 19.99, image: t_shirt },
  { id: 2, name: 'Slim Fit Jeans', price: 49.99, image: slim_fit_jeans },
  { id: 3, name: 'Summer Dress', price: 39.99, image: summer_dress },
  { id: 4, name: 'Casual Sneakers', price: 59.99, image: casual_sneaker },
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

const HeroSection = () => {
  const sectionStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover', // Cover the entire section
    backgroundPosition: 'left', // Center the image
    height: '100vh', // Full viewport height (adjust as needed)
  };

  return (
    <div style={sectionStyle} className="bg-gray-100 py-20 flex flex-col justify-center">
      <div className="container mx-auto px-4 flex flex-col md:flex-row text-center">
        <div className="max-w-lg md:mr-10 bg-white bg-opacity-40 p-6 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Discover Your Style with StyleHub</h1>
          <p className="text-xl mb-8">Trendy and affordable fashion for every occasion. Shop our latest collection and express yourself.</p>
          <Link to="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold inline-flex items-center hover:bg-blue-700 transition duration-300">
            Shop Now <ArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};


const FeatureHighlight = ({ icon: Icon, title, description }) => (
  <div className="text-center">
    <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
      <Icon size={24} className="text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const HomePage = () => {
  const handleSearch = (query) => {
    console.log('Searching for:', query);
    // Add code to perform search, like making an API request
  };

  return (
    <div>
      <NotificationBar 
        message="Free shipping on orders over $50!" 
        linkText="Shop Now" 
        linkUrl="/shop"
      />
      <div className="container mx-auto px-4 py-4">
        <SearchBar onSearch={handleSearch} />
      </div>
      <HeroSection />
      <TrendingSection />
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
};

export default HomePage;