const express = require("express");
const cookieParser = require('cookie-parser');
const request = require("request");
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require("./utils");
const jwt = require("jsonwebtoken");

router.use(cookieParser());
router.use(express.json());

router.post("/borrow_media", (req, res) => {
  const { mediaId } = req.body;
  console.log(`Borrowing media: ${mediaId}`);
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

      console.log(`User ID: ${userId}`);
      const mediaUrl = `http://127.0.0.1:5984/media/${mediaId}`;
      const userUrl = `http://127.0.0.1:5984/users/${userId}`;

      // Get media document
      request({
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword
        }
      }, (error, response, body) => {
        if (error) return handleError(res, 'Media fetch failed', error);

        const mediaDoc = JSON.parse(body);

        // Get user document
        request({
          url: userUrl,
          auth: {
            user: couchdbUsername,
            pass: couchdbPassword
          }
        }, (error, response, body) => {
          if (error) return handleError(res, 'User fetch failed', error);

          const userDoc = JSON.parse(body);

          // Check if media is already borrowed
          const isAlreadyBorrowed = userDoc.media_ids.some(item => item[0] === mediaId);
          if (isAlreadyBorrowed) return res.status(400).send({ success: false, error: 'Already borrowed' });

          // Check if media is available
          if (parseInt(mediaDoc.quantity) > 0) {
            // Decrease media quantity
            mediaDoc.quantity = (parseInt(mediaDoc.quantity) - 1).toString();

            // Update media document
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
              if (error) return handleError(res, 'Media update failed', error);

              // Add media ID to user's media_ids
              userDoc.media_ids.push([mediaId, Math.floor(Date.now() / 1000) + 2 * 7 * 24 * 60 * 60]);

              // Update user document
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
                if (error) return handleError(res, 'User update failed', error);

                res.send({ success: true });
              });
            });
          } else {
            res.status(400).send({ success: false, error: 'No media available' });
          }
        });
      });
    });
  });
});

function handleError(res, message, error) {
  console.error(message, error);
  res.status(500).send({ success: false, error: message });
}

module.exports = router;