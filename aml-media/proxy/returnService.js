const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/return_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;

  console.log(`Returning media ID: ${mediaId} for user ID: ${userId}`);

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
      const mediaItem = userDoc.media_ids.find(item => item[0] === mediaId);
      const returnDate = mediaItem ? mediaItem[1] : null;

      if (!mediaItem) {
        res.status(400).send({ success: false, error: 'Media not borrowed by user' });
        return;
      }

      // Remove the media ID from the user's media_ids
      userDoc.media_ids = userDoc.media_ids.filter(item => item[0] !== mediaId);

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

              // Increase the quantity of the media by 1
              mediaDoc.quantity = (parseInt(mediaDoc.quantity) + 1).toString();

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
                  res.send({ success: true, returnDate: returnDate, media: mediaDoc });
                }
              });
            }
          });
        }
      });
    }
  });
});

router.post('/late_return', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;

  console.log(`Processing late return for media ID: ${mediaId} and user ID: ${userId}`);

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

          // Increase the quantity of the late_returns in the user db by 1
          userDoc.late_returns = (parseInt(userDoc.late_returns) + 1).toString();
          //update the user document
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
            }
          });

          console.log(`User ${userId} returned media ${mediaId} late.`);

          res.send({ success: true });
        }
      });
    }
  });
});

module.exports = router;