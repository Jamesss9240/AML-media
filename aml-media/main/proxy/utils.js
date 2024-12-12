const request = require('request');

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';

const couchRequest = (options) => {
  return new Promise((resolve, reject) => {
    options.auth = { user: couchdbUsername, pass: couchdbPassword };
    options.headers = { 'Content-Type': 'application/json' };
    request(options, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      if (response.statusCode >= 400) {
        return reject(new Error(body));
      }
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
};

module.exports = { couchRequest, couchdbUsername, couchdbPassword };
