import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, CircleDollarSign, ShoppingCart } from 'lucide-react';
import api from '../utils/api';

const CustomerAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30d');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [timeRange, dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/customer-analytics', {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching customer analytics:', err);
            setError('Failed to fetch customer analytics data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative">
                <span className="block sm:inline">No data available</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Controls */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quick Range</label>
                        <select
                            value={timeRange}
                            onChange={(e) => {
                                setTimeRange(e.target.value);
                                const end = new Date();
                                let start = new Date();
                                switch (e.target.value) {
                                    case '7d':
                                        start.setDate(end.getDate() - 7);
                                        break;
                                    case '90d':
                                        start.setDate(end.getDate() - 90);
                                        break;
                                    case '1y':
                                        start.setFullYear(end.getFullYear() - 1);
                                        break;
                                    default:
                                        start.setDate(end.getDate() - 30);
                                }
                                setDateRange({
                                    start: start.toISOString().split('T')[0],
                                    end: end.toISOString().split('T')[0]
                                });
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Custom Range</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="rounded-md border-gray-300"
                            />
                            <span className="self-center">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="rounded-md border-gray-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Segments Overview */}
            {data.customerSegments && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.customerSegments.map(segment => (
                        <div key={segment.segment} className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900">{segment.segment} Customers</h3>
                            <dl className="mt-5 grid grid-cols-1 gap-5">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Count</dt>
                                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                        {segment.customer_count}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Avg. Spend</dt>
                                    <dd className="mt-1 text-xl font-semibold text-gray-900">
                                        {formatCurrency(segment.avg_spend)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Active (90 days)</dt>
                                    <dd className="mt-1 text-xl font-semibold text-gray-900">
                                        {segment.active_last_90_days}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    ))}
                </div>
            )}

            {/* Retention Trends */}
            {data.retentionTrends && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Customer Retention Trends</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.retentionTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="new_customers"
                                    name="New Customers"
                                    stroke="#8884d8"
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="returning_customers"
                                    name="Returning Customers"
                                    stroke="#82ca9d"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="retention_rate"
                                    name="Retention Rate %"
                                    stroke="#ffc658"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Category Preferences */}
            {data.categoryPreferences && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Category Preferences by Segment</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.categoryPreferences}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                                <Bar dataKey="order_count" name="Orders" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Top Customers Table */}
            {data.topCustomers && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Top Customers</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Orders
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Spent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Avg Order Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Returns
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Order
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.topCustomers.map((customer) => (
                                    <tr key={customer.user_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {customer.first_name} {customer.last_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.total_orders}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(customer.total_spent)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(customer.avg_order_value)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.returns}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(customer.last_order_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerAnalytics;