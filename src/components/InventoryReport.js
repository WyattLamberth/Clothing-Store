import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, PieChart, Pie, Cell 
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#FEA8A1', '#A1FECB', '#D4A1FE', '#82CA9D', '#8884D8'];

const InventoryReport = () => {
    const [data, setData] = useState({
        stockLevels: [],
        summary: {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            overallReturnRate: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

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

    // Aggregate data for Stock Status Comparison (Point 3)
    const aggregatedData = data.stockLevels.reduce((acc, item) => {
        const category = acc.find(cat => cat.category_name === item.category_name);
        if (category) {
            category.stock_quantity += item.stock_quantity;
            category.reorder_threshold += item.reorder_threshold;
        } else {
            acc.push({
                category_name: item.category_name,
                stock_quantity: item.stock_quantity,
                reorder_threshold: item.reorder_threshold
            });
        }
        return acc;
    }, []);

    // Calculate Category Contribution to Total Stock (Point 4)
    const totalStock = data.stockLevels.reduce((sum, item) => sum + item.stock_quantity, 0);
    const categoryContribution = aggregatedData.map((category) => ({
        ...category,
        stock_percentage: ((category.stock_quantity / totalStock) * 100).toFixed(2)
    }));

    // Filter data by selected category
    const filteredData = selectedCategory === 'all' 
        ? aggregatedData 
        : aggregatedData.filter(item => item.category_name === selectedCategory);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Filter */}
            <div>
                <label>Category Filter</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {[...new Set(data.stockLevels.map(item => item.category_name))].map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {/* Stock Status Comparison Chart (Point 3) */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Stock Status Comparison</h3>
                <div className="h-80">
                    {filteredData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category_name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="stock_quantity" name="In Stock Items" fill="#82ca9d" />
                                <Bar dataKey="reorder_threshold" name="Reorder Threshold" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500">No data available</div>
                    )}
                </div>
            </div>

            {/* Category Contribution to Total Stock (Point 4 - Pie Chart) */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Category Contribution to Total Stock</h3>
                <div className="h-80">
                    {categoryContribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={categoryContribution} 
                                    dataKey="stock_quantity" 
                                    nameKey="category_name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                                >
                                    {categoryContribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} items`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;
