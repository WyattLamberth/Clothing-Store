import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

const initialUserState = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone_number: '',
  role_id: '',
  password: '',
  address: {
    line_1: '',
    line_2: '',
    city: '',
    state: '',
    zip: ''
  }
};

const UserManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(initialUserState);
  const [editableUser, setEditableUser] = useState(null);

  useEffect(() => {
    // Fetch all users
    fetch('/api/admin/users', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, [token]);

  const handleDeleteUser = (userId) => {
    fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(users.filter(user => user.user_id !== userId));
        alert(data.message);
      })
      .catch(error => console.error('Error deleting user:', error));
  };

  const handleCreateUser = async () => {
    try {
      // Step 1: Create Address
      const addressResponse = await fetch('/api/admin/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser.address)
      });
      const addressData = await addressResponse.json();
  
      if (addressResponse.ok) {
        // Step 2: Create User with addressId
        const userResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...newUser,
            addressId: addressData.addressId  // include addressId
          })
        });
        const userData = await userResponse.json();
  
        if (userResponse.ok) {
          setUsers([...users, { ...newUser, user_id: userData.userId }]);
          setNewUser(initialUserState); // Reset the form
          alert(userData.message);
        } else {
          throw new Error(userData.message);
        }
      } else {
        throw new Error(addressData.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditableUser(user);
  };

  const handleUpdateUser = () => {
    fetch(`/api/admin/users/${editableUser.user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editableUser)
    })
      .then(res => res.json())
      .then(data => {
        setUsers(users.map(user => (user.user_id === editableUser.user_id ? editableUser : user)));
        setEditableUser(null);
        alert(data.message);
      })
      .catch(error => console.error('Error updating user:', error));
  };

  return (
    <div>
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id}>
              <td>{user.user_id}</td>
              <td>{user.first_name}</td>
              <td>{user.last_name}</td>
              <td>{user.email}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleDeleteUser(user.user_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editableUser ? (
        <div>
          <h3>Edit User</h3>
          <input type="text" placeholder="First Name" value={editableUser.first_name} onChange={(e) => setEditableUser({ ...editableUser, first_name: e.target.value })} />
          <input type="text" placeholder="Last Name" value={editableUser.last_name} onChange={(e) => setEditableUser({ ...editableUser, last_name: e.target.value })} />
          <input type="text" placeholder="Username" value={editableUser.username} onChange={(e) => setEditableUser({ ...editableUser, username: e.target.value })} />
          <input type="email" placeholder="Email" value={editableUser.email} onChange={(e) => setEditableUser({ ...editableUser, email: e.target.value })} />
          <input type="text" placeholder="Phone Number" value={editableUser.phone_number} onChange={(e) => setEditableUser({ ...editableUser, phone_number: e.target.value })} />
          <input type="text" placeholder="Role ID" value={editableUser.role_id} onChange={(e) => setEditableUser({ ...editableUser, role_id: e.target.value })} />
          <input type="text" placeholder="Address ID" value={editableUser.address_id} onChange={(e) => setEditableUser({ ...editableUser, address_id: e.target.value })} />
          <button onClick={handleUpdateUser}>Update User</button>
          <button onClick={() => setEditableUser(null)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h3>Create New User</h3>
          <input type="text" placeholder="First Name" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
          <input type="text" placeholder="Last Name" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
          <input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input type="text" placeholder="Phone Number" value={newUser.phone_number} onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })} />
          <input type="text" placeholder="Role ID" value={newUser.role_id} onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })} />
          <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <div>
            <h4>Address</h4>
            <input type="text" placeholder="Line 1" value={newUser.address.line_1} onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, line_1: e.target.value } })} />
            <input type="text" placeholder="Line 2" value={newUser.address.line_2} onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, line_2: e.target.value } })} />
            <input type="text" placeholder="City" value={newUser.address.city} onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, city: e.target.value } })} />
            <input type="text" placeholder="State" value={newUser.address.state} onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, state: e.target.value } })} />
            <input type="text" placeholder="Zip" value={newUser.address.zip} onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, zip: e.target.value } })} />
          </div>
          <button onClick={handleCreateUser}>Create User</button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
