
var sinon = require('sinon')
  , expect = require('expect.js')
  , fs = require('fs')
  , path = require('path')
  , request = require('request');

var scraper = require('../../scraper');
var wordsPerMinute = 270;

scraper.configure({
  "title-selector": ".post-title",
  "content-selector": ".post-inner .entry",
  "words-per-minute": wordsPerMinute
});

var testHTML, testText;
var basePath = path.resolve(__dirname);

describe('Scrapper', function(){

  before(function(done){
    fs.readFile(basePath + '/test_page.html', 'utf8', function (err1, _html) {
      testHTML = _html;

      fs.readFile(basePath + '/test_text.txt', 'utf8', function (err2, _text) {
        testText = _text;

        sinon
          .stub(request, 'get', function(url, opts){
            var gotsomewhere = false;

            var req = new request.Request({ url: url });

            setTimeout(function(){
              var res = fs.createReadStream(basePath + '/test_page.html');
              res.statusCode = 200;
              res.body = testHTML;
              req.emit('response', res);
              req.emit('end');
            }, 1);

            return req;
          });

        done(err1 || err2);
      });
    });
  });

  after(function(){
    request.get.restore();
  });

  describe('#scrape', function(){

    it('must scrape by url', function(done){

      scraper.scrape('http://test.com/some-awesome-post', function(err, result){

        expect(result.title).to.be.equal('test post title inner');

        expect(result.text.length).to.be.equal(924);
        expect(result.text.indexOf('<')).to.be(-1);
        expect(result.text.indexOf('>')).to.be(-1);

        expect(result.readtime).to.be.equal(28);

        done();
      });
    });

  });

  describe('#parse', function(){

    it('must parse an html by a config', function(done){
      scraper.parse(testHTML, function(err, result){
        expect(result.title).to.be.equal('test post title inner');
        expect(result.text.length).to.be.equal(924);
        expect(result.text.indexOf('<')).to.be(-1);
        expect(result.text.indexOf('>')).to.be(-1);

        done();
      });
    });

  });

  describe('#readtime', function(){

    it('must calculate the readtime by a text', function(){
      var totalWords = testText.trim().split(/\s+/g).length;
      var readtime = totalWords / (wordsPerMinute / 60);

      var seconds = scraper.readtime(testText);
      expect(seconds).to.be.equal(readtime);
    });

  });

});
