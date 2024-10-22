// employeeRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// =============================================
// EMPLOYEE ROUTES (Role ID: 2)
// =============================================

// Product Management (Permission: 2001 - Add/Edit/Delete Products)
router.post('/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      INSERT INTO products (
        product_name, category_id, description, price, 
        stock_quantity, reorder_threshold, size, color, brand
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand
    ]);

    await connection.commit();
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Error creating product' });
  } finally {
    connection.release();
  }
});

router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { 
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, 
          price = ?, stock_quantity = ?, reorder_threshold = ?, 
          size = ?, color = ?, brand = ?
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand, productId
    ]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Error updating product' });
  } finally {
    connection.release();
  }
});

// Order Management (Permission: 2002 - View and Manage all Orders)
router.get('/orders', async (req, res) => {
  const connection = await pool.getConnection();
  const { order_id } = req.body;
  try {
    const [orders] = await pool.execute('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders', async (req, res) => {
  const connection = await pool.getConnection(); 
  const { order_id, order_status } = req.body;
  try {
    await connection.beginTransaction(); 
    const [result] = await connection.execute(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [order_status, order_id]
    );
    await connection.commit(); 
    res.status(200).json({ message: 'Order status updated successfully' }); 
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  } finally {
    connection.release();
  }
});

// Inventory Management (Permission: 2003 - Manage Inventory)
router.post('/order_items', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {order_id, product_id, quantity, unit_price, total_item_price} = req.body;
    const [result] = await connection.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_item_price) VALUES (?, ?, ?, ?, ?)',
      [order_id, product_id, quantity, unit_price, total_item_price]
    );
    await connection.commit();
    
    res.status(201).json({ 
      message: 'Order item created successfully', 
      order_item_id: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(400).json({ error: 'Error creating order item' });
  } finally {
    connection.release();
  }
});

// Customer Management (Permission: 2005 - Respond to Customer Reviews)
router.get('/customers', async (req, res) => {
  try {
    const [customers] = await pool.execute(
      `SELECT c.*, u.first_name, u.last_name, u.email 
       FROM customers c 
       JOIN users u ON c.customer_id = u.user_id`
    );
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

router.get('/customers/:customerId', async (req, res) => {
  try {
    const [customer] = await pool.execute(
      `SELECT c.*, u.first_name, u.last_name, u.email 
       FROM customers c 
       JOIN users u ON c.customer_id = u.user_id 
       WHERE c.customer_id = ?`,
      [req.params.customerId]
    );
    if (!customer.length) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

// Process Returns (Permission: 2006 - Process Refunds and Returns)
router.put('/customers/:customerId', async (req, res) => {
  const { preferred_payment_id } = req.body;
  try {
    await pool.execute(
      'UPDATE customers SET preferred_payment_id = ? WHERE customer_id = ?',
      [preferred_payment_id, req.params.customerId]
    );
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

// Price and Promotion Management (Permission: 2004 - Set Product Prices and Promotions)
router.post('/category', async(req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, sex } = req.body;
    
    const [result] = await connection.query(
      'INSERT INTO categories (name, sex) VALUES (?, ?)',
      [name, sex]
    );
    
    await connection.commit();
    res.status(201).json({ 
      message: 'Category created successfully', 
      category_id: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating category:', error);
    res.status(400).json({ error: 'Error creating category' });
  } finally {
    connection.release();
  }
});

router.put('/categories/:categoryId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, sex } = req.body;
    const [result] = await connection.execute(
      'UPDATE categories SET name = ?, sex = ? WHERE category_id = ?',
      [name, sex, req.params.categoryId]
    );
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating category:', error);
    res.status(400).json({ error: 'Error updating category' });
  } finally {
    connection.release();
  }
});

module.exports = router;