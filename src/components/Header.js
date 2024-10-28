import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Header = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const ROLES = {
    CUSTOMER: 1,
    EMPLOYEE: 2,
    ADMIN: 3
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = ['Men', 'Women', 'Kids', 'Sale'];
  const userRole = Number(role);

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
            
            {isAuthenticated && (
              <>
                {/* Employee Dashboard - Show for Employee and Admin */}
                {(userRole === ROLES.EMPLOYEE || userRole === ROLES.ADMIN) && (
                  <li>
                    <Link 
                      to="/employee" 
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <Briefcase className="h-5 w-5" />
                      <span>Employee Dashboard</span>
                    </Link>
                  </li>
                )}
                
                {/* Admin Dashboard - Show only for Admin */}
                {userRole === ROLES.ADMIN && (
                  <li>
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                    >
                      <Shield className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}

                {/* Role Badge */}
                {(userRole === ROLES.ADMIN || userRole === ROLES.EMPLOYEE) && (
                  <li>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      userRole === ROLES.ADMIN 
                        ? 'bg-red-100 text-red-800 border-red-300' 
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {userRole === ROLES.ADMIN ? 'Admin' : 'Employee'}
                    </span>
                  </li>
                )}

                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Log Out</span>
                  </button>
                </li>
              </>
            )}

            {!isAuthenticated && (
              <li>
                <Link 
                  to="/signin" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              </li>
            )}

            <li>
              <Link 
                to="/cart" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <ShoppingBag className="h-5 w-5" />
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