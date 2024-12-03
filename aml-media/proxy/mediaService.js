const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.get('/media', (req, res) => {
  const filter = req.query.filter;
  const url = filter === 'books' 
    ? 'http://localhost:5984/media/_design/media/_view/books' 
    : 'http://localhost:5984/media/_design/media/_view/all_media';

  couchRequest({ url, method: 'GET' }, (err, body) => {
    if (err) {
      console.error('error:', err);
      res.status(500).send('error');
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

module.exports = router;