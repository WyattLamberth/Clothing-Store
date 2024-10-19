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

// User login (updated to use Passport)
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


router.post('/category', async(req, res) => {
  const connection = await pool.getConnection();
  try{
      await connection.beginTransaction();
      const{name, description, sex} = req.body;
      const CategoryQuery = 'INSERT INTO categories (name, description, sex) VALUES (?, ?, ?)' // insert query for categories table
      const [CategoryResult] = await connection.query(CategoryQuery, [name, description, sex]);
      const category_id = CategoryResult.insertId; // get the id of the newly created category
      await connection.commit();
      res.status(201).json({ message: 'Category created successfully', category_id: category_id });
  } catch (error) {
      await connection.rollback(); // if there is an error, rollback(undo all changes made to the database)
      console.error('Error creating category:', error);
      res.status(400).json({ error: 'Error creating category' });
  } finally{
      connection.release(); // release the connection back to the pool
  }
});


//PRODUCT MANAGEMENT:

// Get all products
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product
router.post('/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      INSERT INTO products (product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand
    ]);

    await connection.commit();
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Error creating product' });
  } finally {
    connection.release();
  }
});

// Get product by ID
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const query = 'SELECT * FROM products WHERE product_id = ?';
    const [rows] = await pool.execute(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Update a product by ID
router.put('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { 
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand 
    } = req.body;

    const query = `
      UPDATE products 
      SET product_name = ?, category_id = ?, description = ?, price = ?, stock_quantity = ?, reorder_threshold = ?, size = ?, color = ?, brand = ?
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, [
      product_name, category_id, description, price, stock_quantity, reorder_threshold, size, color, brand, productId
    ]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Error updating product' });
  } finally {
    connection.release();
  }
});

// Delete a product by ID
router.delete('/products/:productId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { productId } = req.params;

    const query = 'DELETE FROM products WHERE product_id = ?';
    const [result] = await connection.execute(query, [productId]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  } finally {
    connection.release();
  }
});

// Get products by category ID
router.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const query = 'SELECT * FROM products WHERE category_id = ?';
    const [rows] = await pool.execute(query, [categoryId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No products found for this category' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Error fetching products by category' });
  }
});


module.exports = router;
