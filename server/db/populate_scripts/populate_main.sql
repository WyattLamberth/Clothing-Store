-- Initialize the database
CREATE DATABASE onlinestore;
USE onlinestore;

-- First, create all tables
-- Roles table
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL
);

-- Users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARBINARY(64) NOT NULL,
  role_id INT NOT NULL DEFAULT 1,
  address_id INT,
  date_joined DATE NOT NULL DEFAULT (CURRENT_DATE)
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

-- Payment table
CREATE TABLE payment (
  preferred_payment_id INT AUTO_INCREMENT PRIMARY KEY,
  cardholder_name VARCHAR(100) NOT NULL,
  card_number CHAR(16) UNIQUE,
  expiration_date CHAR(5) NOT NULL,
  cvv CHAR(3) UNIQUE,
  user_id INT,
  billing_address_id INT
);

-- Products table
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL,
  reorder_threshold INT DEFAULT 0,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  image_path VARCHAR(255),
  CHECK (price > 0),
  CHECK (stock_quantity >= 0)
);

-- Categories table
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  sex ENUM('M', 'F', 'K')
);

-- Orders table
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  shipping_address_id INT,
  order_status ENUM('Pending', 'Shipped', 'Delivered', 'RETURNED') NOT NULL,
  order_date DATE NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  CHECK (total_amount >= 0)
);

-- Order Items table
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_item_price DECIMAL(10,2) NOT NULL,
  CHECK (quantity > 0)
);

-- Shopping Cart table
CREATE TABLE shopping_cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  running_total DECIMAL(10,2) NOT NULL
);

-- Cart Items table
CREATE TABLE cart_items (
  cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
);

-- Returns table
CREATE TABLE returns (
  return_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  approval BOOL,
  user_id INT,
  return_date DATE NOT NULL,
  return_status VARCHAR(20) NOT NULL,
  CHECK (return_status IN ('Pending', 'Approved', 'Rejected'))
);

-- Return Items table
CREATE TABLE return_items (
  return_item_id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT,
  product_id INT,
  quantity INT NOT NULL,
  CHECK (quantity > 0)
);

-- Refunds table
CREATE TABLE refunds (
  refund_id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_date DATE NOT NULL,
  refund_status VARCHAR(20) NOT NULL,
  CHECK (refund_amount <= 0),
  CHECK (refund_status IN ('Pending', 'Completed'))
);

-- Activity Logs table
CREATE TABLE activity_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  timestamp DATETIME NOT NULL,
  entity_affected VARCHAR(50)
);

-- Notifications table
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  message TEXT NOT NULL,
  notification_date DATETIME NOT NULL,
  read_status BOOLEAN NOT NULL DEFAULT FALSE
);

-- Sale Events table
CREATE TABLE sale_events (
  sale_event_id INT AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  CHECK (end_date > start_date)
);


-- Add Foreign Key Constraints
ALTER TABLE users
ADD CONSTRAINT fk_user_address FOREIGN KEY (address_id) REFERENCES address(address_id),
ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id);

ALTER TABLE payment
ADD CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(user_id),
ADD CONSTRAINT fk_payment_address FOREIGN KEY (billing_address_id) REFERENCES address(address_id);

ALTER TABLE products
ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(category_id);

ALTER TABLE orders
ADD CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(user_id),
ADD CONSTRAINT fk_order_address FOREIGN KEY (shipping_address_id) REFERENCES address(address_id);

ALTER TABLE order_items
ADD CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE shopping_cart
ADD CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE cart_items
ADD CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES shopping_cart(cart_id),
ADD CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE returns
ADD CONSTRAINT fk_return_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
ADD CONSTRAINT fk_return_user FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE return_items
ADD CONSTRAINT fk_return_item_return FOREIGN KEY (return_id) REFERENCES returns(return_id),
ADD CONSTRAINT fk_return_item_product FOREIGN KEY (product_id) REFERENCES products(product_id);

ALTER TABLE refunds
ADD CONSTRAINT fk_refund_return FOREIGN KEY (return_id) REFERENCES returns(return_id);

ALTER TABLE activity_logs
ADD CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE notifications
ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_role ON users(role_id);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_order_status ON orders(order_status);

-- First, populate roles and permissions
-- Insert role data
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Customer'),
(2, 'Employee'),
(3, 'Admin');

DELIMITER //

