const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');
const jwt = require('jsonwebtoken');

router.use(cookieParser());
router.use(express.json());

router.get('/user_media', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    console.error("No token provided");
    return res.status(401).send({ success: false, error: "No token provided" });
  }

  jwt.verify(token, "AML_Media_2024_HMACKEY_Random_Jelly_Crop", (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res.status(401).send({ success: false, error: "Failed to authenticate token" });
    }

    function fetchUserIdByEmail(userEmail, callback) {
      const userIndexUrl = `http://127.0.0.1:5984/users/_design/user_index/_view/by_email?key="${userEmail}"`;
      request(
        {
          url: userIndexUrl,
          auth: {
            user: couchdbUsername,
            pass: couchdbPassword,
          },
        },
        (error, response, body) => {
          if (error) return callback(error, null);

          const userIndex = JSON.parse(body);
          if (userIndex.rows.length === 0) {
            return callback(new Error("User not found"), null);
          }

          const userId = userIndex.rows[0].id;
          callback(null, userId);
        }
      );
    }

    const userEmail = decoded.user;
    console.log(`Authenticated user: ${userEmail}`);

    fetchUserIdByEmail(userEmail, (error, userId) => {
      if (error) {
        console.error("Failed to fetch user ID:", error);
        return res.status(404).send({ success: false, error: "User not found" });
      }

      const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10
      const skip = parseInt(req.query.skip, 10) || 0; // Default skip to 0
      const userUrl = `http://127.0.0.1:5984/users/_design/user_index/_view/media_ids?key="${userId}"&limit=${limit}&skip=${skip}`;

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
          const mediaUrl = `http://127.0.0.1:5984/media/_design/media/_view/by_user_media_ids?keys=${JSON.stringify(mediaIds)}&limit=${limit}&skip=${skip}`;

          console.log(`Fetching media`);

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
  });
});

router.post('/get_user_id', (req, res) => {
  const email = req.body.email;
  const userUrl = `http://127.0.0.1:5984/users/_find`;

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

module.exports = router;