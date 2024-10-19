USE online_store;

-- Insert products into the products table, aligning with the existing categories
INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand) VALUES
('Blue Jeans', 1, 'Comfortable blue jeans', 49.99, 100, 10, '32', 'Blue', 'DenimX'),
('Red T-shirt', 10, 'Casual red t-shirt', 19.99, 200, 20, 'L', 'Red', 'TeeTime'),
('Black Belt', 7, 'Classic black belt', 29.99, 150, 10, 'One Size', 'Black', 'LeatherCo'),
('Winter Jacket', 11, 'Warm winter jacket', 89.99, 50, 5, 'XL', 'Grey', 'WinterGear'),
('Running Shoes', 13, 'Lightweight running shoes', 69.99, 75, 10, '9', 'White', 'Speedster'),
('Summer Dress', 16, 'Breezy summer dress', 39.99, 30, 5, 'M', 'Yellow', 'Fashionista'),
('Pleated Skirt', 18, 'Stylish pleated skirt', 34.99, 40, 5, 'S', 'Pink', 'ChicWear'),
('Baseball Cap', 19, 'Sporty baseball cap', 14.99, 120, 10, 'One Size', 'Navy', 'CapCo'),
('Graphic T-shirt', 10, 'T-shirt with cool graphic print', 24.99, 180, 15, 'M', 'Black', 'ArtTees'),
('Sweater', 22, 'Cozy sweater for cold weather', 59.99, 60, 8, 'L', 'Green', 'CozyKnits'),
('Ankle Socks', 25, 'Pack of ankle socks', 9.99, 300, 30, 'One Size', 'White', 'ComfortFit'),
('Cargo Shorts', 28, 'Durable cargo shorts', 44.99, 80, 10, '34', 'Khaki', 'OutdoorPro');

-- Verifying the inserted data
SELECT * FROM products;
