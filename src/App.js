// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SignInRegister from './components/SignInRegister';
import CartPage from './pages/CartPage';
import EmployeePage from './pages/EmployeePage';
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
                <ProtectedRoute element={<EmployeePage />} />
              } />
                <Route path="/admin" element={ // Make sure AdminPage is used here
                <ProtectedRoute element={<AdminPage />} />
              } />
                            <Route path="/admin/users" element={
                <ProtectedRoute element={<UserManagement />} />
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute element={<ProductManagement />} />
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute element={<SalesReports />} />
              } />
              <Route path="/admin/system-maintenance" element={
                <ProtectedRoute element={<SystemMaintenance />} />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;