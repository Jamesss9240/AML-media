const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.post('/return_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  
  couchRequest({ url: userUrl, method: 'GET' }, res, (userDoc) => {
    const mediaItem = userDoc.media_ids.find(item => item[0] === mediaId);
    const returnDate = mediaItem ? mediaItem[1] : null;
    userDoc.media_ids = userDoc.media_ids.filter(item => item[0] !== mediaId);
    
    couchRequest({
      url: userUrl,
      method: 'PUT',
      body: JSON.stringify(userDoc)
    }, res, () => {
      couchRequest({ url: mediaUrl, method: 'GET' }, res, (mediaDoc) => {
        mediaDoc.quantity = (parseInt(mediaDoc.quantity) + 1).toString();
        
        couchRequest({
          url: mediaUrl,
          method: 'PUT',
          body: JSON.stringify(mediaDoc)
        }, res, () => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.send({ success: true, returnDate, media: mediaDoc });
        });
      });
    });
  });
});

router.post('/late_return', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  
  couchRequest({ url: userUrl, method: 'GET' }, res, (userDoc) => {
    couchRequest({ url: mediaUrl, method: 'GET' }, res, () => {
      userDoc.late_returns = (parseInt(userDoc.late_returns) + 1).toString();
      
      couchRequest({
        url: userUrl,
        method: 'PUT',
        body: JSON.stringify(userDoc)
      }, res, () => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send({ success: true });
      });
    });
  });
});

module.exports = router;