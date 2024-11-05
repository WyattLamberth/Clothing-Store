import React, { useState } from 'react';

const ProfilePage = () => {
  const initialProfileData = {
    customerId: '12345',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phoneNumber: '123-456-7890',
    passwordHash: 'hashed_password', // Store securely and never display as plain text
    role: 'customer',
    dateJoined: '2024-01-15',
    addressLine1: '123 Main St',
    addressLine2: '',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    wallet: 100.00,
    paymentCards: [
      {
        id: 1,
        cardNumber: '1234 5678 9012 3456',
        cardCVV: '123',
        cardExp: '12/25'
      },
      {
        id: 2,
        cardNumber: '9876 5432 1098 7654',
        cardCVV: '456',
        cardExp: '01/26'
      }
    ]
  };

  // get user id from local storage
  // do api call to get user data
  // something like this -> const profileData = await api.get('');

  const [profileData, setProfileData] = useState(initialProfileData);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(profileData.paymentCards[0] || {});
  const [updateMessage, setUpdateMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setSelectedCard({ ...selectedCard, [name]: value });
  };

  const handleSave = () => {
    // Save profile data logic
    console.log('Profile data saved:', profileData);
    // Assuming you want to save changes to the selected card as well
    const updatedCards = profileData.paymentCards.map(card =>
      card.id === selectedCard.id ? selectedCard : card
    );
    setProfileData({ ...profileData, paymentCards: updatedCards });
    setUpdateMessage('Your profile is being updated.');
    setTimeout(() => setUpdateMessage(''), 3000); // Clear message after 3 seconds
    setIsEditing(false); // Exit editing mode after saving
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Profile Page</h1>

        {updateMessage && (
          <div className="text-green-600 mb-4">{updateMessage}</div>
        )}

        <div className="space-y-4">
          {/* Profile Information */}
          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Customer ID:</label>
            <span className="text-gray-600">{profileData.customerId}</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">First Name:</label>
            <span className="text-gray-600">{profileData.firstName}</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Last Name:</label>
            <span className="text-gray-600">{profileData.lastName}</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Username:</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                className="border rounded px-4 py-2 w-full text-gray-800"
              />
            ) : (
              <span className="text-gray-800">{profileData.username}</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Email:</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                className="border rounded px-4 py-2 w-full text-gray-800"
              />
            ) : (
              <span className="text-gray-800">{profileData.email}</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Phone Number:</label>
            {isEditing ? (
              <input
                type="tel"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleChange}
                className="border rounded px-4 py-2 w-full text-gray-800"
              />
            ) : (
              <span className="text-gray-800">{profileData.phoneNumber}</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Password:</label>
            <span className="text-gray-600">*********</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Role:</label>
            <span className="text-gray-600">{profileData.role}</span>
          </div>

          <div className="flex justify-between items-center">
            <label className="block mb-1 font-medium">Date Joined:</label>
            <span className="text-gray-600">{profileData.dateJoined}</span>
          </div>

          {/* Address Dropdown */}
          <div>
            <div 
              onClick={() => setIsAddressOpen(!isAddressOpen)} 
              className="cursor-pointer border rounded p-4 mb-2 bg-gray-100 text-gray-800 hover:bg-gray-200 flex justify-between items-center"
            >
              <h2 className="font-semibold">Address</h2>
              <i className={`fas fa-caret-${isAddressOpen ? 'up' : 'down'}`}></i>
            </div>
            {isAddressOpen && (
              <div className="border rounded p-4 mb-2 bg-gray-50">
                {isEditing ? (
                  <>
                    <h3 className="font-medium">Edit Address:</h3>
                    <input
                      type="text"
                      name="addressLine1"
                      value={profileData.addressLine1}
                      onChange={handleChange}
                      placeholder="Address Line 1"
                      className="border rounded px-4 py-2 mb-1 w-full text-gray-800"
                    />
                    <input
                      type="text"
                      name="addressLine2"
                      value={profileData.addressLine2}
                      onChange={handleChange}
                      placeholder="Address Line 2"
                      className="border rounded px-4 py-2 mb-1 w-full text-gray-800"
                    />
                    <input
                      type="text"
                      name="city"
                      value={profileData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="border rounded px-4 py-2 mb-1 w-full text-gray-800"
                    />
                    <input
                      type="text"
                      name="state"
                      value={profileData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="border rounded px-4 py-2 mb-1 w-full text-gray-800"
                    />
                    <input
                      type="text"
                      name="zip"
                      value={profileData.zip}
                      onChange={handleChange}
                      placeholder="Zip Code"
                      className="border rounded px-4 py-2 mb-1 w-full text-gray-800"
                    />
                  </>
                ) : (
                  <>
                    <p>{profileData.addressLine1}</p>
                    {profileData.addressLine2 && <p>{profileData.addressLine2}</p>}
                    <p>{profileData.city}, {profileData.state} {profileData.zip}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment Dropdown */}
          <div>
            <div 
              onClick={() => setIsPaymentOpen(!isPaymentOpen)} 
              className="cursor-pointer border rounded p-4 mb-2 bg-gray-100 text-gray-800 hover:bg-gray-200 flex justify-between items-center"
            >
              <h2 className="font-semibold">Payment</h2>
              <i className={`fas fa-caret-${isPaymentOpen ? 'up' : 'down'}`}></i>
            </div>
            {isPaymentOpen && (
              <div className="border rounded p-4 mb-2 bg-gray-50">
                {isEditing ? (
                  <>
                    <h3 className="font-medium">Edit Payment Cards:</h3>
                    <select 
                      onChange={(e) => setSelectedCard(profileData.paymentCards[e.target.value])} 
                      className="mb-2 border rounded p-2"
                    >
                      {profileData.paymentCards.map((card, index) => (
                        <option key={card.id} value={index}>
                          Card {index + 1}
                        </option>
                      ))}
                    </select>
                    <div className="mb-2">
                      <h4 className="font-medium">Card Number:</h4>
                      <input
                        type="text"
                        name="cardNumber"
                        value={selectedCard.cardNumber}
                        onChange={handleCardChange}
                        className="border rounded px-4 py-2 w-full text-gray-800"
                      />
                    </div>
                    <div className="mb-2">
                      <h4 className="font-medium">EXP:</h4>
                      <input
                        type="text"
                        name="cardExp"
                        value={selectedCard.cardExp}
                        onChange={handleCardChange}
                        className="border rounded px-4 py-2 w-full text-gray-800"
                      />
                    </div>
                    <div className="mb-2">
                      <h4 className="font-medium">CVV:</h4>
                      <input
                        type="text"
                        name="cardCVV"
                        value={selectedCard.cardCVV}
                        onChange={handleCardChange}
                        className="border rounded px-4 py-2 w-full text-gray-800"
                      />
                    </div>
                  </>
                ) : (
                  profileData.paymentCards.map((card, index) => (
                    <div key={index} className="mb-2">
                      <h3 className="font-medium">Card {index + 1}:</h3>
                      <p>Card Number: XXXX XXXX XXXX {card.cardNumber.slice(-4)}</p>
                      <p>EXP: {card.cardExp}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <div className="mt-6">
            {isEditing ? (
              <div className="flex space-x-4">
                <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
















