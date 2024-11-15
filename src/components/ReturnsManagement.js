import React, { useState, useEffect } from 'react';
import api from '../utils/api';

// Utility functions
const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Completed': return 'bg-blue-100 text-blue-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ReturnDetailsModal component
const ReturnDetailsModal = ({ return_data, onClose }) => {
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Return Details - #{return_data.return_id}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Customer: {return_data.first_name} {return_data.last_name}</p>
                  <p className="text-sm text-gray-500">Email: {return_data.email}</p>
                  <p className="text-sm text-gray-500">Order Date: {new Date(return_data.order_date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Refund Amount: {formatCurrency(return_data.refund_amount)}</p>
                  <p className="text-sm text-gray-500">Status: {return_data.return_status}</p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold">Items:</h4>
                  <ul>
                    {return_data.return_items && return_data.return_items.map((item) => (
                      <li key={item.product_id} className="text-sm text-gray-500">
                        {item.product_name} - {item.quantity} x {formatCurrency(item.price)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ReturnsManagement component
const ReturnsManagement = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/staff/returns?${queryParams}`);
      setReturns(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching returns:', error);
      setError('Failed to fetch returns. Please try again.');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [filters]);

  const handleStatusUpdate = async (returnId, status, approval) => {
    try {
      await api.put(`/staff/returns/${returnId}`, { return_status: status, approval });
      fetchReturns();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating return status:', error);
    }
  };

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading returns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : returns.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No returns found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((return_item) => (
                  <tr key={return_item.return_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">#{return_item.return_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{return_item.first_name} {return_item.last_name}</div>
                      <div className="text-sm text-gray-500">{return_item.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(return_item.return_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(return_item.return_status)}`}>
                        {return_item.return_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {return_item.return_items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(Math.abs(return_item.refund_amount || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReturn(return_item);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailsModal && selectedReturn && (
        <ReturnDetailsModal
          return_data={selectedReturn}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReturn(null);
          }}
        />
      )}
    </div>
  );
};

export default ReturnsManagement;