-- Procedure to populate categories
CREATE PROCEDURE PopulateCategories()
BEGIN
    INSERT INTO categories (name, sex) VALUES
    ('Pants', 'M'), ('Pants', 'F'), ('Pants', 'K'),
    ('Shirts', 'M'), ('Shirts', 'F'), ('Shirts', 'K'),
    ('Belts', 'M'), ('Belts', 'F'), ('Belts', 'K'),
    ('Jackets', 'M'), ('Jackets', 'F'), ('Jackets', 'K'),
    ('Shoes', 'M'), ('Shoes', 'F'), ('Shoes', 'K'),
    ('Dresses', 'F'), ('Dresses', 'K'),
    ('Skirts', 'F'), ('Skirts', 'K'),
    ('Hats', 'M'), ('Hats', 'F'), ('Hats', 'K'),
    ('T-shirts', 'M'), ('T-shirts', 'F'), ('T-shirts', 'K'),
    ('Sweaters', 'M'), ('Sweaters', 'F'), ('Sweaters', 'K'),
    ('Socks', 'M'), ('Socks', 'F'), ('Socks', 'K'),
    ('Shorts', 'M'), ('Shorts', 'F'), ('Shorts', 'K');
END //

-- Procedure to populate products
CREATE PROCEDURE PopulateProducts()
BEGIN
    -- Basic products with images
    INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand, image_path) VALUES
    ('Classic T-Shirt', 5, 'Chat GPT T-shirt', 39.99, 30, 5, 'M', 'Black', 'AutoGenerate', 'basic_t_shirt.jpg'),
    ('Slim Fit Jeans', 1, 'Comfy Slim Denim', 49.99, 100, 10, '32', 'Blue', 'DenimX', 'slim_fit_jeans.jpg'),
    ('Summer Dress', 16, 'Breezy summer dress', 39.99, 30, 5, 'M', 'Pink', 'Fashionista', 'summer_dress.jpg'),
    ('Casual Sneakers', 13, 'Casual shoes', 69.99, 75, 10, '9', 'White', '1:1Nike', 'casual_sneaker.jpg');

    -- Additional products
    INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand) VALUES
    ('Blue Jeans', 1, 'Comfortable blue jeans', 49.99, 100, 10, '32', 'Blue', 'DenimX'),
    ('Red T-shirt', 5, 'Casual red t-shirt', 19.99, 200, 20, 'L', 'Red', 'TeeTime'),
    ('Black Belt', 8, 'Classic black belt', 29.99, 150, 10, 'One Size', 'Black', 'LeatherCo'),
    ('Winter Jacket', 12, 'Warm winter jacket', 89.99, 50, 5, 'XL', 'Grey', 'WinterGear'),
    ('Running Shoes', 13, 'Lightweight running shoes', 69.99, 75, 10, '9', 'White', 'Speedster'),
    ('Pleated Skirt', 18, 'Stylish pleated skirt', 34.99, 40, 5, 'S', 'Pink', 'ChicWear'),
    ('Baseball Cap', 20, 'Sporty baseball cap', 14.99, 120, 10, 'One Size', 'Navy', 'CapCo'),
    ('Graphic T-shirt', 5, 'T-shirt with cool graphic print', 24.99, 180, 15, 'M', 'Black', 'ArtTees'),
    ('Sweater', 26, 'Cozy sweater for cold weather', 59.99, 60, 8, 'L', 'Green', 'CozyKnits'),
    ('Ankle Socks', 29, 'Pack of ankle socks', 9.99, 300, 30, 'One Size', 'White', 'ComfortFit'),
    ('Cargo Shorts', 32, 'Durable cargo shorts', 44.99, 80, 10, '34', 'Khaki', 'OutdoorPro');
END //

-- EVERYTHING BEYOND THIS REQUIRES USERS

-- Create a procedure to populate orders and related tables

