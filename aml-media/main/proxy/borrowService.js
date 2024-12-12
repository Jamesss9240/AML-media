const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/borrow_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  const userUrl = `http://localhost:5984/users/${userId}`;

  // Get media document
  request({
    url: mediaUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) return handleError(res, 'Media fetch failed', error);

    const mediaDoc = JSON.parse(body);

    // Get user document
    request({
      url: userUrl,
      auth: {
        user: couchdbUsername,
        pass: couchdbPassword
      }
    }, (error, response, body) => {
      if (error) return handleError(res, 'User fetch failed', error);

      const userDoc = JSON.parse(body);

      // Check if media is already borrowed
      const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);
      if (isAlreadyBorrowed) return res.status(400).send({ success: false, error: 'Already borrowed' });

      // Check if media is available
      if (parseInt(mediaDoc.quantity) > 0) {
        // Decrease media quantity
        mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

        // Update media document
        request({
          url: mediaUrl,
          method: 'PUT',
          auth: {
            user: couchdbUsername,
            pass: couchdbPassword
          },
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaDoc)
        }, (error, response, body) => {
          if (error) return handleError(res, 'Media update failed', error);

          // Add media ID to user's media_ids
          userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

          //upd user document
          request({
            url: userUrl,
            method: 'PUT',
            auth: {
              user: couchdbUsername,
              pass: couchdbPassword
            },
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userDoc)
          }, (error, response, body) => {
            if (error) return handleError(res, 'User update failed', error);

            res.send({ success: true });
          });
        });
      } else {
        res.status(400).send({ success: false, error: 'No media available' });
      }
    });
  });
});

function handleError(res, message, error) {
  res.status(500).send({ success: false, error: message });
}

module.exports = router;
