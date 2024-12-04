const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.get('/', (req, res) => {
  const filter = req.query.filter;
  let url = 'http://localhost:5984/media/_design/media/_view/all_media';

  if (filter === 'books') {
    url = 'http://localhost:5984/media/_design/media/_view/books';
  }

  console.log(`Fetching data from URL: ${url}`);

  const options = {
    url: url,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('Data fetched successfully:', data);
      res.send(data);
    }
  });
});

module.exports = router;