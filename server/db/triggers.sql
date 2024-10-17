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
