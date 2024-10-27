// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Header = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">StyleHub</Link>
        
        <nav>
          <ul className="flex space-x-4 items-center">
            {/* Public Links */}
            <li>
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
            </li>
            <li>
              <Link to="/shop" className="text-gray-600 hover:text-gray-900">
                Shop
              </Link>
            </li>

            {/* Employee and Admin Links */}
            {isAuthenticated && (role === 2 || role === 3) && (
              <li>
                <Link to="/employee" className="text-gray-600 hover:text-gray-900">
                  Employee Dashboard
                </Link>
              </li>
            )}

            {/* Admin Only Links */}
            {isAuthenticated && role === 3 && (
              <li>
                <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin Dashboard
                </Link>
              </li>
            )}

            {/* Authentication Links */}
            {isAuthenticated ? (
              <li>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <LogOut className="inline mr-1" size={20} />
                  Log Out
                </button>
              </li>
            ) : (
              <li>
                <Link to="/signin" className="text-gray-600 hover:text-gray-900 flex items-center">
                  <User className="inline mr-1" size={20} />
                  Sign In
                </Link>
              </li>
            )}

            {/* Cart Link - Always visible */}
            <li>
              <Link to="/cart" className="text-gray-600 hover:text-gray-900 flex items-center">
                <ShoppingBag className="inline mr-1" size={20} />
                Cart
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;