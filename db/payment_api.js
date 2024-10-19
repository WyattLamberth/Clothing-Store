const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../server/db/connection');

// Add Payment API
router.post('/payment', async(req, res) => {
    const connection = await pool.getConnection();
    try{
        await connection.beginTransaction();
        const{cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id} = req.body;
        const PaymentQuery = 'INSERT INTO payment (cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id) VALUES (?, ?, ?, ?, ?, ?)' // insert query for category table
        const [PaymentResult] = await connection.query(PaymentQuery, [cardholder_name, card_number, expiration_date, cvv, customer_id, billing_address_id]);
        const preferred_payment_id = PaymentResult.insertId; // get the id of the newly created category
        await connection.commit();
        res.status(201).json({ message: 'Payment method created successfully', preferred_payment_id: preferred_payment_id });
    } catch (error) {
        await connection.rollback(); // if there is an error, rollback(undo all changes made to the database)
        console.error('Error creating payment method:', error);
        res.status(400).json({ error: 'Error creating payment method' });
    } finally{
        connection.release(); // release the connection back to the pool
    }
});