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

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user.user_id, role: user.role_id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
