const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// =============================================
// CUSTOMER ROUTES (Role ID: 1)
// =============================================

// Logout
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// User Profile Management
router.get('/users/:userId', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    try {
      const [user] = await pool.execute(
        'SELECT user_id, first_name, last_name, username, email, phone_number, role_id FROM users WHERE user_id = ?',
        [req.params.userId]
      );
      if (!user.length) return res.status(404).json({ message: 'User not found' });
      res.json(user[0]);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Shopping Cart Management
router.post('/shopping_cart', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const {customer_id, created_at, running_total} = req.body;
      const [result] = await connection.execute(
        'INSERT INTO shopping_cart (customer_id, created_at, running_total) VALUES (?, ?, ?)',
        [customer_id, created_at, running_total]
      );
      await connection.commit();
      res.status(201).json({ message: 'Cart created successfully', cart_id: result.insertId});
    } catch (error) {
      await connection.rollback();
      res.status(400).json({ error: 'Error creating Cart' });
    } finally {
      connection.release();
    }
});

router.get('/shopping_cart',
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    const {cart_id} = req.body;
    try {
      await connection.beginTransaction();
      const [cart] = await pool.execute('SELECT * FROM shopping_cart WHERE cart_id = ?', [cart_id]);
      res.status(200).json(cart[0]);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    } finally {
      connection.release();
    }
});

router.delete('/shopping_cart',
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    const {cart_id} = req.body;
    try {
      await connection.beginTransaction();
      await pool.execute('DELETE FROM shopping_cart WHERE cart_id = ?', [cart_id]);
      await connection.commit();
      res.status(200).json({ message: 'Shopping cart deleted successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting shopping cart:', error);
      res.status(500).json({ error: 'Failed to delete shopping cart' });
    } finally {
      connection.release();
    }
});

// Cart Items Management
router.get('/cart-items', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    try {
      const [items] = await pool.execute(
        'SELECT * FROM cart_items WHERE cart_id = ?',
        [req.body.cart_id]
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching cart items' });
    }
});

// Order Management
router.post('/orders', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const {customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount} = req.body;
      const [result] = await connection.execute(
        'INSERT INTO orders (customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount]
      );
      await connection.commit();
      res.status(201).json({ message: 'Order created successfully', order_id: result.insertId });
    } catch (error) {
      await connection.rollback();
      res.status(400).json({ error: 'Error creating order' });
    } finally {
      connection.release();
    }
});

router.get('/users/:userId/orders', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders WHERE customer_id = ?',
        [req.params.userId]
      );
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Payment Management
router.get('/payment/:preferred_payment_id',
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const [paymentResult] = await connection.execute(
        'SELECT * FROM payment WHERE preferred_payment_id = ?',
        [req.params.preferred_payment_id]
      );
      if (paymentResult.length === 0) {
        return res.status(404).json({ message: 'No payment method found for this ID.' });
      }
      res.status(200).json(paymentResult);
    } catch (error) {
      res.status(400).json({ error: 'Error retrieving payment method' });
    } finally {
      connection.release();
    }
});

module.exports = router;