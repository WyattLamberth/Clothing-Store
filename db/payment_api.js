const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../server/db/connection');

// Add Payment API
router.post('/payment', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const {
        first_name, last_name, username, email, phone_number, password_hash, role_id, 
        cardholder_name, card_number, expiration_date, cvv, 
        date_joined, line_1, line_2, city, state, zip
      } = req.body;
  
      // 1. Insert address
      const addressQuery = 'INSERT INTO address (line_1, line_2, city, state, zip) VALUES (?, ?, ?, ?, ?)';
      const [addressResult] = await connection.execute(addressQuery, [line_1, line_2, city, state, zip]);
      const address_id = addressResult.insertId;
  
      // 2. Insert into users table
      const userQuery = 'INSERT INTO users (first_name, last_name, username, email, phone_number, password_hash, role_id, address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const [userResult] = await connection.execute(userQuery, [first_name, last_name, username, email, phone_number, password_hash, role_id, address_id]);
      const user_id = userResult.insertId;
  
      // 3. Insert into customers table, use the user_id as customer_id
      const customerQuery = 'INSERT INTO customers (customer_id, date_joined, preferred_payment_id) VALUES (?, ?, NULL)';
      const[customerResult] = await connection.execute(customerQuery, [user_id, date_joined]);
      const customer_id = customerResult.insertId;
  
      // 4. Insert into payment table
      const paymentQuery = 'INSERT INTO payment (cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id) VALUES (?, ?, ?, ?, ?, ?)';
      const [paymentResult] = await connection.query(paymentQuery, [cardholder_name, card_number, expiration_date, cvv, customer_id, address_id]);
      const preferred_payment_id = paymentResult.insertId;
  
      // 5. Commit transaction
      await connection.commit();
  
      // Respond with success and return the new preferred_payment_id
      res.status(201).json({ message: 'Payment method created successfully', preferred_payment_id: preferred_payment_id});
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Error creating payment method:', error);
      res.status(400).json({ error: 'Error creating payment method, please try again.' });
    } finally {
      // Release the connection
      connection.release();
    }
  });