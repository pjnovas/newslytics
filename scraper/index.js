
var request = require('request');
var cheerio = require('cheerio');
var config = require("../config.json").scraper;

module.exports = {

  configure: function(_config){
    config = _config;
  },

  scrape: function(url, done){
    var self = this;

    fetch(url, function(err, html){
      if (err || !html) return done(err);

      self.parse(html, function(err, result){
        if (result.text && result.text.length) {
          result.readtime = self.readtime(result.text);
        }
        done(null, result);
      });
    });
  },

  parse: function(html, done) {
    if (!html || !html.length){
      return done(new Error('No HTML to parse for cheerio'));
    }

    var $ = cheerio.load(html);

    var title = $(config["title-selector"]).text();
    var text = $(config["content-selector"]).text();

    done(null, {
      title: title,
      text: text
    });
  },

  readtime: function(text){
    var wordsPerMinute = config["words-per-minute"];
    var totalWords = text.trim().split(/\s+/g).length;
    return totalWords / (wordsPerMinute / 60);
  }

};

function fetch(url, cb) {
  var result = "";

  function done(err) {
    if (err) {
      console.log(err, err.stack);
    }
    cb && cb(err, result);
  }

  var req = request.get(url, { timeout: config["fetch-timeout"] || 5000 , pool: false });
  req.setMaxListeners(50);

  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml,application/rss+xml');

  req.on('error', done);
  req.on('response', function(res) {
    if (res.statusCode != 200) {
      return this.emit('error', new Error('Bad status code ' + res.statusCode));
    }

    result = res.body;
  });
  req.on('end', done);
}
