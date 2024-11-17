DELIMITER //

CREATE PROCEDURE PopulateOrders(
    IN num_orders INT,
    IN min_items_per_order INT,
    IN max_items_per_order INT
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE current_user_id INT;
    DECLARE current_address_id INT;
    DECLARE current_order_id INT;
    DECLARE current_payment_id INT;
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
        -- Get random user and their payment ID
        SELECT u.user_id, u.address_id, p.preferred_payment_id 
        INTO current_user_id, current_address_id, current_payment_id
        FROM users u
        LEFT JOIN payment p ON u.user_id = p.user_id
        ORDER BY RAND() 
        LIMIT 1;
        
        -- Get or create shipping address
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
            ELT(FLOOR(RAND() * 3) + 1, 'Pending', 'Shipped', 'Delivered'),
            DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 365) DAY),
            ROUND(4.99 + RAND() * 15, 2),  -- Random shipping cost between 4.99 and 19.99
            current_payment_id,
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
        
        SET i = i + 1;
    END WHILE;
    
    -- Clean up
    DROP TEMPORARY TABLE IF EXISTS temp_products;
    
    -- Commit transaction
    COMMIT;
    
END //

DELIMITER ;

-- Example usage:
CALL PopulateOrders(50, 1, 5);  -- Creates 100 orders with 1-5 items each