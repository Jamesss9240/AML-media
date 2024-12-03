const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.post('/search', async (req, res) => {
  try {
    const { query, view } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'error' });
    }

    const selector = { title: { "$regex": `(?i)${query}` } };
    if (view === 'books') selector.type = 'book';

    const requestBody = {
      selector,
      use_index: "_design/title_index"
    };

    couchRequest({
      url: 'http://localhost:5984/media/_find',
      method: 'POST',
      body: JSON.stringify(requestBody)
    }, res, (body) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(body);
    });
  } catch (error) {
    console.error('error', error);
    res.status(500).json({ error: 'error' });
  }
});

module.exports = router;