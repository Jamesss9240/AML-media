const request = require('request');

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

const couchRequest = (options, res, callback) => {
  options.auth = { user: couchdbUsername, pass: couchdbPassword };
  options.headers = { 'Content-Type': 'application/json' };
  request(options, (error, response, body) => {
    if (error) {
      return res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
    if (response.statusCode >= 400) {
      return res.status(response.statusCode).send({ success: false, error: body });
    }
    callback(JSON.parse(body));
  });
};

module.exports = { couchRequest };