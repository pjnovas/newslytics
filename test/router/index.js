
var request = require('request')
  , sinon = require('sinon')
  , expect = require('expect.js')
  , config = require('../../config.test');

var api_url = 'http://localhost:' + (config.port || 3000) + '/api';

request = request.defaults({ json: true });

describe('Router', function(){

  before(function(){

  });

  after(function(){

  });

  it('must return one url feed', function(done){
    var feedUrl = config.rss.origin + 'some_url';

    request.get(api_url + '/articles/' + feedUrl, function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('object');
      done();
    });

  });

  it('must return 400 if is not a valid url', function(done){
    var feedUrl = 'test/rocking/bad';

    request.get(api_url + '/articles/' + feedUrl, function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(400);
      done();
    });

  });

  it('must return last 5 feeds', function(done){

    request.get(api_url + '/articles', function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('array');
      expect(body.length).to.be.equal(5);

      done();
    });

  });

  it('must return feeds by date search', function(done){

    request.get(api_url + '/articles?year=2015&month=4', function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('array');
      expect(body.length).to.be.equal(2);

      done();
    });

  });

});
