import React from 'react';
import ProfileDashboard from '../components/ProfileDashboard';
import { useState } from 'react';

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ProfileDashboard />
      </main>
    </div>
  );
};

export default ProfilePage;






































