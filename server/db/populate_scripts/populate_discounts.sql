-- Make sure we're using the right database
USE online_store;

-- Create a procedure to populate sale events and discounts
DELIMITER //

CREATE PROCEDURE PopulateSalesAndDiscounts(
    IN num_sales INT,  -- Number of sale events to generate
    IN start_date DATE,  -- Starting date for sales events
    IN end_date DATE    -- Ending date for sales events
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE current_sale_id INT;
    DECLARE current_product_id INT;
    DECLARE current_category_id INT;
    DECLARE sale_start_date DATE;
    DECLARE sale_end_date DATE;
    DECLARE date_range INT;
    
    -- Calculate the date range in days
    SET date_range = DATEDIFF(end_date, start_date);
    
    -- Create temporary tables for available products and categories
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_products 
    SELECT product_id, category_id 
    FROM products;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_categories 
    SELECT category_id 
    FROM categories;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Generate sale events
    WHILE i < num_sales DO
        -- Randomly decide if this is a product-specific or category-wide sale
        IF RAND() < 0.7 THEN  -- 70% chance for product-specific sale
            -- Get random product
            SELECT product_id, category_id 
            INTO current_product_id, current_category_id
            FROM temp_products 
            ORDER BY RAND() 
            LIMIT 1;
            
            SET current_category_id = NULL;
        ELSE
            -- Get random category
            SELECT category_id 
            INTO current_category_id
            FROM temp_categories 
            ORDER BY RAND() 
            LIMIT 1;
            
            SET current_product_id = NULL;
        END IF;
        
        -- Generate random start date within the specified range
        SET sale_start_date = DATE_ADD(start_date, INTERVAL FLOOR(RAND() * date_range) DAY);
        -- Generate end date 3-14 days after start date
        SET sale_end_date = DATE_ADD(sale_start_date, INTERVAL FLOOR(RAND() * 11 + 3) DAY);
        
        -- Create sale event
        INSERT INTO sale_events (
            event_name,
            start_date,
            end_date,
            product_id,
            category_id
        )
        VALUES (
            CASE 
                WHEN current_product_id IS NOT NULL THEN 
                    CONCAT(
                        ELT(FLOOR(RAND() * 4) + 1, 'Flash Sale', 'Special Offer', 'Limited Time Deal', 'Clearance'),
                        ' - Product #',
                        current_product_id
                    )
                ELSE 
                    CONCAT(
                        ELT(FLOOR(RAND() * 4) + 1, 'Category Sale', 'Category Special', 'Department Deal', 'Category Clearance'),
                        ' - Category #',
                        current_category_id
                    )
            END,
            sale_start_date,
            sale_end_date,
            current_product_id,
            current_category_id
        );
        
        SET current_sale_id = LAST_INSERT_ID();
        
        -- Create corresponding discounts (1-3 per sale event)
        INSERT INTO discounts (
            discount_type,
            discount_percentage,
            sale_event_id
        )
        SELECT 
            CASE floor(rand() * 3)
                WHEN 0 THEN 'Regular Discount'
                WHEN 1 THEN 'Member Discount'
                WHEN 2 THEN 'Bulk Purchase Discount'
            END,
            -- Generate random discount percentage between 5 and 50
            ROUND(5 + (RAND() * 45), 2),
            current_sale_id
        FROM (
            SELECT 1
            UNION ALL
            SELECT 2 WHERE RAND() < 0.5  -- 50% chance for second discount
            UNION ALL
            SELECT 3 WHERE RAND() < 0.3  -- 30% chance for third discount
        ) AS num;
        
        -- Create notifications for users about the sale (optional)
        INSERT INTO notifications (
            user_id,
            message,
            notification_date,
            read_status
        )
        SELECT 
            user_id,
            CONCAT(
                'New sale alert! ',
                (SELECT event_name FROM sale_events WHERE sale_event_id = current_sale_id),
                ' starting on ',
                DATE_FORMAT(sale_start_date, '%M %D')
            ),
            CURRENT_TIMESTAMP,
            FALSE
        FROM users
        WHERE RAND() < 0.3;  -- Only notify ~30% of users about each sale
        
        -- Log the activity
        INSERT INTO activity_logs (
            action,
            timestamp,
            entity_affected
        )
        VALUES (
            CONCAT('Created sale event: ', 
                  (SELECT event_name FROM sale_events WHERE sale_event_id = current_sale_id)),
            CURRENT_TIMESTAMP,
            'sale_events'
        );
        
        SET i = i + 1;
    END WHILE;
    
    -- Clean up
    DROP TEMPORARY TABLE IF EXISTS temp_products;
    DROP TEMPORARY TABLE IF EXISTS temp_categories;
    
    -- Commit transaction
    COMMIT;
    
END //

DELIMITER ;

-- Example usage:
-- CALL PopulateSalesAndDiscounts(
--     50,  -- Create 50 sale events
--     CURRENT_DATE,  -- Start from today
--     DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)  -- Plan sales for next 90 days
-- );