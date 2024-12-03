const express = require('express');
const router = express.Router();
const { couchRequest } = require('./utils');

router.get('/user_media', (req, res) => {
  const userId = req.query.user_id;
  const userUrl = `http://localhost:5984/users/_design/user_index/_view/media_ids?key="${userId}"`;
  
  couchRequest({ url: userUrl, method: 'GET' }, res, (userMediaData) => {
    const userMediaIds = userMediaData.rows[0].value;
    const mediaIds = userMediaIds.map(item => item[0]);
    const returnDates = userMediaIds.reduce((acc, item) => { acc[item[0]] = item[1]; return acc; }, {});
    const mediaUrl = `http://localhost:5984/media/_design/media/_view/by_user_media_ids?keys=${JSON.stringify(mediaIds)}`;
    
    couchRequest({ url: mediaUrl, method: 'GET' }, res, (mediaData) => {
      mediaData.rows.forEach(row => { row.value.return_date = returnDates[row.id]; });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.send(mediaData);
    });
  });
});

router.post('/get_user_id', (req, res) => {
  const email = req.body.email;
  const userUrl = `http://localhost:5984/users/_find`;
  
  couchRequest({
    url: userUrl,
    method: 'POST',
    body: JSON.stringify({ selector: { email } })
  }, res, (data) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send({ userId: data.docs[0]._id });
  });
});

module.exports = router;