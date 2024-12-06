const express = require('express');
const request = require('request');
const router = express.Router();
const { couchdbUsername, couchdbPassword } = require('./utils');

router.post('/getJWTRole', (req, res) => {
    const { token } = req.body;
    const url = `http://localhost:3000/verifyToken`;
    const options = {
        url,
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
    };
    
    request(options, (error, response, body) => {
        if (error) {
        console.error('Error fetching user role:', error);
        res.status(500).send({ success: false, error });
        } else {
        const roleData = JSON.parse(body);
        console.log('User role data received:', roleData);
        res.status(200).send(roleData);
        }
    });
});


