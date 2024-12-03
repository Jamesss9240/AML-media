const express = require('express');
const bodyParser = require('body-parser');
const mediaService = require('./proxy/mediaService');
const userService = require('./proxy/userService');
const borrowService = require('./proxy/borrowService');
const returnService = require('./proxy/returnService');
const searchService = require('./proxy/searchService');

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.use(bodyParser.json());
app.use(mediaService);
app.use(userService);
app.use(borrowService);
app.use(returnService);
app.use(searchService);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});