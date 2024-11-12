import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ProfileDashboard from '../components/ProfileDashboard';
import { User } from 'lucide-react';
import api from '../utils/api';

const ProfilePage = () => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: {
      line_1: '',
      line_2: '',
      city: '',
      state: '',
      zip: '',
    }
  });

  // Only include the Profile tab
  const tabs = [{ id: 'profile', label: 'Profile', icon: User }];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/users/${userId}`);
        setUserData({
          ...response.data,
          address: {
            line_1: response.data.address?.line_1 || '',
            line_2: response.data.address?.line_2 || '',
            city: response.data.address?.city || '',
            state: response.data.address?.state || '',
            zip: response.data.address?.zip || ''
          }
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileDashboard userData={userData} onUpdateMessage={setUpdateMessage} userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">My Account</h1>
          {updateMessage && (
            <div className="mt-2 text-sm text-green-600">
              {updateMessage}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
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

        {/* Tab Content */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

