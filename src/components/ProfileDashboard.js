import React, { useState } from 'react';
import { Wallet, ShoppingCart, User } from 'lucide-react';

const ProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState("wallet");
  const [showCardForm, setShowCardForm] = useState(false);
  const [showProfileEditForm, setShowProfileEditForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardHolder: '',
    cardNumber: '',
    exp: '',
    cvv: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
    },
  });

  // Hardcoded mock user data
  const [mockUserData, setMockUserData] = useState({
    id: 4,
    firstName: 'Jane',
    lastName: 'Doe',
    address: {
      line1: '456 Elm St',
      line2: '',
      city: 'Somewhere',
      state: 'NY',
      zip: '67890',
    },
    email: 'jane.doe@example.com',
    phone: '555-123-4567',
  });

  const sections = [
    { id: "wallet", label: "My Wallet", icon: Wallet },
    { id: "orders", label: "My Orders", icon: ShoppingCart },
    { id: "personalInfo", label: "Personal Information", icon: User },
  ];

  const [cards, setCards] = useState([]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('line')) {
      const lineKey = name.split('.')[1];
      setCardDetails((prev) => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [lineKey]: value },
      }));
    } else {
      setCardDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    const newCard = {
      cardHolder: cardDetails.cardHolder,
      cardNumber: cardDetails.cardNumber.slice(-4),
      exp: cardDetails.exp,
      billingAddress: cardDetails.billingAddress,
    };
    setCards((prev) => [...prev, newCard]);
    resetCardForm();
  };

  const resetCardForm = () => {
    setCardDetails({
      cardHolder: '',
      cardNumber: '',
      exp: '',
      cvv: '',
      billingAddress: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip: '',
      },
    });
    setShowCardForm(false);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('line')) {
      const lineKey = name.split('.')[1];
      setMockUserData((prev) => ({
        ...prev,
        address: { ...prev.address, [lineKey]: value },
      }));
    } else {
      setMockUserData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Update the user data (this would typically involve an API call)
    setShowProfileEditForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "wallet" && (
          <div>
            <h2 className="text-lg font-semibold">My Wallet</h2>
            <button
              onClick={() => setShowCardForm(!showCardForm)}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 transition"
            >
              {showCardForm ? "Cancel" : "Add New Card"}
            </button>
            {showCardForm && (
              <form onSubmit={handleCardSubmit} className="mt-4 space-y-4">
                <input
                  type="text"
                  name="cardHolder"
                  placeholder="Card Holder Name"
                  value={cardDetails.cardHolder}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Card Number"
                  value={cardDetails.cardNumber}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="exp"
                  placeholder="Expiration Date (MM/YY)"
                  value={cardDetails.exp}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  value={cardDetails.cvv}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <h3 className="text-md font-semibold">Billing Address</h3>
                <input
                  type="text"
                  name="billingAddress.line1"
                  placeholder="Address Line 1"
                  value={cardDetails.billingAddress.line1}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="billingAddress.line2"
                  placeholder="Address Line 2 (optional)"
                  value={cardDetails.billingAddress.line2}
                  onChange={handleCardChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="billingAddress.city"
                  placeholder="City"
                  value={cardDetails.billingAddress.city}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="billingAddress.state"
                  placeholder="State"
                  value={cardDetails.billingAddress.state}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="billingAddress.zip"
                  placeholder="Zip Code"
                  value={cardDetails.billingAddress.zip}
                  onChange={handleCardChange}
                  required
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <button type="submit" className="mt-4 bg-green-500 text-white py-2 px-4 rounded shadow hover:bg-green-600 transition">
                  Submit
                </button>
              </form>
            )}
            <h3 className="mt-6 text-lg font-semibold">My Cards</h3>
            {cards.length === 0 ? (
              <p>No cards added yet.</p>
            ) : (
              <ul className="space-y-2">
                {cards.map((card, index) => (
                  <li key={index} className="border p-4 rounded shadow hover:shadow-lg transition">
                    <p><strong>Card Number:</strong> XXXX XXXX XXXX {card.cardNumber}</p>
                    <p><strong>Expiration Date:</strong> {card.exp}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {activeTab === "orders" && <div>Your order history goes here.</div>}
        {activeTab === "personalInfo" && (
          <div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <button
              onClick={() => setShowProfileEditForm(!showProfileEditForm)}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 transition"
            >
              {showProfileEditForm ? "Cancel" : "Edit Profile"}
            </button>
            {showProfileEditForm ? (
              <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
                <div className="flex">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={mockUserData.firstName}
                      onChange={handleProfileChange}
                      className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                      required
                    />
                  </div>
                  <div className="flex-1 ml-2">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={mockUserData.lastName}
                      onChange={handleProfileChange}
                      className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                      required
                    />
                  </div>
                </div>
                <input
                  type="text"
                  name="email"
                  placeholder="Email"
                  value={mockUserData.email}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={mockUserData.phone}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <h3 className="text-md font-semibold">Address</h3>
                <input
                  type="text"
                  name="address.line1"
                  placeholder="Address Line 1"
                  value={mockUserData.address.line1}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <input
                  type="text"
                  name="address.line2"
                  placeholder="Address Line 2 (optional)"
                  value={mockUserData.address.line2}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                />
                <input
                  type="text"
                  name="address.city"
                  placeholder="City"
                  value={mockUserData.address.city}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <input
                  type="text"
                  name="address.state"
                  placeholder="State"
                  value={mockUserData.address.state}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <input
                  type="text"
                  name="address.zip"
                  placeholder="Zip Code"
                  value={mockUserData.address.zip}
                  onChange={handleProfileChange}
                  className="border p-2 rounded w-full shadow hover:border-blue-300 transition"
                  required
                />
                <button type="submit" className="mt-4 bg-green-500 text-white py-2 px-4 rounded shadow hover:bg-green-600 transition">
                  Save
                </button>
              </form>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p><strong>User ID:</strong> <span className="text-gray-500">{mockUserData.id}</span></p>
                  </div>
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p><strong>First Name:</strong> {mockUserData.firstName}</p>
                  </div>
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p><strong>Last Name:</strong> {mockUserData.lastName}</p>
                  </div>
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p><strong>Email:</strong> {mockUserData.email}</p>
                  </div>
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p><strong>Phone Number:</strong> {mockUserData.phone}</p>
                  </div>
                  <div className="p-4 bg-white shadow-md rounded-lg">
                    <p>
                      <strong>Address:</strong> {`${mockUserData.address.line1}, ${mockUserData.address.line2 || ''} ${mockUserData.address.city}, ${mockUserData.address.state} ${mockUserData.address.zip}`}
                    </p>
                  </div>
                </div>

            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;









































