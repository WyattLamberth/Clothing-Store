// SalesAnalytics.js
import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import api from '../utils/api';

const SalesAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30d');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewType, setViewType] = useState('chart');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState({
        summary: {
            total_revenue: 0,
            total_orders: 0,
            average_order_value: 0,
            unique_customers: 0,
            total_returns: 0,
            average_refund: 0
        },
        categoryStats: [],
        topProducts: [],
        monthlyRevenue: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange, categoryFilter, dateRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/sales-analytics', {
                params: {
                    timeRange,
                    category: categoryFilter,
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });

            if (response.data) {
                const processedData = {
                    summary: {
                        total_revenue: Number(response.data.summary.total_revenue) || 0,
                        total_orders: Number(response.data.summary.total_orders) || 0,
                        average_order_value: Number(response.data.summary.average_order_value) || 0,
                        unique_customers: Number(response.data.summary.unique_customers) || 0,
                        total_returns: Number(response.data.summary.total_returns) || 0,
                        average_refund: Number(response.data.summary.average_refund) || 0
                    },
                    categoryStats: response.data.categoryStats.map(cat => ({
                        ...cat,
                        revenue: Number(cat.revenue) || 0,
                        order_count: Number(cat.order_count) || 0
                    })),
                    topProducts: response.data.topProducts.map(prod => ({
                        ...prod,
                        total_revenue: Number(prod.total_revenue) || 0,
                        total_quantity: Number(prod.total_quantity) || 0,
                        times_ordered: Number(prod.times_ordered) || 0
                    })),
                    monthlyRevenue: response.data.monthlyRevenue.map(month => ({
                        ...month,
                        revenue: Number(month.revenue) || 0,
                        order_count: Number(month.order_count) || 0
                    }))
                };
                setData(processedData);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to fetch sales analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDateRange = (range) => {
        const end = new Date();
        let start = new Date();

        switch (range) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                break;
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
        setTimeRange(range);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
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

    const MetricCard = ({ title, value, trend, icon: Icon, trendValue }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                    <div className="flex items-center mt-2">
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {trendValue}
                        </span>
                    </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                    <Icon className="w-6 h-6 text-blue-500" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quick Range</label>
                        <select
                            value={timeRange}
                            onChange={(e) => handleQuickDateRange(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Custom Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="mt-1 block rounded-md border-gray-300 shadow-sm"
                            />
                            <span className="self-center">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="mt-1 block rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="all">All Categories</option>
                            {data.categoryStats.map(cat => (
                                <option key={cat.category_name} value={cat.category_name}>
                                    {cat.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <button
                            onClick={() => setViewType(viewType === 'chart' ? 'table' : 'chart')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            {viewType === 'chart' ? 'Show Table' : 'Show Chart'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(data.summary.total_revenue)}
                    trend="up"
                    trendValue="12.5% vs last period"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Total Orders"
                    value={data.summary.total_orders.toLocaleString()}
                    trend="up"
                    trendValue="8.2% vs last period"
                    icon={ShoppingBag}
                />
                <MetricCard
                    title="Average Order Value"
                    value={formatCurrency(data.summary.average_order_value)}
                    trend="down"
                    trendValue="3.1% vs last period"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Returns"
                    value={data.summary.total_returns.toLocaleString()}
                    trend="down"
                    trendValue="2.5% vs last period"
                    icon={ArrowDownRight}
                />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Revenue Trend</h3>
                {viewType === 'chart' ? (
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#0088FE"
                                    name="Revenue"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="order_count"
                                    stroke="#00C49F"
                                    name="Orders"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.monthlyRevenue.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{item.month}</td>
                                        <td className="px-6 py-4">{formatCurrency(item.revenue)}</td>
                                        <td className="px-6 py-4">{item.order_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Category Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryStats}
                                    dataKey="revenue"
                                    nameKey="category_name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {data.categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                        {data.categoryStats.map((category, index) => (
                            <div key={category.category_name} className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span>{category.category_name}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(category.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Top Products</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.topProducts.map((product, index) => (
                                <tr key={product.product_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500">{product.times_ordered}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500">{product.total_quantity}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{formatCurrency(product.total_revenue)}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print-only Summary Section */}
            <div className="hidden print:block mt-8">
                <h2 className="text-xl font-bold mb-4">Sales Analytics Summary</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium">Report Period</h3>
                        <p>{dateRange.start} to {dateRange.end}</p>
                    </div>
                    <div>
                        <h3 className="font-medium">Key Metrics</h3>
                        <ul className="list-disc pl-5">
                            <li>Total Revenue: {formatCurrency(data.summary.total_revenue)}</li>
                            <li>Total Orders: {data.summary.total_orders}</li>
                            <li>Average Order Value: {formatCurrency(data.summary.average_order_value)}</li>
                            <li>Total Returns: {data.summary.total_returns}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium">Generated On</h3>
                        <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;