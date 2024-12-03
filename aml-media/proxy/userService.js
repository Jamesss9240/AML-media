const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

// Route to get user media
router.get('/user_media', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).send({ error: 'error' });
    }

    const userUrl = `http://localhost:5984/users/_design/user_index/_view/media_ids?key="${userId}"`;

    couchRequest({ url: userUrl, method: 'GET' }, res, (userMediaData) => {
      if (!userMediaData.rows.length) {
        return res.status(404).send({ error: 'error' });
      }

      const userMediaIds = userMediaData.rows[0].value;
      const mediaIds = userMediaIds.map(item => item[0]);
      const returnDates = userMediaIds.reduce((acc, item) => {
        acc[item[0]] = item[1];
        return acc;
      }, {});

      const mediaUrl = `http://localhost:5984/media/_design/media/_view/by_user_media_ids?keys=${JSON.stringify(mediaIds)}`;

      couchRequest({ url: mediaUrl, method: 'GET' }, res, (mediaData) => {
        if (!mediaData.rows.length) {
          return res.status(404).send({ error: 'error' });
        }

        mediaData.rows.forEach(row => {
          row.value.return_date = returnDates[row.id];
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.send(mediaData);
      });
    });
  } catch (error) {
    console.error('Error fetching user media:', error);
    res.status(500).send({ error: 'error' });
  }
});

// Route to get user ID by email
router.post('/get_user_id', async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).send({ error: 'error' });
    }

    const userUrl = `http://localhost:5984/users/_find`;

    couchRequest({
      url: userUrl,
      method: 'POST',
      body: JSON.stringify({ selector: { email } })
    }, res, (data) => {
      if (!data.docs.length) {
        return res.status(404).send({ error: 'error' });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send({ userId: data.docs[0]._id });
    });
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).send({ error: 'error' });
  }
});

module.exports = router;