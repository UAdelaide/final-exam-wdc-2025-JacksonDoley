const express = require('express');
const path = require('path');
const session = require('express-session'); // Added session middleware for user authentication
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET, // uses the key from the .env file
    resave: false,
    saveUninitialized: true
  }));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;