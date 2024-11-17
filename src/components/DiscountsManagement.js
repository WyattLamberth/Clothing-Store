import React, { useState, useEffect } from 'react';
import { Tag, Calendar, Percent, Plus, X, Trash2, Edit2 } from 'lucide-react';
import api from '../utils/api';

const DiscountsManagement = () => {
  const [saleEvents, setSaleEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    averageDiscount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/sale-events');
      const events = response.data;
      setSaleEvents(events);
      
      const now = new Date();
      const activeEvents = events.filter(event => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        return startDate <= now && endDate >= now;
      });

      const upcomingEvents = events.filter(event => {
        const startDate = new Date(event.start_date);
        return startDate > now;
      });

      const avgDiscount = events.reduce((sum, e) => sum + Number(e.discount_percentage), 0) / events.length;

      setStats({
        totalEvents: events.length,
        activeEvents: activeEvents.length,
        upcomingEvents: upcomingEvents.length,
        averageDiscount: avgDiscount || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this sale event?')) {
      try {
        await api.delete(`/sale-event/${eventId}`);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting sale event:', error);
      }
    }
  };

  const AddEventModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      event_name: '',
      start_date: '',
      end_date: '',
      discount_percentage: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await api.post('/sale-event', {
          event_name: formData.event_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          discount_percentage: parseFloat(formData.discount_percentage)
        });

        fetchData();
        onClose();
      } catch (error) {
        console.error('Error creating sale event:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Sale Event</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Create Sale Event
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discounts Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Create Sale Event</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.totalEvents}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Events</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-green-600">{stats.activeEvents}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Upcoming Events</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold text-blue-600">{stats.upcomingEvents}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Discount</h3>
          <div className="mt-2 flex items-center">
            <span className="text-3xl font-bold">{stats.averageDiscount.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sale Events List */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sale Events</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saleEvents.map((event) => {
                    const now = new Date();
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    let status = 'Upcoming';
                    let statusColor = 'bg-blue-100 text-blue-800';
                    
                    if (startDate <= now && endDate >= now) {
                      status = 'Active';
                      statusColor = 'bg-green-100 text-green-800';
                    } else if (endDate < now) {
                      status = 'Ended';
                      statusColor = 'bg-gray-100 text-gray-800';
                    }

                    return (
                      <tr key={event.sale_event_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.event_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.discount_percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDelete(event.sale_event_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Discounts Sidebar */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Discounts</h3>
            <div className="space-y-4">
              {saleEvents
                .filter(event => {
                  const now = new Date();
                  const startDate = new Date(event.start_date);
                  const endDate = new Date(event.end_date);
                  return startDate <= now && endDate >= now;
                })
                .map((event) => (
                  <div key={event.sale_event_id} className="flex items-center space-x-3">
                    <Tag className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{event.event_name}</p>
                      <p className="text-sm text-gray-500">
                        {event.discount_percentage}% off
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default DiscountsManagement;