USE online_store;

DELIMITER $$

-- Trigger to update stock quantity when an order is placed
CREATE TRIGGER update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  -- Update stock quantity after an order is placed
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;

  -- Ensure stock does not go below zero
  IF (SELECT stock_quantity FROM products WHERE product_id = NEW.product_id) < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for product.';
  END IF;
END$$

-- ACTIVITY LOG FOR PRODUCTS TABLE

-- Trigger to log admin/employee actions (INSERT)
CREATE TRIGGER log_user_action_insert
AFTER INSERT ON products
FOR EACH ROW
BEGIN
    -- Insert the admin/employee action into activity_logs with the user_id
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('INSERT', NOW(), 'products', (SELECT user_id FROM users WHERE role_id IN (1, 2) LIMIT 1)); -- Assuming role_id 1 is Admin, 2 is Employee
END$$

-- Trigger to log admin/employee actions (UPDATE)
CREATE TRIGGER log_user_action_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    -- Insert the admin/employee action into activity_logs with the user_id
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('UPDATE', NOW(), 'products', (SELECT user_id FROM users WHERE role_id IN (1, 2) LIMIT 1));
END$$

-- Trigger to log admin/employee actions (DELETE)
CREATE TRIGGER log_user_action_delete
AFTER DELETE ON products
FOR EACH ROW
BEGIN
    -- Insert the admin/employee action into activity_logs with the user_id
    INSERT INTO activity_logs (action, timestamp, entity_affected, user_id)
    VALUES ('DELETE', NOW(), 'products', (SELECT user_id FROM users WHERE role_id IN (1, 2) LIMIT 1));
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


DELIMITER ;
