const express = require("express");
const cookieParser = require('cookie-parser');
const request = require("request");
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require("./utils");
const jwt = require("jsonwebtoken");

router.use(cookieParser());
router.use(express.json());

router.post("/return_media", (req, res) => {
  const { mediaId } = req.body;
  console.log(`Returning media: ${mediaId}`);
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
      const userUrl = `http://127.0.0.1:5984/users/${userId}`;
      const mediaUrl = `http://127.0.0.1:5984/media/${mediaId}`;

      // Fetch user doc
      request(
        {
          url: userUrl,
          auth: {
            user: couchdbUsername,
            pass: couchdbPassword,
          },
        },
        (error, response, body) => {
          if (error) {
            return handleError(res, "Error fetching user", error);
          }

          const userDoc = JSON.parse(body);
          const mediaItem = userDoc.media_ids.find((item) => item[0] === mediaId);
          const returnDate = mediaItem ? mediaItem[1] : null;

          if (!mediaItem) {
            return res.status(400).send({ success: false, error: "Media not borrowed" });
          }

          // Remove media ID from user's media_ids
          userDoc.media_ids = userDoc.media_ids.filter((item) => item[0] !== mediaId);

          // Update user doc
          request(
            {
              url: userUrl,
              method: "PUT",
              auth: {
                user: couchdbUsername,
                pass: couchdbPassword,
              },
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userDoc),
            },
            (error, response, body) => {
              if (error) {
                return handleError(res, "User update failed", error);
              }

              // Fetch media doc
              request(
                {
                  url: mediaUrl,
                  auth: {
                    user: couchdbUsername,
                    pass: couchdbPassword,
                  },
                },
                (error, response, body) => {
                  if (error) {
                    return handleError(res, "Error fetching media", error);
                  }

                  const mediaDoc = JSON.parse(body);

                  // Increase media quantity
                  mediaDoc.quantity = (parseInt(mediaDoc.quantity) + 1).toString();

                  // Update media doc
                  request(
                    {
                      url: mediaUrl,
                      method: "PUT",
                      auth: {
                        user: couchdbUsername,
                        pass: couchdbPassword,
                      },
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(mediaDoc),
                    },
                    (error, response, body) => {
                      if (error) {
                        return handleError(res, "Media update failed", error);
                      }

                      res.send({ success: true, returnDate: returnDate, media: mediaDoc });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

router.post('/late_return', (req, res) => {
  const { mediaId } = req.body;
  console.log(`Late returning media: ${mediaId}`);
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
      const userUrl = `http://127.0.0.1:5984/users/${userId}`;
      const mediaUrl = `http://127.0.0.1:5984/media/${mediaId}`;

      // Fetch user doc
      request(
        {
          url: userUrl,
          auth: {
            user: couchdbUsername,
            pass: couchdbPassword,
          },
        },
        (error, response, body) => {
          if (error) {
            return handleError(res, "Error fetching user", error);
          }

          const userDoc = JSON.parse(body);

          // Fetch media doc
          request(
            {
              url: mediaUrl,
              auth: {
                user: couchdbUsername,
                pass: couchdbPassword,
              },
            },
            (error, response, body) => {
              if (error) {
                return handleError(res, "Error fetching media", error);
              }

              const mediaDoc = JSON.parse(body);

              // Increase late returns in user doc by 1
              userDoc.late_returns = (parseInt(userDoc.late_returns) + 1).toString();

              // Update user doc
              request(
                {
                  url: userUrl,
                  method: "PUT",
                  auth: {
                    user: couchdbUsername,
                    pass: couchdbPassword,
                  },
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(userDoc),
                },
                (error, response, body) => {
                  if (error) {
                    return handleError(res, "Error updating user", error);
                  }

                  res.send({ success: true });
                }
              );
            }
          );
        }
      );
    });
  });
});

function handleError(res, message, error) {
  console.error(message, error);
  res.status(500).send({ success: false, error: message });
}

module.exports = router;