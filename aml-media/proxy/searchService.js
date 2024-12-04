const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/', (req, res) => {
  const query = req.body.query;
  const view = req.body.view;
  let selector = {
    title: { "$regex": `(?i)${query}` } // Case-insensitive regex
  };

  if (view === 'books') {
    selector.type = 'book'; // Assuming you have a type field to distinguish books
  }

  console.log(`Search query: ${query} in view: ${view}`);

  const options = {
    url: 'http://localhost:5984/media/_find',
    method: 'POST',
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    },
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selector: selector,
      use_index: "_design/title_index"
    })
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('Search data fetched successfully:', data);
      res.status(response.statusCode).set(response.headers).send(data);
    }
  });
});

module.exports = router;