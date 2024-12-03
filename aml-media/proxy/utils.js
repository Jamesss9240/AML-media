  const request = require('request');

  const couchdbUsername = 'admin';
  const couchdbPassword = 'Dexter233';

  const couchRequest = (options, res, callback) => {
    try {
      // Set authentication and headers
      options.auth = { user: couchdbUsername, pass: couchdbPassword };
      options.headers = { 'Content-Type': 'application/json' };

      // Make the request
      request(options, (error, response, body) => {
        if (error) {
          console.error('Request error:', error);
          return res.status(500).send({ success: false, error: 'error' });
        }

        if (response.statusCode >= 400) {
          console.error('Response error:', response.statusCode, body);
          return res.status(response.statusCode).send({ success: false, error: 'error' });
        }

        try {
          const parsedBody = JSON.parse(body);
          callback(parsedBody);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          return res.status(500).send({ success: false, error: 'error' });
        }
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      return res.status(500).send({ success: false, error: 'error' });
    }
  };

  module.exports = { couchRequest };