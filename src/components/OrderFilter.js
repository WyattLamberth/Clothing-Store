import React from 'react';

const OrderFilters = ({ 
  orderStatusFilter, 
  orderDateFilter, 
  orderAmountFilter,
  handleStatusFilterChange,
  handleDateFilterChange,
  handleAmountFilterChange 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex flex-wrap md:flex-nowrap gap-6">
        {/* Status Filter */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Status
          </label>
          <select
            value={orderStatusFilter}
            onChange={handleStatusFilterChange}
            className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              name="start"
              value={orderDateFilter.start}
              onChange={handleDateFilterChange}
              className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              name="end"
              value={orderDateFilter.end}
              onChange={handleDateFilterChange}
              className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Amount Range Filter */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Range ($)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min"
              value={orderAmountFilter.min}
              onChange={handleAmountFilterChange}
              placeholder="Min"
              className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              name="max"
              value={orderAmountFilter.max}
              onChange={handleAmountFilterChange}
              placeholder="Max"
              className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;