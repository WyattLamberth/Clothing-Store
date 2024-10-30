const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================

// Authentication
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { 
      first_name, last_name, username, email, phone_number, password, role_id,
      line_1, line_2, city, state, zip
    } = req.body;

    const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
    const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
    const address_id = addressResult.insertId;

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

// Product & Category Browsing
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [productId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});

router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM products WHERE category_id = ?', [categoryId]);
    if (rows.length === 0) return res.status(404).json({ message: 'No products found for this category' });
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products by category' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories/:categoryId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE category_id = ?',
      [req.params.categoryId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching category' });
  }
});

router.get('/categories/sex/:sex/products', async (req, res) => {
  try {
    const { sex } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.product_id, p.product_name, p.description, p.price, p.stock_quantity, 
              p.size, p.color, p.brand, p.image_path 
       FROM products p
       JOIN categories c ON p.category_id = c.category_id
       WHERE c.sex = ?`,
      [sex]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No products found for the specified sex.' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching products by sex:', error);
    res.status(500).json({ message: 'An error occurred while fetching products.' });
  }
});

router.get('/products/search/search', async (req, res) => {
  const { query } = req.query; // Get the search query from the request

  // Validate the query
  if (!query || typeof query !== 'string' || query.length < 1 || query.length > 100) {
    return res.status(400).json({ message: 'Invalid search query.' });
  }

  console.log(`Search query: ${query}`);

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM products WHERE product_name LIKE ?`,
      [`%${query}%`] // Use wildcard for partial matching
    );

    // Check if products were found
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No products found matching your search.' });
    }

    // Return the found products along with metadata
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'An error occurred while searching for products.' });
  }
});


module.exports = router;