const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.get('/media', (req, res) => {
  const filter = req.query.filter;
  let url = 'http://localhost:5984/media/_design/media/_view/all_media';

  if (filter === 'books') {
    url = 'http://localhost:5984/media/_design/media/_view/books';
  }

  const options = {
    url: url,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      console.log('error fetching media:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('media data:', data);
      res.send(data);
    }
  });
});

app.post('/search', (req, res) => {
  const query = req.body.query;
  const view = req.body.view;
  let selector = {
    title: { "$regex": `(?i)${query}` } // case insensetive
  };

  if (view === 'books') {
    selector.type = 'book'; // book view
  }

  const options = {
    url: 'http://localhost:5984/media/_find',
    method: 'POST',
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    },
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selector: selector,
      use_index: "_design/title_index"
    })
  };

  request(options, (error, response, body) => {
    if (error) {
      console.log('error searching media:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('search results:', data);
      res.status(response.statusCode).set(response.headers).send(data);
    }
  });
});

app.get('/user_media', (req, res) => {
  const userId = req.query.user_id;
  const userUrl = `http://localhost:5984/users/_design/user_index/_view/media_ids?key="${userId}"`;

  const userOptions = {
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(userOptions, (error, response, body) => {
    if (error) {
      console.log('error fetching user media:', error);
      res.status(500).send(error);
    } else {
      const userMediaData = JSON.parse(body);
      console.log('user media data:', userMediaData);

      if (!userMediaData.rows || userMediaData.rows.length === 0) {
        res.status(200).send({ rows: [] });
        return;
      }

      const userMediaIds = userMediaData.rows[0].value;
      const mediaIds = userMediaIds.map(item => item[0]);
      const returnDates = userMediaIds.reduce((acc, item) => {
        acc[item[0]] = item[1];
        return acc;
      }, {});
      const mediaUrl = `http://localhost:5984/media/_design/media/_view/by_user_media_ids?keys=${JSON.stringify(mediaIds)}`;

      const mediaOptions = {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      };

      request(mediaOptions, (error, response, body) => {
        if (error) {
          console.log('error fetching media by ids:', error);
          res.status(500).send(error);
        } else {
          const mediaData = JSON.parse(body);
          console.log('media data by ids:', mediaData);

          mediaData.rows.forEach(row => {
            row.value.return_date = returnDates[row.id];
          });

          res.send(mediaData);
        }
      });
    }
  });
});

app.post('/get_user_id', (req, res) => {
  const email = req.body.email;
  const userUrl = `http://localhost:5984/users/_find`;

  const userOptions = {
    url: userUrl,
    method: 'POST',
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    },
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selector: {
        email: email
      }
    })
  };

  request(userOptions, (error, response, body) => {
    if (error) {
      console.log('error fetching user id:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('user id data:', data);

      if (data.docs && data.docs.length > 0) {
        res.send({ userId: data.docs[0]._id });
      } else {
        res.status(404).send('user not found');
      }
    }
  });
});

app.post('/borrow_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  const userUrl = `http://localhost:5984/users/${userId}`;

  // fetch the media doc
  request({
    url: mediaUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.log('error fetching media doc:', error);
      res.status(500).send({ success: false, error });
    } else {
      const mediaDoc = JSON.parse(body);
      console.log('media doc:', mediaDoc);

      // fetch the user doc
      request({
        url: userUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) {
          console.log('error fetching user doc:', error);
          res.status(500).send({ success: false, error });
        } else {
          const userDoc = JSON.parse(body);
          console.log('user doc:', userDoc);

          // check if the media is already borrowed by the user
          const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);

          if (isAlreadyBorrowed) {
            res.status(400).send({ success: false, error: 'media is already borrowed by the user' });
          } else {
            // check if there is enough quantity to borrow
            if (parseInt(mediaDoc.quantity) > 0) {
              // decrease the quantity of the media by 1
              mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

              // upd the media doc
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
              }, (error, body) => {
                if (error) {
                  console.log('error updating media doc:', error);
                  res.status(500).send({ success: false, error });
                } else {
                  console.log('media doc updated:', mediaDoc);

                  // add the media id to the user's media_ids
                  userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

                  // upd the user doc
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
                      console.log('error updating user doc:', error);
                      res.status(500).send({ success: false, error });
                    } else {
                      console.log('user doc updated:', userDoc);
                      res.send({ success: true });
                    }
                  });
                }
              });
            } else {
              res.status(400).send({ success: false, error: 'no more media available to borrow' });
            }
          }
        }
      });
    }
  });
});

