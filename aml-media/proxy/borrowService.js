const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.post('/borrow_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  const userUrl = `http://localhost:5984/users/${userId}`;
  
  couchRequest({ url: mediaUrl, method: 'GET' }, res, (mediaDoc) => {
    couchRequest({ url: userUrl, method: 'GET' }, res, (userDoc) => {
      const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);
      
      if (isAlreadyBorrowed) {
        return res.status(400).send({ success: false, error: 'Media is already borrowed by the user' });
      }
      
      if (parseInt(mediaDoc.quantity) > 0) {
        mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();
        
        couchRequest({
          url: mediaUrl,
          method: 'PUT',
          body: JSON.stringify(mediaDoc)
        }, res, () => {
          userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);
          
          couchRequest({
            url: userUrl,
            method: 'PUT',
            body: JSON.stringify(userDoc)
          }, res, () => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send({ success: true });
          });
        });
      } else {
        res.status(400).send({ success: false, error: 'No more media available to borrow' });
      }
    });
  });
});

module.exports = router;