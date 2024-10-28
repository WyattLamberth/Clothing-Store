import React, { useState, useEffect } from 'react';
import { Package2, Truck, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/all-orders');
      const ordersData = response.data;
      setOrders(ordersData);
      
      // Calculate stats
      const stats = {
        totalOrders: ordersData.length,
        pendingOrders: ordersData.filter(order => order.order_status === 'Pending').length,
        shippedOrders: ordersData.filter(order => order.order_status === 'Shipped').length,
        deliveredOrders: ordersData.filter(order => order.order_status === 'Delivered').length,
        totalRevenue: ordersData.reduce((sum, order) => sum + Number(order.total_amount), 0)
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { order_status: newStatus });
      fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const OrderModal = ({ order, onClose }) => {
    if (!order) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Details #{order.order_id}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Order Status</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <select
                      value={order.order_status}
                      onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                      className="w-full rounded border-gray-300 shadow-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="RETURNED">Returned</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Order Date</h3>
                  <p>{new Date(order.order_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Order Total</h3>
                <p>${Number(order.total_amount).toFixed(2)}</p>
              </div>

              {/* Add more order details as needed */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.order_status.toLowerCase() === selectedStatus.toLowerCase());

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Shipped': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'RETURNED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders Management</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.totalOrders}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Shipped Orders</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-blue-600">{stats.shippedOrders}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Delivered Orders</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">${stats.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Orders</h3>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded border-gray-300 shadow-sm"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
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
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Updates</h3>
            <div className="space-y-4">
              {orders
                .filter(order => order.order_status === 'Pending')
                .slice(0, 5)
                .map((order) => (
                  <div key={order.order_id} className="flex items-center space-x-3 text-sm">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">New Order #{order.order_id}</p>
                      <p className="text-gray-500">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && (
        <OrderModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrdersManagement;