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
      const { user_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount } = req.body;
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

router.post('/payment', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      cardholder_name,
      card_number,
      expiration_date,
      cvv,
      user_id,        // Changed from customer_id to user_id
      billing_address_id
    } = req.body;

    // Validate required fields
    if (!cardholder_name || !card_number || !expiration_date || !cvv || !user_id || !billing_address_id) {
      throw new Error('Missing required fields');
    }

    // Validate card number format (16 digits)
    if (!/^\d{16}$/.test(card_number)) {
      throw new Error('Invalid card number format');
    }

    // Validate expiration date format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
      throw new Error('Invalid expiration date format');
    }

    // Validate CVV (3 digits)
    if (!/^\d{3}$/.test(cvv)) {
      throw new Error('Invalid CVV format');
    }

    // Check if billing address exists
    const [addressCheck] = await connection.execute(
      'SELECT address_id FROM address WHERE address_id = ?',
      [billing_address_id]
    );

    if (addressCheck.length === 0) {
      throw new Error('Invalid billing address ID');
    }

    // Check if user exists
    const [userCheck] = await connection.execute(
      'SELECT user_id FROM users WHERE user_id = ?',
      [user_id]
    );

    if (userCheck.length === 0) {
      throw new Error('Invalid user ID');
    }

    // Insert payment
    const [paymentResult] = await connection.execute(
      `INSERT INTO payment (
        cardholder_name, 
        card_number, 
        expiration_date, 
        cvv, 
        user_id, 
        billing_address_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [cardholder_name, card_number, expiration_date, cvv, user_id, billing_address_id]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Payment method created successfully',
      preferred_payment_id: paymentResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating payment method:', error);
    res.status(500).json({
      error: error.message || 'Error creating payment method, please try again.'
    });
  } finally {
    connection.release();
  }
});

// Get payments by user ID
router.get('/payment/user/:userId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { userId } = req.params;

    // Verify that the requesting user matches the user ID or is an admin
    if (req.user.user_id !== parseInt(userId) && req.user.role_id !== 3) {
      return res.status(403).json({ message: 'Unauthorized access to payment methods' });
    }

    const paymentQuery = `
      SELECT p.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM payment p
      LEFT JOIN address a ON p.billing_address_id = a.address_id
      WHERE p.user_id = ?
    `;

    const [payments] = await connection.execute(paymentQuery, [userId]);

    if (payments.length === 0) {
      return res.status(200).json([]);
    }

    const formattedPayments = payments.map(payment => ({
      preferred_payment_id: payment.preferred_payment_id,
      cardholder_name: payment.cardholder_name,
      card_number: payment.card_number,
      expiration_date: payment.expiration_date,
      user_id: payment.user_id,
      billing_address: {
        line_1: payment.line_1,
        line_2: payment.line_2,
        city: payment.city,
        state: payment.state,
        zip: payment.zip
      }
    }));

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    res.status(500).json({ error: 'Error retrieving payment methods' });
  } finally {
    connection.release();
  }
});

// Get single payment method
router.get('/payment/:preferred_payment_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_id } = req.params;

    const paymentQuery = `
      SELECT p.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM payment p
      LEFT JOIN address a ON p.billing_address_id = a.address_id
      WHERE p.preferred_payment_id = ?
    `;

    const [payments] = await connection.execute(paymentQuery, [preferred_payment_id]);

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const payment = payments[0];

    // Verify user has access to this payment method
    if (req.user.user_id !== payment.user_id && req.user.role_id !== 3) {
      return res.status(403).json({ message: 'Unauthorized access to payment method' });
    }

    const formattedPayment = {
      preferred_payment_id: payment.preferred_payment_id,
      cardholder_name: payment.cardholder_name,
      card_number: payment.card_number,
      expiration_date: payment.expiration_date,
      user_id: payment.user_id,
      billing_address: {
        line_1: payment.line_1,
        line_2: payment.line_2,
        city: payment.city,
        state: payment.state,
        zip: payment.zip
      }
    };

    res.status(200).json(formattedPayment);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    res.status(500).json({ error: 'Error retrieving payment method' });
  } finally {
    connection.release();
  }
});


// Get all payments (admin only)
router.get('/all_payments', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Verify admin access
    if (req.user.role_id !== 3) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const paymentQuery = `
      SELECT p.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM payment p
      LEFT JOIN address a ON p.billing_address_id = a.address_id
    `;

    const [payments] = await connection.execute(paymentQuery);

    const formattedPayments = payments.map(payment => ({
      preferred_payment_id: payment.preferred_payment_id,
      cardholder_name: payment.cardholder_name,
      card_number: payment.card_number,
      expiration_date: payment.expiration_date,
      user_id: payment.user_id,
      billing_address: {
        line_1: payment.line_1,
        line_2: payment.line_2,
        city: payment.city,
        state: payment.state,
        zip: payment.zip
      }
    }));

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    res.status(500).json({ error: 'Error retrieving payment methods' });
  } finally {
    connection.release();
  }
});

// Create new payment method
router.post('/payment', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      cardholder_name,
      card_number,
      expiration_date,
      cvv,
      user_id,
      billing_address_id
    } = req.body;

    // Verify user authorization
    if (req.user.user_id !== parseInt(user_id) && req.user.role_id !== 3) {
      throw new Error('Unauthorized to create payment method for this user');
    }

    // Validate required fields
    if (!cardholder_name || !card_number || !expiration_date || !cvv || !user_id || !billing_address_id) {
      throw new Error('Missing required fields');
    }

    // Validate card number format (16 digits)
    if (!/^\d{16}$/.test(card_number)) {
      throw new Error('Invalid card number format');
    }

    // Validate expiration date format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
      throw new Error('Invalid expiration date format');
    }

    // Validate CVV (3 digits)
    if (!/^\d{3}$/.test(cvv)) {
      throw new Error('Invalid CVV format');
    }

    // Verify billing address exists
    const [addressCheck] = await connection.execute(
      'SELECT address_id FROM address WHERE address_id = ?',
      [billing_address_id]
    );

    if (addressCheck.length === 0) {
      throw new Error('Invalid billing address ID');
    }

    // Insert payment method
    const [paymentResult] = await connection.execute(
      `INSERT INTO payment (
        cardholder_name, 
        card_number, 
        expiration_date, 
        cvv, 
        user_id, 
        billing_address_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [cardholder_name, card_number, expiration_date, cvv, user_id, billing_address_id]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Payment method created successfully',
      preferred_payment_id: paymentResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating payment method:', error);
    res.status(500).json({
      error: error.message || 'Error creating payment method, please try again.'
    });
  } finally {
    connection.release();
  }
});

