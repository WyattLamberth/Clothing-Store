import React, { useState, useEffect } from 'react';
import { Package2, ArrowUpRight, ArrowDownRight, Filter, X, Check, Ban } from 'lucide-react';
import api from '../utils/api';

const ReturnsDashboard = () => {
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    totalRefunds: 0
  });

  useEffect(() => {
    fetchReturns();
  }, [filters]);

  // Add this after your fetchReturns declaration
  const fetchReturns = async () => {
    try {
      setLoading(true);
      console.log('Fetching returns with filters:', filters); // Debug log

      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/staff/returns?${queryParams}`);
      console.log('Returns API response:', response.data); // Debug log

      const returnsData = response.data;
      
      // Add null checks and default values
      const processedReturns = returnsData.map(ret => ({
        ...ret,
        return_items: ret.return_items ? 
          (typeof ret.return_items === 'string' ? 
            JSON.parse(ret.return_items) : ret.return_items) 
          : [],
        refund_amount: ret.refund_amount || 0,
        first_name: ret.first_name || 'Unknown',
        last_name: ret.last_name || 'Customer',
        email: ret.email || 'No email provided'
      }));

      setReturns(processedReturns);
      calculateStats(processedReturns);
      setError(null);
    } catch (error) {
      console.error('Error fetching returns:', error);
      console.error('Error details:', error.response?.data); // Debug log
      setError(`Failed to fetch returns data: ${error.message}`);
      setReturns([]); // Clear returns on error
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (returnsData) => {
    const stats = {
      totalReturns: returnsData.length,
      pendingReturns: returnsData.filter(r => r.return_status === 'Pending').length,
      approvedReturns: returnsData.filter(r => r.return_status === 'Approved').length,
      totalRefunds: returnsData.reduce((sum, r) => sum + Math.abs(r.refund_amount || 0), 0)
    };
    setStats(stats);
  };

  const handleStatusUpdate = async (returnId, newStatus, approval) => {
    try {
      await api.put(`/staff/returns/${returnId}`, {
        return_status: newStatus,
        approval: approval
      });
      fetchReturns();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating return status:', error);
      setError('Failed to update return status');
    }
  };

  const ReturnDetailsModal = ({ return_data, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Return Details #{return_data.return_id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer Info</h3>
                <p className="mt-1">{return_data.first_name} {return_data.last_name}</p>
                <p className="text-sm text-gray-500">{return_data.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Details</h3>
                <p className="mt-1">Order #{return_data.order_id}</p>
                <p className="text-sm text-gray-500">
                  {new Date(return_data.order_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Return Items</h3>
              <div className="border rounded-lg divide-y">
                {return_data.return_items.map((item, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {item.image_path && (
                        <img
                          src={`/api/placeholder/48/48`}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {return_data.return_status === 'Pending' && (
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => handleStatusUpdate(return_data.return_id, 'Approved', true)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4 inline-block mr-2" />
                  Approve Return
                </button>
                <button
                  onClick={() => handleStatusUpdate(return_data.return_id, 'Rejected', false)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 inline-block mr-2" />
                  Reject Return
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Returns</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.totalReturns}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Returns</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-yellow-600">{stats.pendingReturns}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Approved Returns</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-green-600">{stats.approvedReturns}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Refunds</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">${stats.totalRefunds.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
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

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading returns...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returns.map((return_item) => (
                    <tr key={return_item.return_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">#{return_item.return_id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {return_item.first_name} {return_item.last_name}
                        </div>
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
                        {return_item.return_items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${Math.abs(return_item.refund_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

export default ReturnsDashboard;