app.get('/user_borrowed_media', (req, res) => {
  const userId = req.query.user_id;
  const userUrl = `http://localhost:5984/users/${userId}`;

  const userOptions = {
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(userOptions, (error, response, body) => {
    if (error) {
      console.log('error fetching user borrowed media:', error);
      res.status(500).send(error);
    } else {
      const userDoc = JSON.parse(body);
      console.log('user borrowed media doc:', userDoc);

      if (!userDoc.media_ids || userDoc.media_ids.length === 0) {
        res.status(200).send({ media: [] });
        return;
      }

      const mediaIds = userDoc.media_ids.map(item => item[0]);
      const returnDates = userDoc.media_ids.reduce((acc, item) => {
        acc[item[0]] = item[1];
        return acc;
      }, {});
      const mediaUrl = `http://localhost:5984/media/_design/media/_view/by_user_media_ids?keys=${JSON.stringify(mediaIds)}`;

      const mediaOptions = {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      };

      request(mediaOptions, (error, response, body) => {
        if (error) {
          console.log('error fetching media by user ids:', error);
          res.status(500).send(error);
        } else {
          const mediaData = JSON.parse(body);
          console.log('media data by user ids:', mediaData);

          mediaData.rows.forEach(row => {
            row.value.return_date = returnDates[row.id];
          });

          res.send(mediaData);
        }
      });
    }
  });
});

app.post('/return_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;

  request({
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.log('error fetching user doc:', error);
      res.status(500).send({ success: false, error });
    } else {
      const userDoc = JSON.parse(body);
      console.log('user doc:', userDoc);

      const mediaItem = userDoc.media_ids.find(item => item[0] === mediaId);
      const returnDate = mediaItem ? mediaItem[1] : null;

      if (!mediaItem) {
        res.status(400).send({ success: false, error: 'media not borrowed by user' });
        return;
      }

      userDoc.media_ids = userDoc.media_ids.filter(item => item[0] !== mediaId);

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
          console.log('error updating user doc:', error);
          res.status(500).send({ success: false, error });
        } else {
          console.log('user doc updated:', userDoc);

          request({
            url: mediaUrl,
            auth: {
              user: couchdbUsername,
              pass: couchdbPassword
            }
          }, (error, response, body) => {
            if (error) {
              console.log('error fetching media doc:', error);
              res.status(500).send({ success: false, error });
            } else {
              const mediaDoc = JSON.parse(body);
              console.log('media doc:', mediaDoc);

              mediaDoc.quantity = (parseInt(mediaDoc.quantity) + 1).toString();

              // upd the media doc
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
                  console.log('error updating media doc:', error);
                  res.status(500).send({ success: false, error });
                } else {
                  console.log('media doc updated:', mediaDoc);
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

app.post('/late_return', (req, res) => {
  const { mediaId, userId } = req.body;
  const userUrl = `http://localhost:5984/users/${userId}`;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;

  // fetch user doc
  request({
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.log('error fetching user doc:', error);
      res.status(500).send({ success: false, error });
    } else {
      const userDoc = JSON.parse(body);
      console.log('user doc:', userDoc);

      // fetch media doc
      request({
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) {
          console.log('error fetching media doc:', error);
          res.status(500).send({ success: false, error });
        } else {
          const mediaDoc = JSON.parse(body);
          console.log('media doc:', mediaDoc);

          // increase late returns by 1
          userDoc.late_returns = (parseInt(userDoc.late_returns) + 1).toString();

          // upd the user doc
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
              console.log('error updating user doc:', error);
              res.status(500).send({ success: false, error });
            } else {
              console.log('user doc updated:', userDoc);
              res.send({ success: true });
            }
          });
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`server running on http://localhost:${port}`);
});
