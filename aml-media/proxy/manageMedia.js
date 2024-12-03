// const express = require('express');
// const router = express.Router();
// const { couchRequest } = require('./utils');

// // Get media
// router.get('/media', (req, res) => {
//   const filter = req.query.filter;
//   const url = filter === 'books' 
//     ? 'http://localhost:5984/media/_design/media/_view/books' 
//     : 'http://localhost:5984/media/_design/media/_view/all_media';

//   couchRequest({ url, method: 'GET' }, (err, body) => {
//     if (err) {
//       console.error('error:', err);
//       res.status(500).send('error');
//       return;
//     }

//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.send(body);
//   });
// });

// // Add media
// router.post('/media', (req, res) => {
//   const media = req.body;
//   const url = 'http://localhost:5984/media';

//   couchRequest({ url, method: 'POST', body: JSON.stringify(media) }, (err, body) => {
//     if (err) {
//       console.error('error:', err);
//       res.status(500).send('error');
//       return;
//     }

//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.status(201).send(body);
//   });
// });

// // Remove media
// router.delete('/media/:id', (req, res) => {
//   const mediaId = req.params.id;
//   const url = `http://localhost:5984/media/${mediaId}`;

//   couchRequest({ url, method: 'DELETE' }, (err, body) => {
//     if (err) {
//       console.error('error:', err);
//       res.status(500).send('error');
//       return;
//     }

//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.status(200).send(body);
//   });
// });

// module.exports = router;