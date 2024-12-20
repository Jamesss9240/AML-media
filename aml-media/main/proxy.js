const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const mediaService = require('./proxy/mediaService');
const userService = require('./proxy/userService');
const borrowService = require('./proxy/borrowService');
const returnService = require('./proxy/returnService');
const searchService = require('./proxy/searchService');


const app = express();
const port = 3000;

const couchdbUsername = 'admin';
const couchdbPassword = 'Dexter233';


const sslOptions = {
  key: fs.readFileSync('certificates/key.pem'),
  cert: fs.readFileSync('certificates/cert.pem'),
 
};
const allowedOrigins = ['https://127.0.0.1:8080', 'https://127.0.0.1:8081','https://127.0.0.1:3000'];
// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
      // Check if the incoming origin is in the allowedOrigins list
      if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  credentials: true // Allow credentials (cookies) to be sent
};

// Use the CORS middleware with the specified options
app.use(cors(corsOptions));

// cors handling
app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', ['https://127.0.0.1:8080', 'https://127.0.0.1:8081','https://127.0.0.1:3000']);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(cookieParser());

// middleware
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

//service routes
app.use('/media', mediaService);
app.use('/user', userService);
app.use('/borrow', borrowService);
app.use('/return', returnService);
app.use('/search', searchService);


//http -> https 
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// error middleware
app.use((err, req, res, next) => {
  console.error('server error:', err);
  res.status(500).send({ success: false, error: 'server Error' });
});

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS Server running on https://127.0.0.1:${port}`);
});

//https redirecrt
const http = require('http');

const httpServer = http.createServer((req, res) => {
  const httpsPort = port; 
  const host = req.headers.host.split(':')[0]; // get host
  res.writeHead(301, { 'Location': `https://${host}:${httpsPort}${req.url}` });
  res.end();
});

httpServer.listen(80, () => {
  console.log('http redirect -> https');
}); 