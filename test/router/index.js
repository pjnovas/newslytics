
var request = require('request')
  , sinon = require('sinon')
  , expect = require('expect.js')
  , moment = require('moment')
  , mongoose = require('mongoose')
  , fs = require('fs')
  , nock = require('nock')
  , config = require('../../config.test');

var api_url = 'http://localhost:' + (config.port || 3000) + '/api';

request = request.defaults({ json: true });

var Article, scrapeHTML;

describe('Router', function(){

  before(function(done){
    mongoose.connect(config.db.url || ('mongodb://' + config.db.host + '/'+ config.db.name));
    require('../../models')();
    Article = mongoose.model('Article');

    fs.readFile('../test_page.html', 'utf8', function (err1, _html) {
      scrapeHTML = _html;

      Article.remove({}, done);
    });

  });

  after(function(done){
    nock.restore();
    Article.remove({}, done);
  });

  it('must return one url feed', function(done){
    var path = '2013/12/happiness/';
    var feedUrl = config.rss.origin + path;
    var urlTest = 'http://test.com/' + path;

    nock(urlTest)
      .get('?feed=rss2')
      .reply(200, scrapeHTML);

    var timestamp_prev = new Date();

    Article.findOne({ url: urlTest }, function(err, article){
      // No article at DB
      expect(err).to.not.be.ok();
      expect(article).to.not.be.ok();

      request.get(api_url + '/articles/' + feedUrl, function(err, res, body){
        // Fetch article to RSS and store in DB
        expect(err).to.not.be.ok();
        expect(res.statusCode).to.be.equal(200);

        expect(body).to.be.an('object');
        expect(body._id).to.be.ok();
        expect(body.url.indexOf(path)).to.be.greaterThan(-1);
        expect(body.tail).to.be.equal('/' + path);
        expect(body.title).to.be.equal('Comentarios en: Happiness!');
        expect(body.comments).to.be.equal(3);

        Article.findOne({ url: urlTest }, function(err, article){
          // Article must exist in DB
          expect(err).to.not.be.ok();

          var timestamp_after = new Date();

          expect(article).to.be.ok();
          expect(article.url).to.be.equal(urlTest);

          expect(article.tail).to.be.equal('/' + path);
          expect(article.title).to.be.equal('Comentarios en: Happiness!');
          expect(article.comments).to.be.equal(3);

          expect(article.created_at).to.be.greaterThan(timestamp_prev);
          expect(article.created_at).to.be.lessThan(timestamp_after);

          expect(article.fetched_at).to.be.greaterThan(timestamp_prev);
          expect(article.fetched_at).to.be.lessThan(timestamp_after);

          expect(article.updated_at).to.be.greaterThan(timestamp_prev);
          expect(article.updated_at).to.be.lessThan(timestamp_after);

          done();
        });

      });

    });

  });

  it('must return 400 if is not a valid url', function(done){
    var feedUrl = 'test/rocking/bad';

    request.get(api_url + '/articles/' + feedUrl, function(err, res, body){
      expect(err).to.not.be.ok();
      expect(res.statusCode).to.be.equal(400);
      done();
    });

  });

  it('must return last 5 feeds', function(done){
    var regex = new RegExp('Title');
    var timestamp_prev = new Date();

    Article.find({ title: regex }, function(err, articles){
      expect(err).to.not.be.ok();
      expect(articles.length).to.be.equal(0);

      request.get(api_url + '/articles', function(err, res, body){
        expect(err).to.not.be.ok();
        expect(res.statusCode).to.be.equal(200);

        expect(body).to.be.an('array');
        expect(body.length).to.be.equal(5);

        body.forEach(function(article, i){
          var idx = i+1;
          expect(article._id).to.be.ok();
          expect(article.title).to.be.equal('Title ' + idx);
          expect(article.tail).to.be.equal('/title-'+idx+'/');
          expect(article.url).to.be.equal('http://testdomain.com/title-'+idx+'/');
          expect(moment(article.published_at).isValid()).to.be.true;
          expect(article.comments).to.be.eql(idx);
        });

        Article.find({ title: regex }, function(err, articles){
          // Articles must exist in DB
          expect(err).to.not.be.ok();
          expect(articles.length).to.be.equal(5);

          var timestamp_after = new Date();

          articles.forEach(function(article, i){
            var idx = i+1;
            expect(article._id).to.be.ok();
            expect(article.title).to.be.equal('Title ' + idx);
            expect(article.tail).to.be.equal('/title-'+idx+'/');
            expect(article.url).to.be.equal('http://testdomain.com/title-'+idx+'/');
            expect(moment(article.published_at).isValid()).to.be.true;
            expect(article.comments).to.be.eql(idx);

            expect(article.created_at).to.be.greaterThan(timestamp_prev);
            expect(article.created_at).to.be.lessThan(timestamp_after);

            expect(article.fetched_at).to.be.greaterThan(timestamp_prev);
            expect(article.fetched_at).to.be.lessThan(timestamp_after);

            expect(article.updated_at).to.be.greaterThan(timestamp_prev);
            expect(article.updated_at).to.be.lessThan(timestamp_after);
          });

          done();
        });

      });

    });

  });

  it('must return feeds by date search', function(done){
    var timestamp_first = new Date();

    request.get(api_url + '/articles?year=2015&month=4', function(err, res, body){
      expect(err).to.not.be.ok();
      expect(res.statusCode).to.be.equal(200);

      expect(body).to.be.an('array');
      expect(body.length).to.be.equal(2);

      expect(body[0]._id).to.be.ok(); // It was store in DB
      expect(body[0].title).to.be.equal('HAPPY POST TITLE');
      expect(body[0].tail).to.be.equal('/2013/03/happy-post/');
      expect(body[0].url).to.be.equal('http://testdomain.com/2013/03/happy-post/');
      expect(moment(body[0].published_at).isValid()).to.be.true;
      expect(body[0].comments).to.be.eql(6);

      expect(body[1]._id).to.be.ok(); // It was store in DB
      expect(body[1].title).to.be.equal('HAPPY POST TITLE 2');
      expect(body[1].tail).to.be.equal('/2013/03/happy-post2/');
      expect(body[1].url).to.be.equal('http://testdomain.com/2013/03/happy-post2/');
      expect(moment(body[1].published_at).isValid()).to.be.true;
      expect(body[1].comments).to.be.eql(4);

      expect(new Date(body[0].created_at)).to.be.greaterThan(timestamp_first);
      expect(new Date(body[0].fetched_at)).to.be.greaterThan(timestamp_first);
      expect(new Date(body[0].updated_at)).to.be.greaterThan(timestamp_first);

      var lastCreated = body[0].created_at;
      var timestamp_second = new Date();

      //RE fetch same URL
      request.get(api_url + '/articles?year=2015&month=4', function(err, res, body){
        // should not create another article
        expect(body[0].created_at).to.be.equal(lastCreated);

        // should re-fetch RSS and update it
        expect(new Date(body[0].fetched_at)).to.be.greaterThan(timestamp_second);
        expect(new Date(body[0].updated_at)).to.be.greaterThan(timestamp_second);

        done();
      });

    });

  });

});
