USE onlinestore;

DELIMITER $$

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
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('UPDATE', NOW(), 'products', @current_user_id);
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

-- Notify all customers of new sale events
CREATE TRIGGER notify_new_sale_event
AFTER INSERT ON sale_events
FOR EACH ROW
BEGIN
    -- General notification for sale events, setting user_id as NULL
    INSERT INTO notifications (user_id, message, notification_date, read_status)
    VALUES (NULL, CONCAT('New sale event: ', NEW.event_name, ' starts on ', NEW.start_date), NOW(), FALSE);
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
