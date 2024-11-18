import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    Line,
    LineChart,
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
        summary: {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            overallReturnRate: 0,
        },
        returnsByProduct: [],
        returnsByCategory: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState('all');

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

    // Filter and aggregate data for the graph
    const filteredStockLevels = data.stockLevels.filter((item) => {
        if (selectedCategory !== 'all' && item.category_name !== selectedCategory) return false;
        if (selectedProduct !== 'all' && item.product_name !== selectedProduct) return false;
        return true;
    });

    const filteredReturns = data.returnsByProduct.filter((item) => {
        if (selectedProduct !== 'all' && item.product_name !== selectedProduct) return false;
        if (selectedCategory !== 'all') {
            const categoryMatch = data.stockLevels.find(
                (stock) => stock.product_name === item.product_name && stock.category_name === selectedCategory
            );
            return !!categoryMatch;
        }
        return true;
    });

    const aggregatedData = filteredStockLevels.map((stockItem) => {
        const returnsData = filteredReturns.find((returnItem) => returnItem.product_id === stockItem.product_id) || {};
        return {
            product_name: stockItem.product_name,
            category_name: stockItem.category_name,
            stock_quantity: stockItem.stock_quantity,
            reorder_threshold: stockItem.reorder_threshold,
            total_returns: returnsData.total_returns || 0,
        };
    });

    const totalStock = data.stockLevels.reduce((sum, item) => sum + item.stock_quantity, 0);
    const categoryContribution = data.stockLevels.reduce((acc, item) => {
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

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block mb-2">Category</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded"
                >
                    <option value="all">All Categories</option>
                    {[...new Set(data.stockLevels.map((item) => item.category_name))].map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <label className="block mb-2">Product</label>
                <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded"
                >
                    <option value="all">All Products</option>
                    {[...new Set(data.stockLevels.map((item) => item.product_name))].map((product) => (
                        <option key={product} value={product}>
                            {product}
                        </option>
                    ))}
                </select>
            </div>

            {/* Combined Graph */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Inventory Health Overview</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.categoryTotals}>
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

            {/* Source Data Tables */}
            <div className="space-y-6">
                <DataTable
                    title="Stock Levels Data"
                    data={data.stockLevels.map((item) => ({
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
                    data={data.returnsByProduct.map((item) => ({
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
                    data={data.returnsByCategory.map((item) => ({
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
