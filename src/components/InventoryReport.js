import React, { useState, useEffect } from 'react';
import { Package2, AlertTriangle, BarChart3, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

    useEffect(() => {
        fetchInventoryData();
    }, []);

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/inventory');
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching inventory data:', err);
            setError('Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        // Handle invalid values
        if (value === null || value === undefined || isNaN(value)) {
            return '$0.00';
        }

        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        // Format the number
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const getReturnRateDisplay = () => {
        const rate = data?.summary?.averageReturnRate;
        if (rate === null || rate === undefined) {
            return '0.0%';
        }
        return `${rate.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Products</p>
                            <h3 className="text-2xl font-bold">{data?.summary?.totalProducts || 0}</h3>
                        </div>
                        <Package2 className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <h3 className="text-2xl font-bold text-amber-500">{data?.summary?.lowStockCount || 0}</h3>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Inventory Value</p>
                            <h3 className="text-2xl font-bold">
                                {formatCurrency(data?.summary?.totalValue || 0)}
                            </h3>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Average Return Rate</p>
                            <h3 className="text-2xl font-bold text-red-500">
                                {getReturnRateDisplay()}
                            </h3>
                        </div>
                        <RefreshCcw className="h-8 w-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Category Performance Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Category Performance</h3>
                <div className="h-80">
                    {data?.categoryTotals?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.categoryTotals}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category_name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'total_value' ? formatCurrency(value || 0) : (value || 0),
                                        name === 'total_value' ? 'Total Value' : 'Product Count'
                                    ]}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="product_count" name="Product Count" fill="#8884d8" />
                                <Bar yAxisId="right" dataKey="total_value" name="Total Value" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No category data available
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alert Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Low Stock Alerts</h3>
                <div className="overflow-x-auto">
                    {data?.lowStock?.length > 0 ? (
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
                                        Current Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reorder Threshold
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.lowStock.map((item) => (
                                    <tr key={item.product_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{item.category_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-red-600 font-medium">{item.stock_quantity}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{item.reorder_threshold}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            No low stock items to display
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;