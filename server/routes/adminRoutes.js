// adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// =============================================
// ADMIN ROUTES (Role ID: 3)
// =============================================

// User Management (Permission: 1001 - Manage Users)
router.delete('/users/:userId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE user_id = ?', [req.params.userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Employee Management
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

router.delete('/employees/:employeeId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM employees WHERE employee_id = ?', [req.params.employeeId]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Admin Management
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

router.delete('/admins/:adminId', async (req, res) => {
  try {
    await pool.execute('DELETE FROM admins WHERE admin_id = ?', [req.params.adminId]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error: error.message });
  }
});

// System Configuration (Permission: 1004 - Configure System Settings)
router.post('/activity-logs', async (req, res) => {
  const { user_id, action, entity_affected } = req.body;
  const timestamp = new Date();
  try {
    const [result] = await pool.execute(
      'INSERT INTO activity_logs (user_id, action, timestamp, entity_affected) VALUES (?, ?, ?, ?)',
      [user_id, action, timestamp, entity_affected]
    );
    res.status(201).json({ message: 'Activity logged successfully', log_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error logging activity' });
  }
});

router.get('/activity-logs', async (req, res) => {
  try {
    const [logs] = await pool.query('SELECT * FROM activity_logs');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity logs' });
  }
});

// Promotions Management (Permission: 1005 - Manage Promotions and Discounts)
router.post('/sale-event', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { 
      name, sex, description, price, stock_quantity, reorder_threshold, 
      size, color, brand, event_name, start_date, end_date 
    } = req.body;

    // Insert category
    const [categoryResult] = await connection.execute(
      'INSERT INTO categories (name, sex) VALUES (?, ?)',
      [name, sex]
    );
    const category_id = categoryResult.insertId;

    // Insert product
    const [productResult] = await connection.execute(
      `INSERT INTO products (product_name, category_id, description, price, 
        stock_quantity, reorder_threshold, size, color, brand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [description, category_id, description, price, stock_quantity, 
       reorder_threshold, size, color, brand]
    );
    const product_id = productResult.insertId;

    // Insert sale event
    const [saleEventResult] = await connection.execute(
      'INSERT INTO sale_events (event_name, start_date, end_date, product_id, category_id) VALUES (?, ?, ?, ?, ?)',
      [event_name, start_date, end_date, product_id, category_id]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Sale event created successfully', 
      sale_event_id: saleEventResult.insertId 
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: 'Error creating sale event' });
  } finally {
    connection.release();
  }
});

// Role and Permission Management
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM roles');
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/roles', async (req, res) => {
  const { role_name } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO roles (role_name) VALUES (?)',
      [role_name]
    );
    res.status(201).json({ message: 'Role created successfully', roleId: result.insertId });
  } catch (error) {
    res.status(400).json({ error: 'Error creating role' });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const [permissions] = await pool.query('SELECT * FROM permissions');
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
  const { roleId } = req.params;
  const { permission_id } = req.body;
  try {
    await pool.execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permission_id]
    );
    res.status(201).json({ message: 'Permission added to role successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error adding permission to role' });
  }
});

module.exports = router;