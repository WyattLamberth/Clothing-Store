import React from 'react';
import ProfileDashboard from '../components/ProfileDashboard';

const ProfilePage = () => {
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






































