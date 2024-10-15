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

// Add a new product -- NEED TO COMPLETELY REDO THIS API
router.post('/products', (req, res) => {
    const { name, description, price, stock, size, color, brand, categories } = req.body;
    const query = 'INSERT INTO PRODUCTS (Product_Name, Description, Price, Stock_Quantity, Size, Color, Brand) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, description, price, stock, size, color, brand], (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      const productId = results.insertId;
      const categoryQueries = categories.map(categoryName => {
        return new Promise((resolve, reject) => {
          const categoryQuery = 'INSERT INTO PRODUCT_CATEGORIES (Product_ID, Category_ID) VALUES (?, (SELECT Category_ID FROM CATEGORIES WHERE Name = ?))';
          db.query(categoryQuery, [productId, categoryName], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      });

      Promise.all(categoryQueries)
        .then(() => {
          res.status(201).json({ id: productId, ...req.body });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    });
});

// Fetch all categories
router.get('/categories', (req, res) => {
    db.query('SELECT * FROM CATEGORIES', (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json(results);
    });
});

module.exports = router;