// Update payment method
router.put('/payment/:preferred_payment_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_id } = req.params;
    const { cardholder_name, card_number, expiration_date, cvv } = req.body;

    // Verify user has access to this payment method
    const [paymentCheck] = await connection.execute(
      'SELECT user_id FROM payment WHERE preferred_payment_id = ?',
      [preferred_payment_id]
    );

    if (paymentCheck.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    if (req.user.user_id !== paymentCheck[0].user_id && req.user.role_id !== 3) {
      return res.status(403).json({ message: 'Unauthorized to update this payment method' });
    }

    const updateQuery = `
      UPDATE payment
      SET cardholder_name = ?, 
          card_number = ?, 
          expiration_date = ?, 
          cvv = ?
      WHERE preferred_payment_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [
      cardholder_name,
      card_number,
      expiration_date,
      cvv,
      preferred_payment_id
    ]);

    res.status(200).json({ message: 'Payment method updated successfully' });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Error updating payment method' });
  } finally {
    connection.release();
  }
});

// Delete payment method
router.delete('/payment/:preferred_payment_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_id } = req.params;

    // Verify user has access to this payment method
    const [paymentCheck] = await connection.execute(
      'SELECT user_id FROM payment WHERE preferred_payment_id = ?',
      [preferred_payment_id]
    );

    if (paymentCheck.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    if (req.user.user_id !== paymentCheck[0].user_id && req.user.role_id !== 3) {
      return res.status(403).json({ message: 'Unauthorized to delete this payment method' });
    }

    const deleteQuery = 'DELETE FROM payment WHERE preferred_payment_id = ?';
    const [result] = await connection.execute(deleteQuery, [preferred_payment_id]);

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Error deleting payment method' });
  } finally {
    connection.release();
  }
});

// POST Address API
router.post('/address', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { line_1, line_2, city, state, zip } = req.body;

    // Insert address
    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

    // Commit transaction
    await connection.commit();

    res.status(201).json({ message: 'Address created successfully', address_id: address_id });
  } catch (error) {
    // Rollback in case of error
    await connection.rollback();
    console.error('Error creating address:', error);
    res.status(400).json({ error: 'Error creating address, please try again.' });
  } finally {
    // Release the connection
    connection.release();
  }
});

// Get all addresses API
router.get('/all_address', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Query to get all address
    const addressQuery = `
      SELECT *
      FROM address`;

    const [addressResult] = await connection.execute(addressQuery);

    if (addressResult.length === 0) { // if there are no address found
      return res.status(404).json({ message: 'No address found.' });
    }

    res.status(201).json(addressResult);
  } catch (error) {
    console.error('Error retrieving address:', error);
    res.status(400).json({ error: 'Error retrieving address' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// Get Address by address_id API
router.get('/address/:address_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { address_id } = req.params; // request parameters

    // Query to get address details by address_id
    const addressQuery = `
      SELECT *
      FROM address
      WHERE address_id = ?
    `;

    const [addressResult] = await connection.execute(addressQuery, [address_id]); // execute query with parameter

    if (addressResult.length === 0) { // if no address found
      return res.status(404).json({ message: 'No address found for this ID.' });
    }
    res.status(201).json(addressResult);
  } catch (error) {
    console.error('Error retrieving address:', error);
    res.status(400).json({ error: 'Error retrieving address' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// POST (Update) Address by address_id API
router.put('/address/:address_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { address_id } = req.params;
    const { line_1, line_2, city, state, zip } = req.body; // new address details

    // Update query to modify the address details
    const updateQuery = `
      UPDATE address
      SET line_1 = ?, line_2 = ?, city = ?, state = ?, zip = ?
      WHERE address_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [line_1, line_2, city, state, zip, address_id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'Address updated successfully.' });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Error updating address' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// DELETE Address API
router.delete('/address/:address_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { address_id } = req.params;

    // Query to delete the address by address_id
    const deleteQuery = 'DELETE FROM address WHERE address_id = ?';
    const [result] = await connection.execute(deleteQuery, [address_id]);

    if (result.affectedRows === 0) { // discount not found
      return res.status(404).json({ error: 'Address not found.' });
    }

    res.status(204).send(); // Successfully deleted, no content to return
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Error deleting address' });
  } finally {
    connection.release(); // release the connection back to the pool
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





// NOTIFICATION MANAGEMENT

// Fetch only unread notifications for the logged-in user
router.get('/notifications', authMiddleware.customerOnly, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND read_status = FALSE 
       ORDER BY notification_date DESC`,
      [userId]
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});


// Mark a notification as read
router.put('/notifications/:id/read', authMiddleware.customerOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      `UPDATE notifications SET read_status = TRUE WHERE notification_id = ?`,
      [id]
    );
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});


module.exports = router;