const express = require("express");
const request = require("request");
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require("./utils");

router.post("/return_media", (req, res) => {
  const { mediaId, userId } = req.body;
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
        res.status(500).send({ success: false, error: "Error fetching user" });
      } else {
        const userDoc = JSON.parse(body);
        const mediaItem = userDoc.media_ids.find((item) => item[0] === mediaId);
        const returnDate = mediaItem ? mediaItem[1] : null;

        if (!mediaItem) {
          res.status(400).send({ success: false, error: "Media not borrowed" });
          return;
        }

        // Remove media ID from user's media_ids
        userDoc.media_ids = userDoc.media_ids.filter(
          (item) => item[0] !== mediaId
        );

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
              res
                .status(500)
                .send({ success: false, error: "Error updating user" });
            } else {
              // Fetch doc (media)
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
                    res
                      .status(500)
                      .send({ success: false, error: "Error fetching media" });
                  } else {
                    const mediaDoc = JSON.parse(body);

                    //Increase media
                    mediaDoc.quantity = (
                      parseInt(mediaDoc.quantity) + 1
                    ).toString();

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
                          res
                            .status(500)
                            .send({
                              success: false,
                              error: "Error updating media",
                            });
                        } else {
                          res.send({
                            success: true,
                            returnDate: returnDate,
                            media: mediaDoc,
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

router.post("/late_return", (req, res) => {
  const { mediaId, userId } = req.body;
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
        res.status(500).send({ success: false, error: "Error fetching user" });
      } else {
        const userDoc = JSON.parse(body);

        //fetch media doc
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
              res
                .status(500)
                .send({ success: false, error: "Error fetching media" });
            } else {
              const mediaDoc = JSON.parse(body);

              //Increase late returns in user doc by 1
              userDoc.late_returns = (
                parseInt(userDoc.late_returns) + 1
              ).toString();

              // update user doc
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
                    res
                      .status(500)
                      .send({ success: false, error: "Error updating user" });
                  } else {
                    res.send({ success: true });
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

module.exports = router;
