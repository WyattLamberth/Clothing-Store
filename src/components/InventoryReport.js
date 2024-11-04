import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package2, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import api from '../utils/api';

const InventoryReport = () => {
    const [data, setData] = useState({
        stockLevels: [],
        returnRates: [],
        lowStock: [],
        categoryTotals: [],
        summary: {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            averageReturnRate: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // Helper function to safely format numbers
    const formatNumber = (value, decimals = 2) => {
        const num = Number(value);
        return isNaN(num) ? '0' : num.toFixed(decimals);
    };

    // Helper function to format currency
    const formatCurrency = (value) => {
        const num = Number(value);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    useEffect(() => {
        fetchInventoryReport();
    }, []);

    const fetchInventoryReport = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/inventory');
            if (response.data) {
                // Process all numeric values in the stockLevels array
                const processedStockLevels = response.data.stockLevels?.map(item => ({
                    ...item,
                    stock_value: Number(item.stock_value) || 0,
                    stock_quantity: Number(item.stock_quantity) || 0,
                    reorder_threshold: Number(item.reorder_threshold) || 0
                })) || [];

                // Process category totals
                const processedCategoryTotals = response.data.categoryTotals?.map(category => ({
                    ...category,
                    total_value: Number(category.total_value) || 0,
                    total_items: Number(category.total_items) || 0
                })) || [];

                const processedData = {
                    ...response.data,
                    stockLevels: processedStockLevels,
                    categoryTotals: processedCategoryTotals,
                    summary: {
                        totalProducts: Number(response.data.summary?.totalProducts) || 0,
                        totalValue: Number(response.data.summary?.totalValue) || 0,
                        lowStockCount: Number(response.data.summary?.lowStockCount) || 0,
                        averageReturnRate: Number(response.data.summary?.averageReturnRate) || 0
                    }
                };
                setData(processedData);
            }
            setError(null);
        } catch (err) {
            setError('Failed to fetch inventory report');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading inventory report...</div>
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Inventory Health Report</h2>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Export Report
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <Package2 className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Products</p>
                            <p className="text-2xl font-bold">{data.summary.totalProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(data.summary.totalValue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-2xl font-bold">{data.summary.lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-500" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Avg Return Rate</p>
                            <p className="text-2xl font-bold">{formatNumber(data.summary.averageReturnRate)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'stock', 'returns', 'categories'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">Category Distribution</h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.categoryTotals}
                                        dataKey="total_value"
                                        nameKey="category_name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label
                                    >
                                        {data.categoryTotals.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.stockLevels.map((item) => (
                                    <tr key={item.product_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.category_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.stock_quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatCurrency(Number(item.stock_value) || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.stock_quantity <= item.reorder_threshold
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {item.stock_quantity <= item.reorder_threshold ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'returns' && (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Return Rates by Product</h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.returnRates}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="product_name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="return_rate" fill="#8884d8" name="Return Rate (%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">Category Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {data.categoryTotals.map((category) => (
                                <div key={category.category_name} className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium">{category.category_name}</h4>
                                    <p className="text-sm text-gray-500">Total Items: {category.total_items}</p>
                                    <p className="text-sm text-gray-500">Value: {formatCurrency(category.total_value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryReport;