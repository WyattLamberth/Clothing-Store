import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package2, AlertTriangle, TrendingUp, DollarSign, Download, Filter, RefreshCw, Box, Clock, LayoutGrid } from 'lucide-react';
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
            averageReturnRate: 0,
            inventoryTurnover: 0,
            daysOfStock: 0,
            storageUtilization: 0,
            deadStock: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('stock_value');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [timeRange, setTimeRange] = useState('30d');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];


    useEffect(() => {
        fetchData();
    }, [selectedCategory, timeRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/inventory', {
                params: { timeRange }
            });

            const processedReturnRates = (response.data.returnRates || []).map(rate => ({
                ...rate,
                return_rate: Number(rate.return_rate) || 0
            }));

            const processedData = {
                stockLevels: response.data.stockLevels || [],
                returnRates: processedReturnRates,
                lowStock: response.data.lowStock || [],
                categoryTotals: response.data.categoryTotals || [],
                summary: {
                    totalProducts: Number(response.data.summary?.totalProducts) || 0,
                    totalValue: Number(response.data.summary?.totalValue) || 0,
                    lowStockCount: Number(response.data.summary?.lowStockCount) || 0,
                    averageReturnRate: Number(response.data.summary?.averageReturnRate) || 0,
                    inventoryTurnover: Number(response.data.summary?.inventoryTurnover) || 0,
                    daysOfStock: Number(response.data.summary?.daysOfStock) || 0,
                    storageUtilization: Number(response.data.summary?.storageUtilization) || 0,
                    deadStock: Number(response.data.summary?.deadStock) || 0
                }
            };

            setData(processedData);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to fetch inventory data');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getReturnRate = (productId) => {
        const rate = data.returnRates.find(r => r.product_id === productId)?.return_rate;
        return typeof rate === 'number' ? Number(rate).toFixed(1) : '0.0';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Number(value) || 0);
    };

    const exportToCSV = () => {
        if (!data.stockLevels.length) return;

        const csvContent = [
            'Product ID,Product Name,Category,Stock Level,Value,Reorder Threshold,Return Rate',
            ...data.stockLevels.map(item => {
                const returnRate = getReturnRate(item.product_id);
                return `${item.product_id},"${item.product_name}","${item.category_name}",${item.stock_quantity},${item.stock_value},${item.reorder_threshold},${returnRate}`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
            {/* Header with Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Inventory Health Report</h2>
                    <p className="text-gray-500">Last updated: {lastUpdated.toLocaleString()}</p>
                </div>
                <div className="flex space-x-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Enhanced Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Inventory Turnover"
                    value={`${data.summary.inventoryTurnover}x`}
                    icon={RefreshCw}
                    subValue="Annual turnover rate"
                    trend={2.5}
                />
                <MetricCard
                    title="Days of Stock"
                    value={data.summary.daysOfStock}
                    icon={Clock}
                    subValue="Days of inventory"
                    alert={data.summary.daysOfStock > 60}
                />
                <MetricCard
                    title="Storage Usage"
                    value={`${data.summary.storageUtilization}%`}
                    icon={LayoutGrid}
                    subValue="Warehouse capacity"
                    alert={data.summary.storageUtilization > 90}
                />
                <MetricCard
                    title="Dead Stock"
                    value={data.summary.deadStock}
                    icon={Box}
                    subValue="Items without movement"
                    alert={data.summary.deadStock > 10}
                />
            </div>

            {/* Inventory Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Stock Level Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.categoryTotals}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category_name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total_items" name="Total Items" fill="#0088FE" />
                                <Bar dataKey="low_stock" name="Low Stock" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Storage Utilization by Category</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryTotals}
                                    dataKey="storage_used"
                                    nameKey="category_name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
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
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Inventory Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                        <h4 className="text-red-600 font-medium mb-2">Low Stock Items</h4>
                        <ul className="space-y-2">
                            {data.lowStock.slice(0, 5).map(item => (
                                <li key={item.product_id} className="flex justify-between items-center">
                                    <span className="text-sm">{item.product_name}</span>
                                    <span className="text-sm font-medium">{item.stock_quantity} left</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h4 className="text-yellow-600 font-medium mb-2">High Return Items</h4>
                        <ul className="space-y-2">
                            {data.returnRates
                                .filter(item => item.return_rate > 10)
                                .slice(0, 5)
                                .map(item => (
                                    <li key={item.product_id} className="flex justify-between items-center">
                                        <span className="text-sm">{item.product_name}</span>
                                        <span className="text-sm font-medium">{item.return_rate}% returns</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h4 className="text-blue-600 font-medium mb-2">Storage Optimization</h4>
                        <ul className="space-y-2">
                            {data.categoryTotals
                                .sort((a, b) => b.storage_used - a.storage_used)
                                .slice(0, 5)
                                .map(category => (
                                    <li key={category.category_name} className="flex justify-between items-center">
                                        <span className="text-sm">{category.category_name}</span>
                                        <span className="text-sm font-medium">{category.storage_used}% used</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4">
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                <option value="all">All Categories</option>
                                {data.categoryTotals.map(cat => (
                                    <option key={cat.category_name} value={cat.category_name}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                <option value="stock_value">Value</option>
                                <option value="stock_quantity">Quantity</option>
                                <option value="reorder_threshold">Reorder Threshold</option>
                            </select>
                        </div>
                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                id="lowStock"
                                checked={filterLowStock}
                                onChange={(e) => setFilterLowStock(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <label htmlFor="lowStock" className="ml-2 text-sm text-gray-700">
                                Show only low stock items
                            </label>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Return Rate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product) => {
                                    const stockStatus = Number(product.stock_quantity) <= Number(product.reorder_threshold) ? 'critical' :
                                        Number(product.stock_quantity) <= Number(product.reorder_threshold) * 1.5 ? 'warning' : 'good';

                                    return (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                                                <div className="text-sm text-gray-500">{product.category_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                                                <div className="text-sm text-gray-500">Threshold: {product.reorder_threshold}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatCurrency(product.stock_value)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{getReturnRate(product.product_id)}%</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${stockStatus === 'critical' ? 'bg-red-100 text-red-800' :
                                                        stockStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'}`}>
                                                    {stockStatus === 'critical' ? 'Critical' :
                                                        stockStatus === 'warning' ? 'Warning' : 'Good'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;