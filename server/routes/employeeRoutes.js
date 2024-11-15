const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');
router.use(express.static(path.join(__dirname, './images')));
router.use(express.json());
router.use(express.urlencoded({extended:false}));

// Set up storage engine with destination
// Set up storage engine with destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'src/images'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
      // Set the filename to be the original name
      cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Apply staffOnly middleware to all routes
router.use(authMiddleware.staffOnly);

// =============================================
// EMPLOYEE ROUTES (Role ID: 2)
// =============================================

// Product Management (Permission: 2001)
router.post('/products', upload.single('image'), async (req, res) => {
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


    let image_path = req.file ? req.file.path : '';
    if (image_path.length !== 0){
      image_path = path.basename(req.file.path)
    }

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
      brand,
      image_path
    ];

    // Log the values being passed to the query
    console.log('Values to insert:', values);

    const query = `
      INSERT INTO products (
        product_name, category_id, description, price, 
        stock_quantity, reorder_threshold, size, color, brand, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    res.status(500).json({ 
      error: 'Error creating product',
      details: error.message,
      requestBody: req.body
    });
  } finally {
    connection.release();
  }
});


router.put('/products/:productId', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Set current user for auditing, if required
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    await connection.beginTransaction();
    // Destructure and sanitize incoming data
    const { 
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;
    let image_path = req.file ? path.basename(req.file.path) : '';
    let updateProductQuery;
    let queryParams = [
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand,
      req.params.productId
    ];
    // Update query with image update
    updateProductQuery = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, 
          price = ?, stock_quantity = ?, reorder_threshold = ?, 
          size = ?, color = ?, brand = ?, image_path = ?
      WHERE product_id = ?
    `;
    queryParams.splice(-1, 0, image_path); // Insert image_path into query params
    // Execute the update query
    const [result] = await connection.execute(updateProductQuery, queryParams);
    // Commit if the update was successful
    await connection.commit();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
    console.error('Error updating product:', error); // Log error for debugging
    res.status(400).json({ error: 'Error updating product' });
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

// Get all returns (with filters)
router.get('/staff/returns', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = `
      SELECT r.*,
             o.order_date, o.total_amount as order_total,
             u.first_name, u.last_name, u.email,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'product_id', ri.product_id,
                 'quantity', ri.quantity,
                 'product_name', p.product_name,
                 'price', p.price,
                 'image_path', p.image_path
               )
             ) as return_items,
             COALESCE(ref.refund_amount, 0) as refund_amount,
             ref.refund_status
      FROM returns r
      JOIN orders o ON r.order_id = o.order_id
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN return_items ri ON r.return_id = ri.return_id
      LEFT JOIN products p ON ri.product_id = p.product_id
      LEFT JOIN refunds ref ON r.return_id = ref.return_id
    `;

    const whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push('r.return_status = ?');
      params.push(status);
    }
    if (startDate) {
      whereConditions.push('r.return_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('r.return_date <= ?');
      params.push(endDate);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' GROUP BY r.return_id ORDER BY r.return_date DESC';

    const [returns] = await connection.execute(query, params);
    res.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  } finally {
    connection.release();
  }
});

// Get specific return details
router.get('/staff/returns/:returnId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [returns] = await connection.execute(`
      SELECT r.*,
             o.order_date, o.total_amount as order_total,
             u.first_name, u.last_name, u.email,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'product_id', ri.product_id,
                 'quantity', ri.quantity,
                 'product_name', p.product_name,
                 'price', p.price,
                 'image_path', p.image_path
               )
             ) as return_items,
             COALESCE(ref.refund_amount, 0) as refund_amount,
             ref.refund_status,
             ref.refund_date
      FROM returns r
      JOIN orders o ON r.order_id = o.order_id
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN return_items ri ON r.return_id = ri.return_id
      LEFT JOIN products p ON ri.product_id = p.product_id
      LEFT JOIN refunds ref ON r.return_id = ref.return_id
      WHERE r.return_id = ?
      GROUP BY r.return_id`,
      [req.params.returnId]
    );

    if (returns.length === 0) {
      return res.status(404).json({ message: 'Return not found' });
    }

    res.json(returns[0]);
  } catch (error) {
    console.error('Error fetching return details:', error);
    res.status(500).json({ error: 'Failed to fetch return details' });
  } finally {
    connection.release();
  }
});

router.put('/staff/returns/:returnId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { return_status, approval, notes } = req.body;
    const { returnId } = req.params;

    // Update return status
    await connection.execute(
      'UPDATE returns SET return_status = ?, approval = ?, notes = ? WHERE return_id = ?',
      [return_status, approval, notes || null, returnId]
    );

    // If approved, create refund record
    if (approval && return_status === 'Approved') {
      // Calculate refund amount based on returned items
      const [returnItems] = await connection.execute(`
        SELECT ri.quantity, oi.unit_price
        FROM return_items ri
        JOIN returns r ON ri.return_id = r.return_id
        JOIN orders o ON r.order_id = o.order_id
        JOIN order_items oi ON o.order_id = oi.order_id AND ri.product_id = oi.product_id
        WHERE r.return_id = ?`,
        [returnId]
      );

      const refundAmount = returnItems.reduce((total, item) => 
        total + (item.quantity * item.unit_price), 0);

      // Create refund record
      await connection.execute(
        'INSERT INTO refunds (return_id, refund_amount, refund_date, refund_status) VALUES (?, ?, CURRENT_DATE, ?)',
        [returnId, -Math.abs(refundAmount), 'Pending']  // Ensure negative amount per schema check
      );

      // Update stock quantities
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM return_items WHERE return_id = ?',
        [returnId]
      );

      for (const item of items) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Create notification for customer
      const [returnInfo] = await connection.execute(
        'SELECT user_id FROM returns WHERE return_id = ?',
        [returnId]
      );

      if (returnInfo.length > 0) {
        await connection.execute(
          'INSERT INTO notifications (user_id, message, notification_date, read_status) VALUES (?, ?, CURRENT_DATE, FALSE)',
          [returnInfo[0].user_id, `Your return #${returnId} has been approved and a refund will be processed.`]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Return status updated successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating return status:', error);
    res.status(500).json({ message: 'Error updating return status', error: error.message });
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



module.exports = router;