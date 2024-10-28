// server.js
const express = require('express');
const app = express();
const cors = require('cors');
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

// Public routes (no auth required)
app.use('/api', publicRoutes);

// Protected routes (auth required)
app.use('/api', authMiddleware.authenticate, customerRoutes);
app.use('/api', authMiddleware.authenticate, employeeRoutes);
app.use('/api/admin', authMiddleware.authenticate, adminRoutes); // Prefix admin routes with '/api/admin'

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
