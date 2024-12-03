const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.post('/borrow_media', async (req, res) => {
  try {
    const { mediaId, userId } = req.body;
    const mediaUrl = `http://localhost:5984/media/${mediaId}`;
    const userUrl = `http://localhost:5984/users/${userId}`;

    const mediaDoc = await couchRequest({ url: mediaUrl, method: 'GET' });
    const userDoc = await couchRequest({ url: userUrl, method: 'GET' });

    const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);

    if (isAlreadyBorrowed) {
      return res.status(400).json({ success: false, error: 'error' });
    }

    if (parseInt(mediaDoc.quantity) > 0) {
      mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

      await couchRequest({
        url: mediaUrl,
        method: 'PUT',
        body: JSON.stringify(mediaDoc)
      });

      userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

      await couchRequest({
        url: userUrl,
        method: 'PUT',
        body: JSON.stringify(userDoc)
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'error' });
    }
  } catch (error) {
    console.error('Error borrowing media:', error);
    res.status(500).json({ success: false, error: 'error' });
  }
});

module.exports = router;