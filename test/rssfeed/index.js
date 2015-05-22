
var rssFeed = require('../../rssfeed');

rssFeed.configure({
  "origin": "http://test.com/",
  "append": "?feed=rss2"
});

var request = require('request')
  , sinon = require('sinon')
  , expect = require('expect.js')
  , fs = require('fs');

var fake_feed = 'http://test.com/';
var fake_single = 'http://test.com/2013/12/happiness/';
var fake_search = 'http://test.com/?feed=rss2&year=2013&month=3&day=8';
var fake_search2 = 'http://test.com/?feed=rss2&s=test-keyword';

describe('RSS Feed', function(){

  before(function(){

    sinon
      .stub(request, 'get', function(url, opts){

        function createAndSend(){
          var res = fs.createReadStream(this.toString());
          res.statusCode = 200;
          req.emit('response', res);
          req.emit('end');
        }

        var req = new request.Request({ url: url });

        if (url === fake_feed + '?feed=rss2'){
          setTimeout(createAndSend.bind(__dirname + "/feed_5.xml"), 200);
        }

        if (url === fake_single + '?feed=rss2'){
          setTimeout(createAndSend.bind(__dirname + "/single_feed.xml"), 200);
        }

        if (url === fake_search || url === fake_search2){
          setTimeout(createAndSend.bind(__dirname + "/search_feed.xml"), 200);
        }

        return req;
      });

  });

  after(function(done){
    request.get.restore();
    done();
  });

  it('must fetch one url by RSS feed', function(done){

    rssFeed.get(fake_single, function(err, result){
      if(err) return done(err);

      request.get.called.should.be.true;
      result.should.not.be.empty;

      expect(result.meta.title).to.be.equal('Comentarios en: Happiness!');
      expect(result.meta.link).to.be.equal(fake_single);
      expect(result.items.length).to.be.equal(3); // comments count

      done();
    });

  });

  it('must fetch by last 10 RSS Feeds', function(done){

    rssFeed.getFeed(function(err, result){
      if(err) return done(err);

      request.get.called.should.be.true;
      result.should.not.be.empty;

      expect(result.items.length).to.be.equal(5);

      result.items.forEach(function(item, i){
        var idx = i+1;
        expect(item.title).to.be.equal('Title ' + idx);
        expect(item.link).to.be.equal('http://testdomain.com/title-'+idx+'/');
        expect(item.pubDate).to.be.a(Date);
        expect(item['slash:comments']['#']).to.be.eql(idx);
      });

      done();
    });

  });

  it('must fetch by search date', function(done){

    rssFeed.search({
      year: 2013,
      month: 3,
      day: 8
    }, function(err, result){
      if(err) return done(err);

      request.get.called.should.be.true;
      result.should.not.be.empty;

      expect(result.items.length).to.be.equal(2);

      expect(result.items[0].title).to.be.equal('HAPPY POST TITLE');
      expect(result.items[1].title).to.be.equal('HAPPY POST TITLE 2');

      expect(result.items[0].link).to.be.equal('http://testdomain.com/2013/03/happy-post/');
      expect(result.items[1].link).to.be.equal('http://testdomain.com/2013/03/happy-post2/');

      expect(result.items[0].pubDate).to.be.a(Date);
      expect(result.items[1].pubDate).to.be.a(Date);

      expect(result.items[0]['slash:comments']['#']).to.be.eql(6);
      expect(result.items[1]['slash:comments']['#']).to.be.eql(4);

      done();
    });

  });

  it('must fetch by search keyword', function(done){

    rssFeed.search({
      s: 'test-keyword'
    }, function(err, result){
      if(err) return done(err);

      request.get.called.should.be.true;
      result.should.not.be.empty;

      expect(result.items.length).to.be.equal(2);

      expect(result.items[0].title).to.be.equal('HAPPY POST TITLE');
      expect(result.items[1].title).to.be.equal('HAPPY POST TITLE 2');

      expect(result.items[0].link).to.be.equal('http://testdomain.com/2013/03/happy-post/');
      expect(result.items[1].link).to.be.equal('http://testdomain.com/2013/03/happy-post2/');

      expect(result.items[0].pubDate).to.be.a(Date);
      expect(result.items[1].pubDate).to.be.a(Date);

      expect(result.items[0]['slash:comments']['#']).to.be.eql(6);
      expect(result.items[1]['slash:comments']['#']).to.be.eql(4);

      done();
    });

  });

});
