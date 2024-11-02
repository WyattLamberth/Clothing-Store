const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.customerOnly);

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
router.post('/shopping_cart/create', 
  authMiddleware.customerOnly,
  async (req, res) => {
    const connection = await pool.getConnection();
    const userId = req.user.user_id;

    try {
      await connection.beginTransaction();

      // Check if the user already has a cart
      const [existingCart] = await connection.execute(
        'SELECT * FROM shopping_cart WHERE user_id = ?',
        [userId]
      );

      if (existingCart.length > 0) {
        return res.status(409).json({ message: 'Cart already exists for this user' });
      }

      // Create a new cart
      const [result] = await connection.execute(
        'INSERT INTO shopping_cart (user_id, created_at, running_total) VALUES (?, NOW(), 0.00)',
        [userId]
      );

      await connection.commit();
      res.status(201).json({ message: 'Cart created successfully', cart_id: result.insertId });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating cart:', error);
      res.status(500).json({ error: 'Failed to create cart' });
    } finally {
      connection.release();
    }
  }
);


router.get('/shopping_cart', 
  authMiddleware.customerOnly,
  async (req, res) => {
    const connection = await pool.getConnection();
    const userId = req.user.user_id;

    try {
      // Check if the cart exists
      const [cart] = await connection.execute(
        'SELECT * FROM shopping_cart WHERE user_id = ?', 
        [userId]
      );

      if (cart.length === 0) {
        // If cart does not exist, return an error prompting to create a cart
        return res.status(404).json({ message: 'No shopping cart found. Please create a cart first.' });
      }

      const cartId = cart[0].cart_id;

      // Fetch cart items
      const [cartItems] = await connection.execute(
        'SELECT ci.cart_item_id, ci.product_id, ci.quantity, p.product_name, p.price, p.image_path ' +
        'FROM cart_items ci ' +
        'JOIN products p ON ci.product_id = p.product_id ' +
        'WHERE ci.cart_id = ?', 
        [cartId]
      );

      res.status(200).json({ cart_id: cartId, cartItems });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    } finally {
      connection.release();
    }
  }
);


router.delete('/shopping_cart',
  authMiddleware.customerOnly,
  async (req, res) => {
    const connection = await pool.getConnection();
    const { cart_id } = req.body;
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
  }
);

// Cart Items Management
router.get('/cart-items', 
  authMiddleware.customerOnly,
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

router.delete('/cart-items', 
  authMiddleware.customerOnly,
  async (req, res) => {
    const connection = await pool.getConnection();
    const { product_id } = req.body;
    const userId = req.user.user_id;

    try {
      await connection.beginTransaction();

      const [cart] = await connection.execute(
        'SELECT cart_id FROM shopping_cart WHERE user_id = ?', 
        [userId]
      );

      if (cart.length === 0) {
        return res.status(404).json({ error: 'No shopping cart found for this user' });
      }

      const cartId = cart[0].cart_id;

      await connection.execute(
        'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', 
        [cartId, product_id]
      );

      await connection.commit();
      res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
      await connection.rollback();
      console.error('Error removing item from cart:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    } finally {
      connection.release();
    }
  }
);


// Order Management
router.post('/orders', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const {user_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount} = req.body;
      const [result] = await connection.execute(
        'INSERT INTO orders (user_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount]
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
        'SELECT * FROM orders WHERE user_id = ?',
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