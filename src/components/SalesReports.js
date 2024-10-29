import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar } from 'lucide-react';
import api from '../utils/api';

const SalesReports = () => {
    const [timeframe, setTimeframe] = useState('week');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [salesData, setSalesData] = useState([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        topProducts: []
    });
    const [categoryData, setCategoryData] = useState([]);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        fetchSalesData();
    }, [timeframe, dateRange]);

    const fetchSalesData = async () => {
        try {
            // Fetch orders within date range
            const ordersResponse = await api.get('/all-orders');
            const orders = ordersResponse.data.filter(order => {
                const orderDate = new Date(order.order_date);
                return orderDate >= new Date(dateRange.start) &&
                    orderDate <= new Date(dateRange.end) &&
                    order.order_status !== 'Cancelled';
            });
    
            // Calculate stats for orders
            const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            setStats({
                totalSales,
                averageOrderValue: totalSales / orders.length || 0,
                totalOrders: orders.length,
            });
    
            // Calculate daily sales
            const salesByDate = {};
            orders.forEach(order => {
                const date = order.order_date.split('T')[0];
                salesByDate[date] = (salesByDate[date] || 0) + Number(order.total_amount);
            });
    
            // Convert to array format for Recharts
            const chartData = Object.entries(salesByDate).map(([date, amount]) => ({
                date,
                amount: Number(amount.toFixed(2))
            })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
            setSalesData(chartData);
    
            // Fetch categories and order items
            const [categoriesResponse, orderItemsResponse, productsResponse] = await Promise.all([
                api.get('/categories'),
                api.get('/order_items'),
                api.get('/products')
            ]);
    
            const categories = categoriesResponse.data;
            const orderItems = orderItemsResponse.data;
            const products = productsResponse.data;
    
            // Create a map of product IDs to category IDs
            const productCategoryMap = products.reduce((map, product) => {
                map[product.product_id] = product.category_id;
                return map;
            }, {});
    
            // Calculate sales by category
            const categorySalesMap = {};
            orderItems.forEach(item => {
                if (orders.some(order => order.order_id === item.order_id)) {
                    const categoryId = productCategoryMap[item.product_id];
                    if (categoryId) {
                        categorySalesMap[categoryId] = (categorySalesMap[categoryId] || 0) + 
                            (Number(item.unit_price) * Number(item.quantity));
                    }
                }
            });
    
            // Format category data for the pie chart
            const categorySalesData = categories
                .map(category => ({
                    name: category.name,
                    value: Number((categorySalesMap[category.category_id] || 0).toFixed(2))
                }))
                .filter(category => category.value > 0);
    
            console.log('Category Sales Data:', categorySalesData);
            setCategoryData(categorySalesData);
    
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    };

    const handleTimeframeChange = (newTimeframe) => {
        const today = new Date();
        let startDate = new Date();

        switch (newTimeframe) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate.setDate(today.getDate() - 7);
        }

        setTimeframe(newTimeframe);
        setDateRange({
            start: startDate.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        });
    };
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Sales Reports</h2>
                <div className="flex space-x-4">
                    <select
                        value={timeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                    <div className="flex space-x-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">
                            ${stats.totalSales.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Average Order Value</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">
                            ${stats.averageOrderValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                    <div className="mt-2 flex items-center">
                        <span className="text-3xl font-bold">{stats.totalOrders}</span>
                    </div>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[600px]">
                        <LineChart
                            width={800}
                            height={400}
                            data={salesData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#3B82F6"
                                name="Sales ($)"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </div>
                </div>
            </div>

            {/* Lower Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Order Volume */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Daily Order Volume</h3>
                    <BarChart
                        width={400}
                        height={300}
                        data={salesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="amount" fill="#3B82F6" name="Orders" />
                    </BarChart>
                </div>

                {/* Sales by Category */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                    <div className="flex justify-center">
                        {categoryData.length > 0 ? (
                            <PieChart width={400} height={300}>
                                <Pie
                                    data={categoryData}
                                    cx={200}
                                    cy={150}
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `$${value.toFixed(2)}`}
                                />
                                <Legend />
                            </PieChart>
                        ) : (
                            <div className="text-gray-500 text-center py-10">
                                No category data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReports;