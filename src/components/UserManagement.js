import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, UserPlus, Mail, Phone, MapPin, Power } from 'lucide-react';
import api from '../utils/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activatingUser, setActivatingUser] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        adminUsers: 0,
        employeeUsers: 0,
        customerUsers: 0
    });

    // Fetch initial data
    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    // Simplified fetchUsers function - no need for multiple API calls
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            const usersData = response.data;

            // No need for Promise.all since the addresses are included
            setUsers(usersData);
            setStats({
                totalUsers: usersData.length,
                adminUsers: usersData.filter(user => user.role_id === 3).length,
                employeeUsers: usersData.filter(user => user.role_id === 2).length,
                customerUsers: usersData.filter(user => user.role_id === 1).length
            });
            setError(null);
        } catch (err) {
            setError('Failed to fetch users. Please try again later.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Rest of your existing functions remain the same
    const fetchRoles = async () => {
        try {
            const response = await api.get('/admin/roles');
            setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Failed to fetch roles. Please try again later.');
        }
    };

    // Create new user
    const handleCreateUser = async (formData) => {
        try {
            // First create address
            const addressResponse = await api.post('/admin/address', {
                line_1: formData.line_1,
                line_2: formData.line_2,
                city: formData.city,
                state: formData.state,
                zip: formData.zip
            });

            const addressId = addressResponse.data.addressId;

            // Then create user with address ID
            await api.post('/admin/users', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                username: formData.username,
                email: formData.email,
                phone_number: formData.phone_number,
                password: formData.password,
                role_id: formData.role_id,
                addressId: addressId
            });

            fetchUsers(); // Refresh user list
            setShowAddModal(false);
            setError(null);
        } catch (err) {
            setError('Failed to create user. Please try again.');
            console.error('Error creating user:', err);
        }
    };

    const handleUpdateUser = async (userId, formData) => {
        try {
            // Update user data
            await api.put(`/admin/users/${userId}`, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone_number: formData.phone_number,
                role_id: formData.role_id
            });

            // If there's an address, update it
            if (formData.address_id) {
                await api.put(`/admin/address/${formData.address_id}`, {
                    line_1: formData.line_1,
                    line_2: formData.line_2,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip
                });
            }

            fetchUsers();
            setShowEditModal(false);
            setSelectedUser(null);
            setError(null);
        } catch (err) {
            setError('Failed to update user. Please try again.');
            console.error('Error updating user:', err);
        }
    };

    const handleToggleActivation = async (userId, currentStatus) => {
        try {
            const endpoint = currentStatus ? 'deactivate' : 'activate';
            await api.put(`/admin/users/${userId}/${endpoint}`);
            fetchUsers(); // Refresh user list
            setError(null);
        } catch (err) {
            setError(`Failed to ${currentStatus ? 'deactivate' : 'activate'} user. Please try again.`);
            console.error('Error toggling user activation:', err);
        } finally {
            setActivatingUser(null);
        }
    };



    // Delete user
    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers(); // Refresh user list
                setError(null);
            } catch (err) {
                setError('Failed to delete user. Please try again.');
                console.error('Error deleting user:', err);
            }
        }
    };

    // Update renderUserRow to include activation toggle
    const renderUserRow = (user) => (
        <tr key={user.user_id} className={!user.active ? 'bg-gray-50' : ''}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                            {!user.active && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.email}</div>
                <div className="text-sm text-gray-500">{user.phone_number}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${user.role_id === 3 ? 'bg-blue-100 text-blue-800' : ''}
                    ${user.role_id === 2 ? 'bg-green-100 text-green-800' : ''}
                    ${user.role_id === 1 ? 'bg-purple-100 text-purple-800' : ''}`}
                >
                    {roles.find(role => role.role_id === user.role_id)?.role_name || 'Unknown'}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.address ? (
                    <>
                        {user.address.line_1}
                        {user.address.line_2 && `, ${user.address.line_2}`}
                        {user.address.city && `, ${user.address.city}`}
                        {user.address.state && `, ${user.address.state}`}
                        {user.address.zip && ` ${user.address.zip}`}
                    </>
                ) : (
                    <span className="text-gray-400 italic">No address provided</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(user.user_id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleToggleActivation(user.user_id, user.active)}
                        disabled={activatingUser === user.user_id}
                        className={`${user.active ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                            }`}
                    >
                        <Power className="h-5 w-5" />
                    </button>
                </div>
            </td>
        </tr>
    );

    const UserForm = ({ onClose, initialData = null }) => {
        const [formData, setFormData] = useState({
            first_name: initialData?.first_name || '',
            last_name: initialData?.last_name || '',
            username: initialData?.username || '',
            email: initialData?.email || '',
            phone_number: initialData?.phone_number || '',
            role_id: initialData?.role_id || '1',
            password: '',
            active: initialData?.active ?? true,
            address_id: initialData?.address_id || null,  // Add this line
            line_1: initialData?.address?.line_1 || '',
            line_2: initialData?.address?.line_2 || '',
            city: initialData?.address?.city || '',
            state: initialData?.address?.state || '',
            zip: initialData?.address?.zip || ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (initialData) {
                await handleUpdateUser(initialData.user_id, formData);
            } else {
                await handleCreateUser(formData);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {initialData ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Add Account Status field */}
                            <div className="mt-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Account Active</span>
                                </label>
                            </div>
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={formData.role_id}
                                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    >
                                        {roles.map(role => (
                                            <option key={role.role_id} value={role.role_id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field - Only show for new users */}
                            {!initialData && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            )}

                            {/* Address Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Address Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                                        <input
                                            type="text"
                                            value={formData.line_1}
                                            onChange={(e) => setFormData({ ...formData, line_1: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={formData.line_2}
                                            onChange={(e) => setFormData({ ...formData, line_2: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {initialData ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <span
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setError(null)}
                    >
                        <X className="h-5 w-5 text-red-500 cursor-pointer" />
                    </span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                    <UserPlus className="h-5 w-5" />
                    <span>Add User</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.totalUsers}</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Admins</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold text-blue-600">{stats.adminUsers}</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Employees</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold text-green-600">{stats.employeeUsers}</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Customers</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold text-purple-600">{stats.customerUsers}</span>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-4">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(renderUserRow)}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <UserForm onClose={() => setShowAddModal(false)} />
            )}
            {showEditModal && (
                <UserForm
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                    initialData={selectedUser}
                />
            )}
        </div>
    );
};

export default UserManagement;