const express = require("express");
const request = require("request");
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require("./utils");

router.get("/", (req, res) => {
  const token = req.cookies.token;
  console.log('Token:', token);
  console.log('t', req.cookies);
  const filter = req.query.filter;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let url = "http://127.0.0.1:5984/media/_design/media/_view/all_media";

  if (filter === "books") {
    url = "http://127.0.0.1:5984/media/_design/media/_view/books";
  } else if (filter === "films") {
    url = "http://127.0.0.1:5984/media/_design/media/_view/movies";
  } else if (filter === "journals") {
    url = "http://127.0.0.1:5984/media/_design/media/_view/journals";
  } else if (filter === "games") {
    url = "http://127.0.0.1:5984/media/_design/media/_view/games";
  }

  const options = {
    url: `${url}?skip=${skip}&limit=${limit}`,
    auth: {
      user: couchdbUsername,
      pass: couchdbPassword,
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("error");
    } else {
      const data = JSON.parse(body);
      const totalRows = data.total_rows;
      const totalPages = Math.ceil(totalRows / limit);
      res.send({ rows: data.rows, totalPages: totalPages });
    }
  });
});

module.exports = router;
