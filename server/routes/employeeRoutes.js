const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');

// Apply staffOnly middleware to all routes
router.use(authMiddleware.staffOnly);

// =============================================
// EMPLOYEE ROUTES (Role ID: 2)
// =============================================

// Product Management (Permission: 2001)
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
    res.status(400).json({ error: 'Error creating product' });
  } finally {
    connection.release();
  }
});

router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
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
      stock_quantity, reorder_threshold, size, color, brand,
      req.params.productId
    ]);

    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error updating product' });
  } finally {
    connection.release();
  }
});

router.delete('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'DELETE FROM products WHERE product_id = ?',
      [req.params.productId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error deleting product' });
  } finally {
    connection.release();
  }
});

// Order Management (Permission: 2002)
router.get('/all-orders', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:orderId', async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE order_id = ?',
      [req.params.orderId]
    );
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(orders[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:orderId', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction(); 
    const [result] = await connection.execute(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [req.body.order_status, req.params.orderId]
    );
    await connection.commit(); 
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json({ message: 'Order status updated successfully' }); 
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to update order status' });
  } finally {
    connection.release();
  }
});
router.delete('/orders/:orderId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
      await connection.beginTransaction(); 
      const [result] = await connection.execute('DELETE FROM orders WHERE order_id = ?', [req.params.orderId]);
      await connection.commit(); 
      res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
      await connection.rollback();
      console.error('Error deleting Order:', error);
      res.status(500).json({ error: 'Failed to delete Order' });
  } finally {
      connection.release(); 
  }
});


// Inventory Management (Permission: 2003)
router.post('/products/:productId/restock', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
      [req.body.quantity, req.params.productId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error updating inventory' });
  } finally {
    connection.release();
  }
});

// Customer Management (Permission: 2005)
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
    if (!customer.length) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

// Category Management (Permission: 2004)
router.post('/categories', async(req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO categories (name, sex) VALUES (?, ?)',
      [req.body.name, req.body.sex]
    );
    await connection.commit();
    res.status(201).json({ 
      message: 'Category created successfully', 
      category_id: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error creating category' });
  } finally {
    connection.release();
  }
});

router.put('/categories/:categoryId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE categories SET name = ?, sex = ? WHERE category_id = ?',
      [req.body.name, req.body.sex, req.params.categoryId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error updating category' });
  } finally {
    connection.release();
  }
});

router.delete('/categories/:categoryId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'DELETE FROM categories WHERE category_id = ?',
      [req.params.categoryId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error deleting category' });
  } finally {
    connection.release();
  }
});

// Transaction management
// Get all transaction
router.get('/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM transactions';
    const [transactions] = await connection.execute(query);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  } finally {
    connection.release(); // Ensure the connection is released
  }
});

// Post
router.post('/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { order_id, transaction_date, total_amount, payment_status } = req.body;
    const query = 'INSERT INTO transactions (order_id, transaction_date, total_amount, payment_status) VALUES (?, ?, ?, ?)';
    const [result] = await connection.execute(query, [order_id, transaction_date, total_amount, payment_status]);
    await connection.commit(); 
    const transaction_id = result.insertId;
    res.status(201).json({ message: 'Transaction created successfully', transaction_id: transaction_id });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' }); 
  } finally {
    connection.release(); 
  }
});

// Get transactions by order ID
router.get('/transactions/:transaction_id', async (req, res) => {
  const connection = await pool.getConnection();
  const { transaction_id } = req.params;
  try {
    await connection.beginTransaction();
    const query = 'SELECT * FROM transactions WHERE transaction_id = ?';
    const [transactions] = await connection.execute(query, [transaction_id]);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions by order ID:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  } finally {
    connection.release(); 
  }
});

// Update transaction
router.put('/transactions/:transaction_id', async (req, res) => {
  const connection = await pool.getConnection();
  const { transaction_id } = req.params;
  const { order_id, transaction_date, total_amount, payment_status } = req.body;
  try {
    await connection.beginTransaction();
    const query = 'UPDATE transactions SET order_id = ?, transaction_date = ?, total_amount = ?, payment_status = ? WHERE transaction_id = ?';
    const [result] = await connection.execute(query, [order_id, transaction_date, total_amount, payment_status, transaction_id]);
    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating transaction:', error);
    res.status(400).json({ error: 'Failed to update transaction' });
  } finally {
    connection.release(); 
  }
});

// Delete a transaction
router.delete('/transactions/:transaction_id', async (req, res) => {
  const connection = await pool.getConnection();
  const { transaction_id } = req.params;

  try {
    const query = 'DELETE FROM transactions WHERE transaction_id = ?';
    const [result] = await connection.execute(query, [transaction_id]);

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  } finally {
    connection.release(); // Ensure the connection is released
  }
});


// Get transactions by order ID
router.get('/transactions/order/:orderId', async (req, res) => {
  const connection = await pool.getConnection();
  const { orderId } = req.params;
  try {
    await connection.beginTransaction();
    const query = 'SELECT * FROM transactions WHERE order_id = ?';
    const [transactions] = await connection.execute(query, [orderId]);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions by order ID:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  } finally {
    connection.release();
  }
});

module.exports = router;