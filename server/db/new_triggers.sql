USE onlinestore;

DELIMITER $$

-- LOG TRIGGER FOR NEW USERS
-- Trigger when new users create
CREATE TRIGGER after_create_user
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('INSERT', NOW(), 'users', NEW.user_id);
END$$

-- LOG TRIGGER FOR NEW ORDERS
-- Trigger when new order create
CREATE TRIGGER after_create_order
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('INSERT', NOW(), 'orders', NEW.user_id);
END$$

-- ACTIVITY LOG TRIGGERS TO MONITOR EMPLOYEES ACTIONS
-- Trigger for INSERT action on products table
CREATE TRIGGER log_user_action_insert_product
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('INSERT', NOW(), 'products', @current_user_id);
END$$

-- Trigger for UPDATE action on products table
CREATE TRIGGER log_user_action_update_product
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
	IF @current_user_id IS NULL THEN
		INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
		VALUES ('SYSTEM TRIGGER', NOW(), 'products', @current_user_id);
    ELSE
		INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
		VALUES ('UPDATE', NOW(), 'products', @current_user_id);
    END IF;
END$$

-- Trigger for DELETE action on products table
CREATE TRIGGER log_user_action_delete_product
AFTER DELETE ON products
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('DELETE', NOW(), 'products', @current_user_id);
END$$

-- Trigger for INSERT action on sale_events table
CREATE TRIGGER log_user_action_insert_sale_event
AFTER INSERT ON sale_events
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('INSERT', NOW(), 'sale_events', @current_user_id);
END$$

-- Trigger for DELETE action on sale_events table
CREATE TRIGGER log_user_action_delete_sale_event
AFTER DELETE ON sale_events
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('DELETE', NOW(), 'sale_events', @current_user_id);
END$$


-- NOTIFICATIONS TRIGGERS FOR CUSTOMERS

-- Notify customers of order status changes
CREATE TRIGGER notify_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_status != OLD.order_status THEN
        INSERT INTO notifications (user_id, message, notification_date, read_status)
        VALUES (NEW.user_id, CONCAT('Your order #', NEW.order_id, ' status has been updated to: ', NEW.order_status), NOW(), FALSE);
    END IF;
END$$

-- Notify customers of return status changes
CREATE TRIGGER notify_return_status_change
AFTER UPDATE ON returns
FOR EACH ROW
BEGIN
    INSERT INTO notifications (user_id, message, notification_date, read_status)
    VALUES (
        NEW.user_id, 
        CONCAT('Your return request for order #', NEW.order_id, ' has been ', LOWER(NEW.return_status), '.'), 
        NOW(), 
        FALSE
    );
END$$

-- Notify all customers of new sale events
CREATE TRIGGER notify_new_sale_event
AFTER INSERT ON sale_events
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE customer_id INT;
    
    -- Declare a cursor to iterate over all customers
    DECLARE customer_cursor CURSOR FOR 
    SELECT user_id FROM users WHERE role_id = 1;  
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Open the cursor and iterate through all customers to insert a notification for each
    OPEN customer_cursor;

    read_loop: LOOP
        FETCH customer_cursor INTO customer_id;
        
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Insert a notification for each customer
        INSERT INTO notifications (user_id, message, notification_date, read_status)
        VALUES (customer_id, CONCAT('New sale event: ', NEW.event_name, ' starts on ', NEW.start_date), NOW(), FALSE);INSERT INTO notifications (user_id, message, notification_date, read_status)
        VALUES (
            customer_id, 
            CONCAT('New sale event: "', NEW.event_name, '" with a discount of ', NEW.discount_percentage, '% starts on ', NEW.start_date, ' and ends on ', NEW.end_date), 
            NOW(), 
            FALSE
        );
    END LOOP;

    CLOSE customer_cursor;
END$$


-- MISCELLANEOUS TRIGGERS

-- Adjust stock quantity when an order is placed
CREATE TRIGGER update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Reduce stock quantity but prevent negative values
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE product_id = NEW.product_id;
END$$
DELIMITER ;

