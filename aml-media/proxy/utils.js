const request = require('request');

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

const couchRequest = (options) => {
  return new Promise((resolve, reject) => {
    options.auth = { user: couchdbUsername, pass: couchdbPassword };
    options.headers = { 'Content-Type': 'application/json' };
    console.log('Request options:', options); // Add logging
    request(options, (error, response, body) => {
      if (error) {
        console.error('Request error:', error); // Add logging
        return reject(error);
      }
      if (response.statusCode >= 400) {
        console.error('Response error:', body); // Add logging
        return reject(new Error(body));
      }
      try {
        const parsedBody = JSON.parse(body);
        console.log('Parsed response body:', parsedBody); // Add logging
        resolve(parsedBody);
      } catch (parseError) {
        console.error('Parse error:', parseError); // Add logging
        reject(parseError);
      }
    });
  });
};

module.exports = { couchRequest, couchdbUsername, couchdbPassword };