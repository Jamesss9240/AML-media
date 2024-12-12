const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/', (req, res) => {
  const query = req.body.query;
  const view = req.body.view;
  let selector = {
    title: { "$regex": `(?i)${query}` } // regex search
  };

  if (view === 'books') {
    selector.type = 'book'; 
  }
  else if (view === 'movies') {
    selector.type = 'movie';
  }
  else if (view === 'journals') {
    selector.type = 'journal';
  }
  else if (view === 'games') {
    selector.type = 'game';
    
  }
  else if (view === 'all_media') {
    //all media
  }
  else {
    res.status(400).send('Invalid view');
    return;
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