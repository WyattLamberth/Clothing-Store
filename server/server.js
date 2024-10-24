// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 6001;
const { passport, authMiddleware } = require('./middleware/passport-auth');

const publicRoutes = require('./routes/publicRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');

require('dotenv').config();

// Middleware to parse JSON bodies and authenticate requests
app.use(express.json());
app.use(passport.initialize());
app.use(authMiddleware.authenticate);

// Use routes
app.use('/api', publicRoutes);
app.use('/api', customerRoutes);
app.use('/api', employeeRoutes);
app.use('/api', adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
