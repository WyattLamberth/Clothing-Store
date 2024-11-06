import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Shield, Briefcase, Bell } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const Header = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const ROLES = {
    CUSTOMER: 1,
    EMPLOYEE: 2,
    ADMIN: 3
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.notification_id === notificationId ? { ...notif, read_status: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const categories = [
    { name: 'Men', path: '/men' },
    { name: 'Women', path: '/women' },
    { name: 'Kids', path: '/kids' }
  ];
  
  const userRole = Number(role);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left Section - Logo and Categories */}
        <div className="flex items-center space-x-12">
          <Link to="/" className="text-2xl font-bold">StyleHub</Link>
          <nav className="flex space-x-10">
          {categories.map((category, index) => (
              <NavLink
                key={index}
                to={category.path}
                className={({ isActive }) => 
                  `text-gray-700 hover:text-gray-900 font-medium ${isActive ? 'font-bold' : ''}`
                }
                aria-label={`Go to ${category.name} page`}
              >
                {category.name}
              </NavLink>
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

                  {/* Notification Bell */}
                  <li className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-600 hover:text-gray-900 relative">
                      <Bell className="h-5 w-5" />
                      {notifications.some((notif) => !notif.read_status) && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center absolute -top-2 -right-2">
                          {notifications.filter((notif) => !notif.read_status).length}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-64 max-h-96 bg-white border border-gray-200 shadow-lg rounded-lg p-4 z-50 overflow-y-auto">
                        <h3 className="text-sm font-bold mb-2">Notifications</h3>
                        <ul>
                          {notifications.map((notif) => (
                            <li key={notif.notification_id} className={`p-2 ${notif.read_status ? 'bg-gray-100' : 'bg-white'}`}>
                              <div className="text-xs text-gray-500">{new Date(notif.notification_date).toLocaleString()}</div>
                              <div className="text-sm">{notif.message}</div>
                              {!notif.read_status && (
                                <button onClick={() => markAsRead(notif.notification_id)} className="text-blue-600 text-xs mt-1">
                                  Mark as read
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                        {notifications.length === 0 && <p className="text-gray-500 text-sm">No notifications</p>}
                      </div>
                    )}
                  </li>


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
