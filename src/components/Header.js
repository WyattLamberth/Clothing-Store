import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Building2, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Header = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define role IDs
  const ROLES = {
    CUSTOMER: 1,
    EMPLOYEE: 2,
    ADMIN: 3
  };

  // Categories visible to all users
  const categories = ['Men', 'Women', 'Kids', 'Sale'];

  // Role-based navigation items
  const getRoleBasedNavItems = () => {
    const items = [];

    if (role === ROLES.ADMIN) {
      items.push({
        to: '/admin',
        label: 'Admin Dashboard',
        icon: Shield,
        className: 'text-red-600 hover:text-red-800'
      });
    }

    if (role === ROLES.ADMIN || role === ROLES.EMPLOYEE) {
      items.push({
        to: '/employee',
        label: 'Employee Dashboard',
        icon: Briefcase,
        className: 'text-blue-600 hover:text-blue-800'
      });
    }

    return items;
  };

  // Get role badge configuration
  const getRoleBadge = () => {
    if (role === ROLES.ADMIN) {
      return {
        label: 'Admin',
        className: 'bg-red-100 text-red-800 border-red-300'
      };
    }
    if (role === ROLES.EMPLOYEE) {
      return {
        label: 'Employee',
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
    return null;
  };

  const roleBadge = getRoleBadge();
  const roleBasedNavItems = getRoleBasedNavItems();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left Section - Logo and Categories */}
        <div className="flex items-center space-x-12">
          <Link to="/" className="text-2xl font-bold">StyleHub</Link>
          <nav className="flex space-x-10">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/${category.toLowerCase()}`}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                {category}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section - Links */}
        <nav>
          <ul className="flex items-center space-x-6">
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

            {/* Role-based Navigation Items */}
            {isAuthenticated && roleBasedNavItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.to} 
                  className={`flex items-center space-x-1 ${item.className}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}

            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
                {/* Role Badge */}
                {roleBadge && (
                  <li>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleBadge.className}`}>
                      {roleBadge.label}
                    </span>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/signin" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                  <User size={18} />
                  <span>Sign In</span>
                </Link>
              </li>
            )}

            {/* Cart - Always Visible */}
            <li>
              <Link to="/cart" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <ShoppingBag size={18} />
                <span>Cart</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;