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
//media views links
app.get('/media', (req, res) => {
  const filter = req.query.filter;
  let url = 'http://localhost:5984/media/_design/media/_view/all_media';

  if (filter === 'books') {
    url = 'http://localhost:5984/media/_design/media/_view/books';
  }

  console.log(`Fetching data from URL: ${url}`);
//auth
  const options = {
    url: url,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  
});
//search query, non case sensetive for ease of use
app.post('/search', (req, res) => {
  const query = req.body.query;
  const view = req.body.view;
  let selector = {
    title: { "$regex": `(?i)${query}` } 
  };

  if (view === 'books') {
    selector.type = 'book'; //displays only media of type book
  }

  console.log(`Search query: ${query} in view: ${view}`);
//find media
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
//error logging
  request(options, (error, response, body) => {
    if (error) {
      console.error('fail getting data', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('sucsess:', data);
      res.status(response.statusCode).set(response.headers).send(data);
    }
  });
});
//gets media that the user has owned by id
app.get('/user_media', (req, res) => {
  const userId = req.query.user_id;
  const userUrl = `http://localhost:5984/users/_design/user_index/_view/media_ids?key="${userId}"`;

  console.log(`Fetching user media IDs from URL: ${userUrl}`);
//db auth
  const userOptions = {
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(userOptions, (error, response, body) => {
    if (error) {
      console.error('error getting user id:', error);
      res.status(500).send(error);
    } else {
      const userMediaData = JSON.parse(body);
      console.log('user data recieved', userMediaData);
      if (!userMediaData.rows || userMediaData.rows.length === 0) {
        console.error('no id found for user', userId);
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

      //console.log(`Fetching media from URL: ${mediaUrl}`);

      const mediaOptions = {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      };

      request(mediaOptions, (error, response, body) => {
        if (error) {
          console.error('error getting media:', error);
          res.status(500).send(error);
        } else {
          const mediaData = JSON.parse(body);
          console.log('media recieved:', mediaData);
          mediaData.rows.forEach(row => {
            row.value.return_date = returnDates[row.id];
          });
          console.log('media fetched:', JSON.stringify(mediaData));
          res.send(mediaData);
        }
      });
    }
  });
});

app.post('/get_user_id', (req, res) => {
  const email = req.body.email;
  const userUrl = `http://localhost:5984/users/_find`;

  console.log(`getting user id for email: ${email}`);

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
      console.error('Error fetching user ID:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('User data received:', data);
      if (data.docs && data.docs.length > 0) {
        res.send({ userId: data.docs[0]._id });
      } else {
        res.status(404).send('User not found');
      }
    }
  });
});

app.post('/borrow_media', (req, res) => {
  const { mediaId, userId } = req.body;
  const mediaUrl = `http://localhost:5984/media/${mediaId}`;
  const userUrl = `http://localhost:5984/users/${userId}`;

  console.log(`borrowing: ${mediaId} ID: ${userId}`);

  //get media doc
  request({
    url: mediaUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.error('fetch error:', error);
      res.status(500).send({ success: false, error });
    } else {
      const mediaDoc = JSON.parse(body);
      console.log('fetched media doc:', mediaDoc);

      //get user doc
      request({
        url: userUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) {
          console.error('user document error:', error);
          res.status(500).send({ success: false, error });
        } else {
          const userDoc = JSON.parse(body);
          console.log('user doc success:', userDoc);

          //check if borrowed already, prevents double borrowing
          const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);

          if (isAlreadyBorrowed) {
            res.status(400).send({ success: false, error: 'media already borrowed' });
          } else {
            // check if quantity is more than 0, since media cnnot be borrowed if 0
            if (parseInt(mediaDoc.quantity) > 0) {
            
              mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

              // update media doc
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
                  console.error('upd error media:', error);
                  res.status(500).send({ success: false, error });
                } else {
                  console.log('upd media success:', body);

                  // media id and return date to user doc
                  userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

                  // update user doc
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
                      console.error('user document upd fail:', error);
                      res.status(500).send({ success: false, error });
                    } else {
                      console.log('user doc updated:', body);
                      res.send({ success: true });
                    }
                  });
                }
              });
            } else {
              
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
      console.error('error getting user doc', error);
      res.status(500).send(error);
    } else {
      const userDoc = JSON.parse(body);
      console.log('user doc fetched', userDoc);

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

      
//auth
      const mediaOptions = {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      };

      request(mediaOptions, (error, response, body) => {
        if (error) {
          console.error('error getting media:', error);
          res.status(500).send(error);
        } else {
          const mediaData = JSON.parse(body);
          console.log('media revcieved', mediaData);
          mediaData.rows.forEach(row => {
            row.value.return_date = returnDates[row.id];
          });
          console.log('borrowed media rewecieved:', JSON.stringify(mediaData));
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


  // fetch user doc
  request({
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  }, (error, response, body) => {
    if (error) {
      console.error('error fetching user doc', error);
      res.status(500).send({ success: false, error });
    } else {
      const userDoc = JSON.parse(body);
      console.log('user doc fetched:', userDoc);
      const mediaItem = userDoc.media_ids.find(item => item[0] === mediaId);
      const returnDate = mediaItem ? mediaItem[1] : null;
//safegurad for if somehow media is returned while not being borrowed
      if (!mediaItem) {
        res.status(400).send({ success: false, error: 'media not borrowed' });
        return;
      }

      // remove mediafrom user 
      userDoc.media_ids = userDoc.media_ids.filter(item => item[0] !== mediaId);

      // upd user doc
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
          console.error('error updating', error);
          res.status(500).send({ success: false, error });
        } else {
          console.log('update success:', body);

          // Fetch the media document
          request({
            url: mediaUrl,
            auth: {
              user: couchdbUsername,
              pass: couchdbPassword
            }
          }, (error, response, body) => {
            if (error) {
              console.error('error getting media doc:', error);
              res.status(500).send({ success: false, error });
            } else {
              const mediaDoc = JSON.parse(body);
              console.log('media doc fetched:', mediaDoc);

              // +1 to media quantity
              mediaDoc.quantity = (parseInt(mediaDoc.quantity) + 1).toString();

              // update db
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
                  console.error('upd error:', error);
                  res.status(500).send({ success: false, error });
                } else {
                  console.log('upd success:', body);
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
      console.error('error getting user doc', error);
      res.status(500).send({ success: false, error });
    } else {
      const userDoc = JSON.parse(body);
      console.log('user doc fetched:', userDoc);

      // fetvch media doc
      request({
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) {
          console.error('error getting media doc:', error);
          res.status(500).send({ success: false, error });
        } else {
          const mediaDoc = JSON.parse(body);
          console.log('media doc fetched:', mediaDoc);

          // +1 late returns to user
          userDoc.late_returns = (parseInt(userDoc.late_returns) + 1).toString();
          // upd user doc
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
              console.error('upd error:', error);
              res.status(500).send({ success: false, error });
            } else {
              console.log('user upd sucsess:', body);
            }
          });

          

          res.send({ success: true });
        }
      });
    }
  });
});
//notify runtime
app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`);
});