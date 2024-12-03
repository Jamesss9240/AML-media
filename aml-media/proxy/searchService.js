const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.post('/search', (req, res) => {
  const { query, view } = req.body;
  const selector = { title: { "$regex": `(?i)${query}` } };
  if (view === 'books') selector.type = 'book';

  couchRequest({
    url: 'http://localhost:5984/media/_find',
    method: 'POST',
    body: JSON.stringify({ selector, use_index: "_design/title_index" })
  }, res, (body) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

module.exports = router;