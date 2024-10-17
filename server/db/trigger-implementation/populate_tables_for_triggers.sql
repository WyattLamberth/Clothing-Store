use online_store;

-- Insert data into Roles table
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Customer'),
(2, 'Employee'),
(3, 'Admin');

-- Insert data into Address table
INSERT INTO address (address_id, line_1, line_2, city, state, zip) VALUES
(1, '123 Main St', 'Apt 1', 'Los Angeles', 'CA', '90001'),
(2, '456 Oak St', 'N/A', 'San Francisco', 'CA', '94102');

-- Insert data into Users table
INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '123-456-7890', 'hashedpassword1', 1, 1),
('Jane', 'Smith', 'janesmith', 'jane@example.com', '098-765-4321', 'hashedpassword2', 3, 2);

-- Insert data into Customers table
INSERT INTO customers (customer_id, date_joined, preferred_payment_id) VALUES
(1, '2023-01-01', NULL);

-- Insert data into Employees table
INSERT INTO employees (employee_id, job_title) VALUES
(2, 'Manager');

-- Insert data into Admins table
INSERT INTO admins (admin_id) VALUES
(2);

-- Insert data into Categories table
INSERT INTO categories (category_id, name, description, sex) VALUES
(1, 'T-Shirts', 'All kinds of T-shirts', 'M'),
(2, 'Jeans', 'Different styles of jeans', 'F');

-- Insert data into Products table
INSERT INTO products (product_id, product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand) VALUES
(1, 'Classic T-Shirt', 1, 'A simple classic t-shirt', 19.99, 100, 10, 'M', 'White', 'BrandX'),
(2, 'Slim Fit Jeans', 2, 'Stylish slim fit jeans', 49.99, 50, 5, '32', 'Blue', 'BrandY');

-- Insert data into Orders table
INSERT INTO orders (order_id, customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount) VALUES
(1, 1, 1, 'Pending', '2023-10-01', 5.00, 'Visa', 24.99);

-- Insert data into Order Items table
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, total_item_price) VALUES
(1, 1, 1, 1, 19.99, 19.99);

-- Insert data into Shopping Cart table
INSERT INTO shopping_cart (cart_id, customer_id, created_at, running_total) VALUES
(1, 1, NOW(), 19.99);

-- Insert data into Cart Items table
INSERT INTO cart_items (cart_item_id, cart_id, product_id, quantity) VALUES
(1, 1, 1, 1);
