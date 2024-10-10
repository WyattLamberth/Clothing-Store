-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS online_store;

-- Use the database
USE online_store;

-- Users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARBINARY(64) NOT NULL,
  role ENUM('Customer', 'Employee', 'Admin') NOT NULL,
  address_id INT
);

-- Customers table
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  date_joined DATE NOT NULL,
  preferred_payment_id INT
);

-- Employees table
CREATE TABLE employees (
  employee_id INT PRIMARY KEY,
  manager_employee_id INT,
  role ENUM('Staff', 'Admin') NOT NULL
);

-- Admins table
CREATE TABLE admins (
  admin_id INT PRIMARY KEY
);

-- Payment table
CREATE TABLE payment (
  preferred_payment_id INT PRIMARY KEY,
  cardholder_name VARCHAR(100) NOT NULL,
  card_number CHAR(16) UNIQUE,
  expiration_date CHAR(5) NOT NULL,
  cvv CHAR(3) UNIQUE,
  customer_id INT,
  billing_address_id INT
);

-- Address table
CREATE TABLE address (
  address_id INT PRIMARY KEY,
  line_1 VARCHAR(255) NOT NULL,
  line_2 VARCHAR(255) DEFAULT 'N/A',
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip VARCHAR(10) NOT NULL
);

-- Products table
CREATE TABLE products (
  product_id INT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  category_id INT,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  reorder_threshold INT DEFAULT 0,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  CHECK (price > 0),
  CHECK (stock_quantity >= 0)
);

-- Categories table
CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  description TEXT NOT NULL
);

-- Orders table
CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  shipping_address_id INT,
  order_status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') NOT NULL,
  order_date DATE NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  CHECK (total_amount >= 0)
);

-- Order Items table
CREATE TABLE order_items (
  order_item_id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_item_price DECIMAL(10,2) NOT NULL,
  CHECK (quantity > 0)
);

-- Transactions table
CREATE TABLE transactions (
  transaction_id INT PRIMARY KEY,
  order_id INT,
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  CHECK (total_amount >= 0)
);

-- Shopping Cart table
CREATE TABLE shopping_cart (
  cart_id INT PRIMARY KEY,
  customer_id INT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart Items table
CREATE TABLE cart_items (
  cart_item_id INT PRIMARY KEY,
  cart_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
);

-- Reorder Alerts table
CREATE TABLE reorder_alerts (
  alert_id INT PRIMARY KEY,
  product_id INT,
  alert_date DATE NOT NULL,
  quantity_to_reorder INT NOT NULL,
  CHECK (quantity_to_reorder > 0)
);

-- Returns table
CREATE TABLE returns (
  return_id INT PRIMARY KEY,
  order_id INT,
  customer_id INT,
  return_date DATE NOT NULL,
  return_status VARCHAR(20) NOT NULL,
  CHECK (return_status IN ('Pending', 'Approved', 'Completed', 'Rejected'))
);

-- Return Items table
CREATE TABLE return_items (
  return_item_id INT PRIMARY KEY,
  return_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
);

-- Refunds table
CREATE TABLE refunds (
  refund_id INT PRIMARY KEY,
  return_id INT,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_date DATE NOT NULL,
  refund_status VARCHAR(20) NOT NULL,
  CHECK (refund_amount <= 0),
  CHECK (refund_status IN ('Pending', 'Completed'))
);

-- Activity Logs table
CREATE TABLE activity_logs (
  log_id INT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  timestamp DATETIME NOT NULL,
  entity_affected VARCHAR(50)
);

-- Notifications table
CREATE TABLE notifications (
  notification_id INT PRIMARY KEY,
  user_id INT,
  message TEXT NOT NULL,
  notification_date DATETIME NOT NULL,
  read_status BOOLEAN NOT NULL DEFAULT FALSE
);

-- Sale Events table
CREATE TABLE sale_events (
  sale_event_id INT PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CHECK (end_date > start_date)
);

-- Discounts table
CREATE TABLE discounts (
  discount_id INT PRIMARY KEY,
  discount_type VARCHAR(50) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  product_id INT,
  category_id INT,
  sale_event_id INT,
  CHECK (discount_type IN ('Product', 'Category', 'Order')),
  CHECK (discount_percentage BETWEEN 0 AND 50),
  CHECK (end_date > start_date)
);

-- Permissions table
CREATE TABLE permissions (
  permission_id INT PRIMARY KEY,
  permission_name VARCHAR(50) NOT NULL
);

-- Role Permissions table
CREATE TABLE role_permissions (
  role ENUM('Customer', 'Employee', 'Admin') NOT NULL,
  permission_id INT
);