const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Fetch all products
router.get('/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json(results);
    });
});
  
// Add a new product
router.post('/products', (req, res) => {
    const { name, description, price, stock, image } = req.body;
    const query = 'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, description, price, stock, image], (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.status(201).json({ id: results.insertId, ...req.body });
    });
});

module.exports = router;