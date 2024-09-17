import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';

const Header = () => (
  <header className="bg-white shadow-md">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">StyleHub</Link>
      <nav>
        <ul className="flex space-x-4 items-center">
          <li><Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link></li>
          <li><Link to="/shop" className="text-gray-600 hover:text-gray-900">Shop</Link></li>
          <li>
            <Link to="/signin" className="text-gray-600 hover:text-gray-900">
              <User className="inline mr-1" size={20} />
              Sign In
            </Link>
          </li>
          <li>
            <Link to="/cart" className="text-gray-600 hover:text-gray-900">
              <ShoppingBag className="inline mr-1" size={20} />
              Cart
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;