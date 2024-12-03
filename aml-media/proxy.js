const express = require('express');
const bodyParser = require('body-parser');
const mediaService = require('./proxy/mediaService');
const userService = require('./proxy/userService');
const borrowService = require('./proxy/borrowService');
const returnService = require('./proxy/returnService');
const searchService = require('./proxy/searchService');

const app = express();
const port = 3000;

// Middleware to handle CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Register service routes
app.use('/media', mediaService);
app.use('/user', userService);
app.use('/borrow', borrowService);
app.use('/return', returnService);
app.use('/search', searchService);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('error');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});