const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db/connection');

router.post('/category', async(req, res) => {
    const connection = await pool.getConnection();
    try{
        await connection.beginTransaction();
        const{name, description, sex} = req.body;
        const CategoryQuery = 'INSERT INTO category (name, description, sex) VALUES (?, ?, ?)' // insert query for category table
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
