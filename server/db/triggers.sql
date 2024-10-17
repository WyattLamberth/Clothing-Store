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

