// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 5001;
const routes = require('./routes');
const passport = require('./config/passport');

require('dotenv').config();

// Middleware to parse JSON bodies
app.use(express.json());

// Use routes
app.use('/api', routes);

// initialize passport for auth
app.use(passport.initialize());


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
