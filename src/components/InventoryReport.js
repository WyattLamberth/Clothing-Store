import React, { useState, useEffect } from 'react';
import { Package2, AlertTriangle, BarChart3, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import DataTable from './DataTable';

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
            averageReturnRate: 0,
            inventoryTurnover: 0,
            daysOfStock: 0,
            storageUtilization: 0,
            deadStock: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Add these state declarations at the beginning of the component, after the existing useState declarations
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [sortBy, setSortBy] = useState('stock_quantity');

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
        const rate = data?.summary?.overallReturnRate;
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

    const filteredProducts = data.stockLevels
        .filter(product =>
            (selectedCategory === 'all' || product.category_name === selectedCategory) &&
            (!filterLowStock || (Number(product.stock_quantity) <= Number(product.reorder_threshold)))
        )
        .sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0));

    const MetricCard = ({ title, value, icon: Icon, alert, subValue, trend }) => (
        <div className={`bg-white p-6 rounded-lg shadow ${alert ? 'border-l-4 border-red-500' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                    {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
                    {trend && (
                        <div className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'} mt-1`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${alert ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <Icon className={`w-6 h-6 ${alert ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
            </div>
        </div>
    );


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
                            <p className="text-sm text-gray-500">Overall Return Rate</p>
                            <h3 className="text-2xl font-bold text-red-500">
                                {getReturnRateDisplay()}
                            </h3>
                        </div>
                        <RefreshCcw className="h-8 w-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Filter
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="all">All Categories</option>
                            {data.categoryTotals.map((category) => (
                                <option key={category.category_name} value={category.category_name}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="stock_quantity">Stock Quantity</option>
                            <option value="price">Price</option>
                            <option value="reorder_threshold">Reorder Threshold</option>
                        </select>
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={filterLowStock}
                                onChange={(e) => setFilterLowStock(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Show Only Low Stock Items</span>
                        </label>
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
            <div className="space-y-6">
                {/* Product Stock Levels Table */}
                <DataTable
                    title="Product Stock Levels Data"
                    data={data.stockLevels.map(item => ({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        category: item.category_name,
                        stock_quantity: item.stock_quantity,
                        price: formatCurrency(item.price),
                        reorder_threshold: item.reorder_threshold,
                        stock_value: formatCurrency(item.stock_value)
                    }))}
                    columns={[
                        { header: 'Product ID', accessorKey: 'product_id' },
                        { header: 'Product Name', accessorKey: 'product_name' },
                        { header: 'Category', accessorKey: 'category' },
                        { header: 'Current Stock', accessorKey: 'stock_quantity' },
                        { header: 'Price', accessorKey: 'price' },
                        { header: 'Reorder Threshold', accessorKey: 'reorder_threshold' },
                        { header: 'Stock Value', accessorKey: 'stock_value' }
                    ]}
                    exportFileName="inventory_stock_levels.csv"
                />

                {/* Category Totals Table */}
                <DataTable
                    title="Category Inventory Summary"
                    data={data.categoryTotals.map(cat => ({
                        category: cat.category_name,
                        product_count: cat.product_count,
                        total_items: cat.total_items,
                        total_value: formatCurrency(cat.total_value),
                        average_value: formatCurrency(cat.total_value / cat.product_count)
                    }))}
                    columns={[
                        { header: 'Category', accessorKey: 'category' },
                        { header: 'Number of Products', accessorKey: 'product_count' },
                        { header: 'Total Items', accessorKey: 'total_items' },
                        { header: 'Total Value', accessorKey: 'total_value' },
                        { header: 'Average Value per Product', accessorKey: 'average_value' }
                    ]}
                    exportFileName="inventory_category_summary.csv"
                />

                {/* Low Stock Items Table */}
                <DataTable
                    title="Low Stock Alert Items"
                    data={data.lowStock.map(item => ({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        category: item.category_name,
                        current_stock: item.stock_quantity,
                        reorder_threshold: item.reorder_threshold,
                        price: formatCurrency(item.price),
                        needed_stock: item.reorder_threshold - item.stock_quantity
                    }))}
                    columns={[
                        { header: 'Product ID', accessorKey: 'product_id' },
                        { header: 'Product Name', accessorKey: 'product_name' },
                        { header: 'Category', accessorKey: 'category' },
                        { header: 'Current Stock', accessorKey: 'current_stock' },
                        { header: 'Reorder Threshold', accessorKey: 'reorder_threshold' },
                        { header: 'Price', accessorKey: 'price' },
                        { header: 'Units Needed', accessorKey: 'needed_stock' }
                    ]}
                    exportFileName="low_stock_items.csv"
                />
            </div>
        </div>
    );
};

export default InventoryReport;