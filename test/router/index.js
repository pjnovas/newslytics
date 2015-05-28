
var request = require('request')
  , sinon = require('sinon')
  , expect = require('expect.js')
  , moment = require('moment')
  , config = require('../../config.test');

var api_url = 'http://localhost:' + (config.port || 3000) + '/api';

request = request.defaults({ json: true });

describe('Router', function(){

  before(function(){

  });

  after(function(){

  });

  it('must return one url feed', function(done){
    var path = '2013/12/happiness/';
    var feedUrl = config.rss.origin + path;

    request.get(api_url + '/articles/' + feedUrl, function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('object');
      expect(body.url.indexOf(path)).to.be.greaterThan(-1);
      expect(body.tail).to.be.equal('/' + path);
      expect(body.title).to.be.equal('Comentarios en: Happiness!');
      expect(body.comments).to.be.equal(3);

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

      body.forEach(function(article, i){
        var idx = i+1;
        expect(article.title).to.be.equal('Title ' + idx);
        expect(article.tail).to.be.equal('/title-'+idx+'/');
        expect(article.url).to.be.equal('http://testdomain.com/title-'+idx+'/');
        expect(moment(article.published_at).isValid()).to.be.true;
        expect(article.comments).to.be.eql(idx);
      });

      done();
    });

  });

  it('must return feeds by date search', function(done){

    request.get(api_url + '/articles?year=2015&month=4', function(err, res, body){
      if (err) return done(err);
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('array');
      expect(body.length).to.be.equal(2);

      expect(body[0].title).to.be.equal('HAPPY POST TITLE');
      expect(body[0].tail).to.be.equal('/2013/03/happy-post/');
      expect(body[0].url).to.be.equal('http://testdomain.com/2013/03/happy-post/');
      expect(moment(body[0].published_at).isValid()).to.be.true;
      expect(body[0].comments).to.be.eql(6);

      expect(body[1].title).to.be.equal('HAPPY POST TITLE 2');
      expect(body[1].tail).to.be.equal('/2013/03/happy-post2/');
      expect(body[1].url).to.be.equal('http://testdomain.com/2013/03/happy-post2/');
      expect(moment(body[1].published_at).isValid()).to.be.true;
      expect(body[1].comments).to.be.eql(4);

      done();
    });

  });

});
