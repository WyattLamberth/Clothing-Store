import React, { useState, useEffect } from 'react';
import { User, MapPin, ShoppingBag, CreditCard, Plus, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import ReturnRequestForm from './ReturnRequestForm';
import OrderFilter from './OrderFilter';

const ProfileDashboard = () => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [showProfileEditForm, setShowProfileEditForm] = useState(false);
  const [showAddressEditForm, setShowAddressEditForm] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All'); // State for order status filter
  const [orderDateFilter, setOrderDateFilter] = useState({ start: '', end: '' });
  const [orderAmountFilter, setOrderAmountFilter] = useState({ min: '', max: '' });
  const [returnConfirmation, setReturnConfirmation] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [cards, setCards] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
  const [errors, setErrors] = useState({});
  const [cardDetails, setCardDetails] = useState({
    cardholder_name: '',
    card_number: '',
    expiration_date: '',
    cvv: '',
    billing_address: {
      line_1: '',
      line_2: '',
      city: '',
      state: '',
      zip: '',
    }
  });

  // Add this function with your other fetch functions
  const fetchOrders = async () => {
    try {
      const response = await api.get(`/users/${userId}/orders`);
      console.log("Orders Data:", response.data);
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${userId}`);
        setUserData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await api.get(`/payment/user/${userId}`);
        setCards(response.data || []);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
      }
    };

    if (userId) {
      fetchPaymentMethods();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const toggleOrderExpansion = async (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));

    if (!orderItems[orderId] && !expandedOrders[orderId]) {
      try {
        const response = await api.get(`/order_items/${orderId}`);
        console.log('API Response:', response); // Check full response
        console.log('Response data:', response.data); // Check data specifically

        const items = Array.isArray(response.data) ? response.data : [];
        setOrderItems((prev) => ({
          ...prev,
          [orderId]: items,
        }));
      } catch (error) {
        console.error('Error fetching order items:', error.response || error);
        setOrderItems((prev) => ({
          ...prev,
          [orderId]: [],
        }));
      }
    }
  };

  const validatePaymentInfo = () => {
    const { cardholder_name, card_number, expiration_date, cvv, billing_address } = cardDetails;
    
    // Clear previous errors
    const validationErrors = {};
  
    // Validate each field
    if (!cardholder_name) {
      validationErrors.cardholder_name = 'Cardholder name is required.';
    }
    if (!/^\d{15,16}$/.test(card_number)) {
      validationErrors.card_number = 'Card number must be 15 or 16 digits.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
      validationErrors.expiration_date = 'Expiration date must be in MM/YY format.';
    } else {
      // Check if expiration date is not expired
      const [month, year] = expiration_date.split('/');
      const currentDate = new Date();
      const expirationDate = new Date(`20${year}`, month - 1); // Full year from MM/YY
      if (expirationDate < currentDate) {
        validationErrors.expiration_date = 'Card has expired.';
      }
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      validationErrors.cvv = 'CVV must be 3-4 digits.';
    }
    if (!billing_address.line_1) {
      validationErrors['billing_address.line_1'] = 'Billing address line 1 is required.';
    }
    if (!billing_address.city) {
      validationErrors['billing_address.city'] = 'Billing city is required.';
    }
    if (!billing_address.state) {
      validationErrors['billing_address.state'] = 'Billing state is required.';
    }
    if (!billing_address.zip) {
      validationErrors['billing_address.zip'] = 'Billing ZIP code is required.';
    }
  
    // Update the state with errors
    setErrors(validationErrors);
  
    // Return whether the form is valid
    return Object.keys(validationErrors).length === 0;
  };
  
  
  
  

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleStatusFilterChange = (e) => {
    setOrderStatusFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setOrderDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmountFilterChange = (e) => {
    const { name, value } = e.target;
    setOrderAmountFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  }



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('billing_address.')) {
      const field = name.split('.')[1];
      setCardDetails(prev => ({
        ...prev,
        billing_address: {
          ...prev.billing_address,
          [field]: value
        }
      }));
    } else if (name === 'card_number') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 16);
      setCardDetails(prev => ({ ...prev, [name]: numbersOnly }));
    } else if (name === 'expiration_date') {
      const numbersOnly = value.replace(/\D/g, '');
      const formatted = numbersOnly.slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 4);
      setCardDetails(prev => ({ ...prev, [name]: numbersOnly }));
    } else if (['cardholder_name'].includes(name)) { // Ensure cardholder_name is handled
      setCardDetails((prev) => ({ ...prev, [name]: value }));
    }
    else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditCard = (card) => {
    setCardDetails({
      cardholder_name: card.cardholder_name,
      card_number: card.card_number,
      expiration_date: card.expiration_date,
      cvv: '',
      billing_address: {
        line_1: card.billing_address.line_1,
        line_2: card.billing_address.line_2,
        city: card.billing_address.city,
        state: card.billing_address.state,
        zip: card.billing_address.zip,
      }
    });
    setEditCardId(card.preferred_payment_id);
    setShowCardForm(true);
    setIsEditingCard(true);
  };

  const handleAddOrUpdateCard = async (e) => {
    e.preventDefault();
  
    // Clear existing errors
    setErrors({});
  
    if (!validatePaymentInfo()) {
      return; // Stop if validation fails
    }
  
    try {
      if (isEditingCard) {
        await api.put(`/payment/${editCardId}`, {
          ...cardDetails,
          user_id: userId,
        });
        setUpdateSuccess('Payment method updated successfully');
      } else {
        const addressResponse = await api.post('/address', cardDetails.billing_address);
        const billing_address_id = addressResponse.data.address_id;
  
        await api.post('/payment', {
          ...cardDetails,
          user_id: userId,
          billing_address_id,
        });
        setUpdateSuccess('Payment method added successfully');
      }
  
      const response = await api.get(`/payment/user/${userId}`);
      setCards(response.data || []);
      setShowCardForm(false);
      setIsEditingCard(false);
      setEditCardId(null);
  
      setCardDetails({
        cardholder_name: '',
        card_number: '',
        expiration_date: '',
        cvv: '',
        billing_address: {
          line_1: '',
          line_2: '',
          city: '',
          state: '',
          zip: '',
        },
      });
  
      setErrors({}); // Clear errors after successful operation
    } catch (error) {
      console.error('Error adding or updating payment method:', error);
  
      const serverMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : 'This card is already in use. Please use a different card.';
  
      // Handle duplicate card error
      setErrors((prev) => ({
        ...prev,
        card_number: serverMessage.includes('Duplicate entry')
          ? 'This card number already exists. Please use a different card.'
          : serverMessage,
      }));
    }
  };
  
  
  

  // Removed duplicate handleReturnRequest function

  // Add this handler for successful returns
  const handleReturnSuccess = () => {
    setReturnConfirmation({
      orderId: selectedOrder.order_id,
      returnDate: new Date().toISOString().split("T")[0], // Today's date
      refundedAmount: selectedOrder.returned_amount || 0, // Replace with actual amount if available
    });
    // Refresh orders or show success message
    setShowReturnForm(false);
    setSelectedOrder(null);
    fetchOrders(); // Re-fetch orders to update the list
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure all fields are correctly set and handle potential undefined values
      const payload = {
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        email: userData.email || null,
        phone_number: userData.phone_number || null,
      };

      // Send the update request
      await api.put(`/users/${userId}`, payload);

      // Handle successful response
      setShowProfileEditForm(false);
      setUpdateSuccess('Profile updated successfully');
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };


  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${userId}`, {
        address: {
          line_1: userData.address?.line_1 || null,
          line_2: userData.address?.line_2 || null,
          city: userData.address?.city || null,
          state: userData.address?.state || null,
          zip: userData.address?.zip || null,
        }
      });
      setShowAddressEditForm(false);
      setUpdateSuccess('Address updated successfully');
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating address:', error);
      setError('Failed to update address');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/payment/${cardId}`);
      setCards(cards.filter(card => card.preferred_payment_id !== cardId));
      setUpdateSuccess('Payment method deleted successfully');
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const handleReturnRequest = (order) => {
    console.log("Requesting return for order:", order);
    setSelectedOrder(order);
    setShowReturnForm(true);
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (orderStatusFilter !== 'All' && order.order_status !== orderStatusFilter) {
      return false;
    }

    // Filter by date range
    if (orderDateFilter.start || orderDateFilter.end) {
      const orderDate = new Date(order.order_date);
      const startDate = orderDateFilter.start ? new Date(orderDateFilter.start) : null;
      const endDate = orderDateFilter.end ? new Date(orderDateFilter.end) : null;

      if ((startDate && orderDate < startDate) || (endDate && orderDate > endDate)) {
        return false;
      }
    }

    // Filter by amount range
    if (orderAmountFilter.min || orderAmountFilter.max) {
      const amount = parseFloat(order.total_amount);
      const minAmount = orderAmountFilter.min ? parseFloat(orderAmountFilter.min) : null;
      const maxAmount = orderAmountFilter.max ? parseFloat(orderAmountFilter.max) : null;

      if ((minAmount && amount < minAmount) || (maxAmount && amount > maxAmount)) {
        return false;
      }
    }

    return true;
  });


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {updateSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">
          {updateSuccess}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8 space-x-8">
        <button
          onClick={() => handleTabClick('Profile')}
          className={`px-4 py-2 font-semibold ${activeTab === 'Profile' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          Profile
        </button>
        <button
          onClick={() => handleTabClick('Orders')}
          className={`px-4 py-2 font-semibold ${activeTab === 'Orders' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          Orders
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : activeTab === 'Profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              <button
                onClick={() => setShowProfileEditForm(!showProfileEditForm)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                {showProfileEditForm ? "Cancel" : "Edit"}
              </button>
            </div>

            {showProfileEditForm ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={userData.first_name || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={userData.last_name || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={userData.phone_number || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Name</span>
                  <span>{userData.first_name} {userData.last_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Email</span>
                  <span>{userData.email}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Phone</span>
                  <span>{userData.phone_number}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Address Information</h2>
              </div>
              <button
                onClick={() => setShowAddressEditForm(!showAddressEditForm)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                {showAddressEditForm ? "Cancel" : "Edit"}
              </button>
            </div>

            {showAddressEditForm ? (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="address.line_1"
                    value={userData.address?.line_1 || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="address.line_2"
                    value={userData.address?.line_2 || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={userData.address?.city || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={userData.address?.state || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="address.zip"
                    value={userData.address?.zip || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Save Address
                </button>
              </form>
            ) : (
              userData.address && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Street Address</span>
                    <span>{userData.address.line_1}</span>
                  </div>
                  {userData.address.line_2 && (
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Additional Address</span>
                      <span>{userData.address.line_2}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">City</span>
                    <span>{userData.address.city}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">State</span>
                    <span>{userData.address.state}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">ZIP Code</span>
                    <span>{userData.address.zip}</span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Payment Methods Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Payment Methods</h2>
              </div>
              <button
                onClick={() => {
                  setShowCardForm(!showCardForm);
                  setIsEditingCard(false);
                  setEditCardId(null);
                  setErrors({});
                  setCardDetails({
                    cardholder_name: '',
                    card_number: '',
                    expiration_date: '',
                    cvv: '',
                    billing_address: {
                      line_1: '',
                      line_2: '',
                      city: '',
                      state: '',
                      zip: '',
                    },
                  });
                }}
                className="flex items-center space-x-1 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{isEditingCard ? 'Cancel Edit' : 'Add Payment Method'}</span>
              </button>
            </div>

            {showCardForm && (
              <form onSubmit={handleAddOrUpdateCard} className="mb-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
                  <input
                    type="text"
                    name="cardholder_name"
                    value={cardDetails.cardholder_name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none ${
                      errors.cardholder_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter cardholder name"
                  />
                  {errors.cardholder_name && <p className="text-sm text-red-500 mt-1">{errors.cardholder_name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                    <input
                      type="text"
                      name="card_number"
                      value={cardDetails.card_number}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full p-3 border rounded-lg focus:outline-none ${
                        errors.card_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.card_number && <p className="text-sm text-red-500 mt-1">{errors.card_number}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Expiry</label>
                      <input
                        type="text"
                        name="expiration_date"
                        value={cardDetails.expiration_date}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className={`w-full p-3 border rounded-lg focus:outline-none ${
                          errors.expiration_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.expiration_date && <p className="text-sm text-red-500 mt-1">{errors.expiration_date}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        maxLength={4} 
                        placeholder="123/1234"
                        className={`w-full p-3 border rounded-lg focus:outline-none ${
                          errors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.cvv && <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-700">Billing Address</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="billing_address.line_1"
                      value={cardDetails.billing_address.line_1}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                      className={`w-full p-3 border rounded-lg focus:outline-none ${
                        errors['billing_address.line_1'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['billing_address.line_1'] && (
                      <p className="text-sm text-red-500 mt-1">{errors['billing_address.line_1']}</p>
                    )}
                  </div>
                  <input
                    type="text"
                    name="billing_address.line_2"
                    value={cardDetails.billing_address.line_2}
                    onChange={handleInputChange}
                    placeholder="Apt, Suite, etc. (optional)"
                    className="w-full p-3 border rounded-lg focus:outline-none border-gray-300"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="billing_address.city"
                        value={cardDetails.billing_address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className={`w-full p-3 border rounded-lg focus:outline-none ${
                          errors['billing_address.city'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors['billing_address.city'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['billing_address.city']}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="billing_address.state"
                        value={cardDetails.billing_address.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className={`w-full p-3 border rounded-lg focus:outline-none ${
                          errors['billing_address.state'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors['billing_address.state'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['billing_address.state']}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="billing_address.zip"
                        value={cardDetails.billing_address.zip}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                        className={`w-full p-3 border rounded-lg focus:outline-none ${
                          errors['billing_address.zip'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors['billing_address.zip'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['billing_address.zip']}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isEditingCard ? 'Update Payment Method' : 'Add Payment Method'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCardForm(false);
                      setIsEditingCard(false);
                      setEditCardId(null);
                      setErrors({});
                      setCardDetails({
                        cardholder_name: '',
                        card_number: '',
                        expiration_date: '',
                        cvv: '',
                        billing_address: {
                          line_1: '',
                          line_2: '',
                          city: '',
                          state: '',
                          zip: '',
                        },
                      });
                    }}
                    className="py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>

            )}

            {/* Display saved cards only if not editing or adding a card */}
            {!showCardForm && (
              <div className="space-y-4">
                {cards.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payment methods found</p>
                ) : (
                  cards.map(card => (
                    <div key={card.preferred_payment_id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <div className="font-medium">{card.cardholder_name}</div>
                        <div className="text-sm text-gray-500">
                          •••• •••• •••• {card.card_number.slice(-4)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expires: {card.expiration_date}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.preferred_payment_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="orders-list grid grid-cols-1 gap-4">
          <div className="flex flex-col space-y-4 mb-4">
            <h2 className="text-xl font-semibold">Your Orders</h2>

            {/* Order Filters Component */}
            <OrderFilter
              orderStatusFilter={orderStatusFilter}
              orderDateFilter={orderDateFilter}
              orderAmountFilter={orderAmountFilter}
              handleStatusFilterChange={handleStatusFilterChange}
              handleDateFilterChange={handleDateFilterChange}
              handleAmountFilterChange={handleAmountFilterChange}
            />
          </div>

          {/* Filtered Orders */}
          {filteredOrders.length === 0 ? (
            <p>No orders found for the selected filters.</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.order_id}
                className="order-item bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => toggleOrderExpansion(order.order_id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-grow">
                    <div className="text-gray-700 font-semibold">
                      Status: {order.order_status || 'Unknown'}
                    </div>
                    <div className="text-gray-500">
                      Order Date: {new Date(order.order_date).toLocaleDateString()}
                    </div>
                    <div className="text-gray-900 font-bold mt-2">
                      Total Amount: ${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                  </div>
                  {/* Chevron for expansion */}
                  <div className="flex items-center text-gray-500">
                    <div className="mr-2">View Details</div>
                    <svg
                      className={`w-6 h-6 transform transition-transform ${
                        expandedOrders[order.order_id] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expanded Order Items */}
                {expandedOrders[order.order_id] &&
                  orderItems[order.order_id] &&
                  Array.isArray(orderItems[order.order_id]) && (
                    <div className="order-items mt-4">
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Order Items</h3>
                        {orderItems[order.order_id].map((item) => (
                          <div key={item.order_item_id} className="flex justify-between p-2 border-b">
                            <div className="flex items-center space-x-4">
                            <img
                              src={require(`../images/${item.image_path}`)}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => (e.target.src = '/images/placeholder.png')}
                              onLoad={() => console.log(`Image loaded: /images/${item.image_path}`)}
                            />

                              <span>{item.product_name}</span>
                            </div>
                            <span>Quantity: {item.quantity}</span>
                            <span>Price: ${parseFloat(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.order_status === 'Delivered' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturnRequest(order);
                            }}
                            className="mt-4 w-full text-blue-500 bg-gray-100 p-2 rounded hover:bg-blue-100"
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Return Form Modal */}
      {showReturnForm && selectedOrder && (
        <ReturnRequestForm
          order={selectedOrder}
          orderItems={orderItems[selectedOrder.order_id] || []}
          onClose={() => {
            setShowReturnForm(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Return Confirmation Modal */}
      {returnConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Return Confirmation</h2>
            <p>Thank you for your return request. </p>
            <div className="mt-4">
              <p>
                <strong>Order ID:</strong> #{returnConfirmation.orderId}
              </p>
              <p>
                <strong>Return Date:</strong> {returnConfirmation.returnDate}
              </p>
            </div>
            <button
              onClick={() => setReturnConfirmation(null)}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDashboard;