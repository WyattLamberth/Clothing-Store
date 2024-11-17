const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');
const bcrypt = require('bcrypt');

const multer = require('multer');
const path = require('path');
router.use(express.static(path.join(__dirname, './images')));
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// Set up storage engine with destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/images'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    // Set the filename to be the original name
    cb(null, file.filename);
  }
});

const upload = multer({ storage: storage });

// Apply adminOnly middleware to all routes
router.use(authMiddleware.adminOnly);

// =============================================
// ADMIN ROUTES (Role ID: 3)
// =============================================

// Get all users with their addresses
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM users u
      LEFT JOIN address a ON u.address_id = a.address_id
    `);

    // Map the results to include nested address objects
    const formattedUsers = users.map(user => ({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      active: user.active,
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
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
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

// Create user with address
router.post('/users', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { first_name, last_name, username, email, phone_number, role_id, password, addressId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user
    const [result] = await connection.execute(
      'INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, username, email, phone_number, hashedPassword, role_id, addressId]
    );

    const userId = result.insertId;

    // Fetch the created user with address details
    const [users] = await connection.execute(`
      SELECT u.*, 
             a.line_1, a.line_2, a.city, a.state, a.zip
      FROM users u
      LEFT JOIN address a ON u.address_id = a.address_id
      WHERE u.user_id = ?
    `, [userId]);

    await connection.commit();

    // Format the response
    const user = users[0];
    const response = {
      message: 'User created successfully',
      userId: userId,
      user: {
        ...user,
        address: user.address_id ? {
          line_1: user.line_1,
          line_2: user.line_2,
          city: user.city,
          state: user.state,
          zip: user.zip
        } : null
      }
    };

    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error creating user', error: error.message });
  } finally {
    connection.release();
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

// Delete user and associated address
router.delete('/users/:userId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get the address_id before deleting the user
    const [user] = await connection.execute(
      'SELECT address_id FROM users WHERE user_id = ?',
      [req.params.userId]
    );

    // Delete the user
    const [result] = await connection.execute(
      'DELETE FROM users WHERE user_id = ?',
      [req.params.userId]
    );

    // If user had an address, delete it
    if (user.length > 0 && user[0].address_id) {
      await connection.execute(
        'DELETE FROM address WHERE address_id = ?',
        [user[0].address_id]
      );
    }

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User and associated address deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  } finally {
    connection.release();
  }
}); 

// Optional: Add route to deactivate user (Admin only)
router.put('/users/:userId/deactivate', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE users SET active = FALSE WHERE user_id = ?',
      [req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await connection.commit();
    res.json({ message: 'User account deactivated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  } finally {
    connection.release();
  }
});

// Optional: Add route to reactivate user (Admin only)
router.put('/users/:userId/activate', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE users SET active = TRUE WHERE user_id = ?',
      [req.params.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await connection.commit();
    res.json({ message: 'User account activated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  } finally {
    connection.release();
  }
});

// ADDRESS MANAGEMENT 

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

// Role and Permission Management (Permission: 1002)
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching roles' });
  }
});

router.post('/roles', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO roles (role_name) VALUES (?)',
      [req.body.role_name]
    );
    await connection.commit();
    res.status(201).json({ message: 'Role created successfully', roleId: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error creating role' });
  } finally {
    connection.release();
  }
});

router.put('/roles/:roleId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE roles SET role_name = ? WHERE role_id = ?',
      [req.body.role_name, req.params.roleId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error updating role' });
  } finally {
    connection.release();
  }
});

router.delete('/roles/:roleId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'DELETE FROM roles WHERE role_id = ?',
      [req.params.roleId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error deleting role' });
  } finally {
    connection.release();
  }
});

// Permission Management
router.get('/permissions', async (req, res) => {
  try {
    const [permissions] = await pool.query('SELECT * FROM permissions');
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching permissions' });
  }
});

// Role-Permission Management
router.get('/roles/:roleId/permissions', async (req, res) => {
  try {
    const [permissions] = await pool.execute(
      `SELECT p.* 
       FROM permissions p 
       JOIN role_permissions rp ON p.permission_id = rp.permission_id 
       WHERE rp.role_id = ?`,
      [req.params.roleId]
    );
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching role permissions' });
  }
});

router.post('/roles/:roleId/permissions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [req.params.roleId, req.body.permission_id]
    );
    await connection.commit();
    res.status(201).json({ message: 'Permission added to role successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error adding permission to role' });
  } finally {
    connection.release();
  }
});

router.delete('/roles/:roleId/permissions/:permissionId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [req.params.roleId, req.params.permissionId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Role-permission association not found' });
    res.json({ message: 'Permission removed from role successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error removing permission from role' });
  } finally {
    connection.release();
  }
});

// System Monitoring (Permission: 1003)
router.get('/activity-logs', async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

router.get('/activity-logs/user/:userId', async (req, res) => {
  try {
    const [logs] = await pool.execute(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC',
      [req.params.userId]
    );
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user activity logs' });
  }
});

// REPORTS

// In adminRoutes.js, update the inventory report route
router.get('/reports/inventory', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get product inventory status
    const [stockLevels] = await connection.execute(`
      SELECT p.product_id, p.product_name, p.stock_quantity, p.price,
             p.reorder_threshold, c.name as category_name,
             (p.stock_quantity * p.price) as stock_value
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
    `);

    // Get category totals with proper decimal handling
    const [categoryTotals] = await connection.execute(`
      SELECT c.name as category_name,
             COUNT(p.product_id) as product_count,
             SUM(p.stock_quantity) as total_items,
             CAST(SUM(p.stock_quantity * p.price) AS DECIMAL(10,2)) as total_value
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      GROUP BY c.category_id
    `);

    // Calculate total inventory value with proper decimal handling
    const totalValue = stockLevels.reduce((sum, item) => {
      const itemValue = parseFloat(item.stock_value) || 0;
      return sum + itemValue;
    }, 0);

    // Get low stock items
    const [lowStock] = await connection.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.stock_quantity <= p.reorder_threshold
    `);

    // Format the summary data
    const summary = {
      totalProducts: stockLevels.length,
      totalValue: parseFloat(totalValue.toFixed(2)), // Ensure proper decimal handling
      lowStockCount: lowStock.length,
      averageReturnRate: 0 // Set default value if not calculating returns
    };

    res.json({
      stockLevels,
      lowStock,
      categoryTotals,
      summary
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Error generating inventory report', error: error.message });
  } finally {
    connection.release();
  }
});

// In adminRoutes.js
// In adminRoutes.js or a separate analytics route file

router.get('/reports/sales-analytics', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { timeRange, category, startDate, endDate } = req.query;

    // Build date condition
    let dateCondition = '';
    let dateParams = [];
    if (startDate && endDate) {
      dateCondition = 'WHERE o.order_date BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } else {
      // Default date range based on timeRange
      const endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default: // 30d is default
          startDate.setDate(endDate.getDate() - 30);
      }

      dateCondition = 'WHERE o.order_date BETWEEN ? AND ?';
      dateParams = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    }

    // Build category condition
    let categoryCondition = '';
    let categoryParam = [];
    if (category && category !== 'all') {
      categoryCondition = 'AND c.name = ?';
      categoryParam = [category];
    }

    // Get summary statistics
    const summaryQuery = `
  SELECT 
    main_stats.total_orders,
    main_stats.total_revenue,
    main_stats.average_order_value,
    main_stats.unique_customers,
    COALESCE(return_stats.total_returns, 0) as total_returns,
    COALESCE(return_stats.average_refund, 0) as average_refund
  FROM (
    SELECT 
      COUNT(DISTINCT o.order_id) as total_orders,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as average_order_value,
      COUNT(DISTINCT o.user_id) as unique_customers
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.product_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    ${dateCondition}
    ${categoryCondition}
    AND o.order_status != 'Cancelled'
  ) as main_stats,
  (
    SELECT 
      COUNT(*) as total_returns,
      AVG(ref.refund_amount) as average_refund
    FROM returns r 
    JOIN refunds ref ON r.return_id = ref.return_id
    JOIN orders o ON r.order_id = o.order_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.product_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE o.order_date BETWEEN ? AND ?
    ${categoryCondition}
    AND r.return_status = 'Completed'
  ) as return_stats
`;


    // Get category statistics
    const categoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT o.order_id) as order_count,
        SUM(oi.total_item_price) as revenue
      FROM categories c
      JOIN products p ON c.category_id = p.category_id
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      ${dateCondition}
      ${categoryCondition}
      AND o.order_status != 'Cancelled'
      GROUP BY c.category_id
      ORDER BY revenue DESC
    `;

    // Get top products
    const topProductsQuery = `
      SELECT 
        p.product_name,
        p.product_id,
        COUNT(DISTINCT o.order_id) as times_ordered,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_item_price) as total_revenue
      FROM products p
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${dateCondition}
      ${categoryCondition}
      AND o.order_status != 'Cancelled'
      GROUP BY p.product_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // Get monthly revenue trend
    const revenueQuery = `
      SELECT 
        DATE_FORMAT(o.order_date, '%Y-%m') as month,
        COUNT(DISTINCT o.order_id) as order_count,
        SUM(o.total_amount) as revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${dateCondition}
      ${categoryCondition}
      AND o.order_status != 'Cancelled'
      GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
      ORDER BY month ASC
    `;

    // Execute all queries
    const queryParams = [...dateParams, ...categoryParam];
    const summaryParams = [...dateParams, ...categoryParam, ...dateParams, ...categoryParam];
    const [summaryResults] = await connection.execute(summaryQuery, summaryParams);
    const [categoryStats] = await connection.execute(categoryQuery, queryParams);
    const [topProducts] = await connection.execute(topProductsQuery, queryParams);
    const [monthlyRevenue] = await connection.execute(revenueQuery, queryParams);

    // Format and validate the data
    const summary = {
      total_revenue: Number(summaryResults[0]?.total_revenue) || 0,
      total_orders: Number(summaryResults[0]?.total_orders) || 0,
      average_order_value: Number(summaryResults[0]?.average_order_value) || 0,
      unique_customers: Number(summaryResults[0]?.unique_customers) || 0,
      total_returns: Number(summaryResults[0]?.total_returns) || 0,
      average_refund: Number(summaryResults[0]?.average_refund) || 0
    };

    // Send the response
    res.json({
      summary,
      categoryStats: categoryStats.map(cat => ({
        ...cat,
        revenue: Number(cat.revenue) || 0,
        order_count: Number(cat.order_count) || 0
      })),
      topProducts: topProducts.map(prod => ({
        ...prod,
        total_revenue: Number(prod.total_revenue) || 0,
        total_quantity: Number(prod.total_quantity) || 0,
        times_ordered: Number(prod.times_ordered) || 0
      })),
      monthlyRevenue: monthlyRevenue.map(month => ({
        ...month,
        revenue: Number(month.revenue) || 0,
        order_count: Number(month.order_count) || 0
      }))
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      message: 'Error generating sales report',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// In adminRoutes.js
router.get('/reports/customer-analytics', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { startDate, endDate } = req.query;

    // Calculate customer segments and behavior
    const [customerSegments] = await connection.execute(`
      WITH CustomerStats AS (
        SELECT 
          u.user_id,
          u.first_name,
          u.last_name,
          COUNT(DISTINCT o.order_id) as order_count,
          SUM(o.total_amount) as total_spent,
          MAX(o.order_date) as last_order_date,
          MIN(o.order_date) as first_order_date,
          COUNT(DISTINCT r.return_id) as return_count
        FROM users u
        LEFT JOIN orders o ON u.user_id = o.user_id AND o.order_status != 'Cancelled'
        LEFT JOIN returns r ON o.order_id = r.order_id
        WHERE o.order_date BETWEEN ? AND ?
        GROUP BY u.user_id
      )
      SELECT 
        CASE
          WHEN order_count = 1 THEN 'One-time'
          WHEN order_count BETWEEN 2 AND 3 THEN 'Occasional'
          WHEN order_count BETWEEN 4 AND 8 THEN 'Regular'
          ELSE 'VIP'
        END as segment,
        COUNT(*) as customer_count,
        ROUND(AVG(total_spent), 2) as avg_spend,
        ROUND(AVG(order_count), 2) as avg_orders,
        ROUND(AVG(return_count), 2) as avg_returns,
        COUNT(CASE WHEN DATEDIFF(NOW(), last_order_date) <= 90 THEN 1 END) as active_last_90_days
      FROM CustomerStats
      GROUP BY 
        CASE
          WHEN order_count = 1 THEN 'One-time'
          WHEN order_count BETWEEN 2 AND 3 THEN 'Occasional'
          WHEN order_count BETWEEN 4 AND 8 THEN 'Regular'
          ELSE 'VIP'
        END
    `, [startDate, endDate]);

    // Calculate category preferences by segment
    const [categoryPreferences] = await connection.execute(`
      WITH CustomerSegments AS (
        SELECT 
          u.user_id,
          CASE
            WHEN COUNT(DISTINCT o.order_id) = 1 THEN 'One-time'
            WHEN COUNT(DISTINCT o.order_id) BETWEEN 2 AND 3 THEN 'Occasional'
            WHEN COUNT(DISTINCT o.order_id) BETWEEN 4 AND 8 THEN 'Regular'
            ELSE 'VIP'
          END as segment
        FROM users u
        JOIN orders o ON u.user_id = o.user_id
        WHERE o.order_date BETWEEN ? AND ?
        GROUP BY u.user_id
      )
      SELECT 
        cs.segment,
        c.name as category,
        COUNT(DISTINCT o.order_id) as order_count,
        ROUND(SUM(oi.total_item_price), 2) as revenue,
        COUNT(DISTINCT u.user_id) as customer_count
      FROM CustomerSegments cs
      JOIN users u ON cs.user_id = u.user_id
      JOIN orders o ON u.user_id = o.user_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN categories c ON p.category_id = c.category_id
      WHERE o.order_date BETWEEN ? AND ?
      GROUP BY cs.segment, c.name
    `, [startDate, endDate, startDate, endDate]);

    // Calculate customer acquisition and retention trends
    const [retentionTrends] = await connection.execute(`
      WITH MonthlyCustomers AS (
        SELECT 
          DATE_FORMAT(o.order_date, '%Y-%m') as month,
          COUNT(DISTINCT CASE WHEN prev_order IS NULL THEN u.user_id END) as new_customers,
          COUNT(DISTINCT CASE WHEN prev_order IS NOT NULL THEN u.user_id END) as returning_customers
        FROM users u
        JOIN orders o ON u.user_id = o.user_id
        LEFT JOIN (
          SELECT 
            user_id,
            order_date,
            LAG(order_date) OVER (PARTITION BY user_id ORDER BY order_date) as prev_order
          FROM orders
        ) prev ON o.user_id = prev.user_id AND o.order_date = prev.order_date
        WHERE o.order_date BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
      )
      SELECT 
        month,
        new_customers,
        returning_customers,
        ROUND(100.0 * returning_customers / NULLIF(new_customers + returning_customers, 0), 2) as retention_rate
      FROM MonthlyCustomers
      ORDER BY month
    `, [startDate, endDate]);

    // Get top customers
    const [topCustomers] = await connection.execute(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_amount) as total_spent,
        ROUND(AVG(o.total_amount), 2) as avg_order_value,
        COUNT(DISTINCT r.return_id) as returns,
        MAX(o.order_date) as last_order_date
      FROM users u
      JOIN orders o ON u.user_id = o.user_id
      LEFT JOIN returns r ON o.order_id = r.order_id
      WHERE o.order_date BETWEEN ? AND ?
      GROUP BY u.user_id, u.first_name, u.last_name
      ORDER BY total_spent DESC
      LIMIT 10
    `, [startDate, endDate]);

    res.json({
      customerSegments,
      categoryPreferences,
      retentionTrends,
      topCustomers
    });

  } catch (error) {
    console.error('Error generating customer analytics:', error);
    res.status(500).json({ 
      message: 'Error generating customer analytics', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

module.exports = router;