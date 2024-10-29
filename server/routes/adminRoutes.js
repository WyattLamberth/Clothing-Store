const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');
const bcrypt = require('bcrypt');

const multer = require('multer');
const path = require('path');
router.use(express.static(path.join(__dirname, './images')));
router.use(express.json());
router.use(express.urlencoded({extended:false}));

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

// User Management (Permission: 1001)
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    const [user] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [req.params.userId]);
    if (!user.length) return res.status(404).json({ message: 'User not found' });
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Create a new address
router.post('/address', async (req, res) => {
  const { line_1, line_2, city, state, zip } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)',
      [line_1, line_2, city, state, zip]
    );
    res.status(201).json({ addressId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating address', error: error.message });
  }
});

// Modified route to create a new user with address
router.post('/users', async (req, res) => {
  const { first_name, last_name, username, email, phone_number, role_id, password, addressId } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, username, email, phone_number, hashedPassword, role_id, addressId]
    );
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});


// Update a user
router.put('/users/:userId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { first_name, last_name, email, phone_number, role_id } = req.body;
    const [result] = await connection.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, role_id = ? WHERE user_id = ?',
      [first_name, last_name, email, phone_number, role_id, req.params.userId]
    );
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error updating user', error: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/users/:userId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute('DELETE FROM users WHERE user_id = ?', [req.params.userId]);
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  } finally {
    connection.release();
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

function removePathPrefix(filePath) {
  return filePath.split('\\').pop();
}

// Product Management (Permission: 2001)
router.post('/products', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand
    } = req.body;
    const image_path = removePathPrefix(req.file.path);
    const query = `
      INSERT INTO products (
        product_name, category_id, description, price, 
        stock_quantity, reorder_threshold, size, color, brand, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand, image_path]);

    await connection.commit();
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error creating product' });
  } finally {
    connection.release();
  }
});

router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {
      product_name, category_id, description, price,
      stock_quantity, reorder_threshold, size, color, brand
    } = req.body;

    const query = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, 
          price = ?, stock_quantity = ?, reorder_threshold = ?, 
          size = ?, color = ?, brand = ?
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, [
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

module.exports = router;