const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
// Register and Login
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { 
      first_name, last_name, username, email, phone_number, password, role_id,
      line_1, line_2, city, state, zip
    } = req.body;

    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

    const password_hash = await bcrypt.hash(password, 10);
    const userQuery = 'INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [userResult] = await connection.execute(userQuery, [first_name, last_name, username, email, phone_number, password_hash, role_id, address_id]);

    await connection.commit();
    res.status(201).json({ message: 'User registered successfully', userId: userResult.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Registration failed. Please try again.' });
  } finally {
    connection.release();
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);

    if (rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const passwordHashString = user.password_hash.toString('utf8');
    const isPasswordValid = await bcrypt.compare(password, passwordHashString);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful for user:', email);
    res.json({ token, userId: user.user_id, role: user.role_id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      details: error.message
    });
  }
});

// Public Product & Category Browsing (Permission: 3001)
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [productId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM products WHERE category_id = ?', [categoryId]);
    if (rows.length === 0) return res.status(404).json({ message: 'No products found for this category' });
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products by category' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories/:categoryId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [req.params.categoryId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching category' });
  }
});

// =============================================
// CUSTOMER ROUTES (Role ID: 1)
// =============================================

// User Profile Management (Permission: 3004)
router.get('/users/:userId', 
  authMiddleware.authenticate,
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

// Shopping Cart Management (Permission: 3002)
router.post('/shopping_cart', 
  authMiddleware.authenticate,
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
  authMiddleware.authenticate,
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
  authMiddleware.authenticate,
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

// Order Management (Permission: 3003)
router.post('/orders', 
  authMiddleware.authenticate,
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
  authMiddleware.authenticate,
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

// Payment Management (Permission: 3007)
router.get('/payment/:preferred_payment_id',
  authMiddleware.authenticate,
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