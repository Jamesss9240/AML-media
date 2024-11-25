const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

app.use(bodyParser.json()); // Add this line to parse JSON request bodies

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.get('/media', (req, res) => {
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
      console.log('Data fetched successfully:', body);
      res.send(body);
    }
  });
});

app.post('/search', (req, res) => {
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
      console.log('Search data fetched successfully:', body);
      res.status(response.statusCode).set(response.headers).send(body);
    }
  });
});

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`);
});