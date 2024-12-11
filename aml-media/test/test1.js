const { describe, it } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = 'http://localhost:3000'; 
const should = chai.should();

chai.use(chaiHttp);

describe('Media search service', () => {

  it('media should be returned from the all media view', (done) => {
    chai.request(server)
      .get('/search')
      .send({
        query: '', 
        view: 'all_media'
      })
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.above(0);
        res.body.docs[0].should.have.property('title');
        res.body.docs[0].should.have.property('description');
        done();
      });
  });
});