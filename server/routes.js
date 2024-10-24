const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db/connection');

// USER AND ROLE MANAGEMENT
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

// User login 
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

// User Management Routes
// get a user
router.get('/users/:userId', async (req, res) => {
  try {
    const [user] = await pool.execute(
      'SELECT user_id, first_name, last_name, username, email, phone_number, role_id FROM users WHERE user_id = ?',
      [req.params.userId]
    );
    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// update a user
router.put('/users/:userId', async (req, res) => {
  const { first_name, last_name, email, phone_number } = req.body;
  try {
    await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?',
      [first_name, last_name, email, phone_number, req.params.userId]
    );
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// delete a user
router.delete('/users/:userId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE user_id = ?', [req.params.userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// get all orders under a user
router.get('/users/:userId/orders', async (req, res) => {
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

// get a users cart
router.get('/users/:userId/cart', async (req, res) => {
  try {
    const [cart] = await pool.execute(
      `SELECT sc.*, ci.product_id, ci.quantity, p.product_name, p.price 
       FROM shopping_cart sc 
       LEFT JOIN cart_items ci ON sc.cart_id = ci.cart_id 
       LEFT JOIN products p ON ci.product_id = p.product_id 
       WHERE sc.customer_id = ?`,
      [req.params.userId]
    );
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Customer Management Routes
// get all customers
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

// get a customer
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

// update a customer
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

// delete a customer
router.delete('/customers/:customerId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM customers WHERE customer_id = ?', [req.params.customerId]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
});

// Employee Management Routes
// get all employees
router.get('/employees', async (req, res) => {
  try {
    const [employees] = await pool.execute(
      `SELECT e.*, u.first_name, u.last_name, u.email 
       FROM employees e 
       JOIN users u ON e.employee_id = u.user_id`
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// create an employee
router.post('/employees', async (req, res) => {
  const { user_id, job_title } = req.body;
  try {
    await pool.execute(
      'INSERT INTO employees (employee_id, job_title) VALUES (?, ?)',
      [user_id, job_title]
    );
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

// get an employee
router.get('/employees/:employeeId', async (req, res) => {
  try {
    const [employee] = await pool.execute(
      `SELECT e.*, u.first_name, u.last_name, u.email 
       FROM employees e 
       JOIN users u ON e.employee_id = u.user_id 
       WHERE e.employee_id = ?`,
      [req.params.employeeId]
    );
    if (!employee.length) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
});

// update an employee
router.put('/employees/:employeeId', async (req, res) => {
  const { job_title } = req.body;
  try {
    await pool.execute(
      'UPDATE employees SET job_title = ? WHERE employee_id = ?',
      [job_title, req.params.employeeId]
    );
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

// delete an employee
router.delete('/employees/:employeeId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM employees WHERE employee_id = ?', [req.params.employeeId]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Admin Management Routes
// get all admins
router.get('/admins', async (req, res) => {
  try {
    const [admins] = await pool.execute(
      `SELECT a.*, u.first_name, u.last_name, u.email 
       FROM admins a 
       JOIN users u ON a.admin_id = u.user_id`
    );
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
});

// create an admin
router.post('/admins', async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.execute(
      'INSERT INTO admins (admin_id) VALUES (?)',
      [user_id]
    );
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// get an admin
router.get('/admins/:adminId', async (req, res) => {
  try {
    const [admin] = await pool.execute(
      `SELECT a.*, u.first_name, u.last_name, u.email 
       FROM admins a 
       JOIN users u ON a.admin_id = u.user_id 
       WHERE a.admin_id = ?`,
      [req.params.adminId]
    );
    if (!admin.length) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin', error: error.message });
  }
});

// update an admin
router.put('/admins/:adminId', async (req, res) => {
  // Since admins table doesn't have additional fields, we might update user table information
  res.status(501).json({ message: 'Admin update functionality not implemented' });
});

// delete an admin
router.delete('/admins/:adminId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM admins WHERE admin_id = ?', [req.params.adminId]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error: error.message });
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
      cardholder_name, card_number, expiration_date, cvv, customer_id, address_id
    } = req.body; // Make sure customer_id and address_id are included in the request body

    // Insert into payment table
    const paymentQuery = `
      INSERT INTO payment (cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [paymentResult] = await connection.execute(paymentQuery, [cardholder_name, card_number, expiration_date, cvv, customer_id, address_id]);
    const preferred_payment_id = paymentResult.insertId;

    // Commit transaction
    await connection.commit();

    // Respond with success and return the new preferred_payment_id
    res.status(201).json({ message: 'Payment method created successfully', preferred_payment_id: preferred_payment_id });
  } catch (error) {
    // Rollback in case of error
    await connection.rollback();
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: 'Error creating payment method, please try again.' });
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
      return res.status(404).json({ message: 'No payment method found for this ID.' });
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
      return res.status(404).json({ message: 'No payment method found.' });
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


// SALE EVENT MANAGEMENT:

// POST Sale Event API
router.post('/sale-event', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); // Begin the transaction

    const { 
      event_name, start_date, end_date, product_id, category_id // Added product_id and category_id
    } = req.body;

    // Insert sale event
    const saleEventQuery = `
      INSERT INTO sale_events (event_name, start_date, end_date, product_id, category_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [saleEventResult] = await connection.execute(saleEventQuery, [event_name, start_date, end_date, product_id, category_id]);
    const sale_event_id = saleEventResult.insertId;

    // Commit the transaction
    await connection.commit();

    res.status(201).json({ message: 'Sale event created successfully', sale_event_id: sale_event_id });
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.rollback();
    console.error('Error creating sale event:', error);
    res.status(500).json({ error: 'Error creating sale event' }); // Changed to 500 for server error
  } finally {
    connection.release(); // Release the connection
  }
});


// Get Sale Event by eventID API
router.get('/sale-event/:event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { event_id } = req.params; // request parameters

    // Query to get sale event details by event_id
    const saleEventQuery = `
      SELECT *
      FROM sale_events
      WHERE sale_event_id = ?
    `;

    const [saleEventResult] = await connection.execute(saleEventQuery, [event_id]); // execute query with parameter

    if (saleEventResult.length === 0) { // if no event found
      return res.status(404).json({ message: 'No sale event found for this ID.' });
    }

    // Respond with the sale event data if found
    res.status(201).json(saleEventResult);
  } catch (error) {
    console.error('Error retrieving event:', error);
    res.status(400).json({ error: 'Error retrieving event' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// Get all Sale Events API
router.get('/sale-events', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Query to get all sale events
    const saleEventQuery = `
      SELECT *
      FROM sale_events`; // Correct table name (use underscores, not hyphens)

    const [saleEventResult] = await connection.execute(saleEventQuery);

    if (saleEventResult.length === 0) { // if no events found
      return res.status(404).json({ message: 'No sale events found.' });
    }

    // Respond with the sale events data if found
    res.status(201).json(saleEventResult);
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(400).json({ error: 'Error retrieving sale events' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// PUT event API (Update a Sale Event)
router.put('/sale-event/:sale_event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { sale_event_id } = req.params;
    const { event_name, start_date, end_date } = req.body; // new sale event details

    // Update query to modify the sale event details
    const updateQuery = `
      UPDATE sale_events
      SET event_name = ?, start_date = ?, end_date = ?
      WHERE sale_event_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [event_name, start_date, end_date, sale_event_id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Sale event not found.' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'Sale event updated successfully.' });
  } catch (error) {
    console.error('Error updating sale event:', error);
    res.status(500).json({ error: 'Error updating sale event' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// DELETE Sale Event API
router.delete('/sale-event/:sale_event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { sale_event_id } = req.params;

    // Query to delete the sale event by sale_event_id
    const deleteQuery = 'DELETE FROM sale_events WHERE sale_event_id = ?';
    const [result] = await connection.execute(deleteQuery, [sale_event_id]);

    if (result.affectedRows === 0) { // sale event not found
      return res.status(404).json({ error: 'Sale event not found.' });
    }

    res.status(204).send(); // Successfully deleted, no content to return
  } catch (error) {
    console.error('Error deleting sale event:', error);
    res.status(500).json({ error: 'Error deleting sale event' });
  } finally {
    connection.release(); // release the connection back to the pool
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

// Get role by ID
router.get('/roles/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    const query = 'SELECT * FROM roles WHERE role_id = ?';
    const [rows] = await pool.execute(query, [roleId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Error fetching role' });
  }
});

// Update role by ID
router.put('/roles/:roleId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { roleId } = req.params;
    const { role_name } = req.body;

    const query = 'UPDATE roles SET role_name = ? WHERE role_id = ?';
    const [result] = await connection.execute(query, [role_name, roleId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating role:', error);
    res.status(400).json({ error: 'Error updating role' });
  } finally {
    connection.release();
  }
});

// Delete role by ID
router.delete('/roles/:roleId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { roleId } = req.params;
    const query = 'DELETE FROM roles WHERE role_id = ?';

    const [result] = await connection.execute(query, [roleId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting role:', error);
    res.status(400).json({ error: 'Error deleting role' });
  } finally {
    connection.release();
  }
});

// DISCOUNT MANAGEMENT  

// POST Discount API
router.post('/discount', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      discount_type, 
      discount_percentage, 
      sale_event_id // Added sale_event_id to the destructuring
    } = req.body;

    // Validate required fields
    if (!discount_type || !discount_percentage || !sale_event_id) {
      return res.status(400).json({ error: 'Discount type, percentage, and sale event ID are required.' });
    }

    // Insert discount into the discounts table
    const discountQuery = `
      INSERT INTO discounts (discount_type, discount_percentage, sale_event_id) 
      VALUES (?, ?, ?)
    `;
    const [discountResult] = await connection.execute(discountQuery, [discount_type, discount_percentage, sale_event_id]);
    const discount_id = discountResult.insertId;

    // Commit transaction
    await connection.commit();

    res.status(201).json({ message: 'Discount created successfully', discount_id: discount_id });
  } catch (error) {
    await connection.rollback(); // Rollback in case of error
    console.error('Error creating discount:', error);
    res.status(500).json({ error: 'Error creating discount' }); // Changed to 500 for server error
  } finally {
    connection.release();
  }
});


// Get all discounts API
router.get('/all_discounts', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Query to get all discounts
    const discountsQuery = `
      SELECT *
      FROM discounts`;

    const [discountsResult] = await connection.execute(discountsQuery);

    if (discountsResult.length === 0) { // if there are no discounts found
      return res.status(404).json({ message: 'No discounts found.' });
    }

    res.status(201).json(discountsResult);
  } catch (error) {
    console.error('Error retrieving discounts:', error);
    res.status(400).json({ error: 'Error retrieving discounts' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// Get Discount by discount_id API
router.get('/discount/:discount_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { discount_id } = req.params; // request parameters

    const discountsQuery = `
      SELECT *
      FROM discounts
      WHERE discount_id = ?
    `;

    const [discountsResult] = await connection.execute(discountsQuery, [discount_id]); // execute query with parameter

    if (discountsResult.length === 0) { // if no discount found
      return res.status(404).json({ message: 'No discount found for this ID.' });
    }
    res.status(201).json(discountsResult);
  } catch (error) {
    console.error('Error retrieving discount:', error);
    res.status(400).json({ error: 'Error retrieving discount' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// POST (Update) Discount by discount_id API
router.put('/discount/:discount_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { discount_id } = req.params;
    const { discount_type, discount_percentage } = req.body; // new sale event details

    // Update query to modify the sale event details
    const updateQuery = `
      UPDATE discounts
      SET discount_type = ?, discount_percentage = ?
      WHERE discount_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [discount_type, discount_percentage, discount_id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Discount not found.' });
    }

    // Respond with a success message
    res.status(200).json({ message: 'Discount updated successfully.' });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ error: 'Error updating discount' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// DELETE Discount API
router.delete('/discount/:discount_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { discount_id } = req.params;

    // Query to delete the discount by discount_id
    const deleteQuery = 'DELETE FROM discounts WHERE discount_id = ?';
    const [result] = await connection.execute(deleteQuery, [discount_id]);

    if (result.affectedRows === 0) { // discount not found
      return res.status(404).json({ error: 'Discount not found.' });
    }

    res.status(204).send(); // Successfully deleted, no content to return
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ error: 'Error deleting discount' });
  } finally {
    connection.release(); // release the connection back to the pool
  }
});

// ADDRESS MANAGEMENT 

// POST Address API
router.post('/address', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {line_1, line_2, city, state, zip} = req.body;

    // Insert address
    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

    // Commit transaction
    await connection.commit();

    res.status(201).json({ message: 'Address created successfully', address_id: address_id } );
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

//  ROLE MANAGEMENT

// Fetch all roles from the database
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new role in the roles table
router.post('/roles', async (req, res) => {
  const { role_name } = req.body;
  try {
    const [result] = await pool.execute('INSERT INTO roles (role_name) VALUES (?)', [role_name]);
    res.status(201).json({ message: 'Role created successfully', roleId: result.insertId });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(400).json({ error: 'Error creating role' });
  }
});

// Fetch a specific role by its role_id
router.get('/roles/:roleId', async (req, res) => {
  const { roleId } = req.params;
  try {
    const [role] = await pool.execute('SELECT * FROM roles WHERE role_id = ?', [roleId]);
    if (role.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(role[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Error fetching role' });
  }
});

// Update a specific role in the database by its role_id
router.put('/roles/:roleId', async (req, res) => {
  const { roleId } = req.params;
  const { role_name } = req.body;
  try {
    const [result] = await pool.execute('UPDATE roles SET role_name = ? WHERE role_id = ?', [role_name, roleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(400).json({ error: 'Error updating role' });
  }
});

// Delete a specific role by its role_id
router.delete('/roles/:roleId', async (req, res) => {
  const { roleId } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM roles WHERE role_id = ?', [roleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(400).json({ error: 'Error deleting role' });
  }
});

// PERMISSION MANAGEMENT
// Fetch all permissions from the permissions table
router.get('/permissions', async (req, res) => {
  try {
    const [permissions] = await pool.query('SELECT * FROM permissions');
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Create a new permission in the permissions table
router.post('/permissions', async (req, res) => {
  const { permission_name } = req.body;
  try {
    const [result] = await pool.execute('INSERT INTO permissions (permission_name) VALUES (?)', [permission_name]);
    res.status(201).json({ message: 'Permission created successfully', permissionId: result.insertId });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(400).json({ error: 'Error creating permission' });
  }
});
// Fetch a specific permission by its permission_id
router.get('/permissions/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  try {
    const [permission] = await pool.execute('SELECT * FROM permissions WHERE permission_id = ?', [permissionId]);
    if (permission.length === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json(permission[0]);
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ error: 'Error fetching permission' });
  }
});
// Update a specific permission by its permission_id
router.put('/permissions/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  const { permission_name } = req.body;
  try {
    const [result] = await pool.execute('UPDATE permissions SET permission_name = ? WHERE permission_id = ?', [permission_name, permissionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json({ message: 'Permission updated successfully' });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(400).json({ error: 'Error updating permission' });
  }
});
// Delete a specific permission by its permission_id
router.delete('/permissions/:permissionId', async (req, res) => {
  const { permissionId } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM permissions WHERE permission_id = ?', [permissionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    res.status(200).json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(400).json({ error: 'Error deleting permission' });
  }
});

// ROLE PERMISSION MANAGEMENT

// Fetch all permissions associated with a specific role
router.get('/roles/:roleId/permissions', async (req, res) => {
  const { roleId } = req.params;
  try {
    const [permissions] = await pool.execute(
      `SELECT p.* 
       FROM permissions p 
       JOIN role_permissions rp 
       ON p.permission_id = rp.permission_id 
       WHERE rp.role_id = ?`, 
      [roleId]
    );
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Error fetching role permissions' });
  }
});

// Add a permission to a specific role
router.post('/roles/:roleId/permissions', async (req, res) => {
  const { roleId } = req.params;
  const { permission_id } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', 
      [roleId, permission_id]
    );
    res.status(201).json({ message: 'Permission added to role successfully' });
  } catch (error) {
    console.error('Error adding permission to role:', error);
    res.status(400).json({ error: 'Error adding permission to role' });
  }
});

// Remove a permission from a specific role
router.delete('/roles/:roleId/permissions/:permissionId', async (req, res) => {
  const { roleId, permissionId } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', 
      [roleId, permissionId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Role or permission not found' });
    }
    res.status(200).json({ message: 'Permission removed from role successfully' });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    res.status(400).json({ error: 'Error removing permission from role' });
  }
});

// ACTIVITY LOG MANAGEMENT

// Log a new activity (Add an activity log)
router.post('/activity-logs', async (req, res) => {
  const { user_id, action, entity_affected } = req.body;
  const timestamp = new Date(); // Get current timestamp
  try {
    const query = 'INSERT INTO activity_logs (user_id, action, timestamp, entity_affected) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [user_id, action, timestamp, entity_affected]);
    res.status(201).json({ message: 'Activity logged successfully', log_id: result.insertId });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Error logging activity' });
  }
});

// Get all activity logs
router.get('/activity-logs', async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM activity_logs');
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

// Get an activity log by log ID
router.get('/activity-logs/:logId', async (req, res) => {
  const { logId } = req.params;
  try {
    const [log] = await pool.execute('SELECT * FROM activity_logs WHERE log_id = ?', [logId]);
    if (log.length === 0) {
      return res.status(404).json({ message: 'Activity log not found' });
    }
    res.status(200).json(log[0]);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Error fetching activity log' });
  }
});

// Get all activity logs for a specific user by user ID
router.get('/activity-logs/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [logs] = await pool.execute('SELECT * FROM activity_logs WHERE user_id = ?', [userId]);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching activity logs for user:', error);
    res.status(500).json({ error: 'Error fetching activity logs for user' });
  }
});


// PAST THIS LINE THESE ROUTES HAVE NOT BEEN ADDED INTO THE ROUTES FOLDER
// RETURNS MANAGEMENT

// POST a new return
router.post('/returns', async (req, res) => {
  const { order_id, return_date, return_reason } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO returns (order_id, return_date, return_reason) VALUES (?, ?, ?)',
      [order_id, return_date, return_reason]
    );
    res.status(201).json({ message: 'Return created successfully', return_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating return', details: error.message });
  }
});

// GET all returns
router.get('/returns', async (req, res) => {
  try {
    const [returns] = await pool.execute('SELECT * FROM returns');
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching returns', details: error.message });
  }
});

// GET a return by ID
router.get('/returns/:returnId', async (req, res) => {
  const { returnId } = req.params;
  try {
    const [returns] = await pool.execute('SELECT * FROM returns WHERE return_id = ?', [returnId]);
    if (returns.length === 0) return res.status(404).json({ message: 'Return not found' });
    res.status(200).json(returns[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching return', details: error.message });
  }
});

// UPDATE a return by ID
router.put('/returns/:returnId', async (req, res) => {
  const { returnId } = req.params;
  const { return_reason } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE returns SET return_reason = ? WHERE return_id = ?',
      [return_reason, returnId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Return not found' });
    res.status(200).json({ message: 'Return updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating return', details: error.message });
  }
});

// DELETE a return by ID
router.delete('/returns/:returnId', async (req, res) => {
  const { returnId } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM returns WHERE return_id = ?', [returnId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Return not found' });
    res.status(200).json({ message: 'Return deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting return', details: error.message });
  }
});

// UPDATE return status by ID
router.put('/returns/:returnId/status', async (req, res) => {
  const { returnId } = req.params;
  const { return_status } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE returns SET return_status = ? WHERE return_id = ?',
      [return_status, returnId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Return not found' });
    res.status(200).json({ message: 'Return status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating return status', details: error.message });
  }
});

// RETURN ITEM MANAGEMENT

// GET all items in a return
router.get('/returns/:returnId/items', async (req, res) => {
  const { returnId } = req.params;
  try {
    const [items] = await pool.execute('SELECT * FROM return_items WHERE return_id = ?', [returnId]);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching return items', details: error.message });
  }
});

// POST a new item to a return
router.post('/returns/:returnId/items', async (req, res) => {
  const { returnId } = req.params;
  const { product_id, quantity, reason } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO return_items (return_id, product_id, quantity, reason) VALUES (?, ?, ?, ?)',
      [returnId, product_id, quantity, reason]
    );
    res.status(201).json({ message: 'Return item added successfully', return_item_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error adding return item', details: error.message });
  }
});

// GET a specific return item
router.get('/returns/:returnId/items/:itemId', async (req, res) => {
  const { returnId, itemId } = req.params;
  try {
    const [items] = await pool.execute(
      'SELECT * FROM return_items WHERE return_id = ? AND return_item_id = ?',
      [returnId, itemId]
    );
    if (items.length === 0) return res.status(404).json({ message: 'Return item not found' });
    res.status(200).json(items[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching return item', details: error.message });
  }
});

// UPDATE a specific return item
router.put('/returns/:returnId/items/:itemId', async (req, res) => {
  const { returnId, itemId } = req.params;
  const { quantity, reason } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE return_items SET quantity = ?, reason = ? WHERE return_id = ? AND return_item_id = ?',
      [quantity, reason, returnId, itemId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Return item not found' });
    res.status(200).json({ message: 'Return item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating return item', details: error.message });
  }
});

// DELETE a return item
router.delete('/returns/:returnId/items/:itemId', async (req, res) => {
  const { returnId, itemId } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM return_items WHERE return_id = ? AND return_item_id = ?',
      [returnId, itemId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Return item not found' });
    res.status(200).json({ message: 'Return item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting return item', details: error.message });
  }
});

// REFUND MANAGEMENT

// POST a new refund
router.post('/refunds', async (req, res) => {
  const { return_id, refund_amount, refund_date } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO refunds (return_id, refund_amount, refund_date) VALUES (?, ?, ?)',
      [return_id, refund_amount, refund_date]
    );
    res.status(201).json({ message: 'Refund created successfully', refund_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating refund', details: error.message });
  }
});

// GET all refunds
router.get('/refunds', async (req, res) => {
  try {
    const [refunds] = await pool.execute('SELECT * FROM refunds');
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching refunds', details: error.message });
  }
});

// GET a refund by ID
router.get('/refunds/:refundId', async (req, res) => {
  const { refundId } = req.params;
  try {
    const [refunds] = await pool.execute('SELECT * FROM refunds WHERE refund_id = ?', [refundId]);
    if (refunds.length === 0) return res.status(404).json({ message: 'Refund not found' });
    res.status(200).json(refunds[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching refund', details: error.message });
  }
});

// UPDATE a refund by ID
router.put('/refunds/:refundId', async (req, res) => {
  const { refundId } = req.params;
  const { refund_amount, refund_date } = req.body;
  try {
    const [result] = await pool.execute(
      'UPDATE refunds SET refund_amount = ?, refund_date = ? WHERE refund_id = ?',
      [refund_amount, refund_date, refundId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Refund not found' });
    res.status(200).json({ message: 'Refund updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating refund', details: error.message });
  }
});

// DELETE a refund by ID
router.delete('/refunds/:refundId', async (req, res) => {
  const { refundId } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM refunds WHERE refund_id = ?', [refundId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Refund not found' });
    res.status(200).json({ message: 'Refund deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting refund', details: error.message });
  }
});

module.exports = router;
