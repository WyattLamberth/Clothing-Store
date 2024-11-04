import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    DollarSign,
    ShoppingBag,
    Users,
    ArrowUpRight,
    TrendingDown,
    Filter,
    X
} from 'lucide-react';
import api from '../utils/api';

const SalesAnalytics = () => {
    const [data, setData] = useState({
        summary: {
            total_orders: 0,
            total_revenue: 0,
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
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [timeFrame, setTimeFrame] = useState('monthly'); // daily, weekly, monthly, yearly
    const [sortBy, setSortBy] = useState('revenue'); // revenue, quantity, orders
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [viewMode, setViewMode] = useState('chart'); // chart, table

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const formatCurrency = (value) => {
        const num = Number(value);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    useEffect(() => {
        fetchSalesAnalytics();
    }, [dateRange, selectedCategory, timeFrame, sortBy]); // Add dependencies to trigger refetch

    const fetchSalesAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/sales-analytics', {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                    category: selectedCategory,
                    timeFrame,
                    sortBy
                }
            });
            if (response.data) {
                // Process numeric values
                const processedData = {
                    summary: {
                        total_orders: Number(response.data.summary.total_orders) || 0,
                        total_revenue: Number(response.data.summary.total_revenue) || 0,
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
                        total_quantity: Number(prod.total_quantity) || 0
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
            setError('Failed to fetch sales report');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading sales report...</div>
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

    const FilterControls = () => (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4 items-center">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date Range</label>
                    <div className="flex gap-2 mt-1">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="rounded-md border-gray-300 shadow-sm"
                        />
                        <span className="self-center">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="all">All Categories</option>
                        {data.categoryStats?.map(cat => (
                            <option key={cat.category_name} value={cat.category_name}>
                                {cat.category_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Time Frame</label>
                    <select
                        value={timeFrame}
                        onChange={(e) => setTimeFrame(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Sort Products By</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="revenue">Revenue</option>
                        <option value="quantity">Quantity Sold</option>
                        <option value="orders">Number of Orders</option>
                    </select>
                </div>

                <button
                    onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                    className="ml-auto px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Toggle View
                </button>
            </div>
        </div>
    );

    const ProductDetailsModal = ({ product, onClose }) => {
        const salesTrend = product.salesTrend || data.monthlyRevenue.map(month => ({
            date: month.month,
            sales: (Math.random() * product.total_revenue / data.monthlyRevenue.length).toFixed(2)
        }));

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{product.product_name}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#3B82F6" name="Sales" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Product Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(product.total_revenue)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Units Sold</p>
                            <p className="text-xl font-bold">{product.total_quantity}</p>
                        </div>
                    </div>

                    {/* Sales Trend Graph */}
                    <div className="h-64 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={product.salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#3B82F6" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Customer Demographics</h4>
                            <p className="text-sm text-gray-600">Show demographics of customers who bought this product</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Related Products</h4>
                            <p className="text-sm text-gray-600">Products often purchased together</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };




    return (
        <div className="space-y-6">
            <FilterControls />
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Sales Performance Report</h2>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Export Report
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-6 rounded-lg shadow col-span-2">
                    <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(data.summary.total_revenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <ShoppingBag className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Orders</p>
                            <p className="text-2xl font-bold">{data.summary.total_orders}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Customers</p>
                            <p className="text-2xl font-bold">{data.summary.unique_customers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <ArrowUpRight className="h-8 w-8 text-indigo-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Avg Order Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(data.summary.average_order_value)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Returns</p>
                            <p className="text-2xl font-bold">{data.summary.total_returns}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Monthly Revenue Trend</h3>
                {viewMode === 'chart' ? (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.monthlyRevenue.map((month) => (
                                    <tr key={month.month}>
                                        <td className="px-6 py-4 whitespace-nowrap">{month.month}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(month.revenue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{month.order_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.topProducts.map((product) => (
                                <tr
                                    key={product.product_id}
                                    onClick={() => setExpandedProduct(product)}
                                    className="cursor-pointer hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.times_ordered}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.total_quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(product.total_revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
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
                                    <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{category.category_name}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(category.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {expandedProduct && (
                <ProductDetailsModal
                    product={expandedProduct}
                    onClose={() => setExpandedProduct(null)}
                />
            )}
        </div>
    );
};

export default SalesAnalytics;