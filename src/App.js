import logo from './logo.svg';
import './App.css';
import React from 'react';
import './index.css';
import { ShoppingBag, Search, User } from 'lucide-react';

const productsData = [

  { id: 1, name: 'Classic T-Shirt', price: 19.99, image: '/api/placeholder/300/400' },
  { id: 2, name: 'Slim Fit Jeans', price: 49.99, image: '/api/placeholder/300/400' },
  { id: 3, name: 'Summer Dress', price: 39.99, image: '/api/placeholder/300/400' },
  { id: 4, name: 'Casual Sneakers', price: 59.99, image: '/api/placeholder/300/400' },

]

const Header = () => (
  <header className="bg-white shadow-md">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">StyleHub</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><a href="#" className="text-gray-600 hover:text-gray-900">Home</a></li>
          <li><a href="#" className="text-gray-600 hover:text-gray-900">Shop</a></li>
          <li><a href="#" className="text-gray-600 hover:text-gray-900">About</a></li>
          <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
        </ul>
      </nav>
      <div className="flex space-x-4">
        <Search className="text-gray-600 hover:text-gray-900 cursor-pointer" />
        <ShoppingBag className="text-gray-600 hover:text-gray-900 cursor-pointer" />
        <User className="text-gray-600 hover:text-gray-900 cursor-pointer" />
      </div>
    </div>
  </header>
);

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
    <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {productsData.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-800 text-white">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">About Us</h3>
          <p>StyleHub is your one-stop shop for trendy and affordable clothing.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
          <ul>
            <li><a href="#" className="hover:text-gray-300">FAQ</a></li>
            <li><a href="#" className="hover:text-gray-300">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-gray-300">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Connect With Us</h3>
          <p>Follow us on social media for the latest updates and promotions.</p>
          {/* Add social media icons here */}
        </div>
      </div>
      <div className="mt-8 text-center">
        <p>&copy; 2024 StyleHub. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const HomePage = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      <FeaturedProducts />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <div className="App">
      <HomePage />
    </div>
  );
}

export default App;
