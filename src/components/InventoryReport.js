import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import api from '../utils/api';
import DataTable from './DataTable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#FEA8A1', '#A1FECB', '#D4A1FE', '#82CA9D', '#8884D8'];

const InventoryReport = () => {
    const [data, setData] = useState({
        stockLevels: [],
        categoryTotals: [],
        summary: {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            overallReturnRate: 0,
        },
        returnsByProduct: [],
        returnsByCategory: [],
    });
    const [filteredData, setFilteredData] = useState({
        categoryTotals: [],
        stockLevels: [],
        returnsByProduct: [],
        returnsByCategory: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchInventoryData();
    }, []);

    useEffect(() => {
        filterData();
    }, [selectedCategory, data]);

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports/inventory');
            setData(response.data);
            setFilteredData({
                categoryTotals: response.data.categoryTotals,
                stockLevels: response.data.stockLevels,
                returnsByProduct: response.data.returnsByProduct,
                returnsByCategory: response.data.returnsByCategory,
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching inventory data:', err);
            setError('Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        if (selectedCategory === 'all') {
            setFilteredData({
                categoryTotals: data.categoryTotals,
                stockLevels: data.stockLevels,
                returnsByProduct: data.returnsByProduct,
                returnsByCategory: data.returnsByCategory,
            });
            return;
        }

        const filteredStockLevels = data.stockLevels.filter(
            item => item.category_name === selectedCategory
        );
        const filteredCategoryTotals = data.categoryTotals.filter(
            item => item.category_name === selectedCategory
        );
        const filteredReturnsByCategory = data.returnsByCategory.filter(
            item => item.category_name === selectedCategory
        );
        const filteredReturnsByProduct = data.returnsByProduct.filter(item => {
            const product = data.stockLevels.find(
                p => p.product_id === item.product_id && p.category_name === selectedCategory
            );
            return !!product;
        });

        setFilteredData({
            categoryTotals: filteredCategoryTotals,
            stockLevels: filteredStockLevels,
            returnsByProduct: filteredReturnsByProduct,
            returnsByCategory: filteredReturnsByCategory,
        });
    };

    const totalStock = filteredData.stockLevels.reduce((sum, item) => sum + item.stock_quantity, 0);
    const categoryContribution = filteredData.stockLevels.reduce((acc, item) => {
        const category = acc.find((c) => c.category_name === item.category_name);
        if (category) {
            category.stock_quantity += item.stock_quantity;
        } else {
            acc.push({
                category_name: item.category_name,
                stock_quantity: item.stock_quantity,
            });
        }
        return acc;
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Total Products</h3>
                    <p className="text-2xl font-bold">{data.summary.totalProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Total Inventory Value</h3>
                    <p className="text-2xl font-bold">${data.summary.totalValue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Low Stock Items</h3>
                    <p className="text-2xl font-bold">{data.summary.lowStockCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Overall Return Rate</h3>
                    <p className="text-2xl font-bold">{data.summary.overallReturnRate}%</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Categories</option>
                    {[...new Set(data.stockLevels.map((item) => item.category_name))].map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {/* Combined Graph */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Inventory Health Overview</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredData.categoryTotals}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category_name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="total_items" name="Total Items" fill="#8884d8" />
                            <Bar yAxisId="left" dataKey="product_count" name="Products" fill="#82ca9d" />
                            <Bar yAxisId="left" dataKey="returns" name="Returns" fill="#FF8042" />
                            <Bar yAxisId="right" dataKey="total_value" name="Total Value" fill="#2e8b57" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Contribution Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Category Contribution to Total Stock</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryContribution}
                                dataKey="stock_quantity"
                                nameKey="category_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ category_name, percent }) =>
                                    percent > 0.15 ? `${category_name}: ${(percent * 100).toFixed(2)}%` : null
                                }
                            >
                                {categoryContribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} items`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Tables */}
            <div className="space-y-6">
                <DataTable
                    title="Stock Levels Data"
                    data={filteredData.stockLevels.map((item) => ({
                        product_name: item.product_name,
                        category_name: item.category_name,
                        stock_quantity: item.stock_quantity,
                        reorder_threshold: item.reorder_threshold,
                        stock_value: item.stock_value,
                    }))}
                    columns={[
                        { header: 'Product Name', accessorKey: 'product_name' },
                        { header: 'Category', accessorKey: 'category_name' },
                        { header: 'Stock Quantity', accessorKey: 'stock_quantity' },
                        { header: 'Reorder Threshold', accessorKey: 'reorder_threshold' },
                        { header: 'Stock Value', accessorKey: 'stock_value' },
                    ]}
                    exportFileName="stock_levels.csv"
                />

                <DataTable
                    title="Returns By Product"
                    data={filteredData.returnsByProduct.map((item) => ({
                        product_name: item.product_name,
                        total_returns: item.total_returns,
                        return_date: item.return_date,
                    }))}
                    columns={[
                        { header: 'Product Name', accessorKey: 'product_name' },
                        { header: 'Total Returns', accessorKey: 'total_returns' },
                        { header: 'Return Date', accessorKey: 'return_date' },
                    ]}
                    exportFileName="returns_by_product.csv"
                />

                <DataTable
                    title="Returns By Category"
                    data={filteredData.returnsByCategory.map((item) => ({
                        category_name: item.category_name,
                        total_returns: item.total_returns,
                        return_date: item.return_date,
                    }))}
                    columns={[
                        { header: 'Category Name', accessorKey: 'category_name' },
                        { header: 'Total Returns', accessorKey: 'total_returns' },
                        { header: 'Return Date', accessorKey: 'return_date' },
                    ]}
                    exportFileName="returns_by_category.csv"
                />
            </div>
        </div>
    );
};

export default InventoryReport;