const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db/connection');


// User registration
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      first_name, last_name, username, email, phone_number, password, role_id,
      line_1, line_2, city, state, zip
    } = req.body;

    // Insert address
    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

    // Insert user
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

// User login (updated to use Passport)
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


// Order Management
// Post
router.post('/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount} = req.body;
    const OrderQuery = 'INSERT INTO orders (customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [OrderResult] = await connection.execute(OrderQuery, [customer_id, shipping_address_id, order_status, order_date, shipping_cost, payment_method, total_amount]);
    const order_id = OrderResult.insertId;
    await connection.commit();
    
    res.status(201).json({ message: 'Order created successfully', order_id: order_id });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(400).json({ error: 'Error creating order' });
  } finally {
    connection.release();
  }
});

// Get order via order ID 
router.get('/orders', async (req, res) => {
  const connection = await pool.getConnection();
  // If the order ID in the link (\orders\1), using req.params instead
  // Same JSON format as POST
  const {order_id} = req.body;
  try {
    await connection.beginTransaction();
    const [orders] = await pool.execute('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    // Check if the order exists
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    // Return the order details
    res.status(200).json(orders[0]); // Return the first order object
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Put (Update order status)
router.put('/orders', async (req, res) => {
  const connection = await pool.getConnection(); 
  const { order_id, order_status } = req.body;
  try {
    await connection.beginTransaction(); 
    // Execute the update query
    const [result] = await connection.execute('UPDATE orders SET order_status = ? WHERE order_id = ?',[order_status, order_id]);
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

// Order Item Management
// Post
router.post('/order_items', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {order_id, product_id, quantity, unit_price, total_item_price} = req.body;
    const OrderItemsQuery = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_item_price) VALUES (?, ?, ?, ?, ?)';
    const [OrderItemsResult] = await connection.execute(OrderItemsQuery, [order_id, product_id, quantity, unit_price, total_item_price]);
    const order_item_id = OrderItemsResult.insertId;
    await connection.commit();
    
    res.status(201).json({ message: 'Order item created successfully', order_item_id: order_item_id });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(400).json({ error: 'Error creating order item' });
  } finally {
    connection.release();
  }
});
// Get order item via ID 
router.get('/order_items', async (req, res) => {
  const connection = await pool.getConnection();
  // Input by link (/order_items), with order_item_id in the body
  const {order_item_id} = req.body;
  try {
    await connection.beginTransaction();
    const [orderItem] = await pool.execute('SELECT * FROM order_items WHERE order_item_id = ?', [order_item_id]);
    // Return the order details
    res.status(200).json(orderItem[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Cart Management
// Post
router.post('/shopping_cart', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {customer_id, created_at, running_total} = req.body;
    const CartQuery = 'INSERT INTO shopping_cart (customer_id, created_at, running_total) VALUES (?, ?, ?)';
    const [CartResult] = await connection.execute(CartQuery, [customer_id, created_at, running_total]);
    const cart_id = CartResult.insertId;
    await connection.commit();
    res.status(201).json({ message: 'Cart created successfully', cart_id: cart_id});
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(400).json({ error: 'Error creating Cart' });
  } finally {
    connection.release();
  }
});
// Get order item via ID 
router.get('/shopping_cart', async (req, res) => {
  const connection = await pool.getConnection();
  // Input by link (/shopping_cart), with cart_id in the body
  const {cart_id} = req.body;
  try {
    await connection.beginTransaction();
    const [cart] = await pool.execute('SELECT * FROM shopping_cart WHERE cart_id = ?', [cart_id]);
    // Return the order details
    res.status(200).json(cart[0]);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

router.delete('/shopping_cart', async (req, res) => {
  const connection = await pool.getConnection();
  // Input by link (/shopping_cart), with cart_id in the body
  const {cart_id} = req.body;
  try {
      await connection.beginTransaction(); 
      const [cart] = await pool.execute('DELETE FROM shopping_cart WHERE cart_id = ?', [cart_id]);
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

// CATEGORY MANAGEMENT 

// Create a new category
router.post('/category', async(req, res) => {
  const connection = await pool.getConnection();
  try {
      await connection.beginTransaction();
      const { name, sex } = req.body; // Remove 'description'
      
      // Adjust the query to match your table structure
      const CategoryQuery = 'INSERT INTO categories (name, sex) VALUES (?, ?)';
      
      // Execute the query without 'description'
      const [CategoryResult] = await connection.query(CategoryQuery, [name, sex]);
      
      const category_id = CategoryResult.insertId; // Get the id of the newly created category
      await connection.commit();
      
      res.status(201).json({ message: 'Category created successfully', category_id: category_id });
  } catch (error) {
      await connection.rollback(); // If there is an error, rollback (undo all changes made to the database)
      console.error('Error creating category:', error);
      res.status(400).json({ error: 'Error creating category' });
  } finally {
      connection.release(); // Release the connection back to the pool
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    res.json(rows); // Return all categories in JSON format
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category by ID
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const query = 'SELECT * FROM categories WHERE category_id = ?';
    const [rows] = await pool.execute(query, [categoryId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Error fetching category' });
  }
});

// Update a category by ID
router.put('/categories/:categoryId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { categoryId } = req.params;
    const { name, sex } = req.body;

    const query = `
      UPDATE categories 
      SET name = ?, sex = ?
      WHERE category_id = ?
    `;

    const [result] = await connection.execute(query, [name, sex, categoryId]);

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

// Delete a category by ID
router.delete('/categories/:categoryId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { categoryId } = req.params;
    const query = 'DELETE FROM categories WHERE category_id = ?';

    const [result] = await connection.execute(query, [categoryId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting category:', error);
    res.status(400).json({ error: 'Error deleting category' });
  } finally {
    connection.release();
  }
});


//PRODUCT MANAGEMENT:

// Get all products
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product
router.post('/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand
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

// Get product by ID
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const query = 'SELECT * FROM products WHERE product_id = ?';
    const [rows] = await pool.execute(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Update a product by ID
router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { 
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, price = ?, stock_quantity = ?, reorder_threshold = ?, size = ?, color = ?, brand = ?
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand, productId
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

// Delete a product by ID
router.delete('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { productId } = req.params;

    const query = 'DELETE FROM products WHERE product_id = ?';
    const [result] = await connection.execute(query, [productId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  } finally {
    connection.release();
  }
});

// Get products by category ID
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const query = 'SELECT * FROM products WHERE category_id = ?';
    const [rows] = await pool.execute(query, [categoryId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No products found for this category' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Error fetching products by category' });
  }
});

// PAYMENT MANAGEMENT:

// POST Payment API
router.post('/payment', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {
      first_name, last_name, username, email, phone_number, password_hash, role_id, 
      cardholder_name, card_number, expiration_date, cvv, 
      date_joined, line_1, line_2, city, state, zip
    } = req.body;

    // 1. Insert address
    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

    // 2. Insert into users table
    const userQuery = 'INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [userResult] = await connection.execute(userQuery, [first_name, last_name, username, email, phone_number, password_hash, role_id, address_id]);
    const user_id = userResult.insertId;

    // 3. Insert into customers table, use the user_id as customer_id
    const customerQuery = 'INSERT INTO customers (customer_id, date_joined, preferred_payment_id) VALUES (?, ?, NULL)';
    const[customerResult] = await connection.execute(customerQuery, [user_id, date_joined]);
    const customer_id = customerResult.insertId;

    // 4. Insert into payment table
    const paymentQuery = 'INSERT INTO payment (cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id) VALUES (?, ?, ?, ?, ?, ?)';
    const [paymentResult] = await connection.query(paymentQuery, [cardholder_name, card_number, expiration_date, cvv, customer_id, address_id]);
    const preferred_payment_id = paymentResult.insertId;

    // 5. Commit transaction
    await connection.commit();

    // Respond with success and return the new preferred_payment_id
    res.status(201).json({ message: 'Payment method created successfully', preferred_payment_id: preferred_payment_id});
  } catch (error) {
    // Rollback in case of error
    await connection.rollback();
    console.error('Error creating payment method:', error);
    res.status(400).json({ error: 'Error creating payment method, please try again.' });
  } finally {
    // Release the connection
    connection.release();
  }
});

// Get one Payment API
router.get('/payment/:preferred_payment_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_id } = req.params; // request parameters

    // Query to get payment details by preferred_payment_id
    const paymentQuery = `
      SELECT *
      FROM payment
      WHERE preferred_payment_id = ?
    `;

    const [paymentResult] = await connection.execute(paymentQuery, [preferred_payment_id]); // execute query with parameter

    if (paymentResult.length === 0) { // if no payment method found
      return res.status(404).json({ message: 'No payment method found for this customer.' });
    }

    // Respond with the payment data, if found payment method
    res.status(201).json(paymentResult);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    res.status(400).json({ error: 'Error retrieving payment method' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// Get all Payment API
router.get('/all_payments', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Query to get all payment methods
    const paymentQuery = `
      SELECT *
      FROM payment`;

    const [paymentResult] = await connection.execute(paymentQuery);

    if (paymentResult.length === 0) { // if there are no payment method found
      return res.status(404).json({ message: 'No payment method found for this customer.' });
    }

    // Respond with the payment data, if found payment method
    res.status(201).json(paymentResult);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    res.status(400).json({ error: 'Error retrieving payment method' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// Get Payment by customerID API
router.get('/payment/:customer_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { customer_id } = req.params; // request parameters

    // Query to get payment details by customer_id
    const paymentQuery = `
      SELECT *
      FROM payment
      WHERE customer_id = ?
    `;

    const [paymentResult] = await connection.execute(paymentQuery, [customer_id]); // execute query with parameter

    if (paymentResult.length === 0) { // if no payment method found
      return res.status(404).json({ message: 'No payment method found for this customer.' });
    }

    // Respond with the payment data, if found payment method
    res.status(201).json(paymentResult);
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    res.status(400).json({ error: 'Error retrieving payment method' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// PUT Payment API
router.put('/payment/:preferred_payment_Id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_Id } = req.params;
    const { cardholder_name, card_number, expiration_date, cvv } = req.body; // new payment details

    // Update query to modify the payment details
    const updateQuery = `
      UPDATE payment
      SET cardholder_name = ?, card_number = ?, expiration_date = ?, cvv = ?
      WHERE preferred_payment_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [cardholder_name, card_number, expiration_date, cvv, preferred_payment_Id]); // new values passed in

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    // Respond with a success message
    res.status(201).json({ message: 'Payment method updated successfully.' });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(400).json({ error: 'Error updating payment method' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// DELETE Payment API
router.delete('/payment/:preferred_payment_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { preferred_payment_id } = req.params;

    // Query to delete the payment record by paymentId
    const deleteQuery = 'DELETE FROM payment WHERE preferred_payment_id = ?';
    const [result] = await connection.execute(deleteQuery, [preferred_payment_id]);

    if (result.affectedRows === 0) { // payment method not found
      return res.status(404).json({ error: 'Payment method not found.' });
    }

    res.status(201).send(); // Successfully deleted, no content to return
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(400).json({ error: 'Error deleting payment method' });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

// ROLE MANAGEMENT

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new role
router.post('/roles', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { role_name } = req.body;

    const query = 'INSERT INTO roles (role_name) VALUES (?)';
    const [result] = await connection.execute(query, [role_name]);

    await connection.commit();
    res.status(201).json({ message: 'Role created successfully', roleId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating role:', error);
    res.status(400).json({ error: 'Error creating role' });
  } finally {
    connection.release();
  }
});

module.exports = router;
