import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SignInRegister from './components/SignInRegister';
import CartPage from './pages/CartPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminPage from './pages/AdminPage';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import SalesReports from './pages/SalesReports';
import SystemMaintenance from './pages/SystemMaintenance';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/signin" element={<SignInRegister />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/employee" element={
                <ProtectedRoute element={<EmployeeDashboard />} requiredRole="employee" />
              } />
              <Route path="/admin" element={
                <ProtectedRoute element={<AdminPage />} requiredRole="admin" />
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute element={<UserManagement />} requiredRole="admin" />
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute element={<ProductManagement />} requiredRole="admin" />
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute element={<SalesReports />} requiredRole="admin" />
              } />
              <Route path="/admin/system-maintenance" element={
                <ProtectedRoute element={<SystemMaintenance />} requiredRole="admin" />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
