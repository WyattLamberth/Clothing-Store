USE onlinestore;

DELIMITER $$

-- ACTIVITY LOG TO MONITOR EMPLOYEES ACTIONS

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


-- NOTIFICATIONS 

-- Trigger to notify admin about low stock
CREATE TRIGGER notify_admin_about_low_stock
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  -- Notify admin if stock quantity falls below 5
  IF NEW.stock_quantity < 5 THEN
    INSERT INTO notifications (user_id, message, notification_date, read_status)
    VALUES (
      (SELECT user_id FROM users WHERE role_id = 3 LIMIT 1),  -- Admin role_id = 3
      CONCAT('Stock is critically low for product: ', NEW.product_name),
      NOW(),
      FALSE
    );
  END IF;
END$$

-- Trigger to notify customer when an order is marked as delivered
CREATE TRIGGER notify_customer_order_delivered
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  -- Notify customer when the order status is marked as 'Delivered'
  IF NEW.order_status = 'Delivered' THEN
    INSERT INTO notifications (user_id, message, notification_date, read_status)
    VALUES (
      NEW.user_id,  -- Customer who placed the order, now referencing user_id
      CONCAT('Your order #', NEW.order_id, ' has been delivered!'),
      NOW(),
      FALSE
    );
  END IF;
END$$

-- MISCELLANEOUS TRIGGERS

-- Trigger to update stock quantity when an order is placed
CREATE TRIGGER update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  -- Update stock quantity after an order is placed
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
 
END$$


DELIMITER ;
