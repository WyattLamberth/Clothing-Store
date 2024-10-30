// server.js
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path'); // Add this
const port = process.env.PORT || 6001;
const { passport, authMiddleware } = require('./middleware/passport-auth');
const publicRoutes = require('./routes/publicRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

// Middleware for all routes
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.use('/api', publicRoutes);
app.use('/api', authMiddleware.authenticate, customerRoutes);
app.use('/api', authMiddleware.authenticate, employeeRoutes);
app.use('/api/admin', authMiddleware.authenticate, adminRoutes);

// Handle React routing, return all requests to React app that aren't API routes
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});