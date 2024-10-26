const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/passport-auth');

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

module.exports = router;