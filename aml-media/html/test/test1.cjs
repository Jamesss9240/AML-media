const { describe, it } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = 'https://localhost:3000'; 

// Use expect instead of should
const expect = chai.expect;

// Use chaiHttp plugin
chai.use(chaiHttp);

describe('Media search service', () => {
  it('media should be returned from the all media view', (done) => {
    chai.request(server)
      .get('/search')
      .query({
        query: '', 
        view: 'all_media'
      })
      .end((err, res) => {
        if (err) {
          console.error('Test error:', err);
          return done(err);
        }
        
        try {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('docs');
          expect(res.body.docs).to.be.an('array');
          expect(res.body.docs.length).to.be.above(0);
          expect(res.body.docs[0]).to.have.property('title');
          expect(res.body.docs[0]).to.have.property('description');
          done();
        } catch (assertionError) {
          console.error('Assertion error:', assertionError);
          done(assertionError);
        }
      });
  });
});