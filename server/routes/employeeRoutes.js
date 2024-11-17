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
    // Set current user for auditing (if required)
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    await connection.beginTransaction();

    // Destructure and sanitize incoming data
    const { 
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const productId = req.params.productId;
    const image_path = req.file ? path.basename(req.file.path) : null;

    // Prepare base update query and parameters
    let updateProductQuery = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, 
          price = ?, stock_quantity = ?, reorder_threshold = ?, 
          size = ?, color = ?, brand = ?
    `;
    const queryParams = [
      product_name, category_id, description, price, 
      stock_quantity, reorder_threshold, size, color, brand
    ];

    // Add image_path to the query only if a new image is uploaded
    if (image_path) {
      updateProductQuery += `, image_path = ?`;
      queryParams.push(image_path);
    }

    // Add WHERE clause
    updateProductQuery += ` WHERE product_id = ?`;
    queryParams.push(productId);

    // Execute the update query
    const [result] = await connection.execute(updateProductQuery, queryParams);

    // Commit if the update was successful
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    // Rollback on error and respond with a single error message
    await connection.rollback();
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    connection.release();
  }
});


router.delete('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
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

router.get('/staff/returns', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = `
      SELECT r.*,
             o.order_date, o.total_amount as order_total,
             u.first_name, u.last_name, u.email,
             COALESCE(JSON_ARRAYAGG(
               IF(ri.return_item_id IS NOT NULL,
                  JSON_OBJECT(
                    'product_id', ri.product_id,
                    'quantity', ri.quantity,
                    'product_name', p.product_name,
                    'price', p.price,
                    'image_path', p.image_path
                  ),
                  NULL
               )
             ), JSON_ARRAY()) as return_items,
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

    query += ' GROUP BY r.return_id, o.order_date, o.total_amount, u.first_name, u.last_name, u.email, ref.refund_amount, ref.refund_status';
    query += ' ORDER BY r.return_date DESC';

    console.log('Executing query:', query); // Debug log
    console.log('With params:', params); // Debug log

    const [returns] = await connection.execute(query, params);
    
    // Process the returns to ensure valid JSON arrays
    const processedReturns = returns.map(ret => ({
      ...ret,
      return_items: Array.isArray(ret.return_items) ? ret.return_items.filter(Boolean) : [],
      refund_amount: Number(ret.refund_amount) || 0
    }));

    console.log('Processed returns:', processedReturns); // Debug log
    res.json(processedReturns);

  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch returns',
      details: error.message,
      stack: error.stack
    });
  } finally {
    connection.release();
  }
});

router.get('/staff/returns/:returnId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [returns] = await connection.execute(`
      SELECT r.*,
             o.order_date, o.total_amount as order_total,
             u.first_name, u.last_name, u.email,
             COALESCE(JSON_ARRAYAGG(
               IF(ri.return_item_id IS NOT NULL,
                  JSON_OBJECT(
                    'product_id', ri.product_id,
                    'quantity', ri.quantity,
                    'product_name', p.product_name,
                    'price', p.price,
                    'image_path', p.image_path
                  ),
                  NULL
               )
             ), JSON_ARRAY()) as return_items,
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
      GROUP BY r.return_id, o.order_date, o.total_amount, u.first_name, u.last_name, u.email, ref.refund_amount, ref.refund_status, ref.refund_date`,
      [req.params.returnId]
    );

    if (returns.length === 0) {
      return res.status(404).json({ message: 'Return not found' });
    }

    // Process the return to ensure valid JSON array
    const processedReturn = {
      ...returns[0],
      return_items: Array.isArray(returns[0].return_items) ? 
        returns[0].return_items.filter(Boolean) : [],
      refund_amount: Number(returns[0].refund_amount) || 0
    };

    res.json(processedReturn);
  } catch (error) {
    console.error('Error fetching return details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch return details',
      details: error.message 
    });
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
      'UPDATE returns SET return_status = ?, approval = ? WHERE return_id = ?',
      [return_status, approval, returnId]
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

// Add these routes to employeeRoutes.js

// Get all refunds
router.get('/refunds', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM refunds';
    const [refunds] = await connection.execute(query);
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  } finally {
    connection.release();
  }
});

// Get refund by ID
router.get('/refunds/:refund_id', async (req, res) => {
  const connection = await pool.getConnection();
  const { refund_id } = req.params;
  try {
    const query = 'SELECT * FROM refunds WHERE refund_id = ?';
    const [refund] = await connection.execute(query, [refund_id]);
    
    if (refund.length === 0) {
      return res.status(404).json({ message: 'Refund not found' });
    }
    
    res.json(refund[0]);
  } catch (error) {
    console.error('Error fetching refund:', error);
    res.status(500).json({ error: 'Failed to fetch refund' });
  } finally {
    connection.release();
  }
});

// Create new refund
router.post('/refunds', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { return_id, refund_amount, refund_date, refund_status } = req.body;
    
    // Validate refund status
    if (!['Pending', 'Completed'].includes(refund_status)) {
      return res.status(400).json({ 
        error: 'Invalid refund status. Must be either Pending or Completed' 
      });
    }
    
    // Validate refund amount is negative (as per table constraint)
    if (refund_amount >= 0) {
      return res.status(400).json({
        error: 'Refund amount must be negative'
      });
    }

    // Verify the return exists and is approved
    const [returnCheck] = await connection.execute(
      'SELECT approval FROM returns WHERE return_id = ?',
      [return_id]
    );

    if (returnCheck.length === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (!returnCheck[0].approval) {
      return res.status(400).json({ error: 'Cannot create refund for unapproved return' });
    }

    // Check if refund already exists for this return
    const [existingRefund] = await connection.execute(
      'SELECT refund_id FROM refunds WHERE return_id = ?',
      [return_id]
    );

    if (existingRefund.length > 0) {
      return res.status(400).json({ error: 'Refund already exists for this return' });
    }

    const query = `
      INSERT INTO refunds 
      (return_id, refund_amount, refund_date, refund_status) 
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      return_id,
      refund_amount,
      refund_date,
      refund_status
    ]);

    await connection.commit();
    res.status(201).json({ 
      message: 'Refund created successfully',
      refund_id: result.insertId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating refund:', error);
    res.status(500).json({ error: 'Failed to create refund' });
  } finally {
    connection.release();
  }
});

