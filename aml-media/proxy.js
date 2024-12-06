const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mediaService = require('./proxy/mediaService');
const userService = require('./proxy/userService');
const borrowService = require('./proxy/borrowService');
const returnService = require('./proxy/returnService');
const searchService = require('./proxy/searchService');


const app = express();
const port = 3000;

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

// cors handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// middleware
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));

//service routes

app.use('/media', mediaService);
app.use('/user', userService);
app.use('/borrow', borrowService);
app.use('/return', returnService);
app.use('/search', searchService);

// error middle ware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).send({ success: false, error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});