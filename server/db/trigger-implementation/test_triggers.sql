-- Place another order
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, total_item_price)
VALUES 
(3, 1, 1, 5, 19.99, 99.95);  -- Should reduce stock for Classic T-Shirt

--  Then check if the stock has decreased:
SELECT stock_quantity FROM products WHERE product_id = 1;

-- Update stock to simulate inventory running low
UPDATE products SET stock_quantity = 3 WHERE product_id = 1;

-- Check if reorder alert was triggered
SELECT * FROM reorder_alerts;

-- Update a product's price
UPDATE products SET price = 59.99 WHERE product_id = 1;

-- Check if the activity log was updated
SELECT * FROM activity_logs;

-- Add items to the cart
INSERT INTO cart_items (cart_item_id, cart_id, product_id, quantity)
VALUES (1, 1, 1, 2);  -- Add 2 Classic T-Shirts to cart

-- Check the updated running total in the shopping cart
SELECT running_total FROM shopping_cart WHERE cart_id = 1;

-- Update stock to simulate low inventory
UPDATE products SET stock_quantity = 1 WHERE product_id = 1;

-- Check if a notification was triggered
SELECT * FROM notifications;
