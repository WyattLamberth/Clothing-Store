import React, { useState, useEffect } from 'react';
import { AlertCircle, Package } from 'lucide-react';

const LowStockAlerts = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const products = await response.json();
      
      // Filter products that are at or below reorder threshold
      const lowStock = products.filter(
        product => product.stock_quantity <= product.reorder_threshold
      );
      
      setLowStockProducts(lowStock);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  if (lowStockProducts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4" />
        <p>All products are well-stocked!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lowStockProducts.map((product) => (
        <div 
          key={product.product_id}
          className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">{product.product_name}</h3>
              <p className="text-sm text-red-700">
                Stock: {product.stock_quantity} / Threshold: {product.reorder_threshold}
              </p>
            </div>
          </div>
          <button
            onClick={() => {}} // We'll implement restock functionality
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
          >
            Restock
          </button>
        </div>
      ))}
    </div>
  );
};

export default LowStockAlerts;