// Get refunds by return ID
router.get('/refunds/return/:return_id', async (req, res) => {
  const connection = await pool.getConnection();
  const { return_id } = req.params;
  try {
    const query = 'SELECT * FROM refunds WHERE return_id = ?';
    const [refunds] = await connection.execute(query, [return_id]);
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refunds for return:', error);
    res.status(500).json({ error: 'Failed to fetch refunds for return' });
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

// SALE EVENT MANAGEMENT:

// POST Sale Event API
router.post('/sale-event', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    await connection.beginTransaction();

    const {
      event_name,
      start_date,
      end_date,
      discount_percentage
    } = req.body;

    // Validate discount_percentage (should be between 0 and 100)
    if (discount_percentage < 0 || discount_percentage > 100) {
      return res.status(400).json({ error: 'Discount percentage must be between 0 and 100' });
    }

    // Insert sale event
    const saleEventQuery = `
      INSERT INTO sale_events (
        event_name, 
        start_date, 
        end_date, 
        discount_percentage
      ) VALUES (?, ?, ?, ?)
    `;

    const [saleEventResult] = await connection.execute(
      saleEventQuery, 
      [event_name, start_date, end_date, discount_percentage]
    );

    const sale_event_id = saleEventResult.insertId;
    await connection.commit();

    res.status(201).json({ 
      message: 'Sale event created successfully', 
      sale_event_id: sale_event_id 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating sale event:', error);
    res.status(500).json({ error: 'Error creating sale event' });
  } finally {
    connection.release();
  }
});

// Get Sale Event by eventID API
router.get('/sale-event/:event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { event_id } = req.params;

    const saleEventQuery = `
      SELECT 
        sale_event_id,
        event_name,
        start_date,
        end_date,
        discount_percentage
      FROM sale_events
      WHERE sale_event_id = ?
    `;

    const [saleEventResult] = await connection.execute(saleEventQuery, [event_id]);

    if (saleEventResult.length === 0) {
      return res.status(404).json({ message: 'No sale event found for this ID.' });
    }

    res.status(200).json(saleEventResult[0]);
  } catch (error) {
    console.error('Error retrieving event:', error);
    res.status(500).json({ error: 'Error retrieving event' });
  } finally {
    connection.release();
  }
});

// Get all Sale Events API
router.get('/sale-events', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const saleEventQuery = `
      SELECT 
        sale_event_id,
        event_name,
        start_date,
        end_date,
        discount_percentage
      FROM sale_events
      ORDER BY start_date DESC`;

    const [saleEventResult] = await connection.execute(saleEventQuery);

    if (saleEventResult.length === 0) {
      return res.status(404).json({ message: 'No sale events found.' });
    }

    res.status(200).json(saleEventResult);
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).json({ error: 'Error retrieving sale events' });
  } finally {
    connection.release();
  }
});

// Get active sale events
router.get('/sale-events/active', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const saleEventQuery = `
      SELECT 
        sale_event_id,
        event_name,
        start_date,
        end_date,
        discount_percentage
      FROM sale_events
      WHERE start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
      ORDER BY start_date DESC`;

    const [saleEventResult] = await connection.execute(saleEventQuery);

    if (saleEventResult.length === 0) {
      return res.status(404).json({ message: 'No active sale events found.' });
    }

    res.status(200).json(saleEventResult);
  } catch (error) {
    console.error('Error retrieving active events:', error);
    res.status(500).json({ error: 'Error retrieving active sale events' });
  } finally {
    connection.release();
  }
});

// PUT event API (Update a Sale Event)
router.put('/sale-event/:sale_event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { sale_event_id } = req.params;
    const { 
      event_name, 
      start_date, 
      end_date, 
      discount_percentage 
    } = req.body;

    // Validate discount_percentage if provided
    if (discount_percentage !== undefined) {
      if (discount_percentage < 0 || discount_percentage > 100) {
        return res.status(400).json({ error: 'Discount percentage must be between 0 and 100' });
      }
    }

    const updateQuery = `
      UPDATE sale_events
      SET event_name = ?, 
          start_date = ?, 
          end_date = ?, 
          discount_percentage = ?
      WHERE sale_event_id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [
      event_name,
      start_date,
      end_date,
      discount_percentage,
      sale_event_id
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Sale event not found.' });
    }

    res.status(200).json({ message: 'Sale event updated successfully.' });
  } catch (error) {
    console.error('Error updating sale event:', error);
    res.status(500).json({ error: 'Error updating sale event' });
  } finally {
    connection.release();
  }
});

// DELETE Sale Event API
router.delete('/sale-event/:sale_event_id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SET @current_user_id = ?', [req.user.user_id]);
    const { sale_event_id } = req.params;

    const deleteQuery = 'DELETE FROM sale_events WHERE sale_event_id = ?';
    const [result] = await connection.execute(deleteQuery, [sale_event_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale event not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting sale event:', error);
    res.status(500).json({ error: 'Error deleting sale event' });
  } finally {
    connection.release();
  }
});

router.get('/activity-logs', async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM activity_logs ORDER BY log_id ASC');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});
module.exports = router;