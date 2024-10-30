USE online_store;

-- Insert Categories into Categories Table
INSERT INTO categories (name, sex) VALUES
('Pants', 'M'),
('Pants', 'F'),
('Pants', 'K'),
('Shirts', 'M'),
('Shirts', 'F'),
('Shirts', 'K'),
('Belts', 'M'),
('Belts', 'F'),
('Belts', 'K'),
('Jackets', 'M'),
('Jackets', 'F'),
('Jackets', 'K'),
('Shoes', 'M'),
('Shoes', 'F'),
('Shoes', 'K'),
('Dresses', 'F'),
('Dresses', 'K'),
('Skirts', 'F'),
('Skirts', 'K'),
('Hats', 'M'),
('Hats', 'F'),
('Hats', 'K'),
('T-shirts', 'M'),
('T-shirts', 'F'),
('T-shirts', 'K'),
('Sweaters', 'M'),
('Sweaters', 'F'),
('Sweaters', 'K'),
('Socks', 'M'),
('Socks', 'F'),
('Socks', 'K'),
('Shorts', 'M'),
('Shorts', 'F'),
('Shorts', 'K');

-- Insert products into the products table, aligning with the existing categories
INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand, image_path) VALUES
('Classic T-Shirt', 5, 'Chat GPT T-shirt', 39.99, 30, 5, 'M', 'Black', 'AutoGenerate', 'basic_t_shirt.jpg'),
('Slim Fit Jeans', 1, 'Comfy Slim Denim', 49.99, 100, 10, '32', 'Blue', 'DenimX', 'slim_fit_jeans.jpg'),
('Summer Dress', 16, 'Breezy summer dress', 39.99, 30, 5, 'M', 'Pink', 'Fashionista', 'summer_dress.jpg'),
('Casual Sneakers', 13, 'Casual shoes', 69.99, 75, 10, '9', 'White', '1:1Nike', 'casual_sneaker.jpg');

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

-- Verifying the inserted data
select * from categories;

SELECT * FROM products;
