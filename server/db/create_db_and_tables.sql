-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS online_store;

-- Use the database
USE online_store;

-- Roles table
CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL
);

-- Insert role data
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Customer'),
(2, 'Employee'),
(3, 'Admin');

-- Users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARBINARY(64) NOT NULL,
  role_id INT NOT NULL,
  address_id INT
  -- FOREIGN KEY (role_id) REFERENCES roles(role_id)
  -- FOREIGN KEY (address_id) REFERENCES address(address_id)
);

-- Customers table
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  date_joined DATE NOT NULL,
  preferred_payment_id INT
  -- FOREIGN KEY (customer_id) REFERENCES users(user_id)
  -- FOREIGN KEY (preferred_payment_id) REFERENCES payment(preferred_payment_id)
);

-- Employees table
CREATE TABLE employees (
  employee_id INT PRIMARY KEY,
  job_title VARCHAR(100) NOT NULL
  -- FOREIGN KEY (employee_id) REFERENCES users(user_id)
);

-- Admins table
CREATE TABLE admins (
  admin_id INT PRIMARY KEY
  -- FOREIGN KEY (admin_id) REFERENCES users(user_id)
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
  -- FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  -- FOREIGN KEY (billing_address_id) REFERENCES address(address_id)
);

-- Address table
CREATE TABLE address (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
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
  category_id INT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  reorder_threshold INT DEFAULT 0,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  CHECK (price > 0),
  CHECK (stock_quantity >= 0)
  -- FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Categories table
CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  description TEXT NOT NULL,
  sex ENUM('M', 'F', 'K')
);

-- Orders table
CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  shipping_address_id INT,
  order_status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled', 'RETURNED') NOT NULL,
  order_date DATE NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  CHECK (total_amount >= 0)
  -- FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  -- FOREIGN KEY (shipping_address_id) REFERENCES address(address_id)
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
  -- FOREIGN KEY (order_id) REFERENCES orders(order_id)
  -- FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Transactions table
