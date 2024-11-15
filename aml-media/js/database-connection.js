const couchdb = require('couchdb');
const PouchDB = require('pouchdb');
const db = new PouchDB('http://localhost:5984/');
console.log("test");
const couch = NonoCouchdb({  
    username = "admin";
    password = "Hilol123";
    host = "localhost:5984";

    db = couchdb.Server('http://'+host)

    couch.resource.credentials = (username, password)
})
