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
('Dresses', 'M'),
('Dresses', 'F'),
('Dresses', 'K'),
('Skirts', 'M'),
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

INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand, image_path) VALUES
('Classic T-Shirt', 5, 'Chat GPT T-shirt', 39.99, 30, 5, 'M', 'Black', 'AutoGenerate', 't_shirt_classic.png'),
('Slim Fit Jeans', 1, 'Comfy Slim Denim', 49.99, 100, 10, '32', 'Blue', 'DenimX', 'slim_fit_jeans.jpg'),
('Summer Dress', 16, 'Breezy summer dress', 39.99, 30, 5, 'M', 'Pink', 'Fashionista', 'summer_dress.jpg'),
('Casual Sneakers', 13, 'Casual shoes', 69.99, 75, 10, '9', 'White', '1:1Nike', 'new_sneaker.png.png'),
('Blue Jeans', 1, 'Comfortable blue jeans', 49.99, 100, 10, '32', 'Blue', 'DenimX','blue_jeans.png'),
('Red T-shirt', 5, 'Casual red t-shirt', 19.99, 200, 20, 'L', 'Red', 'TeeTime','red_t_shirt.png'),
('Black Belt', 8, 'Classic black belt', 29.99, 150, 10, 'One Size', 'Black', 'LeatherCo','black_belt.png'),
('Winter Jacket', 12, 'Warm winter jacket', 89.99, 50, 5, 'XL', 'Grey', 'WinterGear','winter_jacket_kid.png'),
('Running Shoes', 13, 'Lightweight running shoes', 69.99, 75, 10, '9', 'White', 'Speedster','run_shoes_2.png'),
('Pleated Skirt', 18, 'Stylish pleated skirt', 34.99, 40, 5, 'S', 'Pink', 'ChicWear','pleart_skirt.png'),
('Baseball Cap', 20, 'Sporty baseball cap', 14.99, 120, 10, 'One Size', 'Navy', 'CapCo','blue_cap.png'),
('Graphic T-shirt', 5, 'T-shirt with cool graphic print', 24.99, 180, 15, 'M', 'Black', 'ArtTees','t-shirts-graphic.png'),
('Sweater', 26, 'Cozy sweater for cold weather', 59.99, 60, 8, 'L', 'Green', 'CozyKnits','green_sweater.png'),
('Ankle Socks', 29, 'Pack of ankle socks', 9.99, 300, 30, 'One Size', 'White', 'ComfortFit','ankle_socks.png'),
('Cargo Shorts', 32, 'Durable cargo shorts', 44.99, 80, 10, '34', 'Khaki', 'OutdoorPro','cargo_short.png');

-- Verifying the inserted data
select * from categories;

SELECT * FROM products;