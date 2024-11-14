import React, { useState, useEffect } from 'react';
import { User, MapPin, ShoppingBag, CreditCard, Plus, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const ProfileDashboard = () => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [showProfileEditForm, setShowProfileEditForm] = useState(false);
  const [showAddressEditForm, setShowAddressEditForm] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [cards, setCards] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editCardId, setEditCardId] = useState(null);
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

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
      const numbersOnly = value.replace(/\D/g, '').slice(0, 3);
      setCardDetails(prev => ({ ...prev, [name]: numbersOnly }));
    } else {
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
    try {
      if (isEditingCard) {
        await api.put(`/payment/${editCardId}`, {
          ...cardDetails,
          user_id: userId
        });
        setUpdateSuccess('Payment method updated successfully');
      } else {
        const addressResponse = await api.post('/address', cardDetails.billing_address);
        const billing_address_id = addressResponse.data.address_id;
  
        await api.post('/payment', {
          ...cardDetails,
          user_id: userId,
          billing_address_id
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
        }
      });
    } catch (error) {
      console.error('Error adding or updating payment method:', error);
      setError('Failed to add or update payment method');
    }
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
          onClick={() => handleTabClick('Return&Orders')}
          className={`px-4 py-2 font-semibold ${activeTab === 'Return&Orders' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          Return&Orders
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
              <form onSubmit={handleAddOrUpdateCard} className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    name="cardholder_name"
                    value={cardDetails.cardholder_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      name="card_number"
                      value={cardDetails.card_number}
                      onChange={handleInputChange}
                      placeholder="1234567890123456"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input
                        type="text"
                        name="expiration_date"
                        value={cardDetails.expiration_date}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mt-4">
                  <h3 className="font-medium">Billing Address</h3>
                  <input
                    type="text"
                    name="billing_address.line_1"
                    value={cardDetails.billing_address.line_1}
                    onChange={handleInputChange}
                    placeholder="Street Address"
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    name="billing_address.line_2"
                    value={cardDetails.billing_address.line_2}
                    onChange={handleInputChange}
                    placeholder="Apt, Suite, etc. (optional)"
                    className="w-full p-2 border rounded"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="billing_address.city"
                      value={cardDetails.billing_address.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="text"
                      name="billing_address.state"
                      value={cardDetails.billing_address.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="billing_address.zip"
                    value={cardDetails.billing_address.zip}
                    onChange={handleInputChange}
                    placeholder="ZIP Code"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    {isEditingCard ? 'Update Payment Method' : 'Add Payment Method'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCardForm(false);
                      setIsEditingCard(false);
                      setEditCardId(null);
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>
          <div className="text-gray-500 text-center py-8">
            No recent orders found
          </div>
        </div>
      )}
    </div>
  );
};
  

export default ProfileDashboard;


