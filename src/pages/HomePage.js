import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, RefreshCw } from 'lucide-react';
import NotificationBar from '../components/NotificationBar';
import SearchBar from '../components/SearchBar';
import backgroundImage from '../images/shoe.gif';
import TrendingSection from '../components/TrendingSection';
import axios from 'axios';
import ProductCard from '../components/ProductCard';


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
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]); // Initialize with mock data
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const handleSearch = async (query) => {
    setLoading(false);
    try {
      const response = await axios.get('/api/products/search', {
        params: { query },
      });
      setSearchResults(response.data); // Update state with search results
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]); // Clear search results on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productIds = [1, 2, 3, 4]; // Replace these with the actual IDs of the first four products
        const requests = productIds.map(id => axios.get(`/api/products/${id}`));
        const responses = await Promise.all(requests);
        setProducts(responses.map(response => response.data));
      } catch (error) {
        console.error('Error fetching first four products:', error);
      }
    };

    fetchProducts();
  }, []);

  const addItemToCart = (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      let updatedCart;

      if (existingItem) {
        // Increase quantity if the item is already in the cart
        updatedCart = prevCart.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item to cart
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }

      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
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
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Recommended For You</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.product_id}
              product={product}
              onAddToCart={addItemToCart}
              isInCart={!!cartItems.find(item => item.product_id === product.product_id)} // Pass if product is in cart
            />
          ))}
        </div>
      </div>
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