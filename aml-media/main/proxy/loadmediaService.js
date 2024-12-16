const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const request = require("request");
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require("./utils");
const jwt = require("jsonwebtoken");



router.get('/fetch-media', async (req, res) => {
    const {page, itemsPerPage } = req.query;
    const token = req.cookies.token;
      if (!token) {
        return res.status(401).send({ success: false, error: "No token provided" });
      }
    
      jwt.verify(token, "AML_Media_2024_HMACKEY_Random_Jelly_Crop", (err, decoded) => {
        if (err) {
          return res.status(401).send({ success: false, error: "Failed to authenticate token" });
        }
        req.userId = decoded.user;
      });

    if (!userId || !page || !itemsPerPage) {
        return res.status(400).send('Missing required query parameters');
    }

    try {
        const response = await axios.get(`https://127.0.0.1:3000/user/user_media`, {
            params: {
                user_id: userId,
                page: page,
                limit: itemsPerPage
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching media');
    }
});
module.exports = router;
