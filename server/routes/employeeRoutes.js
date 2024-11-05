const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db/connection');  // Add this line
const { authMiddleware } = require('../middleware/passport-auth');
router.use(express.static(path.join(__dirname, './images')));
router.use(express.json());
router.use(express.urlencoded({extended:false}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../images')); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    // Keep original filename but make it unique with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Apply staffOnly middleware to all routes
router.use(authMiddleware.staffOnly);

// =============================================
// EMPLOYEE ROUTES (Role ID: 2)
// =============================================

// Product Management (Permission: 2001)
// In employeeRoutes.js

router.post('/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    await connection.beginTransaction();
    
    // Log the incoming request body
    console.log('Request body:', req.body);

    const {
      product_name,
      category_id,
      description,
      price,
      stock_quantity,
      reorder_threshold,
      size,
      color,
      brand
    } = req.body;

    // Validate all required fields are present
    if (!product_name || !category_id || !description || !price || 
        !stock_quantity || !reorder_threshold || !size || !color || !brand) {
      console.log('Missing required fields:', {
        product_name,
        category_id,
        description,
        price,
        stock_quantity,
        reorder_threshold,
        size,
        color,
        brand
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: {
          product_name: !!product_name,
          category_id: !!category_id,
          description: !!description,
          price: !!price,
          stock_quantity: !!stock_quantity,
          reorder_threshold: !!reorder_threshold,
          size: !!size,
          color: !!color,
          brand: !!brand
        }
      });
    }

    // Convert values to appropriate types
    const values = [
      product_name,
      parseInt(category_id),
      description,
      parseFloat(price),
      parseInt(stock_quantity),
      parseInt(reorder_threshold),
      size,
      color,
      brand
    ];

    // Log the values being passed to the query
    console.log('Values to insert:', values);

    const query = `
      INSERT INTO products (
        product_name, category_id, description, price, 
        stock_quantity, reorder_threshold, size, color, brand
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, values);

    await connection.commit();
    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    // Send more detailed error information
    res.status(500).json({ 
      error: 'Error creating product',
      details: error.message,
      requestBody: req.body
    });
  } finally {
    connection.release();
  }
});

router.delete('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // First check if the product exists
    const [product] = await connection.execute(
      'SELECT * FROM products WHERE product_id = ?',
      [req.params.productId]
    );

    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete the product
    const [result] = await connection.execute(
      'DELETE FROM products WHERE product_id = ?',
      [req.params.productId]
    );

    await connection.commit();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  } finally {
    connection.release();
  }
});

router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    await connection.beginTransaction();

    const { 
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const updateProductQuery = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, 
          price = ?, stock_quantity = ?, reorder_threshold = ?, 
          size = ?, color = ?, brand = ?
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(updateProductQuery, [
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
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
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
router.post('/categories', async (req, res) => {
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

// SALE EVENT MANAGEMENT:

// POST Sale Event API
router.post('/sale-event', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
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
      FROM sale_events`;

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
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
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

// Order Item Management
// Post
router.post('/order_items', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { order_id, product_id, quantity, unit_price, total_item_price } = req.body;
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

// Get all order items
router.get('/order_items', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orderItems] = await connection.execute(`
      SELECT oi.*, p.category_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
    `);
    res.status(200).json(orderItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  } finally {
    connection.release();
  }
});

// Get order item via order item ID
router.get('/order_items/:order_item_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orderItem] = await connection.execute(
      'SELECT * FROM order_items WHERE order_item_id = ?',
      [req.params.order_item_id]
    );
    if (orderItem.length === 0) return res.status(404).json({ error: 'Order item not found' });
    res.status(200).json(orderItem[0]);
  } catch (error) {
    console.error('Error fetching order item:', error);
    res.status(500).json({ error: 'Failed to fetch order item' });
  } finally {
    connection.release();
  }
});


module.exports = router;