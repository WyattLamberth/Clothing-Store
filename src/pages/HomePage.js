import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, RefreshCw } from 'lucide-react';
import NotificationBar from '../components/NotificationBar';
import SearchBar from '../components/SearchBar';
import backgroundImage from '../images/pic1.jpg';
import TrendingSection from '../components/TrendingSection';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';
import { useAuth } from '../AuthContext';


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
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const { isAuthenticated, userId } = useAuth();

  const handleSearch = async (query) => {
    setLoading(false);
    try {
      const response = await api.get('/products/search', {
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
        const requests = productIds.map(id => api.get(`/products/${id}`));
        const responses = await Promise.all(requests);
        setProducts(responses.map(response => response.data));
      } catch (error) {
        console.error('Error fetching first four products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch or initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        // Fetch user's cart from database
        try {
          const response = await api.get('/shopping_cart');
          if (response.data.cartItems) {
            setCart(response.data.cartItems);
            // Also update localStorage to keep them in sync
            localStorage.setItem('cart', JSON.stringify(response.data.cartItems));
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // If no cart exists, create one
            try {
              await api.post('/shopping_cart/create');
            } catch (createError) {
              console.error('Error creating cart:', createError);
            }
          }
        }
      } else {
        // For guest users, get cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      }
    };

    initializeCart();
  }, [isAuthenticated]);

  const addToCart = async (product) => {
    try {
      let updatedCart = [...cart];
      const existingItem = updatedCart.find(item => item.product_id === product.product_id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }

      // Update local state
      setCart(updatedCart);
      
      // Always update localStorage as a backup
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated) {
        // Update database if user is logged in
        await api.post('/cart-items/add', {
          product_id: product.product_id,
          quantity: 1,
        });
      }

      // Show overlay
      setSelectedProduct(product);
      setShowOverlay(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedProduct(null);
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
              onAddToCart={addToCart}
              isInCart={!!cart.find(item => item.product_id === product.product_id)} // Pass if product is in cart
            />
          ))}
        </div>
        {showOverlay && selectedProduct && (
          <CartOverlay
            product={selectedProduct}
            onClose={handleCloseOverlay}
          />
        )}
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