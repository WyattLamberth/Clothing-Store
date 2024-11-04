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

// In adminRoutes.js
router.get('/reports/inventory', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get stock levels and value
    const [stockLevels] = await connection.execute(`
          SELECT p.product_id, p.product_name, p.stock_quantity, p.price,
                 p.reorder_threshold, c.name as category_name,
                 (p.stock_quantity * p.price) as stock_value
          FROM products p
          JOIN categories c ON p.category_id = c.category_id
      `);

    // Get return rates
    const [returnRates] = await connection.execute(`
          SELECT p.product_id, p.product_name, 
                 COUNT(ri.return_item_id) as return_count,
                 COUNT(oi.order_item_id) as order_count,
                 (COUNT(ri.return_item_id) * 100.0 / NULLIF(COUNT(oi.order_item_id), 0)) as return_rate
          FROM products p
          LEFT JOIN order_items oi ON p.product_id = oi.product_id
          LEFT JOIN returns r ON oi.order_id = r.order_id
          LEFT JOIN return_items ri ON r.return_id = ri.return_id
          GROUP BY p.product_id
      `);

    // Get low stock items
    const [lowStock] = await connection.execute(`
          SELECT p.*, c.name as category_name
          FROM products p
          JOIN categories c ON p.category_id = c.category_id
          WHERE p.stock_quantity <= p.reorder_threshold
      `);

    // Get category totals
    const [categoryTotals] = await connection.execute(`
          SELECT c.name as category_name,
                 SUM(p.stock_quantity) as total_items,
                 SUM(p.stock_quantity * p.price) as total_value
          FROM products p
          JOIN categories c ON p.category_id = c.category_id
          GROUP BY c.category_id
      `);

    res.json({
      stockLevels,
      returnRates,
      lowStock,
      categoryTotals,
      summary: {
        totalProducts: stockLevels.length,
        totalValue: stockLevels.reduce((sum, item) => sum + item.stock_value, 0),
        lowStockCount: lowStock.length,
        averageReturnRate: returnRates.reduce((sum, item) => sum + (item.return_rate || 0), 0) / returnRates.length
      }
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Error generating inventory report', error: error.message });
  } finally {
    connection.release();
  }
});

// In adminRoutes.js
router.get('/reports/sales-analytics', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get total sales and stats
    const [salesStats] = await connection.execute(`
          SELECT 
              COUNT(DISTINCT o.order_id) as total_orders,
              SUM(o.total_amount) as total_revenue,
              AVG(o.total_amount) as average_order_value,
              COUNT(DISTINCT o.user_id) as unique_customers
          FROM orders o
          WHERE o.order_status != 'Cancelled'
      `);

    // Get sales by category
    const [categoryStats] = await connection.execute(`
          SELECT 
              c.name as category_name,
              COUNT(DISTINCT o.order_id) as order_count,
              SUM(oi.total_item_price) as revenue
          FROM categories c
          JOIN products p ON c.category_id = p.category_id
          JOIN order_items oi ON p.product_id = oi.product_id
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.order_status != 'Cancelled'
          GROUP BY c.category_id
      `);

    // Get top selling products
    const [topProducts] = await connection.execute(`
          SELECT 
              p.product_name,
              p.product_id,
              COUNT(DISTINCT o.order_id) as times_ordered,
              SUM(oi.quantity) as total_quantity,
              SUM(oi.total_item_price) as total_revenue
          FROM products p
          JOIN order_items oi ON p.product_id = oi.product_id
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.order_status != 'Cancelled'
          GROUP BY p.product_id
          ORDER BY total_revenue DESC
          LIMIT 5
      `);

    // Get monthly revenue trend
    const [monthlyRevenue] = await connection.execute(`
          SELECT 
              DATE_FORMAT(o.order_date, '%Y-%m') as month,
              COUNT(DISTINCT o.order_id) as order_count,
              SUM(o.total_amount) as revenue
          FROM orders o
          WHERE o.order_status != 'Cancelled'
          GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
          ORDER BY month DESC
          LIMIT 12
      `);

    // Get returns data
    // Get returns data - Updated Query
    const [returnsData] = await connection.execute(`
      SELECT 
          COUNT(*) as total_returns,
          AVG(ref.refund_amount) as average_refund  -- Changed from r.refund_amount to ref.refund_amount
      FROM returns r
      JOIN refunds ref ON r.return_id = ref.return_id
      WHERE r.return_status = 'Completed'
    `);

    res.json({
      summary: {
          ...salesStats[0],
          total_returns: returnsData[0].total_returns,
          average_refund: returnsData[0].average_refund,
          total_refunds: returnsData[0].total_refunds
      },
      categoryStats,
      topProducts,
      monthlyRevenue
  });

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Error generating sales report', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;