
var request = require('request');
var FeedParser = require('feedparser');
var config = require("../config.json").rss;
var moment = require("moment");

module.exports = {

  configure: function(_config){
    config = _config;
  },

  get: function(url, done){
    console.log('FETCHING RSS ONE: ' + url + config.append);
    fetch(url + config.append, done);
  },

  getFeed: function(done){
    this.search({}, done);
  },

  search: function(query, done){
    var origin = config.origin.replace(/\/\s*$/, ''); //remove last '/'
    var append = config.append;

    var dateAppend = '';
    if (query.hasOwnProperty('y')){
      dateAppend += '/' + query.y;
    }
    if (query.hasOwnProperty('m')){
      dateAppend += '/' + query.m;
    }
    if (query.hasOwnProperty('d')){
      dateAppend += '/' + query.d;
    }

    var keywords = '';
    if (query.hasOwnProperty('s')){
      keywords = '?s=' + query.s;
    }

    var url = origin;
    if (dateAppend) url += dateAppend;
    if (keywords) url += keywords + '&' + append;
    else url += '?' + append;

    console.log('RSS Feed SEARCH FOR > ' + url);
    fetch(url, done);
  }

};


function fetch(url, cb) {
  var result = {};

  function done(err) {
    if (err) console.log(err, err.stack);
    cb && cb(err, result);
  }

  var req = request.get(url, { timeout: 10000, pool: false });
  req.setMaxListeners(50);

  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml,application/rss+xml');

  var feedparser = new FeedParser();

  req.on('error', done);
  req.on('response', function(res) {
    if (res.statusCode != 200) {
      return this.emit('error', new Error('Bad status code ' + res.statusCode));
    }

    res.pipe(feedparser);
  });

  feedparser.on('error', done);

  feedparser.on('end', function(){
    result.meta = this.meta || {};
    result.items = result.items || [];
    done();
  });

  feedparser.on('readable', function() {
    var stream = this
      , meta = this.meta
      , item;

    if (meta){
      result.meta = meta;
    }

    result.items = result.items || [];

    while (item = stream.read()) {
      result.items.push(item);
    }
  });
}



