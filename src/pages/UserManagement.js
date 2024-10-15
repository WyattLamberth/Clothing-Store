// src/pages/UserManagement.js
import React, { useState } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', role: 'Admin' },
    { id: 2, name: 'Jane Smith', role: 'Staff' }
  ]);

  const handleEdit = (id) => {
    // Logic for editing user
  };

  const handleDelete = (id) => {
    // Logic for deleting user
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User and Role Management</h1>
      <ul>
        {users.map(user => (
          <li key={user.id} className="flex justify-between items-center mb-4">
            <span>{user.name} - {user.role}</span>
            <div>
              <button onClick={() => handleEdit(user.id)} className="mr-2 text-blue-600">Edit</button>
              <button onClick={() => handleDelete(user.id)} className="text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Add New Employee</button>
    </div>
  );
};

export default UserManagement;