CREATE TABLE transactions (
  transaction_id INT PRIMARY KEY,
  order_id INT,
  transaction_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  CHECK (total_amount >= 0)
  -- FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Shopping Cart table
CREATE TABLE shopping_cart (
  cart_id INT PRIMARY KEY,
  customer_id INT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  running_total DECIMAL(10,2) NOT NULL
  -- FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Cart Items table
CREATE TABLE cart_items (
  cart_item_id INT PRIMARY KEY,
  cart_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
  -- FOREIGN KEY (cart_id) REFERENCES shopping_cart(cart_id)
  -- FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Reorder Alerts table
CREATE TABLE reorder_alerts (
  alert_id INT PRIMARY KEY,
  product_id INT,
  alert_date DATE NOT NULL,
  quantity_to_reorder INT NOT NULL,
  CHECK (quantity_to_reorder > 0)
  -- FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Returns table
CREATE TABLE returns (
  return_id INT PRIMARY KEY,
  order_id INT,
  approval BOOL,
  customer_id INT,
  return_date DATE NOT NULL,
  return_status VARCHAR(20) NOT NULL,
  CHECK (return_status IN ('Pending', 'Approved', 'Completed', 'Rejected'))
  -- FOREIGN KEY (order_id) REFERENCES orders(order_id)
  -- FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Return Items table
CREATE TABLE return_items (
  return_item_id INT PRIMARY KEY,
  return_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
  -- FOREIGN KEY (return_id) REFERENCES returns(return_id)
  -- FOREIGN KEY (product_id) REFERENCES products(product_id)
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
  -- FOREIGN KEY (return_id) REFERENCES returns(return_id)
);

-- Activity Logs table
CREATE TABLE activity_logs (
  log_id INT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  timestamp DATETIME NOT NULL,
  entity_affected VARCHAR(50)
  -- FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Notifications table
CREATE TABLE notifications (
  notification_id INT PRIMARY KEY,
  user_id INT,
  message TEXT NOT NULL,
  notification_date DATETIME NOT NULL,
  read_status BOOLEAN NOT NULL DEFAULT FALSE
  -- FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Sale Events table
CREATE TABLE sale_events (
  sale_event_id INT PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  product_id INT,
  category_id INT,
  CHECK (end_date > start_date)
  -- FOREIGN KEY (product_id) REFERENCES products(product_id)
  -- FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Discounts table
CREATE TABLE discounts (
  discount_id INT PRIMARY KEY,
  discount_type VARCHAR(50) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  sale_event_id INT,
  CHECK (discount_percentage BETWEEN 0 AND 50)
  -- FOREIGN KEY (sale_event_id) REFERENCES sale_events(sale_event_id)
);

-- Permissions table
CREATE TABLE permissions (
  permission_id INT PRIMARY KEY,
  permission_name VARCHAR(50) NOT NULL
);

-- Role Permissions table
CREATE TABLE role_permissions (
  role_id INT,
  permission_id INT,
  PRIMARY KEY (role_id, permission_id)
  -- FOREIGN KEY (role_id) REFERENCES roles(role_id)
  -- FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- Users table relationships
ALTER TABLE users
ADD CONSTRAINT fk_user_address
FOREIGN KEY (address_id) REFERENCES address(address_id),
ADD CONSTRAINT fk_user_role
FOREIGN KEY (role_id) REFERENCES roles(role_id);

-- Customers table relationships
ALTER TABLE customers
ADD CONSTRAINT fk_customer_user
FOREIGN KEY (customer_id) REFERENCES users(user_id),
ADD CONSTRAINT fk_customer_payment
FOREIGN KEY (preferred_payment_id) REFERENCES payment(preferred_payment_id);

-- Employees table relationships
ALTER TABLE employees
ADD CONSTRAINT fk_employee_user
FOREIGN KEY (employee_id) REFERENCES users(user_id);

-- Admins table relationships
ALTER TABLE admins
ADD CONSTRAINT fk_admin_user
FOREIGN KEY (admin_id) REFERENCES users(user_id);

-- Payment table relationships
ALTER TABLE payment
ADD CONSTRAINT fk_payment_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
ADD CONSTRAINT fk_payment_address
FOREIGN KEY (billing_address_id) REFERENCES address(address_id);

-- Products table relationships
ALTER TABLE products
ADD CONSTRAINT fk_product_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

-- Orders table relationships
ALTER TABLE orders
ADD CONSTRAINT fk_order_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
ADD CONSTRAINT fk_order_address
FOREIGN KEY (shipping_address_id) REFERENCES address(address_id);

-- Order Items table relationships
ALTER TABLE order_items
ADD CONSTRAINT fk_order_item_order
FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD CONSTRAINT fk_order_item_product
FOREIGN KEY (product_id) REFERENCES products(product_id);

-- Transactions table relationships
ALTER TABLE transactions
ADD CONSTRAINT fk_transaction_order
FOREIGN KEY (order_id) REFERENCES orders(order_id);

-- Shopping Cart table relationships
ALTER TABLE shopping_cart
ADD CONSTRAINT fk_cart_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Cart Items table relationships
ALTER TABLE cart_items
ADD CONSTRAINT fk_cart_item_cart
FOREIGN KEY (cart_id) REFERENCES shopping_cart(cart_id),
ADD CONSTRAINT fk_cart_item_product
FOREIGN KEY (product_id) REFERENCES products(product_id);

-- Returns table relationships
ALTER TABLE returns
ADD CONSTRAINT fk_return_order
FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD CONSTRAINT fk_return_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Return Items table relationships
ALTER TABLE return_items
ADD CONSTRAINT fk_return_item_return
FOREIGN KEY (return_id) REFERENCES returns(return_id),
ADD CONSTRAINT fk_return_item_product
FOREIGN KEY (product_id) REFERENCES products(product_id);

-- Refunds table relationships
ALTER TABLE refunds
ADD CONSTRAINT fk_refund_return
FOREIGN KEY (return_id) REFERENCES returns(return_id);

-- Activity Logs table relationships
ALTER TABLE activity_logs
ADD CONSTRAINT fk_activity_log_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Sale Events table relationships
ALTER TABLE sale_events
ADD CONSTRAINT fk_sale_event_product
FOREIGN KEY (product_id) REFERENCES products(product_id),
ADD CONSTRAINT fk_sale_event_category
FOREIGN KEY (category_id) REFERENCES categories(category_id);

-- Discounts table relationships
ALTER TABLE discounts
ADD CONSTRAINT fk_discount_sale_event
FOREIGN KEY (sale_event_id) REFERENCES sale_events(sale_event_id);

-- Notifications table relationships
ALTER TABLE notifications
ADD CONSTRAINT fk_notification_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Role Permissions table and Role table relationships
ALTER TABLE role_permissions
ADD CONSTRAINT fk_role_permissions_role
FOREIGN KEY (role_id) REFERENCES roles(role_id),
ADD CONSTRAINT fk_role_permissions_permission
FOREIGN KEY (permission_id) REFERENCES permissions(permission_id);

-- Reorder Alerts table relationships
ALTER TABLE reorder_alerts
ADD CONSTRAINT fk_reorder_alert_product
FOREIGN KEY (product_id) REFERENCES products(product_id);;
