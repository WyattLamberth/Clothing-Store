-- Insert roles
INSERT INTO roles (role_id, role_name) VALUES (1, 'Customer'), (2, 'Employee'), (3, 'Admin');

-- Insert users
INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id)
VALUES 
('John', 'Doe', 'johndoe', 'john@example.com', '123-456-7890', 'hashedpassword', 1, 1),
('Jane', 'Doe', 'janedoe', 'jane@example.com', '098-765-4321', 'hashedpassword', 2, 2),
('Admin', 'Smith', 'adminsmith', 'admin@example.com', '555-555-5555', 'hashedpassword', 3, 3);

-- Insert customers
INSERT INTO customers (customer_id, date_joined, preferred_payment_id) VALUES (1, '2024-01-01', 1);

-- Insert employees
INSERT INTO employees (employee_id, job_title) VALUES (2, 'Store Manager');

-- Insert addresses
INSERT INTO address (address_id, line_1, line_2, city, state, zip)
VALUES 
(1, '123 Main St', 'Apt 1', 'Cityville', 'NY', '12345'),
(2, '456 Broadway', 'Ste 2', 'Metropolis', 'CA', '67890'),
(3, '789 Elm St', 'Floor 3', 'Capital City', 'TX', '54321');

-- Insert products
INSERT INTO products (product_id, product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand)
VALUES 
(1, 'Classic T-Shirt', 1, 'Comfortable cotton shirt', 19.99, 100, 10, 'M', 'Blue', 'BrandA'),
(2, 'Slim Fit Jeans', 2, 'Stylish denim jeans', 49.99, 50, 5, 'L', 'Black', 'BrandB'),
(3, 'Summer Dress', 3, 'Lightweight summer dress', 39.99, 20, 3, 'S', 'Red', 'BrandC');

-- Insert orders
INSERT INTO orders (order_id, customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount)
VALUES 
(1, 1, 1, 'Pending', '2024-10-01', 5.99, 'Visa', 59.99);

-- Insert order items
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, total_item_price)
VALUES 
(1, 1, 1, 2, 19.99, 39.98),
(2, 1, 2, 1, 49.99, 49.99);

-- Insert payment details
INSERT INTO payment (preferred_payment_id, cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id)
VALUES 
(1, 'John Doe', '1234567812345678', '12/24', '123', 1, 1);
