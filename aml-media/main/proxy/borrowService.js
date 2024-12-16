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

    const userId = decoded.user;
    console.log(`Authenticated user: ${userId}`);

    const mediaUrl = `http://127.0.0.1:5984/media/${mediaId}`;
    const userUrl = `http://127.0.0.1:5984/users/${userId}`;

    // Get media document
    request(
      {
        url: mediaUrl,
        auth: {
          user: couchdbUsername,
          pass: couchdbPassword,
        },
      },
      (error, response, body) => {
        if (error) return handleError(res, "Media fetch failed", error);

        const mediaDoc = JSON.parse(body);

        if (mediaDoc.available) {
          // Get user document
          request(
            {
              url: userUrl,
              auth: {
                user: couchdbUsername,
                pass: couchdbPassword,
              },
            },
            (error, response, body) => {
              if (error) return handleError(res, "User fetch failed", error);

              const userDoc = JSON.parse(body);

              // Update user document with borrowed media
              userDoc.borrowedMedia = userDoc.borrowedMedia || [];
              userDoc.borrowedMedia.push({
                mediaId: mediaId,
                borrowDate: new Date().toISOString(),
                returnDate: null,
              });

              // Update media document to mark as not available
              mediaDoc.available = false;

              // Save updated user document
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
                  if (error) return handleError(res, "User update failed", error);

                  // Save updated media document
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
                      if (error) return handleError(res, "Media update failed", error);

                      res.send({ success: true });
                    }
                  );
                }
              );
            }
          );
        } else {
          res.status(400).send({ success: false, error: "No media available" });
        }
      }
    );
  });
});

function handleError(res, message, error) {
  console.error(message, error);
  res.status(500).send({ success: false, error: message });
}

module.exports = router;