CREATE PROCEDURE PopulateOrders(
    IN num_orders INT,  -- Number of orders to generate
    IN min_items_per_order INT,  -- Minimum items per order
    IN max_items_per_order INT   -- Maximum items per order
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE current_user_id INT;
    DECLARE current_address_id INT;
    DECLARE current_order_id INT;
    DECLARE num_items INT;
    DECLARE current_product_id INT;
    DECLARE current_product_price DECIMAL(10,2);
    DECLARE items_counter INT;
    DECLARE order_total DECIMAL(10,2);
    
    -- Create temporary table for available products
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_products 
    SELECT product_id, price 
    FROM products 
    WHERE stock_quantity > 0;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Generate orders
    WHILE i < num_orders DO
        -- Get random user
        SELECT user_id INTO current_user_id 
        FROM users 
        ORDER BY RAND() 
        LIMIT 1;
        
        -- Get or create shipping address
        SELECT address_id INTO current_address_id 
        FROM users 
        WHERE user_id = current_user_id;
        
        -- If user has no address, create one
        IF current_address_id IS NULL THEN
            INSERT INTO address (line_1, city, state, zip)
            VALUES (
                CONCAT('Address for user ', current_user_id),
                'Default City',
                'Default State',
                CONCAT('', FLOOR(RAND() * 89999) + 10000)
            );
            
            SET current_address_id = LAST_INSERT_ID();
            
            -- Update user's address
            UPDATE users 
            SET address_id = current_address_id 
            WHERE user_id = current_user_id;
        END IF;
        
        -- Generate random order date within the last year
        INSERT INTO orders (
            user_id,
            shipping_address_id,
            order_status,
            order_date,
            shipping_cost,
            payment_method,
            total_amount
        )
        VALUES (
            current_user_id,
            current_address_id,
            ELT(FLOOR(RAND() * 4) + 1, 'Pending', 'Shipped', 'Delivered', 'Cancelled'),
            DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 365) DAY),
            ROUND(4.99 + RAND() * 15, 2),  -- Random shipping cost between 4.99 and 19.99
            ELT(FLOOR(RAND() * 3) + 1, 'Credit Card', 'PayPal', 'Debit Card'),
            0  -- Will update this after adding items
        );
        
        SET current_order_id = LAST_INSERT_ID();
        SET num_items = FLOOR(RAND() * (max_items_per_order - min_items_per_order + 1)) + min_items_per_order;
        SET items_counter = 0;
        SET order_total = 0;
        
        -- Add items to order
        WHILE items_counter < num_items DO
            -- Get random product
            SELECT product_id, price 
            INTO current_product_id, current_product_price
            FROM temp_products 
            ORDER BY RAND() 
            LIMIT 1;
            
            -- Add order item
            INSERT INTO order_items (
                order_id,
                product_id,
                quantity,
                unit_price,
                total_item_price
            )
            VALUES (
                current_order_id,
                current_product_id,
                FLOOR(RAND() * 3) + 1,  -- Random quantity between 1 and 3
                current_product_price,
                current_product_price * (FLOOR(RAND() * 3) + 1)
            );
            
            -- Update order total
            SET order_total = order_total + (current_product_price * (FLOOR(RAND() * 3) + 1));
            SET items_counter = items_counter + 1;
        END WHILE;
        
        -- Update order total
        UPDATE orders 
        SET total_amount = order_total + shipping_cost 
        WHERE order_id = current_order_id;
        
        VALUES (
            current_order_id,
            (SELECT order_date FROM orders WHERE order_id = current_order_id),
            (SELECT total_amount FROM orders WHERE order_id = current_order_id),
            CASE 
                WHEN (SELECT order_status FROM orders WHERE order_id = current_order_id) = 'Cancelled' 
                THEN 'Cancelled'
                ELSE 'Completed'
            END
        );
        
        SET i = i + 1;
    END WHILE;
    
    -- Clean up
    DROP TEMPORARY TABLE IF EXISTS temp_products;
    
    -- Commit transaction
    COMMIT;
    
END //

DELIMITER ;

-- Execute the population procedures in the correct order

-- Then execute other procedures
CALL PopulateCategories();
CALL PopulateProducts();

-- Generate some initial orders
CALL PopulateOrders(50, 1, 5);  -- Creates 50 orders with 1-5 items each

-- Create some sale events
INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('Black Friday Sale', '2024-11-24', '2024-11-27', 30.00);

INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('Christmas Clearance Sale', '2024-12-20', '2024-12-25', 25.00);

INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('Flash Sale', '2024-11-18', '2024-11-18', 40.00);

INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('New Year’s Blowout', '2024-12-30', '2025-01-02', 35.00);

INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('Valentine’s Day Special', '2025-02-10', '2025-02-14', 20.00);

INSERT INTO sale_events (event_name, start_date, end_date, discount_percentage)
VALUES ('Summer Splash Sale', '2025-06-01', '2025-06-15', 20.00);



-- Quick verification
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders;