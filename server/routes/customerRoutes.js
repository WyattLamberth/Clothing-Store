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

// Get single user with address (your existing modified route)
router.get('/users/:userId', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM users u
      LEFT JOIN address a ON u.address_id = a.address_id
      WHERE u.user_id = ?
    `, [req.params.userId]);

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const response = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      role_id: user.role_id,
      address_id: user.address_id,
      date_joined: user.date_joined,
      address: user.address_id ? {
        line_1: user.line_1,
        line_2: user.line_2,
        city: user.city,
        state: user.state,
        zip: user.zip
      } : null
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user and address
router.put('/users/:userId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { first_name, last_name, email, phone_number, role_id, address } = req.body;

    // Update user information
    const [userResult] = await connection.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, role_id = ? WHERE user_id = ?',
      [first_name, last_name, email, phone_number, role_id, req.params.userId]
    );

    // Update address if provided
    if (address) {
      await connection.execute(
        'UPDATE address SET line_1 = ?, line_2 = ?, city = ?, state = ?, zip = ? WHERE address_id = (SELECT address_id FROM users WHERE user_id = ?)',
        [address.line_1, address.line_2, address.city, address.state, address.zip, req.params.userId]
      );
    }

    // Fetch updated user with address
    const [users] = await connection.execute(`
      SELECT u.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM users u
      LEFT JOIN address a ON u.address_id = a.address_id
      WHERE u.user_id = ?
    `, [req.params.userId]);

    await connection.commit();

    if (userResult.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = users[0];
    const response = {
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        address: updatedUser.address_id ? {
          line_1: updatedUser.line_1,
          line_2: updatedUser.line_2,
          city: updatedUser.city,
          state: updatedUser.state,
          zip: updatedUser.zip
        } : null
      }
    };

    res.json(response);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error updating user', error: error.message });
  } finally {
    connection.release();
  }
});

// User Profile Update
router.put('/users/:userId', 
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    try {
      const { first_name, last_name, username, email, phone_number } = req.body;
      const [result] = await pool.execute(
        'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, phone_number = ? WHERE user_id = ?',
        [first_name, last_name, username, email, phone_number, req.params.userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
});


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

// Payment Method Update
router.put('/payment/:preferred_payment_id',
  authMiddleware.checkSelfOrHigher,
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { payment_type, provider, account_number, expiry_date } = req.body;
      const [result] = await connection.execute(
        'UPDATE payment SET payment_type = ?, provider = ?, account_number = ?, expiry_date = ? WHERE preferred_payment_id = ?',
        [payment_type, provider, account_number, expiry_date, req.params.preferred_payment_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Payment method not found' });
      }

      res.status(200).json({ message: 'Payment method updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating payment method', error: error.message });
    } finally {
      connection.release();
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
// Add item to cart
router.post('/cart-items/add', authMiddleware.customerOnly, async (req, res) => {
  const connection = await pool.getConnection();
  const { product_id, quantity } = req.body;
  const userId = req.user.user_id;

  try {
    await connection.beginTransaction();

    // Check if the user's cart exists
    const [cart] = await connection.execute(
      'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
      [userId]
    );

    let cartId;

    if (cart.length === 0) {
      // Create a new cart if one doesn't exist
      const [newCart] = await connection.execute(
        'INSERT INTO shopping_cart (user_id, created_at, running_total) VALUES (?, NOW(), 0.00)',
        [userId]
      );
      cartId = newCart.insertId;
    } else {
      cartId = cart[0].cart_id;
    }

    // Check if the item already exists in the cart
    const [existingItem] = await connection.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product_id]
    );

    if (existingItem.length > 0) {
      // Update quantity if item already exists
      await connection.execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
        [quantity, cartId, product_id]
      );
    } else {
      // Insert new item if it doesn't exist
      await connection.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, product_id, quantity]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Item added to cart successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  } finally {
    connection.release();
  }
});


router.get('/cart-items', authMiddleware.customerOnly, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Retrieve cart_id using user_id
    const [cart] = await pool.execute(
      'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
      [userId]
    );

    if (cart.length === 0) {
      return res.status(404).json({ message: 'No shopping cart found for this user.' });
    }

    const cartId = cart[0].cart_id;

    // Fetch all items in the cart
    const [items] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    res.status(200).json({ cart_id: cartId, items });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
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

router.put('/cart-items/update', authMiddleware.customerOnly, async (req, res) => {
  const connection = await pool.getConnection();
  const { product_id, quantity } = req.body;
  const userId = req.user.user_id;

  try {
    await connection.beginTransaction();

    // Get user's cart_id
    const [cart] = await connection.execute(
      'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
      [userId]
    );

    if (cart.length === 0) {
      return res.status(404).json({ message: 'No shopping cart found for this user.' });
    }

    const cartId = cart[0].cart_id;

    // Update item quantity
    await connection.execute(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      [quantity, cartId, product_id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Item quantity updated successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating item quantity:', error);
    res.status(500).json({ error: 'Failed to update item quantity.' });
  } finally {
    connection.release();
  }
});





module.exports = router;