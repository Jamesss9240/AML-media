const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/borrow_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  const userUrl = `http://localhost:5984/users/${userId}`;

  console.log(`Borrowing media ID: ${mediaId} for user ID: ${userId}`);

  // Fetch the media document
  request({
    url: mediaUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.error('Error fetching media document:', error);
      res.status(500).send({ success: false, error });
    } else {
      const mediaDoc = JSON.parse(body);
      console.log('Media document fetched:', mediaDoc);

      // Fetch the user document
      request({
        url: userUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) {
          console.error('Error fetching user document:', error);
          res.status(500).send({ success: false, error });
        } else {
          const userDoc = JSON.parse(body);
          console.log('User document fetched:', userDoc);

          // Check if the media is already borrowed by the user
          const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);

          if (isAlreadyBorrowed) {
            res.status(400).send({ success: false, error: 'Media is already borrowed by the user' });
          } else {
            // Check if there is enough quantity to borrow
            if (parseInt(mediaDoc.quantity) > 0) {
              // Decrease the quantity of the media by 1
              mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

              // Update the media document
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
                if (error) {
                  console.error('Error updating media document:', error);
                  res.status(500).send({ success: false, error });
                } else {
                  console.log('Media document updated successfully:', body);

                  // Add the media ID to the user's media_ids
                  userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

                  // Update the user document
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
                    if (error) {
                      console.error('Error updating user document:', error);
                      res.status(500).send({ success: false, error });
                    } else {
                      console.log('User document updated successfully:', body);
                      res.send({ success: true });
                    }
                  });
                }
              });
            } else {
              res.status(400).send({ success: false, error: 'No more media available to borrow' });
            }
          }
        }
      });
    }
  });
});

module.exports = router;