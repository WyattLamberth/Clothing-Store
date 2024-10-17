DELIMETER //

CREATE TRIGGER update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  -- Update the stock quantity in the products table after an order is placed
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;

  -- Ensure that the stock quantity does not go below zero
  IF (SELECT stock_quantity FROM products WHERE product_id = NEW.product_id) < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for product.';
  END IF;
END;

CREATE TRIGGER reorder_alert_after_stock_decrease
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  -- Check if the new stock quantity is below the reorder threshold
  IF NEW.stock_quantity < NEW.reorder_threshold THEN
    INSERT INTO reorder_alerts (product_id, alert_date, quantity_to_reorder)
    VALUES (NEW.product_id, CURDATE(), NEW.reorder_threshold);
  END IF;
END;

CREATE TRIGGER log_user_action
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
BEGIN
  DECLARE action_type VARCHAR(50);

  -- Determine the type of action performed
  IF INSERTING THEN
    SET action_type = 'INSERT';
  ELSIF UPDATING THEN
    SET action_type = 'UPDATE';
  ELSIF DELETING THEN
    SET action_type = 'DELETE';
  END IF;

  -- Insert the action into the activity_logs table
  INSERT INTO activity_logs (user_id, action, timestamp, entity_affected)
  VALUES (NEW.user_id, action_type, NOW(), 'products');
END;

CREATE TRIGGER update_cart_total_after_adding_item
AFTER INSERT ON cart_items
FOR EACH ROW
BEGIN
  -- Calculate the running total of the cart based on item prices and quantities
  UPDATE shopping_cart
  SET running_total = (
    SELECT SUM(ci.quantity * p.price)
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = NEW.cart_id
  )
  WHERE cart_id = NEW.cart_id;
END;

CREATE TRIGGER notify_admin_about_low_stock
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  -- If stock quantity is below the critical level (e.g., 5), notify admin
  IF NEW.stock_quantity < 5 THEN
    INSERT INTO notifications (user_id, message, notification_date, read_status)
    VALUES (
      (SELECT user_id FROM users WHERE role_id = 3 LIMIT 1),  -- Admin role_id = 3
      CONCAT('Stock is critically low for product: ', NEW.product_name),
      NOW(),
      FALSE
    );
  END IF;
END;
