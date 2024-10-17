use online_store;

-- Insert a new order item to simulate a purchase
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_item_price)
VALUES (1, 1, 2, 19.99, 39.98);  -- Buying 2 units of 'Classic T-Shirt' (product_id = 1)

-- Check if the stock has been reduced
SELECT product_name, stock_quantity
FROM products
WHERE product_id = 1;

-- Insert another order item to decrease stock further
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_item_price)
VALUES (1, 1, 96, 19.99, 1959.02);  -- This should cause stock to fall below the reorder threshold

-- Check if a reorder alert was created
SELECT *
FROM reorder_alerts
WHERE product_id = 1;

-- Perform an INSERT operation on products to trigger the log
INSERT INTO products (product_id, product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand)
VALUES (3, 'Winter Jacket', 1, 'A warm winter jacket', 99.99, 50, 10, 'L', 'Black', 'BrandY');

-- Check the activity logs for the new entry
SELECT *
FROM activity_logs
WHERE entity_affected = 'products';

-- Perform an UPDATE operation on products to trigger the log
UPDATE products
SET price = 89.99
WHERE product_id = 3;

-- Check the logs again
SELECT *
FROM activity_logs
WHERE entity_affected = 'products';

-- Perform a DELETE operation on products to trigger the log
DELETE FROM products
WHERE product_id = 3;

-- Check the logs for the delete action
SELECT *
FROM activity_logs
WHERE entity_affected = 'products';

-- Add an item to the shopping cart
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES (1, 2, 2);  -- Adding 2 units of 'Slim Fit Jeans' (product_id = 2) to cart (cart_id = 1)

-- Check if the cart total was updated
SELECT running_total
FROM shopping_cart
WHERE cart_id = 1;

-- Insert another order item to simulate low stock and trigger a notification
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_item_price)
VALUES (1, 2, 49, 49.99, 2499.50);  -- Draining stock for 'Slim Fit Jeans'

-- Check the activity logs or notifications table for an entry related to low stock
SELECT *
FROM activity_logs
WHERE action = 'LOW_STOCK';



