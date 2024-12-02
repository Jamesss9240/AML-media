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

  console.log(`Fetching data from URL: ${url}`);

  const options = {
    url: url,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('Data fetched successfully:', data);
      res.send(data);
    }
  });
});

app.post('/search', (req, res) => {
  const query = req.body.query;
  const view = req.body.view;
  let selector = {
    title: { "$regex": `(?i)${query}` } // Case-insensitive regex
  };

  if (view === 'books') {
    selector.type = 'book'; // Assuming you have a type field to distinguish books
  }

  console.log(`Search query: ${query} in view: ${view}`);

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
      console.error('Error fetching data:', error);
      res.status(500).send(error);
    } else {
      const data = JSON.parse(body);
      console.log('Search data fetched successfully:', data);
      res.status(response.statusCode).set(response.headers).send(data);
    }
  });
});

app.get('/user_media', (req, res) => {
  const userId = req.query.user_id;
  const userUrl = `http://localhost:5984/users/_design/user_index/_view/media_ids?key="${userId}"`;

  console.log(`Fetching user media IDs from URL: ${userUrl}`);

  const userOptions = {
    url: userUrl,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword
    }
  };

  request(userOptions, (error, response, body) => {
    if (error) {
      console.error('Error fetching user media IDs:', error);
      res.status(500).send(error);
    } else {
      const userMediaData = JSON.parse(body);
      console.log('User media data received:', userMediaData);
      if (!userMediaData.rows || userMediaData.rows.length === 0) {
        console.error('No media IDs found for user:', userId);
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

      console.log(`Fetching media from URL: ${mediaUrl}`);

      const mediaOptions = {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      };

      request(mediaOptions, (error, response, body) => {
        if (error) {
          console.error('Error fetching media:', error);
          res.status(500).send(error);
        } else {
          const mediaData = JSON.parse(body);
          console.log('Media data received:', mediaData);
          mediaData.rows.forEach(row => {
            row.value.return_date = returnDates[row.id];
          });
          console.log('Media fetched successfully:', JSON.stringify(mediaData));
          res.send(mediaData);
        }
      });
    }
  });
});

app.post('/get_user_id', (req, res) => {
  const email = req.body.email;
  const userUrl = `http://localhost:5984/users/_find`;

  console.log(`Fetching user ID for email: ${email}`);

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
                  userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000)]);

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

app.post('/return_media', (req, res) => {
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
                  res.send({ success: true });
                }
              });
            }
          });
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`);
});